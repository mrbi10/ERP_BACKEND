const captchaService = require("../services/captcha.service");

exports.getCaptcha = (req, res) => {
  const captcha = captchaService.generateCaptcha();
  res.json(captcha);
};
