const authService = require("../services/auth.service");
const captchaStore = require("../utils/captchaStore");
const { logActivity } = require("../services/activityLog.service");

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
