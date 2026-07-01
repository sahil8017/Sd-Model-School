const nodemailer = require('nodemailer');
const { EmailConfig } = require('../database/models.cjs');

const SCHOOL = process.env.SCHOOL_NAME || 'S.D. Model Sr. Sec. School, Karnal';

// Cached transporter — recreated whenever config changes
let _transporter = null;
let _configHash   = null;

async function getConfig() {
  const cfg = await EmailConfig.findOne();
  if (!cfg?.gmail_user || !cfg?.gmail_app_password || !cfg?.enabled)
    throw new Error('Gmail not configured. Ask admin to set up Email Settings first.');
  return cfg;
}

async function getTransporter() {
  const cfg  = await getConfig();
  const hash = `${cfg.gmail_user}:${cfg.gmail_app_password}`;
  if (!_transporter || hash !== _configHash) {
    _transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: cfg.gmail_user, pass: cfg.gmail_app_password },
    });
    _configHash = hash;
  }
  return { transporter: _transporter, from: `"${cfg.from_name || SCHOOL}" <${cfg.gmail_user}>` };
}

async function sendEmail({ to, subject, html, text }) {
  const { transporter, from } = await getTransporter();
  const info = await transporter.sendMail({ from, to, subject, html: html || text, text });
  console.log(`✉️  Email sent → ${to}  [${info.messageId}]`);
  return info;
}

async function sendBatch(messages) {
  const { transporter, from } = await getTransporter();
  const results = await Promise.allSettled(
    messages.map(m => transporter.sendMail({ from, to: m.to, subject: m.subject, html: m.html || m.text, text: m.text }))
  );
  const sent   = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').map((r, i) => ({ to: messages[i]?.to, error: r.reason?.message }));
  console.log(`✉️  Batch: ${sent}/${messages.length} sent`);
  if (failed.length) console.warn('Failed:', failed);
  return { sent, total: messages.length, failed };
}

// Email templates
function salaryTemplate({ teacherName, amount, month, designation }) {
  return {
    subject: `Salary Credit Notification — ${month}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e3a5f;padding:24px;text-align:center">
          <h2 style="color:#fff;margin:0;font-size:20px">${SCHOOL}</h2>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Salary Notification</p>
        </div>
        <div style="padding:28px">
          <p style="color:#374151">Dear <strong>${teacherName}</strong> (${designation}),</p>
          <p style="color:#374151">Your salary for <strong>${month}</strong> has been credited to your account.</p>
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin:20px 0;text-align:center">
            <div style="font-size:13px;color:#166534">Amount Credited</div>
            <div style="font-size:32px;font-weight:bold;color:#15803d">₹${Number(amount).toLocaleString('en-IN')}</div>
          </div>
          <p style="color:#6b7280;font-size:13px">If you have any queries, please contact the administration office.</p>
        </div>
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">${SCHOOL}</p>
        </div>
      </div>`,
  };
}

function attendanceTemplate({ studentName, className, date, status, teacherName }) {
  const isAbsent = status === 'Absent';
  return {
    subject: `Attendance Update — ${studentName} — ${date}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e3a5f;padding:24px;text-align:center">
          <h2 style="color:#fff;margin:0;font-size:20px">${SCHOOL}</h2>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Attendance Notification</p>
        </div>
        <div style="padding:28px">
          <p style="color:#374151">Dear Parent/Guardian,</p>
          <p style="color:#374151">This is to inform you that <strong>${studentName}</strong> (Class ${className}) was marked
            <span style="color:${isAbsent ? '#dc2626' : '#16a34a'};font-weight:bold">${status}</span>
            on <strong>${date}</strong>.</p>
          ${isAbsent ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin:16px 0;color:#991b1b;font-size:13px">
            ⚠️ Please contact the school if this absence was unexpected or if your child is unwell.
          </div>` : ''}
          <p style="color:#6b7280;font-size:13px">Recorded by: ${teacherName}</p>
        </div>
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">${SCHOOL}</p>
        </div>
      </div>`,
  };
}

function marksTemplate({ studentName, className, subject, marksObtained, totalMarks, examType, teacherName }) {
  const pct  = ((marksObtained / totalMarks) * 100).toFixed(1);
  const grade = pct >= 90 ? 'A+' : pct >= 80 ? 'A' : pct >= 70 ? 'B+' : pct >= 60 ? 'B' : pct >= 50 ? 'C' : 'D';
  return {
    subject: `${examType} Results — ${studentName} — ${subject}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e3a5f;padding:24px;text-align:center">
          <h2 style="color:#fff;margin:0;font-size:20px">${SCHOOL}</h2>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">${examType} Result</p>
        </div>
        <div style="padding:28px">
          <p style="color:#374151">Dear Parent/Guardian,</p>
          <p style="color:#374151"><strong>${studentName}</strong> (Class ${className}) ${examType} result:</p>
          <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
            <div style="font-size:14px;color:#1d4ed8;font-weight:600">${subject}</div>
            <div style="font-size:36px;font-weight:bold;color:#1e40af">${marksObtained}<span style="font-size:18px;color:#93c5fd">/${totalMarks}</span></div>
            <div style="display:flex;justify-content:center;gap:20px;margin-top:8px">
              <span style="background:#dbeafe;color:#1d4ed8;padding:4px 12px;border-radius:20px;font-size:13px">${pct}%</span>
              <span style="background:#dbeafe;color:#1d4ed8;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:bold">Grade ${grade}</span>
            </div>
          </div>
          <p style="color:#6b7280;font-size:13px">Teacher: ${teacherName}</p>
        </div>
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">${SCHOOL}</p>
        </div>
      </div>`,
  };
}

function complaintTemplate({ studentName, className, complaint, teacherName, date }) {
  return {
    subject: `School Notice — ${studentName} — ${date}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e3a5f;padding:24px;text-align:center">
          <h2 style="color:#fff;margin:0;font-size:20px">${SCHOOL}</h2>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Teacher Notice</p>
        </div>
        <div style="padding:28px">
          <p style="color:#374151">Dear Parent/Guardian,</p>
          <p style="color:#374151">This is regarding <strong>${studentName}</strong> (Class ${className}):</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0;color:#92400e">
            ${complaint}
          </div>
          <p style="color:#6b7280;font-size:13px">From: ${teacherName} · Date: ${date}</p>
          <p style="color:#374151;font-size:13px">Please contact the school if you wish to discuss this matter.</p>
        </div>
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">${SCHOOL}</p>
        </div>
      </div>`,
  };
}

function credentialsTemplate({ teacherName, designation, schoolEmail, password }) {
  return {
    subject: `Teacher Login Credentials — ${teacherName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e3a5f;padding:24px;text-align:center">
          <h2 style="color:#fff;margin:0;font-size:20px">${SCHOOL}</h2>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">Teacher Login Credentials</p>
        </div>
        <div style="padding:28px">
          <p style="color:#374151">New teacher account has been created:</p>
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:16px 0">
            <table style="width:100%;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px;width:120px">Name</td><td style="padding:6px 0;font-weight:600;color:#1e293b">${teacherName}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Designation</td><td style="padding:6px 0;font-weight:600;color:#1e293b">${designation || 'Teacher'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Login Email</td><td style="padding:6px 0;font-family:monospace;color:#2563eb">${schoolEmail}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b;font-size:13px">Password</td><td style="padding:6px 0;font-family:monospace;font-weight:bold;color:#dc2626">${password}</td></tr>
            </table>
          </div>
          <p style="color:#6b7280;font-size:13px">Please share these credentials with the teacher. They can log in at the school management portal.</p>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px;margin-top:12px;font-size:12px;color:#92400e">
            ⚠️ Please ask the teacher to change their password after first login.
          </div>
        </div>
        <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:16px;text-align:center">
          <p style="color:#9ca3af;font-size:12px;margin:0">${SCHOOL}</p>
        </div>
      </div>`,
  };
}

function bulkCredentialsTemplate(teachers) {
  const rows = teachers.map(t => `
    <tr style="border-bottom:1px solid #e2e8f0">
      <td style="padding:8px 10px;color:#1e293b">${t.name}</td>
      <td style="padding:8px 10px;color:#64748b;font-size:12px">${t.designation}</td>
      <td style="padding:8px 10px;font-family:monospace;font-size:12px;color:#2563eb">${t.schoolEmail}</td>
      <td style="padding:8px 10px;font-family:monospace;font-weight:bold;color:#dc2626">${t.password}</td>
    </tr>`).join('');
  return {
    subject: `All Teacher Credentials — ${SCHOOL}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:800px;margin:auto;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden">
        <div style="background:#1e3a5f;padding:24px;text-align:center">
          <h2 style="color:#fff;margin:0;font-size:20px">${SCHOOL}</h2>
          <p style="color:#93c5fd;margin:4px 0 0;font-size:13px">All Teacher Login Credentials</p>
        </div>
        <div style="padding:28px">
          <p style="color:#374151">${teachers.length} teacher accounts — credentials listed below:</p>
          <div style="overflow-x:auto;margin-top:12px">
            <table style="width:100%;border-collapse:collapse;font-size:13px">
              <thead>
                <tr style="background:#f1f5f9">
                  <th style="padding:8px 10px;text-align:left;color:#475569">Name</th>
                  <th style="padding:8px 10px;text-align:left;color:#475569">Designation</th>
                  <th style="padding:8px 10px;text-align:left;color:#475569">Login Email</th>
                  <th style="padding:8px 10px;text-align:left;color:#475569">Password</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </div>
          <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:10px;margin-top:16px;font-size:12px;color:#92400e">
            ⚠️ Keep this email confidential. Ask teachers to change their passwords after first login.
          </div>
        </div>
      </div>`,
  };
}

module.exports = { sendEmail, sendBatch, salaryTemplate, attendanceTemplate, marksTemplate, complaintTemplate, credentialsTemplate, bulkCredentialsTemplate };
