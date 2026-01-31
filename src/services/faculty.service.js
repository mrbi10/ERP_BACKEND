const db = require("../config/db");
const bcrypt = require("bcrypt");

// 1️⃣ LIST + FILTER
exports.getFacultyList = async (req) => {
  let { dept_id, role, designation, page, limit } = req.query;

  page = Number(page) || 1;
  limit = Number(limit) || 20;

  const offset = (page - 1) * limit;

  let sql = `
    SELECT 
      u.user_id,
      u.name,
      u.email,
      u.role,
      u.dept_id,
      s.designation
    FROM users u
    JOIN staff s ON s.user_id = u.user_id
    WHERE u.is_active = 1
      AND s.is_active = 1
      AND u.role IN ('Staff', 'CA', 'HOD')
  `;

  const params = [];

  if (dept_id !== undefined) {
    sql += " AND u.dept_id = ?";
    params.push(Number(dept_id));
  }

  if (role !== undefined) {
    sql += " AND u.role = ?";
    params.push(role);
  }

  if (designation !== undefined) {
    sql += " AND s.designation = ?";
    params.push(designation);
  }

  // 🔐 SAFE pagination (numbers already validated)
  sql += " LIMIT " + limit + " OFFSET " + offset;

  const [rows] = await db.execute(sql, params);
  return rows;
};




// 2️⃣ GET SINGLE FACULTY
exports.getFacultyById = async (user_id) => {
  const [rows] = await db.execute(
    `
    SELECT 
      u.user_id,
      u.name,
      u.email,
      u.role,
      u.dept_id,
      s.designation
    FROM users u
    JOIN staff s ON s.user_id = u.user_id
    WHERE u.user_id = ?
      AND u.is_active = 1
      AND s.is_active = 1
    `,
    [user_id]
  );

  if (!rows.length) throw new Error("Faculty not found");
  return rows[0];
};


// 3️⃣ CREATE FACULTY
exports.createFaculty = async (data) => {



  const {
    name,
    email,
    password = "Test@123",
    role,
    dept_id,
    designation,
  } = data;

  if (!["Staff", "CA", "HOD"].includes(role)) {
    throw new Error("Invalid faculty role");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const conn = await db.getConnection();

  const [[existing]] = await conn.execute(
    "SELECT user_id FROM users WHERE email = ? AND is_active = 1",
    [email]
  );

  if (existing) {
    throw new Error("Email already exists");
  }
  try {
    await conn.beginTransaction();

    const [userResult] = await conn.execute(
      `
      INSERT INTO users (name, email, password, role, dept_id)
      VALUES (?, ?, ?, ?, ?)
      `,
      [name, email, hashedPassword, role, dept_id]
    );

    

    const user_id = userResult.insertId;

    await conn.execute(
      `
      INSERT INTO staff (user_id, name , email, designation, dept_id)
      VALUES (?, ?, ?, ?, ?)
      `,
      [user_id, name, email, designation, dept_id]
    );

    await conn.commit();
    return { user_id, name, role };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};


// 4️⃣ UPDATE FACULTY
exports.updateFaculty = async (user_id, data) => {
  /* ---------- USERS TABLE ---------- */
  const userFields = [];
  const userParams = [];

  if (data.name !== undefined) {
    userFields.push("name = ?");
    userParams.push(data.name);
  }

  if (data.email !== undefined) {
    userFields.push("email = ?");
    userParams.push(data.email);
  }

  if (data.role !== undefined) {
    if (!["Staff", "CA", "HOD"].includes(data.role)) {
      throw new Error("Invalid faculty role");
    }
    userFields.push("role = ?");
    userParams.push(data.role);
  }

  if (data.dept_id !== undefined) {
    userFields.push("dept_id = ?");
    userParams.push(data.dept_id);
  }

  if (userFields.length > 0) {
    await db.execute(
      `
      UPDATE users
      SET ${userFields.join(", ")}
      WHERE user_id = ?
      `,
      [...userParams, user_id]
    );
  }

  /* ---------- STAFF TABLE ---------- */
  const staffFields = [];
  const staffParams = [];

  if (data.designation !== undefined) {
    staffFields.push("designation = ?");
    staffParams.push(data.designation);
  }

  if (data.dept_id !== undefined) {
    staffFields.push("dept_id = ?");
    staffParams.push(data.dept_id);
  }

  if (staffFields.length > 0) {
    await db.execute(
      `
      UPDATE staff
      SET ${staffFields.join(", ")}
      WHERE user_id = ?
      `,
      [...staffParams, user_id]
    );
  }

  return { user_id };
};


exports.deleteFaculty = async (user_id) => {
  await db.execute(
    `
    UPDATE users
    SET is_active = 0
    WHERE user_id = ?
    `,
    [user_id]
  );

  await db.execute(
    `
    UPDATE staff
    SET is_active = 0
    WHERE user_id = ?
    `,
    [user_id]
  );
};

