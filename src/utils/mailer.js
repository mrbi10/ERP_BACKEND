const axios = require("axios");
const { getAccessToken } = require("./msGraphAuth");

/* ================= CORE MAIL SENDER ================= */
const sendMail = async (toEmail, subject, html) => {
  const token = await getAccessToken();
  const url = `https://graph.microsoft.com/v1.0/users/${process.env.MAIL_SENDER}/sendMail`;

  await axios.post(
    url,
    {
      message: {
        subject,
        body: { contentType: "HTML", content: html },
        toRecipients: [{ emailAddress: { address: toEmail } }]
      },
      saveToSentItems: false
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );
};

exports.sendMail = sendMail;

/* ================= PREMIUM BASE TEMPLATE ================= */
const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>

<head>
  <meta charset="UTF-8" />
  <style>
    img {
      display: none !important;
      max-width: 0 !important;
      height: 0 !important;
      overflow: hidden !important;
    }
  </style>
  <title>${title}</title>
</head>
<body style="
  margin:0;
  padding:0;
  background-color:#F8FAFC;
  font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#F8FAFC;">
    <tr>
      <td align="center" style="padding: 60px 20px;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width:560px; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03); border: 1px solid #E2E8F0;">
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: left;">
              <div style="font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #0F172A; display: flex; align-items: center;">
                <span style="background: #2563EB; color: #fff; padding: 4px 10px; border-radius: 6px; margin-right: 10px; font-size: 16px;">M</span>
                MNMJEC <span style="font-weight: 300; color: #64748B; margin-left: 4px;">ERP</span>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding: 0 40px 40px 40px;">
              ${content}
            </td>
          </tr>

          <tr>
                <td style="padding: 36px 40px; background-color: #F8FAFC; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: #94A3B8; line-height: 1.6;">
                This is an automated message. Please do not reply.<br/>
                &copy; ${new Date().getFullYear()} MISRIMAL NAVAJEE MUNOTH JAIN ENGINEERING COLLEGE. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

/* ================= RESET PASSWORD MAIL ================= */
exports.sendResetMail = async (to, name, token) => {
  const link = `${process.env.FRONTEND_URL}/resetpassword/${token}`;

  const content = `
    <h1 style="font-size: 24px; font-weight: 700; color: #1E293B; margin: 0 0 16px 0;">Password Reset Request</h1>
    <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
      Hello <strong>${name}</strong>,<br/><br/>
      We received a request to access your MNMJEC ERP account. Click the button below to set a new secure password.
    </p>

    <div style="margin: 32px 0;">
      <a href="${link}" style="
        display: inline-block;
        padding: 14px 32px;
        background-color: #2563EB;
        color: #ffffff;
        text-decoration: none;
        border-radius: 8px;
        font-size: 15px;
        font-weight: 600;
        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
      ">
        Reset My Password
      </a>
    </div>

    <p style="font-size: 14px; color: #94A3B8; line-height: 1.6; border-top: 1px solid #F1F5F9; padding-top: 20px;">
      <strong>Note:</strong> This link expires in 60 minutes. If you didn't request this, your account is still safe and no action is required.
    </p>
  `;

  const html = baseTemplate("Security: Reset Password", content);
  await sendMail(to, "Action Required: Reset your ERP password", html);
};

/* ================= OTP MAIL ================= */
exports.sendOtpMail = async (to, name, otp) => {
  const content = `
    <h1 style="font-size: 24px; font-weight: 700; color: #1E293B; margin: 0 0 16px 0;">Verification Code</h1>
    <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-bottom: 24px;">
      Hello <strong>${name}</strong>, use the secure code below to finalize your login session.
    </p>

    <div style="
      margin: 32px 0;
      padding: 24px;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      text-align: center;
    ">
      <div style="
        font-family: 'Courier New', Courier, monospace;
        font-size: 36px;
        font-weight: 800;
        letter-spacing: 10px;
        color: #2563EB;
      ">
        ${otp}
      </div>
    </div>

    <p style="font-size: 14px; color: #94A3B8; line-height: 1.6;">
      This code is sensitive and will expire in <span style="color:#E11D48; font-weight:600;">5 minutes</span>. 
      For your security, never share your OTP with anyone, including staff members.
    </p>
  `;

  const html = baseTemplate("Security: OTP Verification", content);
  await sendMail(to, "Your ERP Verification Code", html);
};