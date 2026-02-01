const express = require("express");
const router = express.Router();

const authenticateToken = require("../middlewares/authenticateToken");
const upload = require("../middlewares/upload.middleware");
const profilehubusecase = require("../usecases/profilehub.usecase");

router.use(authenticateToken);

// ===== MASTER =====
router.get("/activity-types", profilehubusecase.getActivityTypes);

// ===== STUDENT =====
router.post("/activity", profilehubusecase.createActivity);
router.get("/my-activities", profilehubusecase.getMyActivities);
router.put("/activity/:activityId", profilehubusecase.updateActivity);
router.delete("/activity/:activityId", profilehubusecase.deleteActivity);

// ===== FILES =====
router.post("/activity/:activityId/upload", upload.single("file"), profilehubusecase.uploadActivityFile);
router.get("/activity/:activityId/files", profilehubusecase.getActivityFiles);

// ===== REVIEW (CA / HOD / PRINCIPAL) =====
router.get("/review", profilehubusecase.getActivitiesForReview);
router.put("/activity/:activityId/verify", profilehubusecase.verifyActivity);



module.exports = router;
