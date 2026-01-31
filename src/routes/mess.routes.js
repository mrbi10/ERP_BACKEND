const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");

const messUsecase = require("../usecases/mess.usecase");

const ROLES = ["Principal", "HOD", "MessAdmin"];

// ===== MENU =====
router.get(
  "/",
  authenticateToken,
  messUsecase.getMessMenu
);

// ===== AUTO COUNT =====
router.get(
  "/auto-count",
  authenticateToken,
  authorize(ROLES),
  messUsecase.getAutoCount
);

// ===== DAILY COUNT =====
router.post(
  "/save",
  authenticateToken,
  authorize(ROLES),
  messUsecase.saveMessCount
);

router.put(
  "/day/:date",
  authenticateToken,
  authorize(ROLES),
  messUsecase.updateMessCount
);

router.delete(
  "/day/:date",
  authenticateToken,
  authorize(ROLES),
  messUsecase.deleteMessCount
);

// ===== PAYMENTS =====
router.post(
  "/payment",
  authenticateToken,
  authorize(ROLES),
  messUsecase.savePayment
);

router.delete(
  "/payment/:id",
  authenticateToken,
  authorize(ROLES),
  messUsecase.deletePayment
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

// ===== HISTORY =====
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

router.put(
  "/payment/:id",
  authenticateToken,
  authorize(ROLES),
  messUsecase.updatePayment   // 👈 REQUIRED
);



module.exports = router;
