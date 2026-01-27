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
    let query = `
    SELECT a.*, s.name AS student_name, s.roll_no AS regNo, sub.subject_name
    FROM attendance a
    JOIN students s ON a.student_id = s.student_id
    JOIN subjects sub ON a.subject_id = sub.subject_id
    WHERE 1=1`;
    const p = [];

    if (q.classId) { query += " AND s.class_id = ?"; p.push(q.classId); }
    if (q.subjectId) { query += " AND a.subject_id = ?"; p.push(q.subjectId); }
    if (q.studentId) { query += " AND a.student_id = ?"; p.push(q.studentId); }
    if (q.date) { query += " AND a.date = ?"; p.push(q.date); }

    query += " ORDER BY a.date ASC";

    const [rows] = await pool.query(query, p);
    return rows;
};
