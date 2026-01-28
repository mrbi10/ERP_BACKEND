const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const messUsecase = require("../usecases/mess.usecase");

const ROLES = ["Principal", "HOD", "MessAdmin"];

router.get(
  "/",
  authenticateToken,
  messUsecase.getmessmenu
);

router.get(
  "/auto-count",
  authenticateToken,
  authorize(ROLES),
  messUsecase.getAutoCount
);

router.post(
  "/save",
  authenticateToken,
  authorize(ROLES),
  messUsecase.saveMessCount
);

router.post(
  "/payment",
  authenticateToken,
  authorize(ROLES),
  messUsecase.savePayment
);

router.get(
  "/payment/history",
  authenticateToken,
  authorize(ROLES),
  messUsecase.getPaymentHistory
);

router.get(
  "/payment/next-start",
  authenticateToken,
  authorize(ROLES),
  messUsecase.getNextPaymentStart
);

router.get(
  "/history",
  authenticateToken,
  authorize(ROLES),
  messUsecase.getMessHistory
);

router.get(
  "/range",
  authenticateToken,
  authorize(ROLES),
  messUsecase.getRangeSummary
);

module.exports = router;
