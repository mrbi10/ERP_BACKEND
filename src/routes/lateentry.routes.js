const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const lateEntryUsecase = require("../usecases/lateentry.usecase");

router.get(
  "/today",
  authenticateToken,
  lateEntryUsecase.getTodayLateEntries
);

router.post(
  "/",
  authenticateToken,
  lateEntryUsecase.markLateStudent
);

module.exports = router;
