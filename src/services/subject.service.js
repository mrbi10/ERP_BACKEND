const pool = require("../config/db");

/**
 * Create Subject
 */
exports.createSubject = async (data) => {
  const sql = `
    INSERT INTO subjects
    (subject_code, subject_name, regulation, dept_id, class_id, staff_id,
     periods_per_week, is_active, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `;

  const values = [
    data.subject_code,
    data.subject_name,
    data.regulation,
    data.dept_id,
    data.class_id,
    data.staff_id,
    data.periods_per_week || 5,
    data.created_by
  ];

  const [result] = await pool.query(sql, values);
  return result;
};

/**
 * Get Subjects (role-based visibility)
 */
exports.getSubjects = async ({ role, dept_id, class_id }) => {
  let sql = `
    SELECT *
    FROM subjects
    WHERE is_active = 1
  `;
  const params = [];

  if (role === "HOD") {
    sql += " AND dept_id = ?";
    params.push(dept_id);
  }

  if (role === "CA") {
    sql += " AND dept_id = ? AND class_id = ?";
    params.push(dept_id, class_id);
  }

  if (role === "Principal") {
    if (dept_id) {
      sql += " AND dept_id = ?";
      params.push(dept_id);
    }
    if (class_id) {
      sql += " AND class_id = ?";
      params.push(class_id);
    }
  }

  sql += " ORDER BY subject_name";


  const [rows] = await pool.query(sql, params);
  return rows;
};


/**
 * Update Subject
 */
exports.updateSubject = async (subject_id, data) => {
  const sql = `
    UPDATE subjects SET
      subject_code = ?,
      subject_name = ?,
      regulation = ?,
      dept_id = ?,
      class_id = ?,
      staff_id = ?,
      periods_per_week = ?,
      updated_by = ?
    WHERE subject_id = ?
  `;

  const values = [
    data.subject_code,
    data.subject_name,
    data.regulation,
    data.dept_id,
    data.class_id,
    data.staff_id,
    data.periods_per_week,
    data.updated_by,
    subject_id
  ];

  await pool.query(sql, values);
};

/**
 * Soft Delete
 */
exports.softDeleteSubject = async (subject_id, user_id) => {
  const sql = `
    UPDATE subjects
    SET is_active = 0, updated_by = ?
    WHERE subject_id = ?
  `;
  await pool.query(sql, [user_id, subject_id]);
};
