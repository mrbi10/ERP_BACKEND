const pool = require("../config/db");
const { getStudentIdFromToken } = require("../utils/student");
const {
  submitAttemptInternal,
  terminateAttempt
} = require("./placementAttempt.service");


exports.getStudentCourses = async (rollNo) => {
  const [[student]] = await pool.query(
    "SELECT student_id, dept_id, class_id FROM students WHERE roll_no = ? AND is_active = 1",
    [rollNo]
  );

  if (!student) {
    throw new Error("Student not found");
  }

  const [rows] = await pool.query(
    `
    SELECT DISTINCT
      tc.course_id,
      tc.name,
      tc.description,
      tc.status
    FROM training_courses tc
    JOIN training_course_assignments ca
      ON ca.course_id = tc.course_id
    WHERE ca.dept_id = ? AND ca.class_id = ?
    AND tc.is_active = 1 and ca.is_active = 1
    ORDER BY tc.course_id DESC
    `,
    [student.dept_id, student.class_id]
  );

  return rows;
};


exports.getCourseTests = async (courseId) => {
  const [rows] = await pool.query(
    `
    SELECT
      t.test_id,
      t.title,
      t.duration_minutes,
      t.total_marks,
      t.pass_mark,
      t.max_attempts,
      t.publish_start,
      t.publish_end,
      t.published,
      t.created_at,
      CASE
        WHEN t.published = 1
         AND UTC_TIMESTAMP() BETWEEN t.publish_start AND t.publish_end
        THEN 'LIVE'
        WHEN t.published = 1
         AND UTC_TIMESTAMP() < t.publish_start
        THEN 'SCHEDULED'
        ELSE 'IDLE'
      END AS status
    FROM tests t
    WHERE t.course_id = ?
    and t.is_active = 1
    ORDER BY t.created_at DESC
    `,
    [courseId]
  );

  return rows;
};

exports.getTrainerCourses = async (trainerId) => {
  const [rows] = await pool.query(
    `
    SELECT 
      course_id,
      name,
      description,
      status
    FROM training_courses
    WHERE trainer_id = ?
      AND is_active = 1
    ORDER BY course_id DESC
    `,
    [trainerId]
  );

  return rows;
};

exports.getStudentCourseTests = async (req) => {
  const { courseId } = req.params;
  const rollNo = req.user.roll_no;

  const [[student]] = await pool.query(
    "SELECT dept_id, class_id FROM students WHERE roll_no = ? AND is_active = 1",
    [rollNo]
  );

  if (!student) {
    throw new Error("Student not found");
  }

  const [tests] = await pool.query(
    `
    SELECT
      t.test_id,
      t.title,
      t.course_id,
      t.duration_minutes,
      t.publish_start,
      t.publish_end,
      t.total_marks,
      t.pass_mark,
      t.max_attempts
    FROM tests t
    JOIN training_test_assignments tta
      ON tta.test_id = t.test_id
    WHERE
      t.course_id = ?
      AND tta.dept_id = ?
      AND tta.class_id = ?
      AND t.published = 1
      AND t.is_active = 1
      and tta.is_active = 1
      AND UTC_TIMESTAMP() BETWEEN t.publish_start AND t.publish_end
    ORDER BY t.publish_start ASC
    `,
    [courseId, student.dept_id, student.class_id]
  );

  return {
    success: true,
    tests
  };
};

exports.getTestMeta = async (testId) => {
  const [[test]] = await pool.query(
    `
    SELECT
      test_id,
      course_id,
      title,
      duration_minutes,
      total_marks,
      pass_mark,
      max_attempts,
      publish_start,
      publish_end,
      published
    FROM tests
    WHERE test_id = ? and is_active = 1
    `,
    [testId]
  );

  return test;
};

exports.getTestQuestions = async (testId) => {
  const [rows] = await pool.query(
    `
    SELECT
      question_id,
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      marks,
      note
    FROM questions
    WHERE test_id = ? and is_active = 1
    ORDER BY question_id
    `,
    [testId]
  );

  return rows;
};

exports.getCourseAssignments = async (courseId) => {
  const [rows] = await pool.query(
    `
    SELECT dept_id, class_id
    FROM training_course_assignments
    WHERE course_id = ? and is_active = 1
    ORDER BY dept_id, class_id
    `,
    [courseId]
  );

  return rows;
};


exports.getTestAssignmentsWithStudents = async (testId) => {
  const [assignments] = await pool.query(
    `
    SELECT dept_id, class_id
    FROM training_test_assignments
    WHERE test_id = ? and is_active = 1
    ORDER BY dept_id, class_id
    `,
    [testId]
  );

  const [students] = await pool.query(
    `
    SELECT 
      s.dept_id,
      s.class_id,
      s.roll_no,
      s.name,
      s.email
    FROM students s
    JOIN training_test_assignments a
      ON a.dept_id = s.dept_id
     AND a.class_id = s.class_id and a.is_active = 1
    WHERE a.test_id = ? AND s.is_active = 1
    ORDER BY s.dept_id, s.class_id, s.roll_no
    `,
    [testId]
  );

  const grouped = {};
  for (const s of students) {
    const key = `${s.dept_id}_${s.class_id}`;
    if (!grouped[key]) {
      grouped[key] = {
        dept_id: s.dept_id,
        class_id: s.class_id,
        count: 0,
        students: []
      };
    }
    grouped[key].count++;
    grouped[key].students.push({
      roll_no: s.roll_no,
      name: s.name,
      email: s.email
    });
  }

  return {
    assignments,
    stats: {
      total_students: students.length,
      with_email: students.filter(s => s.email).length
    },
    groups: Object.values(grouped)
  };
};

exports.getGlobalAnalytics = async (user) => {
  const { role, assigned_class_id, dept_id, user_id } = user;

  let filter = `
    WHERE a.status IN ('submitted','auto_submitted')
      AND t.is_active = 1
      AND c.is_active = 1
  `;
  const params = [];

  if (role === "trainer") {
    filter += " AND c.trainer_id = ?";
    params.push(user_id);
  } else if (role === "CA") {
    filter += " AND s.class_id = ?";
    params.push(assigned_class_id);
  } else if (role === "HOD") {
    filter += " AND s.dept_id = ?";
    params.push(dept_id);
  }

  const [[summary]] = await pool.query(`
    SELECT
      COUNT(DISTINCT s.student_id) AS total_students,
      COUNT(DISTINCT t.test_id) AS total_tests,
      COUNT(a.attempt_id) AS total_attempts,
      ROUND(
        SUM(a.pass_status = 'pass') / NULLIF(COUNT(a.attempt_id), 0) * 100,
        2
      ) AS pass_percentage
    FROM test_attempts a
    JOIN tests t ON t.test_id = a.test_id
    JOIN training_courses c ON c.course_id = t.course_id
    JOIN students s ON s.student_id = a.student_id
    ${filter}
  `, params);

  return { summary };
};


exports.getGlobalResults = async (user) => {
  let where = `
    WHERE a.status IN ('submitted','auto_submitted')
      AND t.is_active = 1
      AND c.is_active = 1
  `;
  const params = [];

  if (user.role === "CA") {
    where += " AND s.class_id = ?";
    params.push(user.assigned_class_id);
  }

  if (user.role === "HOD") {
    where += " AND s.dept_id = ?";
    params.push(user.dept_id);
  }

  const [rows] = await pool.query(`
    SELECT
      c.name AS course_name,
      t.title AS test_title,
      s.roll_no,
      s.name AS student_name,
      a.score,
      a.pass_status,
      a.submitted_at
    FROM test_attempts a
    JOIN tests t ON t.test_id = a.test_id
    JOIN training_courses c ON c.course_id = t.course_id
    JOIN students s ON s.student_id = a.student_id
    ${where}
    ORDER BY a.submitted_at DESC
  `, params);

  return rows;
};


exports.getStudentResults = async (user) => {
  const [[student]] = await pool.query(
    "SELECT student_id FROM students WHERE roll_no = ? AND is_active = 1",
    [user.roll_no]
  );

  if (!student) {
    throw new Error("Student mapping missing");
  }

  const query = `
    SELECT
      c.name AS course_name,
      t.title AS test_title,
      t.test_id,
      t.total_marks,
      t.pass_mark,

      a.attempt_id,
      ROW_NUMBER() OVER (
        PARTITION BY a.student_id, a.test_id
        ORDER BY a.started_at
      ) AS attempt_no,

      a.score,
      ROUND((a.score / t.total_marks) * 100, 2) AS percentage,
      a.pass_status,
      a.submitted_at

    FROM test_attempts a
    JOIN tests t 
      ON t.test_id = a.test_id
    JOIN training_courses c 
      ON c.course_id = t.course_id

    WHERE a.student_id = ?
      AND a.status IN ('submitted','auto_submitted')
      AND t.is_active = 1
      AND c.is_active = 1

    ORDER BY a.submitted_at DESC
  `;

  const [rows] = await pool.query(query, [student.student_id]);
  return rows;
};


exports.getTestResults = async (testId) => {
  const [rows] = await pool.query(`
    SELECT s.roll_no, s.name, ta.score, ta.pass_status, ta.submitted_at
    FROM test_attempts ta 
    JOIN students s ON ta.student_id = s.student_id
    WHERE ta.test_id = ?
  `, [testId]);

  return rows;
};

exports.getTestAttempts = async (testId) => {
  const [rows] = await pool.query(`
   SELECT
          s.student_id,
          s.roll_no,
          s.name,
          COUNT(ta.attempt_id) AS total_attempts,
          COUNT(ta.attempt_id)   AS latest_attempt,
          MAX(ta.submitted_at) AS last_submitted_at
        FROM test_attempts ta
        JOIN students s ON s.student_id = ta.student_id
        WHERE ta.test_id = ? 
        GROUP BY s.student_id
        ORDER BY total_attempts DESC
  `, [testId]);

  return {
    success: true,
    students: rows,
    total_students_attempted: rows.length
  };
};

exports.getStudentTestStatus = async (user, testId) => {
  const [[student]] = await pool.query(
    "SELECT dept_id, class_id FROM students WHERE roll_no = ? AND is_active = 1",
    [user.roll_no]
  );

  const [[row]] = await pool.query(`
    SELECT 1
    FROM tests t
    JOIN training_test_assignments a
      ON a.test_id = t.test_id
    WHERE t.test_id = ?
      AND t.published = 1
      AND UTC_TIMESTAMP() BETWEEN t.publish_start AND t.publish_end
      AND a.dept_id = ?
      AND a.class_id = ?
  `, [testId, student.dept_id, student.class_id]);

  return { is_live: !!row };
};

exports.getTestNotificationSettings = async (testId) => {
  const [[row]] = await pool.query(`
    SELECT settings
    FROM notifications
    WHERE type='placement_exam' AND ref_id=?
    ORDER BY sent_at DESC
    LIMIT 1
  `, [testId]);

  return row?.settings || null;
};

exports.getCourseAnalytics = async (courseId) => {
  const [[stats]] = await pool.query(`
    SELECT
      COUNT(DISTINCT s.student_id) AS eligible_students,
      COUNT(DISTINCT ta.student_id) AS attempted,
      SUM(ta.pass_status='pass') AS passed,
      SUM(ta.pass_status='fail') AS failed
    FROM training_course_assignments ca
    JOIN students s ON s.dept_id=ca.dept_id AND s.class_id=ca.class_id
    LEFT JOIN tests t ON t.course_id=ca.course_id
    LEFT JOIN test_attempts ta ON ta.test_id=t.test_id
    WHERE ca.course_id=?
  `, [courseId]);

  return stats;
};

// ================= CREATE COURSE =================
exports.createCourse = async ({ name, description, status, trainerId }) => {
  const [result] = await pool.query(
    `
    INSERT INTO training_courses
      (name, description, trainer_id, status)
    VALUES (?, ?, ?, ?)
    `,
    [
      name,
      description || null,
      trainerId,
      status || "UPCOMING"
    ]
  );

  return result.insertId;
};


// ================= CREATE TEST =================
exports.createTest = async ({
  course_id,
  title,
  duration_minutes,
  total_marks,
  pass_mark,
  max_attempts
}) => {
  const [result] = await pool.query(
    `
    INSERT INTO tests
      (course_id, title, duration_minutes, total_marks, pass_mark, max_attempts)
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      course_id,
      title,
      duration_minutes,
      total_marks || 100,
      pass_mark || 40,
      max_attempts || 1
    ]
  );

  return result.insertId;
};


// ================= ADD QUESTIONS =================
exports.addTestQuestions = async (testId, questions) => {
  for (const q of questions) {
    await pool.query(
      `
      INSERT INTO questions
        (test_id, question, option_a, option_b, option_c, option_d, correct_option, note, marks)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        testId,
        q.question,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_option,
        q.note || null,
        q.marks || 1
      ]
    );
  }

  const [[sum]] = await pool.query(
    `
    SELECT COALESCE(SUM(marks), 0) AS totalMarks
    FROM questions
    WHERE test_id = ?
    `,
    [testId]
  );

  await pool.query(
    `
    UPDATE tests
    SET total_marks = ?
    WHERE test_id = ?
    `,
    [sum.totalMarks, testId]
  );

  return {
    added: questions.length,
    total_marks: sum.totalMarks
  };
};

// ================= ASSIGN COURSE =================
exports.assignCourse = async (courseId, assignments) => {
  await pool.query(
    `DELETE FROM training_course_assignments WHERE course_id = ?`,
    [courseId]
  );

  if (assignments.length > 0) {
    const values = assignments.map(a => [
      courseId,
      a.dept_id,
      a.class_id
    ]);

    await pool.query(
      `
      INSERT INTO training_course_assignments
        (course_id, dept_id, class_id)
      VALUES ?
      `,
      [values]
    );
  }
};


// ================= ASSIGN TEST =================
exports.assignTest = async ({
  testId,
  assignments,
  publish_start,
  publish_end,
  published
}) => {
  await pool.query(
    `DELETE FROM training_test_assignments WHERE test_id = ?`,
    [testId]
  );

  const values = assignments.map(a => [
    testId,
    a.dept_id,
    a.class_id
  ]);

  await pool.query(
    `
    INSERT INTO training_test_assignments
      (test_id, dept_id, class_id)
    VALUES ?
    `,
    [values]
  );

  await pool.query(
    `
    UPDATE tests
    SET publish_start = ?, publish_end = ?, published = ?
    WHERE test_id = ?
    `,
    [publish_start, publish_end, published, testId]
  );
};


// ================= SAVE NOTIFICATION SETTINGS =================
exports.saveTestNotificationSettings = async ({ testId, settings, userId }) => {
  await pool.query(
    `
    INSERT INTO notifications
      (type, ref_id, event_type, channel, settings, sent_by)
    VALUES
      ('placement_exam', ?, 'SETTINGS', 'PORTAL', ?, ?)
    `,
    [testId, JSON.stringify(settings), userId]
  );
};


// ================= SEND NOTIFICATIONS =================
exports.sendTestNotifications = async ({
  req,
  testId,
  eventType,
  userId
}) => {
  const connection = await pool.getConnection();

  try {
    const [[test]] = await connection.query(
      "SELECT title FROM tests WHERE test_id = ?",
      [testId]
    );

    const [students] = await connection.query(
      `
      SELECT s.student_id, s.name, s.email
      FROM students s
      JOIN training_test_assignments a
        ON a.dept_id = s.dept_id
       AND a.class_id = s.class_id
      WHERE a.test_id = ? AND s.is_active = 1
        AND s.email IS NOT NULL
      `,
      [testId]
    );

    if (!students.length) {
      return { message: "No recipients found" };
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO notifications
        (type, ref_id, event_type, channel, title, message, recipient_count, sent_by)
      VALUES
        ('placement_exam', ?, ?, 'EMAIL', ?, ?, ?, ?)
      `,
      [
        testId,
        eventType,
        "Placement Exam Notification",
        `${eventType} notification for placement exam`,
        students.length,
        userId
      ]
    );

    const notificationId = result.insertId;

    const recipients = students.map(s => [
      notificationId,
      s.student_id,
      s.email,
      "EMAIL"
    ]);

    await connection.query(
      `
      INSERT INTO notification_recipients
        (notification_id, student_id, email, channel)
      VALUES ?
      `,
      [recipients]
    );

    await connection.commit();

    return {
      message: "Notification sent successfully",
      recipients: students.length
    };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

exports.startTest = async (req) => {
  const { testId } = req.params;
  const rollNo = req.user.roll_no;

  const deviceFingerprint = req.get("Device-Fingerprint") || null;
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket.remoteAddress;

  const [[student]] = await pool.query(
    "SELECT student_id, dept_id, class_id FROM students WHERE roll_no = ? AND is_active = 1",
    [rollNo]
  );

  if (!student) throw new Error("Student mapping not found");

  const userAgent = req.headers["user-agent"] || "";
  if (/android|iphone|ipad|mobile/i.test(userAgent)) {
    throw new Error("Exams must be taken on a desktop or laptop");
  }

  const [[test]] = await pool.query(
    `
    SELECT
      t.max_attempts,
      t.duration_minutes,
      LEAST(
        TIMESTAMPDIFF(SECOND, UTC_TIMESTAMP(), t.publish_end),
        t.duration_minutes * 60
      ) AS remaining_seconds
    FROM tests t
    JOIN training_course_assignments tca
      ON tca.course_id = t.course_id
    WHERE
      t.test_id = ?
      AND t.published = 1 
      AND t.is_active = 1
      AND UTC_TIMESTAMP() BETWEEN t.publish_start AND t.publish_end
      AND tca.dept_id = ?
      AND tca.class_id = ?
    `,
    [testId, student.dept_id, student.class_id]
  );

  if (!test) throw new Error("Test not available");
  if (test.remaining_seconds <= 0) throw new Error("Test time already ended");

  const [[count]] = await pool.query(
    `SELECT COUNT(*) total FROM test_attempts WHERE test_id = ? AND student_id = ?`,
    [testId, student.student_id]
  );

  if (count.total >= test.max_attempts) {
    throw new Error("Max attempts reached");
  }

  const [[active]] = await pool.query(
    `
    SELECT attempt_id FROM test_attempts
    WHERE test_id = ? AND student_id = ? AND status = 'in_progress'
    `,
    [testId, student.student_id]
  );

  if (active) throw new Error("Active attempt exists");

  const [result] = await pool.query(
    `
    INSERT INTO test_attempts
      (test_id, student_id, started_at, status, ip_address, user_agent, device_fingerprint)
    VALUES (?, ?, NOW(), 'in_progress', ?, ?, ?)
    `,
    [testId, student.student_id, ipAddress, userAgent, deviceFingerprint]
  );

  await pool.query(
    `
    UPDATE test_attempts
    SET total_questions = (SELECT COUNT(*) FROM questions WHERE test_id = ?)
    WHERE attempt_id = ?
    `,
    [testId, result.insertId]
  );

  const [questions] = await pool.query(
    `
    SELECT question_id, question, option_a, option_b, option_c, option_d, marks, note
    FROM questions WHERE test_id = ? and is_active = 1
    `,
    [testId]
  );

  return {
    success: true,
    attempt_id: result.insertId,
    questions,
    remaining_seconds: test.remaining_seconds
  };
};


exports.saveAnswer = async (req) => {
  const { testId } = req.params;
  const { attempt_id, question_id, selected_option } = req.body;

  const studentId = await getStudentIdFromToken(req);
  if (!studentId) return;

  const [[valid]] = await pool.query(
    `
    SELECT ta.attempt_id
    FROM test_attempts ta
    JOIN questions q ON q.question_id = ?
    WHERE ta.attempt_id = ?
      AND ta.student_id = ?
      AND ta.status = 'in_progress'
      AND ta.test_id = ?
    `,
    [question_id, attempt_id, studentId, testId]
  );

  if (!valid) return;

  await pool.query(
    `
    INSERT INTO student_answers (attempt_id, question_id, selected_option)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE selected_option = VALUES(selected_option)
    `,
    [attempt_id, question_id, selected_option]
  );
};



exports.submitTest = async (req) => {
  const { testId } = req.params;
  const { attempt_id, forced_submission = 0 } = req.body;

  const studentId = await getStudentIdFromToken(req);
  if (!studentId) {
    throw new Error("Student record not found");
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const [[attempt]] = await conn.query(
      `
      SELECT attempt_id, status
      FROM test_attempts
      WHERE attempt_id = ?
        AND student_id = ?
      `,
      [attempt_id, studentId]
    );

    if (!attempt) {
      throw new Error("Invalid or already closed attempt");
    }

    if (attempt.status !== "in_progress") {
      await conn.rollback();
      return {
        success: true,
        message: "Already submitted"
      };
    }

    const [rows] = await conn.query(
      `
      SELECT
        q.question_id,
        q.correct_option,
        q.marks,
        sa.selected_option
      FROM questions q
      LEFT JOIN student_answers sa
        ON sa.question_id = q.question_id
       AND sa.attempt_id = ?
      WHERE q.test_id = ?
      `,
      [attempt_id, testId]
    );

    let totalScore = 0;
    let answeredCount = 0;

    for (const r of rows) {
      if (r.selected_option) {
        answeredCount++;
        if (r.selected_option === r.correct_option) {
          totalScore += r.marks;
        }
      }
    }

    const [[test]] = await conn.query(
      `SELECT pass_mark, total_marks FROM tests WHERE test_id = ?`,
      [testId]
    );

    const percentage =
      test.total_marks > 0
        ? (totalScore / test.total_marks) * 100
        : 0;

    const passStatus =
      percentage >= test.pass_mark ? "pass" : "fail";

    await conn.query(
      `
      UPDATE test_attempts
      SET
        submitted_at = NOW(),
        status = ?,
        forced_submission = ?,
        answered_count = ?,
        score = ?,
        pass_status = ?
      WHERE attempt_id = ?
        AND status = 'in_progress'
      `,
      [
        forced_submission ? "auto_submitted" : "submitted",
        forced_submission ? 1 : 0,
        answeredCount,
        totalScore,
        passStatus,
        attempt_id
      ]
    );

    await conn.commit();

    return {
      success: true,
      score: totalScore,
      percentage,
      pass_status: passStatus
    };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

exports.logViolation = async (req) => {
  const {
    attempt_id,
    violation_type,
    violation_source = null,
    extra_payload = null
  } = req.body;

  if (!attempt_id || !violation_type) {
    throw new Error("Invalid payload");
  }

  const studentId = await getStudentIdFromToken(req);
  if (!studentId) {
    throw new Error("Student record not found");
  }

  const [[attempt]] = await pool.query(
    `
    SELECT attempt_id, status
    FROM test_attempts
    WHERE attempt_id = ?
      AND student_id = ?
      AND status = 'in_progress'
    `,
    [attempt_id, studentId]
  );

  if (!attempt) {
    throw new Error("Invalid or closed attempt");
  }

  const [[count]] = await pool.query(
    `
    SELECT COUNT(*) AS total
    FROM test_attempt_violations
    WHERE attempt_id = ?
    `,
    [attempt_id]
  );

  const warningNumber = count.total + 1;
  const isTerminal = warningNumber >= 2 ? 1 : 0;

  await pool.query(
    `
    INSERT INTO test_attempt_violations
    (
      attempt_id,
      violation_type,
      violation_source,
      warning_number,
      is_terminal,
      event_timestamp,
      extra_payload
    )
    VALUES (?, ?, ?, ?, ?, NOW(), ?)
    `,
    [
      attempt_id,
      violation_type,
      violation_source,
      warningNumber,
      isTerminal,
      extra_payload ? JSON.stringify(extra_payload) : null
    ]
  );

  if (attempt.status === "terminated") {
    return {
      success: true,
      warning_number: warningNumber,
      terminated: true
    };
  }

  if (isTerminal) {
    await terminateAttempt(attempt_id, violation_type);
    await submitAttemptInternal(attempt_id);
  }


  return {
    success: true,
    warning_number: warningNumber,
    terminated: !!isTerminal
  };
};


/* ===========================
   QUESTIONS
=========================== */

exports.updateQuestion = async (req) => {
  const { questionId } = req.params;

  const [[check]] = await pool.query(
    `
    SELECT t.published
    FROM tests t
    JOIN questions q ON q.test_id = t.test_id
    WHERE q.question_id = ?
    `,
    [questionId]
  );

  if (check?.published === 1) {
    throw new Error("Cannot edit questions after test is published");
  }

  const {
    question,
    option_a,
    option_b,
    option_c,
    option_d,
    correct_option,
    note,
    marks
  } = req.body;

  await pool.query(
    `
    UPDATE questions
    SET
      question = ?,
      option_a = ?,
      option_b = ?,
      option_c = ?,
      option_d = ?,
      correct_option = ?,
      note = ?,
      marks = ?
    WHERE question_id = ?
    `,
    [
      question,
      option_a,
      option_b,
      option_c,
      option_d,
      correct_option,
      note,
      marks,
      questionId
    ]
  );

  return { success: true };
};


/* ===========================
   COURSES
=========================== */

exports.updateCourse = async (req) => {
  const { courseId } = req.params;
  const { name, description } = req.body;

  if (!name) {
    throw new Error("Course name required");
  }

  await pool.query(
    `
    UPDATE training_courses
    SET name = ?, description = ?
    WHERE course_id = ?
    `,
    [name, description || null, courseId]
  );

  return { success: true };
};


/* ===========================
   TESTS – DETAILS
=========================== */

exports.updateTestDetails = async (req) => {
  const { testId } = req.params;
  const {
    title,
    duration_minutes,
    total_marks,
    pass_mark,
    max_attempts
  } = req.body;

  if (!title || !duration_minutes) {
    throw new Error("Invalid data");
  }

  await pool.query(
    `
    UPDATE tests
    SET
      title = ?,
      duration_minutes = ?,
      total_marks = ?,
      pass_mark = ?,
      max_attempts = ?
    WHERE test_id = ?
    `,
    [title, duration_minutes, total_marks, pass_mark, max_attempts, testId]
  );

  return { success: true };
};


exports.patchTest = async (req) => {
  const { testId } = req.params;
  const { published, publish_start, publish_end } = req.body;

  const [[oldTest]] = await pool.query(
    `SELECT published, publish_start, publish_end
     FROM tests
     WHERE test_id = ?`,
    [testId]
  );

  if (!oldTest) {
    throw new Error("Test not found");
  }

  const fields = [];
  const values = [];

  if (published !== undefined) {
    fields.push("published = ?");
    values.push(published);
  }

  if (publish_start !== undefined) {
    fields.push("publish_start = ?");
    values.push(publish_start);
  }

  if (publish_end !== undefined) {
    fields.push("publish_end = ?");
    values.push(publish_end);
  }

  if (!fields.length) {
    throw new Error("No fields to update");
  }

  values.push(testId);

  const [result] = await pool.query(
    `UPDATE tests SET ${fields.join(", ")} WHERE test_id = ?`,
    values
  );

  if (result.affectedRows === 0) {
    throw new Error("No changes applied");
  }

  const newTest = {
    ...oldTest,
    ...req.body
  };

  return {
    success: true,
    oldData: oldTest,
    newData: newTest
  };
};


/* ===========================
   TESTS – PUBLISH
=========================== */

exports.toggleTestPublish = async (req) => {
  const { testId } = req.params;

  const [[assign]] = await pool.query(
    `
    SELECT COUNT(*) cnt
    FROM training_test_assignments
    WHERE test_id = ?
    `,
    [testId]
  );

  if (assign.cnt === 0) {
    throw new Error("Assign test before publishing");
  }

  await pool.query(
    `
    UPDATE tests
    SET published = IF(published = 1, 0, 1)
    WHERE test_id = ?
    `,
    [testId]
  );

  return { success: true };
};


exports.clearPublishWindow = async (req) => {
  const { testId } = req.params;

  await pool.query(
    `
    UPDATE tests
    SET publish_start = ?, publish_end = ?
    WHERE test_id = ?
    `,
    [null, null, testId]
  );

  return { success: true };
};


/* ===========================
   NOTIFICATIONS
=========================== */

exports.saveNotificationSettings = async (req) => {
  const { testId } = req.params;
  const settings = req.body;

  await pool.query(
    `
    INSERT INTO notifications
      (type, ref_id, event_type, channel, settings, sent_by)
    VALUES
      ('placement_exam', ?, 'SETTINGS', 'PORTAL', ?, ?)
    `,
    [testId, JSON.stringify(settings), req.user.user_id]
  );

  return { success: true, message: "Settings saved" };
};

/* ===========================
   COURSE ASSIGNMENTS (REPLACE)
=========================== */

exports.replaceCourseAssignments = async (req) => {
  const { courseId } = req.params;
  const { assignments } = req.body;

  if (!Array.isArray(assignments)) {
    throw new Error("Assignments array required");
  }

  // 1️⃣ Remove existing assignments
  await pool.query(
    `DELETE FROM training_course_assignments WHERE course_id = ?`,
    [courseId]
  );

  // 2️⃣ Insert new assignments
  for (const a of assignments) {
    await pool.query(
      `
      INSERT INTO training_course_assignments
        (course_id, dept_id, class_id)
      VALUES (?, ?, ?)
      `,
      [courseId, a.dept_id, a.class_id]
    );
  }

  return { success: true };
};


exports.deactivateCourse = async (req) => {
  const { courseId } = req.params;

  await pool.query(
    `UPDATE training_courses SET is_active = 0 WHERE course_id = ?`,
    [courseId]
  );

  await pool.query(
    `UPDATE tests SET is_active = 0 WHERE course_id = ?`,
    [courseId]
  );

  await pool.query(
    `UPDATE questions q
     JOIN tests t ON t.test_id = q.test_id
     SET q.is_active = 0
     WHERE t.course_id = ?`,
    [courseId]
  );

  await pool.query(
    `UPDATE training_course_assignments
     SET is_active = 0
     WHERE course_id = ?`,
    [courseId]
  );

  await pool.query(
    `UPDATE training_test_assignments tta
     JOIN tests t ON t.test_id = tta.test_id
     SET tta.is_active = 0
     WHERE t.course_id = ?`,
    [courseId]
  );
};


exports.deactivateTest = async (req) => {
  const { testId } = req.params;

  await pool.query(
    `UPDATE tests SET is_active = 0 WHERE test_id = ?`,
    [testId]
  );

  await pool.query(
    `UPDATE questions SET is_active = 0 WHERE test_id = ?`,
    [testId]
  );

  await pool.query(
    `UPDATE training_test_assignments SET is_active = 0 WHERE test_id = ?`,
    [testId]
  );
};


exports.deactivateCourseAssignment = async (req) => {
  await pool.query(
    `UPDATE training_course_assignments SET is_active = 0 WHERE id = ?`,
    [req.params.id]
  );
};

exports.deactivateQuestion = async (req) => {
  const { questionId } = req.params;

  const [[row]] = await pool.query(
    `
    SELECT t.published, q.test_id
    FROM questions q
    JOIN tests t ON t.test_id = q.test_id
    WHERE q.question_id = ? AND q.is_active = 1
    `,
    [questionId]
  );

  if (!row) throw new Error("Question not found");

  if (row.published === 1) {
    throw new Error("Cannot delete questions after test is published");
  }

  await pool.query(
    `UPDATE questions SET is_active = 0 WHERE question_id = ?`,
    [questionId]
  );

  const [[sum]] = await pool.query(
    `
    SELECT COALESCE(SUM(marks),0) totalMarks
    FROM questions
    WHERE test_id = ? AND is_active = 1
    `,
    [row.test_id]
  );

  await pool.query(
    `UPDATE tests SET total_marks = ? WHERE test_id = ?`,
    [sum.totalMarks, row.test_id]
  );

  return {
    success: true,
    total_marks: sum.totalMarks
  };
};


// module.exports = {
//   submitTest,
//   logViolation
// };
