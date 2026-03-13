/**
 * Generic Priority Engine
 *
 * This is a business-agnostic priority calculation engine.
 * It delegates the actual priority calculation to injected rules.
 *
 * The engine provides:
 * - Priority rank calculation (lower = higher priority)
 * - Sort key extraction for ordering within same rank
 * - Comparison function for sorting tickets
 */

class PriorityEngine {
  /**
   * @param {Object} rules - Rule set with a calculate(ticket) method
   */
  constructor(rules) {
    this.rules = rules;
  }

  /**
   * Calculate priority rank for a ticket
   * Lower numbers = higher priority
   *
   * @param {Object} ticket - Queue ticket
   * @returns {Number} Priority rank
   */
  calculateRank(ticket) {
    if (!this.rules || typeof this.rules.calculate !== 'function') {
      // Default: treat all tickets equally
      return 500;
    }
    return this.rules.calculate(ticket);
  }

  /**
   * Get sort key for ordering within same priority rank
   * - Scheduled patients: sorted by scheduledAt or queueEnteredAt
   * - Walk-ins: sorted by queueEnteredAt
   *
   * @param {Object} ticket - Queue ticket
   * @returns {Date} Sort key timestamp
   */
  getSortKey(ticket) {
    if (ticket.source === 'scheduled') {
      return new Date(ticket.scheduledAt || ticket.queueEnteredAt);
    }
    return new Date(ticket.queueEnteredAt);
  }

  /**
   * Compare two tickets for sorting
   * First by priorityRank, then by sort key, then by queueEnteredAt
   *
   * @param {Object} a - First ticket
   * @param {Object} b - Second ticket
   * @returns {Number} Comparison result (-1, 0, 1)
   */
  compare(a, b) {
    // First compare by priority rank
    if (a.priorityRank !== b.priorityRank) {
      return a.priorityRank - b.priorityRank;
    }

    // Then compare by sort key (earlier = higher priority)
    const keyA = this.getSortKey(a);
    const keyB = this.getSortKey(b);
    const sortKeyDiff = keyA.getTime() - keyB.getTime();

    if (sortKeyDiff !== 0) {
      return sortKeyDiff;
    }

    // Tie-breaker: use queueEnteredAt (first added to queue wins)
    const enteredA = new Date(a.queueEnteredAt);
    const enteredB = new Date(b.queueEnteredAt);
    return enteredA.getTime() - enteredB.getTime();
  }

  /**
   * Sort an array of tickets by priority
   *
   * @param {Array} tickets - Array of queue tickets
   * @returns {Array} Sorted array
   */
  sortQueue(tickets) {
    return [...tickets].sort((a, b) => this.compare(a, b));
  }
}

module.exports = PriorityEngine;
