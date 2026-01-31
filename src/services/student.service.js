const pool = require("../config/db");
const bcrypt = require("bcrypt");
exports.getStudents = async (user, filters = {}) => {
    let query = "";
    const params = [];

    const { dept_id, class_id, gender } = filters;

    switch (user.role) {

        // 🔹 CA → fixed dept + fixed class (filters ignored)
        case "CA":
            query = `
        SELECT *
        FROM students
        WHERE dept_id = ?
          AND class_id = ?
          ${gender ? "AND gender = ?" : ""} 
          AND is_active = 1
        ORDER BY roll_no ASC
      `;
            params.push(user.dept_id, user.assigned_class_id);
            if (gender) params.push(gender);
            break;

        // 🔹 Staff → only students they handle
        case "Staff":
            query = `
        SELECT DISTINCT s.*
        FROM students s
        JOIN subjects sub ON sub.class_id = s.class_id
        WHERE sub.staff_id = ?
          ${gender ? "AND s.gender = ?" : ""}
          AND s.is_active = 1
        ORDER BY s.roll_no ASC
      `;
            params.push(user.user_id);
            if (gender) params.push(gender);
            break;

        // 🔹 HOD → dept fixed, class optional
        case "HOD":
            query = `
        SELECT *
        FROM students
        WHERE dept_id = ?
          ${class_id ? "AND class_id = ?" : ""}
          ${gender ? "AND gender = ?" : ""}
          AND is_active = 1
        ORDER BY roll_no ASC
      `;
            params.push(user.dept_id);
            if (class_id) params.push(class_id);
            if (gender) params.push(gender);
            break;

        // 🔹 Principal → everything optional
        case "Principal":
            query = `
        SELECT *
        FROM students
        WHERE 1=1
          ${dept_id ? "AND dept_id = ?" : ""}
          ${class_id ? "AND class_id = ?" : ""}
          ${gender ? "AND gender = ?" : ""}
          AND is_active = 1
        ORDER BY roll_no ASC
      `;
            if (dept_id) params.push(dept_id);
            if (class_id) params.push(class_id);
            if (gender) params.push(gender);
            break;

        default:
            throw new Error("Unauthorized");
    }

    const [rows] = await pool.query(query, params);
    return rows;
};


exports.getStudentsByDepartment = async (dept_id) => {
    const [rows] = await pool.query(
        "SELECT * FROM students WHERE dept_id = ? AND is_active = 1 ORDER BY roll_no ASC",
        [dept_id]
    );
    return rows;
};

exports.getStudentsByClass = async (user, classId) => {
    let query = "";
    let params = [];

    if (["CA", "Staff", "HOD"].includes(user.role)) {
        query = `
      SELECT * FROM students
      WHERE class_id = ? AND dept_id = ? AND is_active = 1
      ORDER BY roll_no ASC 
    `;
        params = [classId, user.dept_id];
    } else {
        query = `
      SELECT * FROM students
      WHERE class_id = ? AND is_active = 1
      ORDER BY roll_no ASC
    `;
        params = [classId];
    }

    const [rows] = await pool.query(query, params);
    return rows;
};

exports.createStudent = async (data) => {
    const conn = await pool.getConnection();

    const classId =
        data.class_id === "" || data.class_id === undefined
            ? null
            : Number(data.class_id);

    const deptId =
        data.dept_id === "" || data.dept_id === undefined
            ? null
            : Number(data.dept_id);

    try {
        await conn.beginTransaction();

        const hashed = await bcrypt.hash(data.roll_no, 10);

        if (!["M", "F"].includes(data.gender)) {
            throw new Error("Invalid gender value");
        }

        const [userRes] = await conn.execute(
            `INSERT INTO users (name, email, password, role, dept_id, assigned_class_id)
       VALUES (?, ?, ?, 'student', ?, ?)`,
            [data.name, data.email, hashed, data.dept_id, classId]
        );

        const [stuRes] = await conn.execute(
            `INSERT INTO students
   (name, roll_no, gender, class_id, dept_id, email, mobile, jain, hostel, bus)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.name,
                data.roll_no,
                data.gender,
                classId,
                deptId,
                data.email,
                data.mobile,
                data.jain ? 1 : 0,
                data.hostel ? 1 : 0,
                data.bus ? 1 : 0,
            ]
        );

        await conn.commit();
        return { success: true, student_id: stuRes.insertId, user_id: userRes.insertId };
    } catch (err) {
        await conn.rollback();
        if (err.code === "ER_DUP_ENTRY") {
            throw { code: "DUPLICATE", message: "Duplicate student" };
        }
        throw err;
    } finally {
        conn.release();
    }
};

exports.updateStudent = async (studentId, data, user) => {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 🔹 fetch old email for safe user update
    const [[oldStudent]] = await conn.query(
      "SELECT email FROM students WHERE student_id = ?",
      [studentId]
    );

    if (!oldStudent) throw new Error("Student not found");

    const fields = [];
    const values = [];

    // -------- identity fields --------
    if (data.name) {
      fields.push("name = ?");
      values.push(data.name.trim().toUpperCase());
    }

    if (data.roll_no) {
      fields.push("roll_no = ?");
      values.push(data.roll_no);
    }

    if (data.email) {
      fields.push("email = ?");
      values.push(data.email);
    }

    if (data.mobile !== undefined) {
      fields.push("mobile = ?");
      values.push(data.mobile);
    }

    if (data.gender) {
      fields.push("gender = ?");
      values.push(data.gender);
    }

    // -------- role-based dept/class --------
    if (data.dept_id && user.role === "Principal") {
      fields.push("dept_id = ?");
      values.push(data.dept_id);
    }

    if (data.class_id && (user.role === "Principal" || user.role === "HOD")) {
      fields.push("class_id = ?");
      values.push(data.class_id);
    }

    // -------- status flags --------
    if (data.jain !== undefined) {
      fields.push("jain = ?");
      values.push(data.jain ? 1 : 0);
    }

    if (data.hostel !== undefined) {
      fields.push("hostel = ?");
      values.push(data.hostel ? 1 : 0);
    }

    if (data.bus !== undefined) {
      fields.push("bus = ?");
      values.push(data.bus ? 1 : 0);
    }

    if (!fields.length) throw new Error("No fields to update");

    values.push(studentId);

    // 🔹 update students table
    await conn.query(
      `UPDATE students SET ${fields.join(", ")} WHERE student_id = ?`,
      values
    );

    // 🔹 sync users table safely
    if (data.name || data.email || data.dept_id || data.class_id) {
      await conn.query(
        `
        UPDATE users
        SET
          name = COALESCE(?, name),
          email = COALESCE(?, email),
          dept_id = COALESCE(?, dept_id),
          assigned_class_id = COALESCE(?, assigned_class_id)
        WHERE email = ? AND role = 'student'
        `,
        [
          data.name?.trim().toUpperCase() || null,
          data.email || null,
          data.dept_id || null,
          data.class_id || null,
          oldStudent.email
        ]
      );
    }

    await conn.commit();
    return { success: true };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


exports.deleteStudent = async (student_id) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // get linked user email
        const [[row]] = await conn.execute(
            `SELECT email FROM students WHERE student_id = ? AND is_active = 1`,
            [student_id]
        );

        if (!row) {
            throw new Error("Student not found");
        }

        // soft delete student
        await conn.execute(
            `UPDATE students SET is_active = 0 WHERE student_id = ?`,
            [student_id]
        );

        // soft delete user account
        await conn.execute(
            `UPDATE users SET is_active = 0 
       WHERE email = ? AND role = 'student'`,
            [row.email]
        );

        await conn.commit();
        return { success: true };

    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};

