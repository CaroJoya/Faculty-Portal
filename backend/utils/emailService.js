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

// Debug log for email configuration
console.log('[emailService] 📧 Email Configuration:');
console.log(`[emailService]   SMTP_HOST: ${SMTP_HOST}`);
console.log(`[emailService]   SMTP_PORT: ${SMTP_PORT}`);
console.log(`[emailService]   SMTP_USER: ${SMTP_USER ? '✅ Set' : '❌ Missing'}`);
console.log(`[emailService]   SMTP_PASS: ${SMTP_PASS ? '✅ Set' : '❌ Missing'}`);
console.log(`[emailService]   SMTP_FROM_EMAIL: ${SMTP_FROM_EMAIL}`);
console.log(`[emailService]   FRONTEND_URL: ${FRONTEND_URL}`);

if (SMTP_USER && SMTP_PASS && SMTP_USER !== 'your_email@gmail.com' && SMTP_PASS !== 'your_app_password') {
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
    
    // Verify connection
    transporter.verify((error, success) => {
      if (error) {
        console.error('[emailService] ❌ SMTP Verification Failed:', error.message);
        mailEnabled = false;
      } else {
        console.log('[emailService] ✅ SMTP Transporter configured and verified successfully');
        mailEnabled = true;
      }
    });
  } catch (err) {
    console.error('[emailService] ❌ Failed to initialize SMTP:', err.message);
    mailEnabled = false;
  }
} else {
  console.warn('[emailService] ⚠️ SMTP_USER or SMTP_PASS not configured or using placeholder values. Emails will be logged only.');
  console.warn('[emailService] ⚠️ Please set valid SMTP_USER and SMTP_PASS in .env file');
}

// ========== CORE SEND FUNCTION ==========
async function sendEmail(to, subject, htmlContent) {
  if (!mailEnabled || !transporter) {
    console.log('[EMAIL-LOG] 📝 Email would be sent to:', to);
    console.log('[EMAIL-LOG] 📝 Subject:', subject);
    console.log('[EMAIL-LOG] ⚠️ Email not actually sent - SMTP not configured');
    return false;
  }

  if (!to || !to.includes('@')) {
    console.error('[emailService] ❌ Invalid recipient email:', to);
    return false;
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
    console.error(`[emailService] ❌ Send failed to ${to}:`, error.message);
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
  // REMOVED: The reviewLink parameter and button are no longer used
  return shell({
    title: "📋 New Leave Request",
    subtitle: `${requester.full_name} needs your review`,
    bodyHtml: `
      <p><strong>Requester:</strong> ${requester.full_name}</p>
      <p><strong>Department:</strong> ${requester.department || '-'}</p>
      <p><strong>Role:</strong> ${requester.role || '-'}</p>
      <p><strong>Period:</strong> ${leaveRequest.start_date} → ${leaveRequest.end_date}</p>
      <p><strong>Type:</strong> ${leaveRequest.leave_category} (${leaveRequest.leave_type})</p>
      <p><strong>Reason:</strong> ${(leaveRequest.reason || '-').substring(0, 200)}</p>
      <p style="margin-top:20px;color:#6b7280;font-size:13px;">Please log in to the portal to review and take action on this request.</p>
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
      <p>We received a request to reset your password for the PCE Faculty Leave Portal.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:15px;margin:20px 0;text-align:center;">
        <a href="${resetLink}" style="display:inline-block;background:#059669;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Reset Password →</a>
      </div>
      <p style="font-size:12px;">This link will expire in 1 hour. If you didn't request this, please ignore this email.</p>
    `
  });
}

// ========== PUBLIC EXPORTS ==========
async function sendNewLeaveRequest(requester, leaveRequest, recipient, reviewLink) {
  if (!recipient || !recipient.email) {
    console.error('[emailService] ❌ Cannot send new leave request: recipient has no email', recipient);
    return false;
  }
  // reviewLink parameter is kept for compatibility but not used in email
  const html = buildNewLeaveRequestTemplate(requester, leaveRequest, reviewLink);
  const result = await sendEmail(recipient.email, `📋 New Leave Request - ${requester.full_name}`, html);
  console.log(`[emailService] sendNewLeaveRequest to ${recipient.email}: ${result ? 'SUCCESS' : 'FAILED'}`);
  return result;
}

async function sendLeaveStatusUpdate(user, leaveRequest, status, comments) {
  if (!user || !user.email) {
    console.error('[emailService] ❌ Cannot send leave status update: user has no email', user);
    return false;
  }
  const html = buildLeaveStatusUpdateTemplate(user, leaveRequest, status, comments);
  const result = await sendEmail(user.email, `📧 Leave Request ${status}`, html);
  console.log(`[emailService] sendLeaveStatusUpdate to ${user.email} (${status}): ${result ? 'SUCCESS' : 'FAILED'}`);
  return result;
}

async function sendPasswordResetEmail(user, token) {
  if (!user || !user.email) {
    console.error('[emailService] ❌ Cannot send password reset: user has no email', user);
    return false;
  }
  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
  const html = buildPasswordResetTemplate(user, resetLink);
  const result = await sendEmail(user.email, "🔐 Reset Your Password", html);
  console.log(`[emailService] sendPasswordResetEmail to ${user.email}: ${result ? 'SUCCESS' : 'FAILED'}`);
  return result;
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