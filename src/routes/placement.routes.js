const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authenticateToken");
const authorize = require("../middlewares/authorize");
const placementUsecase = require("../usecases/placement.usecase");


router.get(
  "/student/courses",
  authenticateToken,
  authorize(["student"]),
  placementUsecase.getStudentCourses
);

router.get(
  "/courses",
  authenticateToken,
  authorize(["Staff", "CA", "trainer", "HOD", "Principal"]),
  placementUsecase.getTrainerCourses
);

router.get(
  "/student/courses/:courseId/tests",
  authenticateToken,
  authorize(["student"]),
  placementUsecase.getStudentCourseTests
);

router.get(
  "/courses/:courseId/tests",
  authenticateToken,
  authorize(["Staff", "student", "CA", "HOD", "trainer", "Principal"]),
  placementUsecase.getCourseTests
);

router.get(
  "/tests/:testId/meta",
  authenticateToken,
  authorize(["Staff", "CA", "trainer", "HOD", "Principal"]),
  placementUsecase.getTestMeta
);

router.get(
  "/tests/:testId/questions",
  authenticateToken,
  authorize(["Staff", "CA", "trainer", "HOD", "Principal"]),
  placementUsecase.getTestQuestions
);


router.get(
  "/courses/:courseId/assignments",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.getCourseAssignments
);

router.get(
  "/tests/:testId/assignments",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.getTestAssignments
);

// ---------- ANALYTICS & RESULTS ----------
router.get(
  "/analytics",
  authenticateToken,
  placementUsecase.getGlobalAnalytics
);

router.get(
  "/results",
  authenticateToken,
  placementUsecase.getGlobalResults
);

router.get(
  "/student/results",
  authenticateToken,
  authorize(["student"]),
  placementUsecase.getStudentResults
);

// ---------- TEST LEVEL ----------
router.get(
  "/tests/:testId/results",
  authenticateToken,
  authorize(["Staff", "CA", "HOD", "trainer", "Principal"]),
  placementUsecase.getTestResults
);

router.get(
  "/tests/:testId/attempts",
  authenticateToken,
  authorize(["trainer", "HOD", "student", "CA", "Principal"]),
  placementUsecase.getTestAttempts
);

router.get(
  "/student/tests/:testId/status",
  authenticateToken,
  authorize(["student"]),
  placementUsecase.getStudentTestStatus
);

router.get(
  "/tests/:testId/notifications",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.getTestNotificationSettings
);

// ---------- COURSE ANALYTICS ----------
router.get(
  "/courses/:courseId/analytics",
  authenticateToken,
  authorize(["Staff", "CA", "HOD", "trainer", "Principal"]),
  placementUsecase.getCourseAnalytics
);

// ---------- CREATE COURSE ----------
router.post(
  "/courses",
  authenticateToken,
  authorize(["Staff", "CA", "trainer", "HOD", "Principal"]),
  placementUsecase.createCourse
);

// ---------- CREATE TEST ----------
router.post(
  "/tests",
  authenticateToken,
  authorize(["Staff", "CA", "trainer", "HOD", "Principal"]),
  placementUsecase.createTest
);

// ---------- ADD QUESTIONS ----------
router.post(
  "/tests/:testId/questions",
  authenticateToken,
  authorize(["Staff", "CA", "HOD", "trainer", "Principal"]),
  placementUsecase.addTestQuestions
);

// ---------- ASSIGN COURSE ----------
router.post(
  "/courses/:courseId/assign",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.assignCourse
);

// ---------- ASSIGN TEST ----------
router.post(
  "/tests/:testId/assign",
  authenticateToken,
  authorize(["trainer"]),
  placementUsecase.assignTest
);

// ---------- SAVE NOTIFICATION SETTINGS ----------
router.post(
  "/tests/:testId/notifications",
  authenticateToken,
  authorize(["trainer"]),
  placementUsecase.saveTestNotificationSettings
);

// ---------- SEND NOTIFICATIONS ----------
router.post(
  "/tests/:testId/notifications/send",
  authenticateToken,
  authorize(["trainer"]),
  placementUsecase.sendTestNotifications
);

// ---------- STUDENT START TEST ----------
router.post(
  "/student/tests/:testId/start",
  authenticateToken,
  authorize(["student"]),
  placementUsecase.startTest
);

// ---------- SAVE ANSWER ----------
router.post(
  "/student/tests/:testId/answer",
  authenticateToken,
  authorize(["student"]),
  placementUsecase.saveAnswer
);

// ---------- SUBMIT TEST ----------
router.post(
  "/student/tests/:testId/submit",
  authenticateToken,
  authorize(["student"]),
  placementUsecase.submitTest
);

// ---------- LOG VIOLATION ----------
router.post(
  "/student/tests/log-violation",
  authenticateToken,
  authorize(["student"]),
  placementUsecase.logViolation
);


/* ===========================
   QUESTIONS
=========================== */

// Update question
router.patch(
  "/questions/:questionId",
  authenticateToken,
  authorize(["Staff", "CA", "trainer", "HOD", "Principal"]),
  placementUsecase.updateQuestion
);


/* ===========================
   COURSES
=========================== */

// Update course details
router.patch(
  "/courses/:courseId",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.updateCourse
);


/* ===========================
   TESTS – DETAILS
=========================== */

// Update test basic details
router.patch(
  "/tests/:testId/details",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.updateTestDetails
);

// Partial update test (publish flags, window etc.)
router.patch(
  "/tests/:testId",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.patchTest
);


/* ===========================
   TESTS – PUBLISH
=========================== */

// Toggle publish
router.patch(
  "/tests/:testId/publish",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.toggleTestPublish
);

// Clear publish window
router.patch(
  "/tests/:testId/publish-window",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.clearPublishWindow
);


/* ===========================
   NOTIFICATIONS
=========================== */

// Save notification settings
router.patch(
  "/tests/:testId/notifications",
  authenticateToken,
  authorize(["trainer"]),
  placementUsecase.saveNotificationSettings
);

router.put(
  "/courses/:courseId/assignments",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.replaceCourseAssignments
);

// soft delete course
router.delete(
  "/courses/:courseId",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.deactivateCourse
);

// soft delete test
router.delete(
  "/tests/:testId",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.deactivateTest
);

// soft delete course assignment
router.delete(
  "/course-assignments/:id",
  authenticateToken,
  authorize(["trainer", "HOD", "Principal"]),
  placementUsecase.deactivateCourseAssignment
);

// soft delete question
router.delete(
  "/questions/:questionId",
  authenticateToken,
  authorize(["Staff", "CA", "trainer", "HOD", "Principal"]),
  placementUsecase.deactivateQuestion
);


module.exports = router;
