module.exports = {
  DEFAULT_USER_ID: 1,
  DEFAULT_SCHEDULE_ID: 1,

  BOOKING_STATUS: {
    CONFIRMED: 'confirmed',
    CANCELLED: 'cancelled',
    RESCHEDULED: 'rescheduled',
  },

  DAYS_OF_WEEK: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],

  DEFAULT_TIMEZONE: 'America/New_York',

  // Minimum minutes in advance a slot can be booked
  MIN_BOOKING_NOTICE_MINUTES: 30,

  // Maximum days ahead a booking can be made
  MAX_BOOKING_DAYS_AHEAD: 60,
};
