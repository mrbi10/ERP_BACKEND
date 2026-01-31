const pool = require("../config/db");

/**
 * Resolve student_id from JWT user payload
 * Returns student_id or null
 */
const getStudentIdFromToken = async (req) => {
  const { id, roll_no, email, role } = req.user || {};

  if (role !== "student") return null;

  // Prefer roll_no if present (fast + reliable)
  if (roll_no) {
    const [[student]] = await pool.query(
      `SELECT student_id FROM students WHERE roll_no = ? AND is_active = 1`,
      [roll_no]
    );
    return student?.student_id || null;
  }

  // Fallback: email mapping
  if (email) {
    const [[student]] = await pool.query(
      `SELECT student_id FROM students WHERE email = ? AND is_active = 1`,
      [email]
    );
    return student?.student_id || null;
  }

  return null;
};

module.exports = {
  getStudentIdFromToken
};
