const nodemailer = require('nodemailer');
const { DateTime } = require('luxon');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function formatBookingTime(utcStr, timezone) {
  return DateTime.fromSQL(utcStr, { zone: 'UTC' })
    .setZone(timezone)
    .toFormat('EEEE, MMMM d, yyyy \'at\' h:mm a ZZZZ');
}

async function sendBookingConfirmation(booking, eventType) {
  const transport = getTransporter();
  if (!transport) return;

  const from = process.env.SMTP_FROM || 'noreply@calendly-clone.com';
  const timezone = booking.timezone || 'UTC';
  const formattedTime = formatBookingTime(booking.start_time, timezone);

  const subject = `Booking Confirmed: ${eventType.name} with ${booking.host_name}`;

  const html = `
    <h2>Your booking is confirmed!</h2>
    <p>Hi ${booking.invitee_name},</p>
    <p>Your <strong>${eventType.name}</strong> with <strong>${booking.host_name}</strong> has been scheduled.</p>
    <hr/>
    <p><strong>Date & Time:</strong> ${formattedTime}</p>
    <p><strong>Duration:</strong> ${eventType.duration} minutes</p>
    ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
    <hr/>
    <p>Confirmation ID: <code>${booking.confirmation_token}</code></p>
    <p>If you need to cancel, please contact ${booking.host_email}.</p>
  `;

  await transport.sendMail({
    from,
    to: booking.invitee_email,
    subject,
    html,
  });
}

async function sendCancellationNotification(booking, eventType) {
  const transport = getTransporter();
  if (!transport) return;

  const from = process.env.SMTP_FROM || 'noreply@calendly-clone.com';
  const timezone = booking.timezone || 'UTC';
  const formattedTime = formatBookingTime(booking.start_time, timezone);

  const subject = `Booking Cancelled: ${eventType.name}`;

  const html = `
    <h2>Your booking has been cancelled</h2>
    <p>Hi ${booking.invitee_name},</p>
    <p>Your <strong>${eventType.name}</strong> scheduled for <strong>${formattedTime}</strong> has been cancelled.</p>
    ${booking.cancel_reason ? `<p><strong>Reason:</strong> ${booking.cancel_reason}</p>` : ''}
    <p>Please contact ${booking.host_email} if you have any questions.</p>
  `;

  await transport.sendMail({
    from,
    to: booking.invitee_email,
    subject,
    html,
  });
}

async function sendRescheduleNotification(booking, eventType, oldStartTime) {
  const transport = getTransporter();
  if (!transport) return;

  const from = process.env.SMTP_FROM || 'noreply@calendly-clone.com';
  const timezone = booking.timezone || 'UTC';
  const newTime = formatBookingTime(booking.start_time, timezone);
  const oldTime = formatBookingTime(oldStartTime, timezone);

  const subject = `Booking Rescheduled: ${eventType.name}`;

  const html = `
    <h2>Your booking has been rescheduled</h2>
    <p>Hi ${booking.invitee_name},</p>
    <p>Your <strong>${eventType.name}</strong> has been rescheduled.</p>
    <p><strong>Previous time:</strong> ${oldTime}</p>
    <p><strong>New time:</strong> ${newTime}</p>
    <p>Confirmation ID: <code>${booking.confirmation_token}</code></p>
  `;

  await transport.sendMail({
    from,
    to: booking.invitee_email,
    subject,
    html,
  });
}

module.exports = { sendBookingConfirmation, sendCancellationNotification, sendRescheduleNotification };
