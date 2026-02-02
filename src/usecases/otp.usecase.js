const authService = require("../services/auth.service");
const mailer = require("../utils/mailer");

const otpStore = new Map(); // email → { otp, expires }

const generateOtp = () =>
    Math.floor(100000 + Math.random() * 900000).toString();

const pool = require("../config/db");

exports.requestOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const otp = generateOtp();

    const [result] = await pool.query(
      `
      UPDATE users
      SET login_otp = ?, 
          login_otp_expires = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)
      WHERE email = ?
        AND is_active = 1
      `,
      [otp, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found or inactive" });
    }

    const [[user]] = await pool.query(
      `SELECT name FROM users WHERE email = ?`,
      [email]
    );

    const name = user?.name || "User";

    await mailer.sendOtpMail(email, name, otp);

    res.json({ message: "OTP sent successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};




exports.loginWithOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res.status(400).json({ message: "Email and OTP required" });

    const [[user]] = await pool.query(
      `
      SELECT user_id, login_otp, login_otp_expires
      FROM users
      WHERE email = ?
        AND is_active = 1
      `,
      [email]
    );

    if (!user || !user.login_otp)
      throw new Error("OTP not requested");

    if (new Date(user.login_otp_expires) < new Date())
      throw new Error("OTP expired");

    if (user.login_otp !== otp)
      throw new Error("Invalid OTP");

    await pool.query(
      `
      UPDATE users
      SET login_otp = NULL,
          login_otp_expires = NULL
      WHERE user_id = ?
      `,
      [user.user_id]
    );

    const { token, user: fullUser } =
      await authService.loginWithOtp(email);

    res.json({ token, user: fullUser });

  } catch (err) {
    res.status(401).json({ message: err.message });
  }
};

