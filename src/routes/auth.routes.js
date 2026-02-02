const express = require("express");
const router = express.Router();

const authUsecase = require("../usecases/auth.usecase");
const captchaUsecase = require("../usecases/captcha.usecase");
const otpUsecase = require("../usecases/otp.usecase");

router.get("/captcha", captchaUsecase.getCaptcha);

router.post("/login", authUsecase.login);
router.post("/login-otp", otpUsecase.loginWithOtp);

router.post("/request-otp", otpUsecase.requestOtp);

router.post("/forgotpassword", authUsecase.forgotPassword);
router.post("/resetpassword/:token", authUsecase.resetPassword);

module.exports = router;
