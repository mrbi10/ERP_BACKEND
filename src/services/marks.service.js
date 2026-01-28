const pool = require("../config/db");

exports.addOrUpdateMarks = async ({
  student_id,
  subject_id,
  exam_type,
  mark,
  total,
  entered_by
}) => {
  await pool.query(
    `
    INSERT INTO marks (student_id, subject_id, exam_type, marks, total, entered_by)
    VALUES (?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      marks = VALUES(marks),
      total = VALUES(total),
      updated_at = CURRENT_TIMESTAMP
    `,
    [student_id, subject_id, exam_type, mark, total, entered_by]
  );
};

exports.getStudentByRollNo = async (rollNo) => {
  const [[row]] = await pool.query(
    "SELECT student_id, name AS student_name FROM students WHERE roll_no = ?",
    [rollNo]
  );
  return row;
};

exports.getMarksByStudentId = async (studentId) => {
  const [rows] = await pool.query(
    `
    SELECT m.*, sub.subject_name
    FROM marks m
    JOIN subjects sub ON m.subject_id = sub.subject_id
    WHERE m.student_id = ?
    `,
    [studentId]
  );
  return rows;
};

exports.getMarksByClass = async (classId) => {
  const [rows] = await pool.query(
    `
    SELECT m.*, st.name AS student_name, s.subject_name
    FROM marks m
    JOIN students st ON m.student_id = st.student_id
    JOIN subjects s ON m.subject_id = s.subject_id
    WHERE st.class_id = ?
    `,
    [classId]
  );
  return rows;
};

exports.getMarksOverview = async () => {
  const [rows] = await pool.query(`
    SELECT 
      d.dept_id AS department_name,
      COUNT(DISTINCT s.student_id) AS total_students,
      ROUND(AVG(m.marks), 2) AS avg_mark,
      ROUND(SUM(m.marks >= 50) / COUNT(m.marks) * 100, 2) AS pass_rate
    FROM marks m
    JOIN students s ON s.student_id = m.student_id
    JOIN departments d ON d.dept_id = s.dept_id
    GROUP BY d.dept_id
  `);
  return rows;
};

exports.getDepartmentAnalysis = async () => {
  const [rows] = await pool.query(`
    SELECT 
      d.dept_id AS department_name,
      ROUND(AVG(CASE WHEN m.exam_type='IAT1' THEN m.marks END),2) AS IAT1,
      ROUND(AVG(CASE WHEN m.exam_type='IAT2' THEN m.marks END),2) AS IAT2,
      ROUND(AVG(CASE WHEN m.exam_type='MODEL' THEN m.marks END),2) AS MODEL,
      ROUND(SUM(m.marks >= 50) / COUNT(m.marks) * 100, 2) AS pass_rate
    FROM marks m
    JOIN students s ON s.student_id = m.student_id
    JOIN departments d ON d.dept_id = s.dept_id
    GROUP BY d.dept_id
  `);
  return rows;
};

exports.getTopPerformers = async () => {
  const [rows] = await pool.query(`
    SELECT 
      s.name,
      d.dept_id AS department_name,
      m.exam_type,
      ROUND(AVG(m.marks),2) AS avg_mark
    FROM marks m
    JOIN students s ON s.student_id = m.student_id
    JOIN departments d ON d.dept_id = s.dept_id
    GROUP BY s.student_id, m.exam_type
    ORDER BY avg_mark DESC
    LIMIT 10
  `);
  return rows;
};
