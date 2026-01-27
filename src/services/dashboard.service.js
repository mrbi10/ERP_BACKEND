const pool = require("../config/db");

// ================= ADMIN OVERVIEW =================
exports.getAdminOverview = async ({ deptId, classId }) => {
  const today = new Date().toISOString().split("T")[0];

  // ---- Dynamic filters ----
  let whereClause = "WHERE 1=1";
  const params = [];

  if (deptId) {
    whereClause += " AND s.dept_id = ?";
    params.push(deptId);
  }

  if (classId) {
    whereClause += " AND s.class_id = ?";
    params.push(classId);
  }

  // ---- Total students ----
  const [totals] = await pool.query(
    `
    SELECT 
      COUNT(*) AS total_students,
      SUM(s.jain = 1) AS total_jain,
      SUM(s.hostel = 1) AS total_hostel,
      SUM(s.bus = 1) AS total_bus
    FROM students s
    ${whereClause}
    `,
    params
  );

  // ---- Present today ----
  const [present] = await pool.query(
    `
    SELECT 
      COUNT(DISTINCT a.student_id) AS present_today,
      SUM(s.jain = 1) AS present_jain,
      SUM(s.hostel = 1) AS present_hostel,
      SUM(s.bus = 1) AS present_bus
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    WHERE a.date = ? AND a.status = 'Present'
    ${deptId ? "AND s.dept_id = ?" : ""}
    ${classId ? "AND s.class_id = ?" : ""}
    `,
    [
      today,
      ...(deptId ? [deptId] : []),
      ...(classId ? [classId] : []),
    ]
  );

  return {
    total_students: totals[0]?.total_students || 0,
    present_today: present[0]?.present_today || 0,
    jain_students: {
      total: totals[0]?.total_jain || 0,
      present: present[0]?.present_jain || 0,
    },
    hostel_students: {
      total: totals[0]?.total_hostel || 0,
      present: present[0]?.present_hostel || 0,
    },
    bus_students: {
      total: totals[0]?.total_bus || 0,
      present: present[0]?.present_bus || 0,
    },
  };
};

// ================= PROFILE =================
exports.getProfile = async (user) => {
  // -------- STUDENT PROFILE --------
  if (user.role.toLowerCase() === "student") {
    const [rows] = await pool.query(
      `
      SELECT 
        s.name, 
        s.roll_no AS regNo, 
        'B.E. CSE' AS course,
        (SELECT year FROM classes WHERE class_id = s.class_id) AS Year,
        s.email,
        s.mobile,
        s.jain,
        s.hostel,
        s.class_id,
        u.role,
        u.dept_id
      FROM students s
      JOIN users u ON s.email = u.email
      WHERE s.roll_no = ?
      `,
      [user.roll_no]
    );

    if (!rows.length) {
      throw new Error("Profile not found");
    }

    return rows[0];
  }

  // -------- STAFF / CA / HOD / PRINCIPAL --------
  const [rows] = await pool.query(
    `
    SELECT 
      user_id,
      name,
      email,
      role,
      dept_id,
      assigned_class_id,
      reset_token,
      reset_expires
    FROM users
    WHERE user_id = ?
    `,
    [user.id]
  );

  if (!rows.length) {
    throw new Error("User not found");
  }

  return rows[0];
};
