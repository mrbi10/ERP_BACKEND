const placementService = require("../services/placement.service");
const {logActivity} = require("../services/activityLog.service");

exports.getStudentCourses = async (req, res) => {
  try {
    const rollNo = req.user.roll_no;

    const courses = await placementService.getStudentCourses(rollNo);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "STUDENT_VIEW_COURSES",
      description: "Student viewed assigned placement courses"
    });

    res.json({ success: true, courses });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseTests = async (req, res) => {
  try {
    const tests = await placementService.getCourseTests(req.params.courseId);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_COURSE_TESTS",
      description: `Viewed tests under course ${req.params.courseId}`,
      refTable: "training_courses",
      refId: req.params.courseId
    });

    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentCourseTests = async (req, res) => {
  try {
    const result = await placementService.getStudentCourseTests(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "GET_STUDENT_COURSE_TESTS",
      refTable: "tests",
      refId: req.params.courseId
    });

    res.json(result);
  } catch (err) {
    console.error("Student course tests error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getTrainerCourses = async (req, res) => {
  try {
    const courses = await placementService.getTrainerCourses(req.user.id);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_TRAINER_COURSES",
      description: "Viewed trainer courses"
    });

    res.json({
      success: true,
      courses
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getTestMeta = async (req, res) => {
  try {
    const test = await placementService.getTestMeta(req.params.testId);

    if (!test) {
      return res.status(404).json({ message: "Test not found" });
    }

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_TEST_META",
      description: `Viewed test meta ${req.params.testId}`,
      refTable: "tests",
      refId: req.params.testId
    });

    res.json({ test });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTestQuestions = async (req, res) => {
  try {
    const questions = await placementService.getTestQuestions(
      req.params.testId
    );

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_TEST_QUESTIONS",
      description: `Viewed questions for test ${req.params.testId}`,
      refTable: "tests",
      refId: req.params.testId
    });

    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseAssignments = async (req, res) => {
  try {
    const assignments = await placementService.getCourseAssignments(
      req.params.courseId
    );

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_COURSE_ASSIGNMENTS",
      description: `Viewed assignments for course ${req.params.courseId}`,
      refTable: "training_courses",
      refId: req.params.courseId
    });

    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getTestAssignments = async (req, res) => {
  try {
    const data = await placementService.getTestAssignmentsWithStudents(
      req.params.testId
    );

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_TEST_ASSIGNMENTS",
      description: `Viewed test assignments ${req.params.testId}`,
      refTable: "tests",
      refId: req.params.testId
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getGlobalAnalytics = async (req, res) => {
  try {
    const data = await placementService.getGlobalAnalytics(req.user);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_ANALYTICS",
      description: "Viewed placement analytics"
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGlobalResults = async (req, res) => {
  try {
    if (req.user.role === "student") {
      return res.status(403).json({ message: "Forbidden" });
    }

    const results = await placementService.getGlobalResults(req.user);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_RESULTS",
      description: "Viewed placement test results"
    });

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentResults = async (req, res) => {
  try {
    const results = await placementService.getStudentResults(req.user);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_STUDENT_RESULTS",
      description: "Student viewed their placement test results"
    });

    res.json({ results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTestResults = async (req, res) => {
  try {
    const results = await placementService.getTestResults(req.params.testId);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_TEST_RESULTS",
      refTable: "tests",
      refId: req.params.testId
    });

    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getTestAttempts = async (req, res) => {
  try {
    const data = await placementService.getTestAttempts(req.params.testId);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_TEST_ATTEMPTS",
      refTable: "tests",
      refId: req.params.testId
    });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getStudentTestStatus = async (req, res) => {
  try {
    const status = await placementService.getStudentTestStatus(
      req.user,
      req.params.testId
    );

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "CHECK_TEST_STATUS",
      refTable: "tests",
      refId: req.params.testId
    });

    res.json(status);
  } catch (err) {
    res.status(500).json({ is_live: false });
  }
};

exports.getTestNotificationSettings = async (req, res) => {
  try {
    const settings = await placementService.getTestNotificationSettings(
      req.params.testId
    );

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_TEST_NOTIFICATION_SETTINGS",
      refTable: "tests",
      refId: req.params.testId
    });

    res.json({ settings });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseAnalytics = async (req, res) => {
  try {
    const analytics = await placementService.getCourseAnalytics(
      req.params.courseId
    );

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "READ",
      action: "VIEW_COURSE_ANALYTICS",
      refTable: "training_courses",
      refId: req.params.courseId
    });

    res.json({ success: true, analytics });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const { name, description, status } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Course name required" });
    }

    const courseId = await placementService.createCourse({
      name,
      description,
      status,
      trainerId: req.user.id
    });

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "CREATE",
      action: "CREATE_COURSE",
      refTable: "training_courses",
      refId: courseId,
      newData: { name, description, status }
    });

    res.json({
      success: true,
      course_id: courseId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= CREATE TEST =================
exports.createTest = async (req, res) => {
  try {
    const {
      course_id,
      title,
      duration_minutes,
      total_marks,
      pass_mark,
      max_attempts
    } = req.body;

    if (!course_id || !title || !duration_minutes) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const testId = await placementService.createTest({
      course_id,
      title,
      duration_minutes,
      total_marks,
      pass_mark,
      max_attempts
    });

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "CREATE",
      action: "CREATE_TEST",
      refTable: "tests",
      refId: testId,
      newData: {
        course_id,
        title,
        duration_minutes,
        total_marks,
        pass_mark,
        max_attempts
      }
    });

    res.json({
      success: true,
      test_id: testId
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= ADD QUESTIONS =================
exports.addTestQuestions = async (req, res) => {
  try {
    const { testId } = req.params;
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: "Questions required" });
    }

    const result = await placementService.addTestQuestions(testId, questions);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "CREATE",
      action: "ADD_TEST_QUESTIONS",
      refTable: "tests",
      refId: testId,
      newData: { questions_count: questions.length }
    });

    res.json({
      success: true,
      added: result.added,
      total_marks: result.total_marks
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= ASSIGN COURSE =================
exports.assignCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { assignments } = req.body;

    if (!Array.isArray(assignments)) {
      return res.status(400).json({ message: "Invalid assignments data" });
    }

    await placementService.assignCourse(courseId, assignments);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "ASSIGN_COURSE",
      refTable: "training_courses",
      refId: courseId,
      newData: { assignments }
    });

    res.json({
      success: true,
      assigned_count: assignments.length
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= ASSIGN TEST =================
exports.assignTest = async (req, res) => {
  try {
    const { testId } = req.params;
    const { assignments, publish_start, publish_end, published } = req.body;

    if (!assignments || assignments.length === 0) {
      return res.status(400).json({ message: "Assignments required" });
    }

    if (!publish_start || !publish_end) {
      return res.status(400).json({
        message: "publish_start and publish_end are required"
      });
    }

    await placementService.assignTest({
      testId,
      assignments,
      publish_start,
      publish_end,
      published
    });

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "ASSIGN_TEST",
      refTable: "tests",
      refId: testId,
      newData: {
        assignments,
        publish_start,
        publish_end,
        published
      }
    });

    res.json({
      success: true,
      message: "Test assigned successfully"
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= SAVE NOTIFICATION SETTINGS =================
exports.saveTestNotificationSettings = async (req, res) => {
  try {
    const { testId } = req.params;
    const settings = req.body;

    await placementService.saveTestNotificationSettings({
      testId,
      settings,
      userId: req.user.user_id
    });

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "CREATE",
      action: "SAVE_NOTIFICATION_SETTINGS",
      refTable: "tests",
      refId: testId,
      newData: settings
    });

    res.json({ message: "Settings saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= SEND NOTIFICATIONS =================
exports.sendTestNotifications = async (req, res) => {
  try {
    const { testId } = req.params;
    const { type } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Notification type required" });
    }

    const result = await placementService.sendTestNotifications({
      req,
      testId,
      eventType: type,
      userId: req.user.user_id
    });

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "CREATE",
      action: "SEND_TEST_NOTIFICATIONS",
      refTable: "tests",
      refId: testId,
      newData: { type }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= START TEST =================
exports.startTest = async (req, res) => {
  try {
    const result = await placementService.startTest(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "CREATE",
      action: "START_TEST",
      refTable: "test_attempts",
      refId: result?.attempt_id || null
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= SAVE ANSWER =================
exports.saveAnswer = async (req, res) => {
  try {
    await placementService.saveAnswer(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "SAVE_ANSWER",
      refTable: "student_answers",
      newData: req.body
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= SUBMIT TEST =================
exports.submitTest = async (req, res) => {
  try {
    const result = await placementService.submitTest(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "SUBMIT_TEST",
      refTable: "test_attempts",
      refId: req.body.attempt_id,
      newData: result
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= LOG VIOLATION =================
exports.logViolation = async (req, res) => {
  try {
    const result = await placementService.logViolation(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "CREATE",
      action: "LOG_VIOLATION",
      refTable: "test_attempt_violations",
      newData: req.body
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ===========================
   QUESTIONS
=========================== */

exports.updateQuestion = async (req, res) => {
  try {
    const result = await placementService.updateQuestion(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "UPDATE_QUESTION",
      refTable: "questions",
      refId: req.params.questionId,
      newData: req.body
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ===========================
   COURSES
=========================== */

exports.updateCourse = async (req, res) => {
  try {
    const result = await placementService.updateCourse(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "UPDATE_COURSE",
      refTable: "training_courses",
      refId: req.params.courseId,
      newData: req.body
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ===========================
   TESTS – DETAILS
=========================== */

exports.updateTestDetails = async (req, res) => {
  try {
    const result = await placementService.updateTestDetails(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "UPDATE_TEST_DETAILS",
      refTable: "tests",
      refId: req.params.testId,
      newData: req.body
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.patchTest = async (req, res) => {
  try {
    const result = await placementService.patchTest(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "PATCH_TEST",
      refTable: "tests",
      refId: req.params.testId,
      oldData: result.oldData,
      newData: result.newData
    });

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};



/* ===========================
   TESTS – PUBLISH
=========================== */

exports.toggleTestPublish = async (req, res) => {
  try {
    const result = await placementService.toggleTestPublish(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "TOGGLE_TEST_PUBLISH",
      refTable: "tests",
      refId: req.params.testId
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.clearPublishWindow = async (req, res) => {
  try {
    const result = await placementService.clearPublishWindow(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "CLEAR_PUBLISH_WINDOW",
      refTable: "tests",
      refId: req.params.testId
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/* ===========================
   NOTIFICATIONS
=========================== */

exports.saveNotificationSettings = async (req, res) => {
  try {
    const result = await placementService.saveNotificationSettings(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "SAVE_NOTIFICATION_SETTINGS",
      refTable: "notifications",
      refId: req.params.testId,
      newData: req.body
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ================= COURSE ASSIGNMENTS (REPLACE) =================
exports.replaceCourseAssignments = async (req, res) => {
  try {
    const result = await placementService.replaceCourseAssignments(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "REPLACE_COURSE_ASSIGNMENTS",
      refTable: "training_course_assignments",
      refId: req.params.courseId,
      newData: req.body.assignments
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= COURSE (SOFT DELETE) =================
exports.deactivateCourse = async (req, res) => {
  try {
    await placementService.deactivateCourse(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "DEACTIVATE_COURSE",
      refTable: "training_courses",
      refId: req.params.courseId
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= TEST (SOFT DELETE) =================
exports.deactivateTest = async (req, res) => {
  try {
    await placementService.deactivateTest(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "DEACTIVATE_TEST",
      refTable: "tests",
      refId: req.params.testId
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= COURSE ASSIGNMENT =================
exports.deactivateCourseAssignment = async (req, res) => {
  try {
    await placementService.deactivateCourseAssignment(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "DEACTIVATE_COURSE_ASSIGNMENT",
      refTable: "training_course_assignments",
      refId: req.params.id
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ================= QUESTION =================
exports.deactivateQuestion = async (req, res) => {
  try {
    const result = await placementService.deactivateQuestion(req);

    await logActivity({
      req,
      user: req.user,
      module: "PLACEMENT",
      actionType: "UPDATE",
      action: "DEACTIVATE_QUESTION",
      refTable: "questions",
      refId: req.params.questionId
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

