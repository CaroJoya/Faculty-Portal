const nodemailer = require('nodemailer');

// ========== CONFIGURATION ==========
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'pcefacultyleaveportal@gmail.com';
const SMTP_FROM_NAME = process.env.SMTP_FROM_NAME || 'PCE Faculty Leave Portal';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ========== INITIALIZE SMTP TRANSPORTER ==========
let transporter = null;
let mailEnabled = false;

if (SMTP_USER && SMTP_PASS) {
  try {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
    mailEnabled = true;
    console.log('[emailService] ✅ SMTP Transporter configured successfully');
  } catch (err) {
    console.error('[emailService] ❌ Failed to initialize SMTP:', err.message);
  }
} else {
  console.warn('[emailService] ⚠️ SMTP_USER or SMTP_PASS not configured. Emails will be logged only.');
}

// ========== CORE SEND FUNCTION ==========
async function sendEmail(to, subject, htmlContent) {
  if (!mailEnabled || !transporter) {
    console.log('[EMAIL-LOG] 📝 Would send to:', to);
    console.log('[EMAIL-LOG] 📝 Subject:', subject);
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${SMTP_FROM_NAME}" <${SMTP_FROM_EMAIL}>`,
      to: to,
      subject: subject,
      html: htmlContent
    });
    console.log(`[emailService] ✅ Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[emailService] ❌ Send failed:', error.message);
    return false;
  }
}

// ========== EMAIL TEMPLATES ==========
function shell({ title, subtitle, bodyHtml }) {
  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><title>${title}</title></head>
  <body style="font-family:Arial,sans-serif;margin:0;padding:20px;background:#f0f4f8;">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#1a56db,#4f46e5);padding:30px;color:white;text-align:center;">
        <h1 style="margin:0;">${title}</h1>
        <p style="margin:8px 0 0;opacity:0.9;">${subtitle || 'Pillai College of Engineering'}</p>
      </div>
      <div style="padding:30px;">
        ${bodyHtml}
      </div>
      <div style="text-align:center;padding:20px;font-size:12px;color:#6b7280;">
        Pillai College of Engineering, New Panvel<br>Faculty Leave Portal
      </div>
    </div>
  </body>
  </html>
  `;
}

function statusBadge(status) {
  const s = String(status || '').toLowerCase();
  const colors = {
    approved: { bg: '#d1fae5', text: '#065f46' },
    rejected: { bg: '#fee2e2', text: '#991b1b' },
    pending: { bg: '#fed7aa', text: '#92400e' }
  };
  const c = colors[s] || colors.pending;
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${c.bg};color:${c.text};">${status}</span>`;
}

function buildNewLeaveRequestTemplate(requester, leaveRequest, reviewLink) {
  return shell({
    title: "📋 New Leave Request",
    subtitle: `${requester.full_name} needs your review`,
    bodyHtml: `
      <p><strong>Requester:</strong> ${requester.full_name}</p>
      <p><strong>Department:</strong> ${requester.department || '-'}</p>
      <p><strong>Period:</strong> ${leaveRequest.start_date} → ${leaveRequest.end_date}</p>
      <p><strong>Type:</strong> ${leaveRequest.leave_category} (${leaveRequest.leave_type})</p>
      <p><strong>Reason:</strong> ${leaveRequest.reason || '-'}</p>
      <div style="text-align:center;margin-top:25px;">
        <a href="${reviewLink}" style="display:inline-block;background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Review Request →</a>
      </div>
    `
  });
}

function buildLeaveStatusUpdateTemplate(user, leaveRequest, status, comments) {
  return shell({
    title: status === 'Approved' ? '✅ Leave Request Approved' : '❌ Leave Request Update',
    subtitle: `Your request has been ${status.toLowerCase()}`,
    bodyHtml: `
      <div style="text-align:center;margin-bottom:20px;">${statusBadge(status)}</div>
      <p><strong>Period:</strong> ${leaveRequest.start_date} → ${leaveRequest.end_date}</p>
      <p><strong>Type:</strong> ${leaveRequest.leave_category}</p>
      ${comments ? `<p><strong>Comments:</strong> ${comments}</p>` : ''}
      <div style="text-align:center;margin-top:25px;">
        <a href="${FRONTEND_URL}/status" style="display:inline-block;background:#1a56db;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">View Status →</a>
      </div>
    `
  });
}

function buildPasswordResetTemplate(user, resetLink) {
  return shell({
    title: "🔐 Reset Your Password",
    subtitle: "No worries, it happens to everyone",
    bodyHtml: `
      <p>Hello ${user.full_name || user.username},</p>
      <p>We received a request to reset your password.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:15px;margin:20px 0;text-align:center;">
        <a href="${resetLink}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password →</a>
      </div>
      <p style="font-size:12px;">If you didn't request this, please ignore this email.</p>
    `
  });
}

// ========== PUBLIC EXPORTS ==========
async function sendNewLeaveRequest(requester, leaveRequest, recipient, reviewLink) {
  const html = buildNewLeaveRequestTemplate(requester, leaveRequest, reviewLink);
  return sendEmail(recipient.email, `📋 New Leave Request - ${requester.full_name}`, html);
}

async function sendLeaveStatusUpdate(user, leaveRequest, status, comments) {
  const html = buildLeaveStatusUpdateTemplate(user, leaveRequest, status, comments);
  return sendEmail(user.email, `📧 Leave Request ${status}`, html);
}

async function sendPasswordResetEmail(user, token) {
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
  const html = buildPasswordResetTemplate(user, resetLink);
  return sendEmail(user.email, "🔐 Reset Your Password", html);
}

async function sendCompensationNotification(conversion, action, comments, recipientEmail) {
  console.log('[emailService] Compensation notification not implemented');
  return true;
}

module.exports = {
  sendEmail,
  sendNewLeaveRequest,
  sendLeaveStatusUpdate,
  sendCompensationNotification,
  sendPasswordResetEmail,
  mailEnabled
};