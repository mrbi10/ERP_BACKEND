const authService = require("../services/auth.service");
const captchaStore = require("../utils/captchaStore");
const { logActivity } = require("../services/activityLog.service");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const mailer = require("../utils/mailer");

exports.login = async (req, res) => {
  const { email, password, captchaId, captchaText } = req.body;

  try {
    if (!email || !password) {
      throw new Error("Email and password required");
    }

    if (!captchaId || !captchaText) {
      throw new Error("Captcha required");
    }

    const expected = captchaStore.get(captchaId);

    if (!expected || expected !== captchaText.toLowerCase()) {
      throw new Error("Invalid captcha");
    }

    captchaStore.remove(captchaId);

    const { token, user } = await authService.login({ email, password });

    await logActivity({
      req,
      user,
      module: "AUTH",
      actionType: "LOGIN",
      action: "User login",
      description: "Login successful",
      refTable: "users",
      refId: user.user_id
    });

    res.json({ token, user });

  } catch (err) {

    await logActivity({
      req,
      user: null,
      module: "AUTH",
      actionType: "LOGIN_FAILED",
      action: "User login failed",
      description: err.message
    });

    res.status(400).json({ message: err.message });
  }
};


exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email required" });
    }

    const user = await authService.getUserByEmail(email);

    if (!user) {
      return res.json({ message: "If your email exists, a reset link has been sent!" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await authService.saveResetToken(user.user_id, token, expires);
    await mailer.sendResetMail(user.email, user.name, token);

    res.json({ message: "If your email exists, a reset link has been sent!" });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await authService.getUserByResetToken(token);
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await authService.updatePassword(user.user_id, hashed);

    res.json({ message: "Password updated successfully" });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
