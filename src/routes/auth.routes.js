const express = require("express");
const router = express.Router();

const authUsecase = require("../usecases/auth.usecase");
const captchaUsecase = require("../usecases/captcha.usecase");

router.get("/captcha", captchaUsecase.getCaptcha);
router.post("/login", authUsecase.login);
router.post("/forgotpassword", authUsecase.forgotPassword);
router.post("/resetpassword/:token", authUsecase.resetPassword);

module.exports = router;
