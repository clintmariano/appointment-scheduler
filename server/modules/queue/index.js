/**
 * Queue Module
 *
 * Entry point for the queue management module.
 * Initializes the priority engine with clinic rules and exports the queue service.
 */

const PriorityEngine = require('./priorityEngine');
const clinicRules = require('./clinicRules');
const QueueService = require('./queueService');

// Initialize priority engine with clinic rules
const priorityEngine = new PriorityEngine(clinicRules);

// Create queue service instance
const queueService = new QueueService(priorityEngine);

module.exports = {
  PriorityEngine,
  clinicRules,
  QueueService,
  priorityEngine,
  queueService
};
