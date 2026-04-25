const nodemailer = require("nodemailer");

const MAIL_HOST = process.env.MAIL_HOST;
const MAIL_PORT = Number(process.env.MAIL_PORT || 587);
const MAIL_USER = process.env.MAIL_USER;
const MAIL_PASS = process.env.MAIL_PASS;
const MAIL_FROM = process.env.MAIL_FROM || `PCE Faculty Portal <${MAIL_USER || "no-reply@localhost"}>`;

const mailEnabled = !!(MAIL_HOST && MAIL_PORT && MAIL_USER && MAIL_PASS);

let transporter = null;
if (mailEnabled) {
  transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: false,
    auth: {
      user: MAIL_USER,
      pass: MAIL_PASS
    }
  });
} else {
  console.warn("[emailService] SMTP not configured. Emails will be logged only.");
}

function shell({ title, subtitle, bodyHtml }) {
  return `
  <div style="font-family:Arial,sans-serif;background:#f3f6fb;padding:20px;">
    <div style="max-width:700px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e5e7eb;">
      <div style="padding:20px;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#fff;">
        <h2 style="margin:0 0 6px 0;font-size:22px;">${title}</h2>
        <p style="margin:0;opacity:.9;">${subtitle || ""}</p>
      </div>
      <div style="padding:20px;color:#0f172a;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:14px 20px;border-top:1px solid #e5e7eb;color:#64748b;font-size:12px;">
        PCE Faculty Portal
      </div>
    </div>
  </div>
  `;
}

async function sendEmail(to, subject, html) {
  try {
    if (!to) return false;

    if (!mailEnabled) {
      console.log("[EMAIL-LOG]", { to, subject, preview: String(html).slice(0, 300) });
      return true;
    }

    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      html
    });
    return true;
  } catch (e) {
    console.error("[emailService] sendEmail error:", e.message);
    return false;
  }
}

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  const ok = s === "approved";
  const bg = ok ? "#dcfce7" : "#fee2e2";
  const fg = ok ? "#166534" : "#991b1b";
  return `<span style="display:inline-block;padding:6px 10px;border-radius:999px;background:${bg};color:${fg};font-weight:700;">${status}</span>`;
}

function buildNewLeaveRequestTemplate(requester, leaveRequest, reviewLink = "#") {
  return shell({
    title: "New Leave Request",
    subtitle: "A new leave request needs your review",
    bodyHtml: `
      <p><b>Requester:</b> ${requester.full_name} (${requester.username})</p>
      <p><b>Email:</b> ${requester.email || "-"}</p>
      <p><b>Department:</b> ${requester.department || "-"}</p>
      <hr style="border:none;border-top:1px solid #e5e7eb;" />
      <p><b>Period:</b> ${leaveRequest.start_date} to ${leaveRequest.end_date}</p>
      <p><b>Leave Type:</b> ${leaveRequest.leave_type || "-"}</p>
      <p><b>Category:</b> ${leaveRequest.leave_category || "-"}</p>
      <p><b>Reason:</b> ${leaveRequest.reason || "-"}</p>
      <a href="${reviewLink}" style="display:inline-block;margin-top:10px;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">Review Request</a>
    `
  });
}

function buildLeaveStatusUpdateTemplate(user, leaveRequest, status, comments = "") {
  return shell({
    title: "Leave Status Update",
    subtitle: "Your leave request has been updated",
    bodyHtml: `
      <p>Hello ${user.full_name || user.username},</p>
      <p>Status: ${statusBadge(status)}</p>
      <p><b>Period:</b> ${leaveRequest.start_date} to ${leaveRequest.end_date}</p>
      <p><b>Leave Type:</b> ${leaveRequest.leave_type || "-"}</p>
      <p><b>Category:</b> ${leaveRequest.leave_category || "-"}</p>
      <p><b>Reason:</b> ${leaveRequest.reason || "-"}</p>
      <p><b>Comments:</b> ${comments || "-"}</p>
      <a href="${process.env.FRONTEND_URL || "http://localhost:5173/login"}" style="display:inline-block;margin-top:10px;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">Login</a>
    `
  });
}

function buildCompensationRequestTemplate(payload, reviewLink = "#") {
  return shell({
    title: "Compensation Request Submitted",
    subtitle: "A compensation request needs review",
    bodyHtml: `
      <p><b>User:</b> ${payload.user_name} (${payload.user_username})</p>
      <p><b>Department:</b> ${payload.department || "-"}</p>
      <p><b>Extra Work Date:</b> ${payload.work_date || "-"}</p>
      <p><b>Hours:</b> ${payload.hours || "-"}</p>
      <p><b>Earned Leaves (calc):</b> ${payload.earned_leaves || "-"}</p>
      <p><b>Details:</b> ${payload.details || "-"}</p>
      <a href="${reviewLink}" style="display:inline-block;margin-top:10px;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">Review Compensation</a>
    `
  });
}

function buildCompensationDecisionTemplate(payload, action, comments = "") {
  const approved = action === "approved";
  return shell({
    title: approved ? "Compensation Approved" : "Compensation Rejected",
    subtitle: approved ? "Your compensation request was approved" : "Your compensation request was rejected",
    bodyHtml: `
      <p><b>Status:</b> ${approved ? "Approved" : "Rejected"}</p>
      <p><b>Hours:</b> ${payload.hours || "-"}</p>
      <p><b>Earned Leaves:</b> ${payload.earned_leaves || "-"}</p>
      <p><b>Updated Balance:</b> ${payload.updated_earned_leave_left ?? "-"}</p>
      <p><b>Comments:</b> ${comments || "-"}</p>
    `
  });
}

function buildPasswordResetTemplate(user, resetLink) {
  return shell({
    title: "Password Reset Request",
    subtitle: "This link will expire in 1 hour",
    bodyHtml: `
      <p>Hello ${user.full_name || user.username},</p>
      <p>We received a request to reset your password.</p>
      <a href="${resetLink}" style="display:inline-block;margin-top:10px;background:#1d4ed8;color:#fff;text-decoration:none;padding:10px 14px;border-radius:8px;">Reset Password</a>
      <p style="margin-top:14px;color:#64748b;">If you did not request this, you can ignore this email.</p>
    `
  });
}

async function sendNewLeaveRequest(requester, leaveRequest, recipient, reviewLink) {
  const html = buildNewLeaveRequestTemplate(requester, leaveRequest, reviewLink);
  return sendEmail(recipient.email, "New Leave Request - Action Required", html);
}

async function sendLeaveStatusUpdate(user, leaveRequest, status, comments) {
  const html = buildLeaveStatusUpdateTemplate(user, leaveRequest, status, comments);
  return sendEmail(user.email, `Leave Request ${status}`, html);
}

async function sendCompensationNotification(conversion, action, comments, recipientEmail) {
  const html =
    action === "requested"
      ? buildCompensationRequestTemplate(conversion)
      : buildCompensationDecisionTemplate(conversion, action, comments);
  const subject =
    action === "requested"
      ? "New Compensation Request"
      : action === "approved"
      ? "Compensation Approved"
      : "Compensation Rejected";
  return sendEmail(recipientEmail, subject, html);
}


// Add this function to emailService.js
function buildPasswordResetTemplate(user, resetLink) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
      <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
      <p style="color: #555;">Hello ${user.full_name || user.username},</p>
      <p style="color: #555;">Someone requested a password reset for your account. Click the link below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2b53e6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #555;">This link will expire in <strong>1 hour</strong>.</p>
      <p style="color: #888; font-size: 12px;">If you didn't request this, please ignore this email. Your password will remain unchanged.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="color: #999; font-size: 11px; text-align: center;">Faculty Leave Portal</p>
    </div>
  `;
}

// Update the sendPasswordResetEmail function
async function sendPasswordResetEmail(user, resetLink) {
  const html = buildPasswordResetTemplate(user, resetLink);
  return sendEmail(user.email, "Reset Your Password - Faculty Portal", html);
}

module.exports = {
  sendEmail,
  sendNewLeaveRequest,
  sendLeaveStatusUpdate,
  sendCompensationNotification,
  sendPasswordResetEmail
};