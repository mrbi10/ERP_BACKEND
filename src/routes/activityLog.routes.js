const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const logUsecase = require("../usecases/activityLog.usecase");

router.get(
  "/",
  authenticateToken,
  authorize(["Admin", "Principal"]),
  logUsecase.getLogs
);

module.exports = router;
