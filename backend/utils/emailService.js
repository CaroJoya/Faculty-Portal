const Brevo = require('@getbrevo/brevo');

// ========== CONFIGURATION ==========
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || 'shrusti24comp@student.mes.ac.in';
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || 'Pillai College of Engineering';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ========== INITIALIZE BREVO ==========
let brevoClient = null;
let mailEnabled = false;

if (BREVO_API_KEY && BREVO_API_KEY !== 'your-brevo-api-key-here') {
  try {
    brevoClient = new Brevo.TransactionalEmailsApi();
    brevoClient.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);
    mailEnabled = true;
    console.log('[emailService] ✅ Brevo API configured successfully');
    console.log(`[emailService] 📧 Sender: ${BREVO_SENDER_NAME} <${BREVO_SENDER_EMAIL}>`);
  } catch (err) {
    console.error('[emailService] ❌ Failed to initialize Brevo:', err.message);
  }
} else {
  console.warn('[emailService] ⚠️ BREVO_API_KEY not configured. Emails will be logged only.');
  console.warn('[emailService] 💡 Set BREVO_API_KEY in Render environment variables');
}

// ========== CORE SEND FUNCTION ==========
async function sendEmail(to, subject, htmlContent) {
  if (!mailEnabled || !brevoClient) {
    console.log('[EMAIL-LOG] 📝 Would send to:', to);
    console.log('[EMAIL-LOG] 📝 Subject:', subject);
    console.log('[EMAIL-LOG] 📝 Preview:', String(htmlContent).slice(0, 200));
    return true;
  }

  try {
    const sendSmtpEmail = new Brevo.SendSmtpEmail();
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = {
      name: BREVO_SENDER_NAME,
      email: BREVO_SENDER_EMAIL
    };
    sendSmtpEmail.to = [{ email: to }];
    
    // Add reply-to (optional)
    sendSmtpEmail.replyTo = { email: BREVO_SENDER_EMAIL, name: BREVO_SENDER_NAME };

    const response = await brevoClient.sendTransacEmail(sendSmtpEmail);
    console.log(`[emailService] ✅ Email sent to ${to}`);
    console.log(`[emailService] 📨 Message ID: ${response?.messageId || 'unknown'}`);
    return true;
  } catch (error) {
    console.error('[emailService] ❌ Send failed:', error?.response?.body?.message || error.message);
    if (error?.response?.body) {
      console.error('[emailService] 📋 Details:', JSON.stringify(error.response.body, null, 2));
    }
    return false;
  }
}

// ========== EMAIL TEMPLATES ==========
function shell({ title, subtitle, bodyHtml }) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;">
    <div style="max-width:600px;margin:0 auto;padding:20px;">
      <div style="background:linear-gradient(135deg,#1a56db,#4f46e5);padding:30px 20px;border-radius:16px 16px 0 0;color:white;text-align:center;">
        <img src="https://your-domain.com/logo.png" alt="PCE Logo" style="height:50px;margin-bottom:10px;" onerror="this.style.display='none'">
        <h1 style="margin:0;font-size:24px;">${title}</h1>
        <p style="margin:8px 0 0;opacity:0.9;">${subtitle || 'Pillai College of Engineering'}</p>
      </div>
      <div style="background:white;padding:30px 25px;border-radius:0 0 16px 16px;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
        ${bodyHtml}
      </div>
      <div style="text-align:center;padding:20px;font-size:12px;color:#6b7280;">
        <p>Pillai College of Engineering, New Panvel</p>
        <p>This is an automated message from the Faculty Leave Portal</p>
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
  return `<span style="display:inline-block;padding:4px 12px;border-radius:20px;background:${c.bg};color:${c.text};font-weight:600;">${status}</span>`;
}

function buildNewLeaveRequestTemplate(requester, leaveRequest, reviewLink) {
  return shell({
    title: "📋 New Leave Request",
    subtitle: `${requester.full_name} needs your review`,
    bodyHtml: `
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 15px;color:#1f2937;">Request Details</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;"><strong>Requester:</strong></td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${requester.full_name}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;"><strong>Department:</strong></td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${requester.department || '-'}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;"><strong>Period:</strong></td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${leaveRequest.start_date} → ${leaveRequest.end_date}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;"><strong>Type:</strong></td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${leaveRequest.leave_category} (${leaveRequest.leave_type})</td></tr>
          <tr><td style="padding:8px 0;"><strong>Reason:</strong></td><td style="padding:8px 0;">${leaveRequest.reason || '-'}</td></tr>
        </table>
      </div>
      <div style="text-align:center;margin-top:25px;">
        <a href="${reviewLink}" style="display:inline-block;background:#1a56db;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Review Request →</a>
      </div>
    `
  });
}

function buildLeaveStatusUpdateTemplate(user, leaveRequest, status, comments) {
  return shell({
    title: status === 'Approved' ? '✅ Leave Request Approved' : '❌ Leave Request Update',
    subtitle: `Your request has been ${status.toLowerCase()}`,
    bodyHtml: `
      <div style="margin-bottom:20px;text-align:center;">
        ${statusBadge(status)}
      </div>
      <div style="margin-bottom:20px;">
        <h3 style="margin:0 0 15px;color:#1f2937;">Request Summary</h3>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;"><strong>Period:</strong></td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${leaveRequest.start_date} → ${leaveRequest.end_date}</td></tr>
          <tr><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;"><strong>Type:</strong></td><td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${leaveRequest.leave_category}</td></tr>
          ${comments ? `<tr><td style="padding:8px 0;"><strong>Comments:</strong></td><td style="padding:8px 0;">${comments}</td></tr>` : ''}
        </table>
      </div>
      <div style="text-align:center;margin-top:25px;">
        <a href="${FRONTEND_URL}/status" style="display:inline-block;background:#1a56db;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">View My Status →</a>
      </div>
    `
  });
}

function buildPasswordResetTemplate(user, resetLink) {
  return shell({
    title: "🔐 Reset Your Password",
    subtitle: "No worries, it happens to everyone",
    bodyHtml: `
      <p style="margin-bottom:20px;">Hello ${user.full_name || user.username},</p>
      <p style="margin-bottom:20px;">We received a request to reset your password for the PCE Faculty Leave Portal.</p>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:15px;margin:20px 0;text-align:center;">
        <p style="margin:0 0 10px;font-size:14px;">Click the button below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetLink}" style="display:inline-block;background:#059669;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Reset Password →</a>
      </div>
      <p style="margin-top:20px;font-size:12px;color:#6b7280;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
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
  return sendEmail(user.email, "🔐 Reset Your Password - PCE Faculty Leave Portal", html);
}

// Placeholder for compatibility
async function sendCompensationNotification(conversion, action, comments, recipientEmail) {
  console.log('[emailService] Compensation notification not implemented with Brevo');
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