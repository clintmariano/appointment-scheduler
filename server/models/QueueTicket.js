const mongoose = require('mongoose');

// Queue Ticket Schema
const queueTicketSchema = new mongoose.Schema({
  // Identity
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  tenantId: {
    type: String,
    default: 'default',
    index: true
  },
  locationId: {
    type: String,
    default: 'main',
    index: true
  },

  // References (optional - for flexibility)
  appointmentId: {
    type: String,
    default: null,
    index: true
  },
  patientId: {
    type: String,
    default: null,
    index: true
  },

  // Patient Info Snapshot (for display without joins)
  patientName: {
    type: String,
    required: true
  },
  patientBirthday: {
    type: String,
    default: ''
  },

  // Source & Classification
  source: {
    type: String,
    enum: ['scheduled', 'walk_in'],
    required: true
  },
  urgency: {
    type: String,
    enum: ['emergency', 'urgent', 'normal'],
    default: 'normal'
  },

  // Generic Attributes (for priority calculation)
  attributes: {
    patientGroup: { type: String, default: '' },    // e.g., 'pregnant', 'pediatric', 'general'
    serviceType: { type: String, default: '' },     // e.g., 'consultation', 'vaccination'
  },

  // Status
  status: {
    type: String,
    enum: ['waiting', 'called', 'in_progress', 'done', 'skipped', 'no_show'],
    default: 'waiting',
    index: true
  },

  // Priority (calculated by engine)
  priorityRank: {
    type: Number,
    default: 500,
    index: true
  },

  // Timestamps
  scheduledAt: {
    type: Date,
    default: null
  },
  queueEnteredAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  calledAt: {
    type: Date,
    default: null
  },
  servedAt: {
    type: Date,
    default: null
  },
  completedAt: {
    type: Date,
    default: null
  },

  // Assignment
  servedBy: {
    type: String,
    default: null
  },
  deskNumber: {
    type: String,
    default: null
  },

  // Manual queue order override (set by assistant to override priority sorting)
  manualOrder: {
    type: Number,
    default: null
  },

  // Notes
  notes: {
    type: String,
    default: ''
  },

  // Metadata
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: null
  }
});

// Compound indexes for efficient queries
queueTicketSchema.index({ tenantId: 1, locationId: 1, status: 1, priorityRank: 1 });
queueTicketSchema.index({ tenantId: 1, locationId: 1, queueEnteredAt: 1 });

// Pre-save middleware to update timestamps
queueTicketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('QueueTicket', queueTicketSchema);
