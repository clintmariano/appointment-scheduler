/**
 * Queue Service
 *
 * Business logic for queue operations.
 * Uses the priority engine for ordering and the QueueTicket model for persistence.
 */

const QueueTicket = require('../../models/QueueTicket');

class QueueService {
  /**
   * @param {PriorityEngine} priorityEngine - Priority calculation engine
   */
  constructor(priorityEngine) {
    this.engine = priorityEngine;
  }

  /**
   * Generate a unique ticket ID
   * Format: TKT-YYYYMMDD-XXX
   */
  generateTicketId() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `TKT-${dateStr}-${random}`;
  }

  /**
   * Get start and end of a date in Manila timezone (for date filtering)
   * @param {String} dateStr - Optional date string (YYYY-MM-DD). If not provided, uses today.
   */
  getDateRange(dateStr = null) {
    // Use provided date or current date in Manila timezone
    let targetDateStr;
    if (dateStr) {
      targetDateStr = dateStr;
    } else {
      const now = new Date();
      targetDateStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // YYYY-MM-DD format
    }

    // Create start and end times for the target date in Manila timezone
    const start = new Date(`${targetDateStr}T00:00:00+08:00`);
    const end = new Date(`${targetDateStr}T23:59:59.999+08:00`);

    return { start, end };
  }

  /**
   * Get start and end of today in Manila timezone (for date filtering)
   * @deprecated Use getDateRange() instead
   */
  getTodayRange() {
    return this.getDateRange();
  }

  /**
   * Get today's queue, grouped by status
   *
   * @param {String} tenantId - Tenant ID
   * @param {String} locationId - Location ID
   * @param {Array} statusFilter - Status values to include
   * @param {String} dateStr - Optional date string (YYYY-MM-DD) for simulation
   * @returns {Object} Queue grouped by status with stats
   */
  async getTodayQueue(tenantId = 'default', locationId = 'main', statusFilter = ['waiting', 'called', 'in_progress'], dateStr = null) {
    const { start, end } = this.getDateRange(dateStr);

    const tickets = await QueueTicket.find({
      tenantId,
      locationId,
      status: { $in: statusFilter },
      queueEnteredAt: { $gte: start, $lte: end }
    }).lean();

    // Sort tickets by priority
    const sorted = this.engine.sortQueue(tickets);

    // Group by status
    const grouped = {
      waiting: [],
      called: [],
      inProgress: []
    };

    const now = new Date();

    for (const ticket of sorted) {
      // Calculate wait time in minutes
      const waitTime = Math.floor((now - new Date(ticket.queueEnteredAt)) / 60000);
      const enrichedTicket = { ...ticket, waitTime };

      if (ticket.status === 'waiting') {
        grouped.waiting.push(enrichedTicket);
      } else if (ticket.status === 'called') {
        grouped.called.push(enrichedTicket);
      } else if (ticket.status === 'in_progress') {
        grouped.inProgress.push(enrichedTicket);
      }
    }

    // Calculate stats
    const allWaitTimes = grouped.waiting.map(t => t.waitTime);
    const avgWaitTime = allWaitTimes.length > 0
      ? Math.round(allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length)
      : 0;

    // Get completed count for today
    const completedCount = await QueueTicket.countDocuments({
      tenantId,
      locationId,
      status: { $in: ['done', 'skipped', 'no_show'] },
      queueEnteredAt: { $gte: start, $lte: end }
    });

    return {
      ...grouped,
      stats: {
        totalWaiting: grouped.waiting.length,
        totalCalled: grouped.called.length,
        totalInProgress: grouped.inProgress.length,
        totalServed: completedCount,
        avgWaitTime
      }
    };
  }

  /**
   * Get a single ticket by ID
   *
   * @param {String} ticketId - Ticket ID
   * @returns {Object} Queue ticket
   */
  async getTicket(ticketId) {
    return QueueTicket.findOne({ id: ticketId }).lean();
  }

  /**
   * Add a walk-in patient to the queue
   *
   * @param {Object} data - Walk-in data
   * @param {String} data.queueDate - Optional queue date (YYYY-MM-DD) for simulation
   * @returns {Object} Created ticket
   */
  async addWalkIn(data) {
    // Determine queue entered at time - use queueDate if provided, otherwise current time
    let queueEnteredAt = new Date();
    if (data.queueDate) {
      // Use the simulation date at midnight Manila time
      queueEnteredAt = new Date(`${data.queueDate}T00:00:00+08:00`);
    }

    const ticket = new QueueTicket({
      id: this.generateTicketId(),
      tenantId: data.tenantId || 'default',
      locationId: data.locationId || 'main',
      patientId: data.patientId,
      patientName: data.patientName,
      patientBirthday: data.patientBirthday || '',
      source: 'walk_in',
      urgency: data.urgency || 'normal',
      attributes: data.attributes || {},
      status: 'waiting',
      queueEnteredAt: queueEnteredAt,
      notes: data.notes || '',
      createdBy: data.createdBy
    });

    // Calculate priority rank
    ticket.priorityRank = this.engine.calculateRank(ticket);

    await ticket.save();
    return ticket.toObject();
  }

  /**
   * Create a queue ticket from a scheduled appointment
   *
   * @param {Object} data - Appointment data
   * @param {String} data.queueDate - Optional queue date (YYYY-MM-DD) for simulation
   * @returns {Object} Created ticket
   */
  async createFromAppointment(data) {
    // Check if ticket already exists for this appointment
    const existing = await QueueTicket.findOne({
      appointmentId: data.appointmentId,
      status: { $nin: ['done', 'skipped', 'no_show'] }
    });

    // Determine queue entered at time - use queueDate if provided, otherwise current time
    let queueEnteredAt = new Date();
    if (data.queueDate) {
      // Use the simulation date at midnight Manila time
      queueEnteredAt = new Date(`${data.queueDate}T00:00:00+08:00`);
    }

    // If existing ticket found and we're using a simulation date, update it
    if (existing) {
      // If the existing ticket's queueEnteredAt doesn't match the expected queueEnteredAt, update it
      // This handles the case where we're simulating a different date
      const existingTime = existing.queueEnteredAt.getTime();
      const newTime = queueEnteredAt.getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      // If the dates differ by more than a day, update the ticket
      if (Math.abs(existingTime - newTime) > oneDay) {
        existing.queueEnteredAt = queueEnteredAt;
        existing.scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : queueEnteredAt;
        existing.priorityRank = this.engine.calculateRank(existing);
        existing.updatedAt = new Date();
        await existing.save();
        return existing.toObject();
      }

      return existing.toObject();
    }

    const ticket = new QueueTicket({
      id: this.generateTicketId(),
      tenantId: data.tenantId || 'default',
      locationId: data.locationId || 'main',
      appointmentId: data.appointmentId,
      patientId: data.patientId,
      patientName: data.patientName,
      patientBirthday: data.patientBirthday || '',
      source: 'scheduled',
      urgency: data.urgency || 'normal',
      attributes: data.attributes || {},
      status: 'waiting',
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : queueEnteredAt,
      queueEnteredAt: queueEnteredAt,
      notes: data.notes || '',
      createdBy: data.createdBy
    });

    // Calculate priority rank
    ticket.priorityRank = this.engine.calculateRank(ticket);

    await ticket.save();
    return ticket.toObject();
  }

  /**
   * Call the next patient in the queue
   *
   * @param {String} tenantId - Tenant ID
   * @param {String} locationId - Location ID
   * @param {String} servedBy - Staff member ID
   * @param {String} deskNumber - Desk/room number
   * @returns {Object|null} Called ticket or null if queue empty
   */
  async callNext(tenantId = 'default', locationId = 'main', servedBy, deskNumber) {
    const { start, end } = this.getTodayRange();

    // Get all waiting tickets for today
    const waitingTickets = await QueueTicket.find({
      tenantId,
      locationId,
      status: 'waiting',
      queueEnteredAt: { $gte: start, $lte: end }
    }).lean();

    if (waitingTickets.length === 0) {
      return null;
    }

    // Sort by priority
    const sorted = this.engine.sortQueue(waitingTickets);
    const nextTicket = sorted[0];

    // Update the ticket
    const updated = await QueueTicket.findOneAndUpdate(
      { id: nextTicket.id },
      {
        status: 'called',
        calledAt: new Date(),
        servedBy,
        deskNumber,
        updatedAt: new Date()
      },
      { new: true }
    ).lean();

    return updated;
  }

  /**
   * Update ticket status
   *
   * @param {String} ticketId - Ticket ID
   * @param {String} newStatus - New status
   * @param {Object} additionalData - Additional fields to update
   * @returns {Object} Updated ticket
   */
  async updateStatus(ticketId, newStatus, additionalData = {}) {
    const update = {
      status: newStatus,
      updatedAt: new Date(),
      ...additionalData
    };

    // Set timestamps based on status
    if (newStatus === 'called' && !additionalData.calledAt) {
      update.calledAt = new Date();
    }
    if (newStatus === 'in_progress' && !additionalData.servedAt) {
      update.servedAt = new Date();
    }
    if (['done', 'skipped', 'no_show'].includes(newStatus) && !additionalData.completedAt) {
      update.completedAt = new Date();
    }

    return QueueTicket.findOneAndUpdate(
      { id: ticketId },
      update,
      { new: true }
    ).lean();
  }

  /**
   * Change ticket urgency (recalculates priority)
   *
   * @param {String} ticketId - Ticket ID
   * @param {String} newUrgency - New urgency level
   * @returns {Object} Updated ticket
   */
  async changeUrgency(ticketId, newUrgency) {
    const ticket = await QueueTicket.findOne({ id: ticketId });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.urgency = newUrgency;
    ticket.priorityRank = this.engine.calculateRank(ticket);
    ticket.updatedAt = new Date();

    await ticket.save();
    return ticket.toObject();
  }

  /**
   * Get tickets for a specific patient
   *
   * @param {String} patientId - Patient ID
   * @param {Number} limit - Max number of tickets to return
   * @returns {Array} Patient's tickets
   */
  async getPatientTickets(patientId, limit = 10) {
    return QueueTicket.find({ patientId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Soft delete a ticket
   *
   * @param {String} ticketId - Ticket ID
   * @returns {Object} Updated ticket
   */
  async removeTicket(ticketId) {
    return QueueTicket.findOneAndUpdate(
      { id: ticketId },
      {
        status: 'skipped',
        completedAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    ).lean();
  }
}

module.exports = QueueService;
