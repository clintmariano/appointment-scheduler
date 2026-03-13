/**
 * Queue API Routes
 *
 * Endpoints for queue management operations.
 */

const express = require('express');
const router = express.Router();
const { queueService, clinicRules } = require('../modules/queue');

// Simple auth middleware (same pattern as patients.js)
const simpleAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = JSON.parse(atob(token));
    req.userId = decoded.userId;
    req.userRole = getUserRole(token);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Get user role from token
const getUserRole = (token) => {
  try {
    const decoded = JSON.parse(atob(token));
    const roleMap = {
      '1': 'doctor',
      '2': 'assistant1',
      '3': 'assistant2'
    };
    return roleMap[decoded.userId] || null;
  } catch (error) {
    return null;
  }
};

/**
 * GET /api/queue/today
 * Get today's queue grouped by status
 */
router.get('/today', simpleAuth, async (req, res) => {
  try {
    const { tenantId = 'default', locationId = 'main', status, date } = req.query;

    // Parse status filter
    const statusFilter = status
      ? status.split(',')
      : ['waiting', 'called', 'in_progress'];

    // Pass date parameter for simulation mode
    const queue = await queueService.getTodayQueue(tenantId, locationId, statusFilter, date || null);

    res.json(queue);
  } catch (error) {
    console.error('Get queue error:', error);
    res.status(500).json({ message: 'Failed to get queue', error: error.message });
  }
});

/**
 * GET /api/queue/:id
 * Get a single ticket by ID
 */
router.get('/:id', simpleAuth, async (req, res) => {
  try {
    const ticket = await queueService.getTicket(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Add priority label and color
    ticket.priorityLabel = clinicRules.getLabel(ticket.priorityRank);
    ticket.priorityColor = clinicRules.getColor(ticket);

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Failed to get ticket', error: error.message });
  }
});

/**
 * POST /api/queue/walk-in
 * Add a walk-in patient to the queue
 */
router.post('/walk-in', simpleAuth, async (req, res) => {
  try {
    const { patientId, patientName, patientBirthday, urgency, attributes, notes, queueDate } = req.body;

    if (!patientName) {
      return res.status(400).json({ message: 'Patient name is required' });
    }

    const ticket = await queueService.addWalkIn({
      patientId,
      patientName,
      patientBirthday,
      urgency,
      attributes,
      notes,
      queueDate,
      createdBy: req.userId
    });

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
      io.emit('queue_updated', { action: 'add', ticket });
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Add walk-in error:', error);
    res.status(500).json({ message: 'Failed to add walk-in', error: error.message });
  }
});

/**
 * POST /api/queue/from-appointment
 * Create a queue ticket from a scheduled appointment
 */
router.post('/from-appointment', simpleAuth, async (req, res) => {
  try {
    const {
      appointmentId,
      patientId,
      patientName,
      patientBirthday,
      urgency,
      attributes,
      scheduledAt,
      notes,
      queueDate
    } = req.body;

    if (!patientName) {
      return res.status(400).json({ message: 'Patient name is required' });
    }

    const ticket = await queueService.createFromAppointment({
      appointmentId,
      patientId,
      patientName,
      patientBirthday,
      urgency,
      attributes,
      scheduledAt,
      notes,
      queueDate,
      createdBy: req.userId
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue_updated', { action: 'add', ticket });
    }

    res.status(201).json(ticket);
  } catch (error) {
    console.error('Create from appointment error:', error);
    res.status(500).json({ message: 'Failed to create ticket', error: error.message });
  }
});

/**
 * POST /api/queue/call-next
 * Call the next patient in the queue
 */
router.post('/call-next', simpleAuth, async (req, res) => {
  try {
    const { tenantId = 'default', locationId = 'main', deskNumber, date } = req.body;

    const ticket = await queueService.callNext(
      tenantId,
      locationId,
      req.userId,
      deskNumber,
      date || null
    );

    if (!ticket) {
      return res.json({ message: 'No patients waiting', ticket: null });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue_updated', { action: 'called', ticket });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Call next error:', error);
    res.status(500).json({ message: 'Failed to call next', error: error.message });
  }
});

/**
 * PATCH /api/queue/:id/status
 * Update ticket status
 */
router.patch('/:id/status', simpleAuth, async (req, res) => {
  try {
    const { status, servedBy, deskNumber } = req.body;

    const validStatuses = ['waiting', 'called', 'in_progress', 'done', 'skipped', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const ticket = await queueService.updateStatus(req.params.id, status, {
      servedBy: servedBy || req.userId,
      deskNumber
    });

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue_updated', { action: 'status_changed', ticket });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
});

/**
 * PATCH /api/queue/:id/urgency
 * Change ticket urgency
 */
router.patch('/:id/urgency', simpleAuth, async (req, res) => {
  try {
    const { urgency } = req.body;

    const validUrgencies = ['normal', 'urgent', 'emergency'];
    if (!validUrgencies.includes(urgency)) {
      return res.status(400).json({ message: 'Invalid urgency level' });
    }

    const ticket = await queueService.changeUrgency(req.params.id, urgency);

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue_updated', { action: 'urgency_changed', ticket });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Change urgency error:', error);
    res.status(500).json({ message: 'Failed to change urgency', error: error.message });
  }
});

/**
 * DELETE /api/queue/:id
 * Remove/skip a ticket
 */
router.delete('/:id', simpleAuth, async (req, res) => {
  try {
    const ticket = await queueService.removeTicket(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('queue_updated', { action: 'removed', ticket });
    }

    res.json({ message: 'Ticket removed', ticket });
  } catch (error) {
    console.error('Remove ticket error:', error);
    res.status(500).json({ message: 'Failed to remove ticket', error: error.message });
  }
});

/**
 * GET /api/queue/patient/:patientId
 * Get tickets for a specific patient
 */
router.get('/patient/:patientId', simpleAuth, async (req, res) => {
  try {
    const tickets = await queueService.getPatientTickets(req.params.patientId);
    res.json(tickets);
  } catch (error) {
    console.error('Get patient tickets error:', error);
    res.status(500).json({ message: 'Failed to get patient tickets', error: error.message });
  }
});

module.exports = router;
