const pool = require("../config/db");

/**
 * INTERNAL: Auto submit a terminated attempt
 * ❗ NO RESPONSE
 * ❗ NO AUTH
 * ❗ DB is the source of truth
 */
const submitAttemptInternal = async (attemptId) => {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [[attempt]] = await conn.query(
      `
      SELECT test_id
      FROM test_attempts
      WHERE attempt_id = ?
      `,
      [attemptId]
    );

    if (!attempt) return;

    const testId = attempt.test_id;

    const [rows] = await conn.query(
      `
      SELECT
        q.correct_option,
        q.marks,
        sa.selected_option
      FROM questions q
      LEFT JOIN student_answers sa
        ON sa.question_id = q.question_id
       AND sa.attempt_id = ?
      WHERE q.test_id = ?
      `,
      [attemptId, testId]
    );

    let score = 0;
    let answered = 0;

    for (const r of rows) {
      if (r.selected_option) {
        answered++;
        if (r.selected_option === r.correct_option) {
          score += r.marks;
        }
      }
    }

    const [[test]] = await conn.query(
      `
      SELECT pass_mark, total_marks
      FROM tests
      WHERE test_id = ?
      `,
      [testId]
    );

    const percentage =
      test.total_marks > 0
        ? (score / test.total_marks) * 100
        : 0;

    const passStatus =
      percentage >= test.pass_mark ? "pass" : "fail";

    await conn.query(
      `
      UPDATE test_attempts
      SET
        submitted_at = NOW(),
        status = 'auto_submitted',
        forced_submission = 1,
        answered_count = ?,
        score = ?,
        pass_status = ?
      WHERE attempt_id = ?
        AND status = 'terminated'
      `,
      [answered, score, passStatus, attemptId]
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error("Internal submit error:", err);
  } finally {
    conn.release();
  }
};

/**
 * INTERNAL: Terminate an in-progress attempt
 */
const terminateAttempt = async (attemptId, reason) => {
  await pool.query(
    `
    UPDATE test_attempts
    SET
      status = 'terminated',
      forced_submission = 1,
      termination_reason = ?
    WHERE attempt_id = ?
      AND status = 'in_progress'
    `,
    [reason, attemptId]
  );
};

module.exports = {
  submitAttemptInternal,
  terminateAttempt
};
