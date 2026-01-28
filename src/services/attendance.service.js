const pool = require("../config/db");

exports.markAttendance = async (user, attendanceList) => {
  if (!Array.isArray(attendanceList) || !attendanceList.length) {
    throw { status: 400, message: "No attendance data provided" };
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [allowedRows] = await conn.query(
      `SELECT class_id, access_type FROM staff_class_access WHERE user_id = ?`,
      [user.id]
    );

    const caClasses = allowedRows
      .filter(r => r.access_type.toUpperCase() === "CA")
      .map(r => r.class_id);

    if (!caClasses.length) {
      throw { status: 403, message: "You are not allowed to mark attendance" };
    }

    let markedCount = 0;

    for (const r of attendanceList) {
      const { regNo, subjectId, date, period, status } = r;
      if (!regNo || !subjectId || !date || !period) continue;

      const [[student]] = await conn.query(
        "SELECT student_id, class_id FROM students WHERE roll_no = ?",
        [regNo]
      );
      if (!student || !caClasses.includes(student.class_id)) continue;

      const [result] = await conn.query(
        `INSERT INTO attendance (student_id, subject_id, date, period, status, marked_by)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           status = VALUES(status),
           marked_by = VALUES(marked_by)`,
        [student.student_id, subjectId, date, period, status, user.id]
      );

      if (result.affectedRows > 0) markedCount++;
    }

    await conn.commit();

    if (!markedCount) {
      throw { status: 400, message: "No attendance marked" };
    }

    return { success: true, message: `Attendance saved for ${markedCount} record(s)` };

  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


exports.updateAttendance = async (user, data) => {
  if (!Array.isArray(data) || !data.length) {
    throw { status: 400, message: "Invalid data format" };
  }

  const allowed = ["Present", "Absent", "Late"];

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    for (const item of data) {
      const { attendance_id, status } = item;

      if (!attendance_id || !status) {
        throw { status: 400, message: "Missing required fields" };
      }

      const normalized =
        status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

      if (!allowed.includes(normalized)) {
        throw { status: 400, message: "Invalid status value" };
      }

      const [result] = await conn.query(
        `UPDATE attendance
         SET status = ?, marked_by = ?
         WHERE attendance_id = ?`,
        [normalized, user.id, attendance_id]
      );

      if (!result.affectedRows) {
        throw { status: 404, message: `Attendance ${attendance_id} not found` };
      }
    }

    await conn.commit();
    return { message: "Attendance updated successfully" };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};



exports.getAttendance = async (q) => {
  let sql = `
    SELECT
      a.attendance_id,
      a.student_id,
      a.date,
      a.status,
      s.name AS student_name,
      s.roll_no AS regNo,
      s.dept_id,
      s.class_id
    FROM attendance a
    JOIN students s ON s.student_id = a.student_id
    WHERE 1=1
  `;

  const params = [];

  // ---- Academic scope (any combination allowed) ----
  if (q.deptId) {
    sql += " AND s.dept_id = ?";
    params.push(q.deptId);
  }

  if (q.classId) {
    sql += " AND s.class_id = ?";
    params.push(q.classId);
  }

  if (q.studentId) {
    sql += " AND a.student_id = ?";
    params.push(q.studentId);
  }

  // ---- Date handling (single OR range) ----
  if (q.date) {
    // single-day report
    sql += " AND a.date = ?";
    params.push(q.date);
  } else {
    // range report
    if (q.fromDate) {
      sql += " AND a.date >= ?";
      params.push(q.fromDate);
    }

    if (q.toDate) {
      sql += " AND a.date <= ?";
      params.push(q.toDate);
    }
  }

  sql += " ORDER BY a.date ASC, s.roll_no ASC";

  const [rows] = await pool.query(sql, params);
  return rows;
};


exports.getStudentAttendance = async (rollNo) => {

  const [rows] = await pool.query(
    `
    SELECT 
      a.*,
      s.roll_no,
      s.name AS student_name
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    WHERE s.roll_no = ?
    ORDER BY a.date ASC
    `,
    [rollNo]
  );

  return rows;
};


