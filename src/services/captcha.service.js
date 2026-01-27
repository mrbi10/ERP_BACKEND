const svgCaptcha = require("svg-captcha");
const captchaStore = require("../utils/captchaStore");

exports.generateCaptcha = () => {
  const captcha = svgCaptcha.create({
    size: 5,
    noise: 2,
    color: true,
    background: "#f0f0f0"
  });

  const id = Date.now().toString();

  captchaStore.set(id, captcha.text);

  return {
    id,
    image: captcha.data
  };
};
