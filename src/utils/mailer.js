const nodemailer = require("nodemailer");

/**
 * Send password reset email
 */
exports.sendResetMail = async (toEmail, userName, token) => {
    try {
        // const transporter = nodemailer.createTransport({
        //     host: process.env.SMTP_HOST,
        //     port: Number(process.env.SMTP_PORT),
        //     secure: false,
        //     auth: {
        //         user: process.env.SMTP_USER,
        //         pass: process.env.SMTP_PASS
        //     },
        //     tls: {
        //         rejectUnauthorized: false
        //     }
        // });

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: process.env.SMTP_SECURE === "true",
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });


        const resetLink = `${process.env.FRONTEND_URL}/resetpassword/${token}`;

        const mailOptions = {
            from: `"MNMJEC ERP" <${process.env.SMTP_USER}>`,
            to: toEmail,
            subject: "Password Reset Request",
            html: `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fb; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
          
          <div style="background-color: #1e90ff; padding: 20px; text-align: center; color: #ffffff;">
            <h1 style="margin: 0; font-size: 24px;">MNMJEC ERP</h1>
          </div>
          
          <div style="padding: 30px; color: #333333;">
            <p style="font-size: 16px;">Hello <strong>${userName}</strong>,</p>
            <p style="font-size: 16px;">
              We received a request to reset your password.
              Click the button below to set a new password.
              This link is valid for <strong>1 hour</strong>.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background-color: #1e90ff; color: #ffffff; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 14px; color: #555555;">
              Or copy and paste this link into your browser:
            </p>
            <p style="word-break: break-all; font-size: 14px;">
              <a href="${resetLink}" style="color: #1e90ff;">${resetLink}</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0;">
            <p style="font-size: 12px; color: #888888;">
              If you did not request a password reset, please ignore this email.
              Your account remains secure.
            </p>
          </div>
          
          <div style="background-color: #f4f7fb; text-align: center; padding: 15px; font-size: 12px; color: #888888;">
            &copy; ${new Date().getFullYear()} MNMJEC ERP. All rights reserved.
          </div>
          
        </div>
      </div>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log(`[SUCCESS] Reset email sent to ${toEmail}`);

    } catch (err) {
        console.error(`[ERROR] Failed to send reset email to ${toEmail}:`, err.message);
    }
};
