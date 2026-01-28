const pool = require("../config/db");

// ===============================
// Get subjects (role aware)
// ===============================
exports.getSubjects = async (req) => {
  const { class_id, dept_id } = req.query;
  const { role, id: userId, dept_id: userDept } = req.user;

  let query = `
    SELECT s.*, c.dept_id, c.year, c.section
    FROM subjects s
    JOIN classes c ON s.class_id = c.class_id
    WHERE 1=1
  `;
  const params = [];

  if (role === "Staff") {
    query += " AND s.staff_id = ?";
    params.push(userId);
  } else if (role === "HOD") {
    query += " AND c.dept_id = ?";
    params.push(userDept);
  }

  if (dept_id) {
    query += " AND c.dept_id = ?";
    params.push(dept_id);
  }

  if (class_id) {
    query += " AND s.class_id = ?";
    params.push(class_id);
  }

  query += " ORDER BY c.year, c.section, s.subject_name";

  const [rows] = await pool.query(query, params);
  return rows;
};

// ===============================
// Get subjects handled by staff / CA
// ===============================
exports.getStaffSubjects = async (req) => {
  const staffId = req.user.id;
  const role = req.user.role;

  // Subjects directly handled
  const [handledSubjects] = await pool.query(
    `SELECT * FROM subjects WHERE staff_id = ?`,
    [staffId]
  );

  let caSubjects = [];

  if (["CA", "Staff"].includes(role)) {
    const [caClasses] = await pool.query(
      `SELECT class_id FROM classes WHERE ca_id = ? OR assigned_ca_id = ?`,
      [staffId, staffId]
    );

    if (caClasses.length > 0) {
      const classIds = caClasses.map(c => c.class_id);

      const [rows] = await pool.query(
        `SELECT * FROM subjects WHERE class_id IN (?)`,
        [classIds]
      );

      caSubjects = rows.map(s => ({
        ...s,
        from_ca: true
      }));
    }
  }

  const allSubjects = [
    ...handledSubjects.map(s => ({ ...s, from_ca: false })),
    ...caSubjects
  ];

  const uniqueSubjects = [
    ...new Map(allSubjects.map(s => [s.subject_id, s])).values()
  ];

  return {
    handled_subjects: handledSubjects,
    ca_subjects: caSubjects,
    subjects: uniqueSubjects
  };
};
