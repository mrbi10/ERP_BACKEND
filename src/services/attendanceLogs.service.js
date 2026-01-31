const pool = require("../config/db");

// ================= GET TODAY LATE =================
// ================= GET TODAY LATE =================
exports.getTodayLateEntries = async (user) => {
  const { role, dept_id, assigned_class_id } = user;

  let sql = `
    SELECT 
      person_type,
      person_id,
      roll_no,
      name,
      dept_id,
      class_id,
      designation,
      entry_time,
      late_minutes
    FROM attendance_logs
    WHERE entry_date = CURDATE()
      AND entry_type = 'IN'
      AND is_late = 1
  `;

  const params = [];

  if (role === "HOD") {
    sql += " AND dept_id = ?";
    params.push(dept_id);
  }

  if (role === "CA") {
    sql += " AND person_type = 'STUDENT' AND dept_id = ? AND class_id = ?";
    params.push(dept_id, assigned_class_id);
  }

  sql += " ORDER BY entry_time ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
};



exports.getAttendanceLogs = async (req) => {
  const { role, dept_id, assigned_class_id } = req.user;
  const {
    date,
    from_date,
    to_date,
    person_type,
    entry_type,
    late_only,
    dept,
    class_id
  } = req.query;

  let sql = `
    SELECT
      person_type,
      person_id,
      roll_no,
      name,
      dept_id,
      class_id,
      designation,
      entry_type,
      entry_date,
      entry_time,
      is_late,
      late_minutes,
      recorded_mode,
      recorder_role
    FROM attendance_logs
    WHERE 1=1
  `;
  const params = [];

  // Date filters
  if (date) {
    sql += " AND entry_date = ?";
    params.push(date);
  }

  if (from_date && to_date) {
    sql += " AND entry_date BETWEEN ? AND ?";
    params.push(from_date, to_date);
  }

  if (person_type) {
    sql += " AND person_type = ?";
    params.push(person_type);
  }

  if (entry_type) {
    sql += " AND entry_type = ?";
    params.push(entry_type);
  }

  if (late_only) {
    sql += " AND is_late = 1";
  }

  // 🔐 ROLE VISIBILITY
  if (role === "HOD") {
    sql += " AND dept_id = ?";
    params.push(dept_id);
  }

  if (role === "CA") {
    sql += " AND person_type = 'STUDENT'";
    sql += " AND dept_id = ?";
    sql += " AND class_id = ?";
    params.push(dept_id, assigned_class_id);
  }

  // Principal → no restriction

  sql += " ORDER BY entry_date DESC, entry_time DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
};

// ================= LIVE ATTENDANCE =================
exports.getLiveAttendance = async (user) => {
  const { role, dept_id } = user;

  let sql = `
    SELECT al.*
    FROM attendance_logs al
    INNER JOIN (
      SELECT person_type, person_id, MAX(created_at) AS latest
      FROM attendance_logs
      WHERE entry_date = CURDATE()
      GROUP BY person_type, person_id
    ) last_log
      ON al.person_type = last_log.person_type
     AND al.person_id = last_log.person_id
     AND al.created_at = last_log.latest
    WHERE al.entry_date = CURDATE()
  `;

  const params = [];

  // 🔐 HOD → only own department
  if (role === "HOD") {
    sql += " AND al.dept_id = ?";
    params.push(dept_id);
  }

  sql += " ORDER BY al.entry_time DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
};

// ================= TODAY SUMMARY =================
exports.getTodaySummary = async (user) => {
  const { role, dept_id, assigned_class_id } = user;

  let sql = `
    SELECT
      COUNT(*) AS total_entries,
      SUM(entry_type = 'IN') AS total_in,
      SUM(entry_type = 'OUT') AS total_out,
      SUM(is_late = 1) AS late_count,
      SUM(person_type = 'STUDENT') AS student_count,
      SUM(person_type = 'STAFF') AS staff_count
    FROM attendance_logs
    WHERE entry_date = CURDATE()
  `;

  const params = [];

  // 🔐 HOD → dept only
  if (role === "HOD") {
    sql += " AND dept_id = ?";
    params.push(dept_id);
  }

  // 🔐 CA → students of assigned class
  if (role === "CA") {
    sql += " AND person_type = 'STUDENT'";
    sql += " AND dept_id = ?";
    sql += " AND class_id = ?";
    params.push(dept_id, assigned_class_id);
  }

  const [[row]] = await pool.query(sql, params);
  return row;
};


// ================= MANUAL ENTRY (SECURITY / ADMIN) =================
exports.markManualEntry = async (req) => {
  const { unique_code } = req.body;

  if (!unique_code) {
    throw new Error("ID card / barcode required");
  }

  // 🔹 Find person from USERS table
  const [[user]] = await pool.query(
    `
    SELECT 
      user_id,
      name,
      role,
      dept_id,
      assigned_class_id
    FROM users
    WHERE unique_code = ?
    `,
    [unique_code]
  );

  if (!user) {
    throw new Error("Invalid ID card");
  }

  const personType = user.role === "student" ? "STUDENT" : "STAFF";

  // 🔹 Last IN / OUT
  const [[last]] = await pool.query(
    `
    SELECT entry_type
    FROM attendance_logs
    WHERE person_type = ? AND person_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
    [personType, user.user_id]
  );

  const entryType = last && last.entry_type === "IN" ? "OUT" : "IN";

  // 🔹 Late logic (first IN only)
  let isLate = 0;
  let lateMinutes = 0;

  if (entryType === "IN") {
    const [[count]] = await pool.query(
      `
      SELECT COUNT(*) AS cnt
      FROM attendance_logs
      WHERE person_type = ?
        AND person_id = ?
        AND entry_date = CURDATE()
        AND entry_type = 'IN'
      `,
      [personType, user.user_id]
    );

    if (count.cnt === 0) {
      const now = new Date();
      const minutesNow = now.getHours() * 60 + now.getMinutes();

      const allowed =
        personType === "STUDENT"
          ? 540   // 09:00
          : 540;  // 09:00

      if (minutesNow > allowed) {
        isLate = 1;
        lateMinutes = minutesNow - allowed;
      }
    }
  }

  // 🔹 Insert attendance log
  await pool.query(
    `
    INSERT INTO attendance_logs (
      person_type,
      person_id,
      unique_code,
      name,
      roll_no,
      dept_id,
      class_id,
      designation,
      entry_type,
      entry_date,
      entry_time,
      is_late,
      late_minutes,
      recorded_mode,
      recorded_by,
      recorder_role
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), CURTIME(), ?, ?, 'BARCODE', ?, ?)
    `,
    [
      personType,
      user.user_id,
      unique_code,
      user.name,
      personType === "STUDENT" ? user.user_id : null, // optional display
      user.dept_id,
      user.assigned_class_id,
      user.role, // designation
      entryType,
      isLate,
      lateMinutes,
      req.user.user_id,
      req.user.role
    ]
  );

  return {
    success: true,
    name: user.name,
    person_type: personType,
    entry_type: entryType,
    is_late: isLate,
    late_minutes: lateMinutes
  };
};

exports.getAttendanceHistory = async (user, query) => {
  const { role, dept_id, assigned_class_id } = user;
  const {
    from_date,
    to_date,
    person_type,
    status,
    dept_filter,
    class_filter
  } = query;

  let sql = `
    SELECT 
      person_type,
      person_id,
      name,
      roll_no,
      dept_id,
      class_id,
      entry_type,
      entry_date,
      entry_time,
      is_late,
      late_minutes
    FROM attendance_logs
    WHERE entry_date BETWEEN ? AND ?
  `;

  const params = [from_date, to_date];

  // Person type filter
  if (person_type !== "ALL") {
    sql += " AND person_type = ?";
    params.push(person_type);
  }

  // Status filter
  if (status === "LATE") {
    sql += " AND is_late = 1";
  } else if (status !== "ALL") {
    sql += " AND entry_type = ?";
    params.push(status);
  }

  // Role-based visibility
  if (role === "HOD") {
    sql += " AND dept_id = ?";
    params.push(dept_id);
  }

  if (role === "CA") {
    sql += " AND person_type='STUDENT' AND dept_id=? AND class_id=?";
    params.push(dept_id, assigned_class_id);
  }

  // Explicit filters (Principal / HOD only)
  if (dept_filter && dept_filter !== "ALL") {
    sql += " AND dept_id = ?";
    params.push(dept_filter);
  }

  if (class_filter && class_filter !== "ALL") {
    sql += " AND class_id = ?";
    params.push(class_filter);
  }

  sql += " ORDER BY entry_date DESC, entry_time DESC";

  const [rows] = await pool.query(sql, params);
  return rows;
};

// ================= GET PEOPLE LIST =================
exports.getPeopleList = async (user, query) => {
  const { role, dept_id, assigned_class_id } = user;
  const { dept_id: filterDept, class_id, type } = query;

  if (!type || !["STUDENT", "STAFF"].includes(type)) {
    throw new Error("Invalid person type");
  }

  const params = [];
  let sql = "";

  // ---------------- STUDENTS ----------------
  if (type === "STUDENT") {
    sql = `
      SELECT 
        u.user_id AS person_id,
        u.name,
        u.unique_code,
        u.dept_id,
        u.assigned_class_id AS class_id,
        s.roll_no
      FROM users u
      LEFT JOIN students s ON u.email = s.email
      WHERE u.role = 'student' 
        AND u.is_active = 1
    `;

    // Role-based visibility
    if (role === "HOD") {
      sql += " AND u.dept_id = ?";
      params.push(dept_id);
    }

    if (role === "CA") {
      sql += " AND u.dept_id = ? AND u.assigned_class_id = ?";
      params.push(dept_id, assigned_class_id);
    }

    // Filters
    if (filterDept && filterDept !== "ALL") {
      sql += " AND u.dept_id = ?";
      params.push(filterDept);
    }

    if (class_id && class_id !== "ALL") {
      sql += " AND u.assigned_class_id = ?";
      params.push(class_id);
    }

    sql += " ORDER BY u.name ASC";
  }

  // ---------------- STAFF ----------------
  if (type === "STAFF") {
    sql = `
      SELECT 
        u.user_id AS person_id,
        u.name,
        u.unique_code,
        u.dept_id,
        u.role AS designation
      FROM users u
      WHERE u.role != 'student'
        AND u.is_active = 1
    `;

    // Role-based visibility
    if (role === "HOD") {
      sql += " AND u.dept_id = ?";
      params.push(dept_id);
    }

    if (role === "CA") {
      // CA should NOT see other staff except same dept
      sql += " AND u.dept_id = ?";
      params.push(dept_id);
    }

    // Filters
    if (filterDept && filterDept !== "ALL") {
      sql += " AND u.dept_id = ?";
      params.push(filterDept);
    }

    sql += " ORDER BY u.name ASC";
  }

  const [rows] = await pool.query(sql, params);
  return rows;
};
