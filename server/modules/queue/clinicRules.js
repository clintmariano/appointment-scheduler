/**
 * Clinic Priority Rules
 *
 * Priority Order (lower rank = higher priority):
 * 1. Emergency pregnant      (100)
 * 2. Urgent pregnant         (200)
 * 3. Scheduled pregnant      (300)
 * 4. Walk-in pregnant        (400)
 * 5. Scheduled non-pregnant  (500)
 * 6. Walk-in non-pregnant    (600)
 *
 * Within the same priority group:
 * - Scheduled patients: ordered by appointment creation time
 * - Walk-ins: ordered by queue entry time
 */

const PRIORITY_MAP = {
  'emergency_pregnant': 100,
  'urgent_pregnant': 200,
  'scheduled_pregnant': 300,
  'walk_in_pregnant': 400,
  'scheduled_non_pregnant': 500,
  'walk_in_non_pregnant': 600,
};

/**
 * Calculate priority rank for a clinic ticket
 *
 * @param {Object} ticket - Queue ticket with urgency, source, and attributes
 * @returns {Number} Priority rank (lower = higher priority)
 */
function calculate(ticket) {
  const isPregnant = ticket.attributes?.patientGroup === 'pregnant';
  const urgency = ticket.urgency || 'normal';
  const source = ticket.source || 'walk_in';

  let key;

  // Emergency patients (pregnant get even higher priority)
  if (urgency === 'emergency') {
    key = isPregnant ? 'emergency_pregnant' : 'scheduled_non_pregnant';
    // For emergency non-pregnant, treat as high priority too
    if (!isPregnant) return 150; // Between emergency_pregnant and urgent_pregnant
  }
  // Urgent patients
  else if (urgency === 'urgent') {
    key = isPregnant ? 'urgent_pregnant' : 'scheduled_non_pregnant';
    // For urgent non-pregnant, treat as medium-high priority
    if (!isPregnant) return 250; // Between urgent_pregnant and scheduled_pregnant
  }
  // Normal priority - depends on source and pregnancy status
  else {
    if (isPregnant) {
      key = source === 'scheduled' ? 'scheduled_pregnant' : 'walk_in_pregnant';
    } else {
      key = source === 'scheduled' ? 'scheduled_non_pregnant' : 'walk_in_non_pregnant';
    }
  }

  return PRIORITY_MAP[key] || 500;
}

/**
 * Get human-readable priority label
 *
 * @param {Number} rank - Priority rank
 * @returns {String} Priority label
 */
function getLabel(rank) {
  if (rank <= 100) return 'Emergency (Pregnant)';
  if (rank <= 150) return 'Emergency';
  if (rank <= 200) return 'Urgent (Pregnant)';
  if (rank <= 250) return 'Urgent';
  if (rank <= 300) return 'Scheduled (Pregnant)';
  if (rank <= 400) return 'Walk-in (Pregnant)';
  if (rank <= 500) return 'Scheduled';
  return 'Walk-in';
}

/**
 * Get priority color for UI display
 *
 * @param {Object} ticket - Queue ticket
 * @returns {String} Color code
 */
function getColor(ticket) {
  const urgency = ticket.urgency || 'normal';
  const isPregnant = ticket.attributes?.patientGroup === 'pregnant';

  if (urgency === 'emergency') return 'red';
  if (urgency === 'urgent') return 'amber';
  if (isPregnant) return 'teal';
  return 'gray';
}

module.exports = {
  calculate,
  getLabel,
  getColor,
  PRIORITY_MAP
};
