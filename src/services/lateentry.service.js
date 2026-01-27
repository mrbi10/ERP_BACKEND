const pool = require("../config/db");

// ================= GET TODAY =================
exports.getTodayLateEntries = async () => {
  const [rows] = await pool.query(`
    SELECT 
      l.roll_no, 
      l.name, 
      l.dept_id, 
      l.entry_time, 
      l.date,
      c.year, 
      c.section
    FROM late_entries l
    LEFT JOIN classes c ON l.class_id = c.class_id
    WHERE l.date = CURDATE()
    ORDER BY l.entry_time ASC
  `);

  return rows;
};

// ================= MARK LATE =================
exports.markLateStudent = async (req) => {
  const { roll_no } = req.body;

  if (!roll_no) {
    throw new Error("Roll number required");
  }

  // IST time check
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false
  });

  const parts = formatter.formatToParts(now);
  const hour = parseInt(parts.find(p => p.type === "hour").value);

  if (hour < 9) {
    throw new Error("Late marking allowed only after 9:00 AM");
  }

  // Student lookup
  const [students] = await pool.query(
    `
    SELECT s.student_id, s.roll_no, s.name, s.dept_id, c.year, c.section, c.class_id
    FROM students s
    JOIN classes c ON s.class_id = c.class_id
    WHERE s.roll_no = ?
    `,
    [roll_no]
  );

  if (!students.length) {
    throw new Error("Student not found");
  }

  const student = students[0];

  const [existing] = await pool.query(
    `SELECT 1 FROM late_entries WHERE roll_no = ? AND date = CURDATE()`,
    [roll_no]
  );

  if (existing.length) {
    throw new Error("This student is already marked late today.");
  }

  await pool.query(
    `
    INSERT INTO late_entries
      (student_id, roll_no, name, dept_id, class_id, entry_time, date, is_late, recorded_by)
    VALUES
      (?, ?, ?, ?, ?, CURTIME(), CURDATE(), 1, ?)
    `,
    [
      student.student_id,
      student.roll_no,
      student.name,
      student.dept_id,
      student.class_id,
      req.user.name || "Security"
    ]
  );

  return {
    success: true,
    student: {
      name: student.name,
      roll_no: student.roll_no,
      dept: student.dept_id,
      year: student.year,
      section: student.section
    },
    message: `${student.name} (${student.roll_no}) marked as late.`
  };
};
