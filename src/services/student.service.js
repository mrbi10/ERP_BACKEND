const pool = require("../config/db");
const bcrypt = require("bcrypt");

exports.getStudents = async (user) => {
    let query = "";
    let params = [];

    switch (user.role) {
        case "CA":
            query = `
        SELECT * FROM students
        WHERE class_id = ? AND dept_id = ?
        ORDER BY roll_no ASC
      `;
            params = [user.assigned_class_id, user.dept_id];
            break;

        case "Staff":
            query = `
        SELECT DISTINCT s.*
        FROM students s
        JOIN subjects sub ON s.class_id = sub.class_id
        WHERE sub.staff_id = ?
        ORDER BY s.roll_no ASC
      `;
            params = [user.user_id];
            break;

        case "HOD":
            query = `
        SELECT s.*
        FROM students s
        JOIN classes c ON s.class_id = c.class_id
        WHERE c.dept_id = ?
        ORDER BY s.roll_no ASC
      `;
            params = [user.dept_id];
            break;

        default:
            query = `SELECT * FROM students ORDER BY roll_no ASC`;
    }
    const [rows] = await pool.query(query, params);
    return rows;
};

exports.getStudentsByDepartment = async (dept_id) => {
    const [rows] = await pool.query(
        "SELECT * FROM students WHERE dept_id = ? ORDER BY roll_no",
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
      WHERE class_id = ? AND dept_id = ?
      ORDER BY roll_no ASC
    `;
        params = [classId, user.dept_id];
    } else {
        query = `
      SELECT * FROM students
      WHERE class_id = ?
      ORDER BY roll_no ASC
    `;
        params = [classId];
    }

    const [rows] = await pool.query(query, params);
    return rows;
};

exports.createStudent = async (data) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const hashed = await bcrypt.hash(data.roll_no, 10);

        const [userRes] = await conn.execute(
            `INSERT INTO users (name, email, password, role, dept_id, assigned_class_id)
       VALUES (?, ?, ?, 'student', ?, ?)`,
            [data.name, data.email, hashed, data.dept_id, data.class_id]
        );

        const [stuRes] = await conn.execute(
            `INSERT INTO students
       (name, roll_no, class_id, dept_id, email, mobile, jain, hostel, bus)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                data.name,
                data.roll_no,
                data.class_id,
                data.dept_id,
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

exports.updateStudent = async (studentId, data) => {
    const fields = [];
    const values = [];

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

    values.push(studentId);

    await pool.query(
        `UPDATE students SET ${fields.join(", ")} WHERE student_id = ?`,
        values
    );
};

exports.deleteStudent = async (student_id) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [[row]] = await conn.execute(
            "SELECT email FROM students WHERE student_id = ?",
            [student_id]
        );

        await conn.execute("DELETE FROM students WHERE student_id = ?", [student_id]);
        await conn.execute(
            "DELETE FROM users WHERE email = ? AND role = 'student'",
            [row.email]
        );

        await conn.commit();
    } catch (err) {
        await conn.rollback();
        throw err;
    } finally {
        conn.release();
    }
};
