const db = require("../config/db");
const fs = require("fs");
const path = require("path");
const onedrive = require("./onedrive.service");



// ================= CREATE ACTIVITY =================

exports.createActivity = async (user, data) => {
  console.log(user, data);
  const {
    activity_type_id,
    title,
    description,
    start_date,
    end_date
  } = data;

  const [result] = await db.query(
    `INSERT INTO student_activities
     (student_id, register_no, dept_id, class_id,
      activity_type_id, title, description, start_date, end_date)
     VALUES (?,?,?,?,?,?,?,?,?)`,
    [
      user.id,
      user.roll_no,
      user.dept_id,
      user.class_id,
      activity_type_id,
      title,
      description,
      start_date,
      end_date
    ]
  );

  return {
    activity_id: result.insertId,
    title,
    status: "PENDING"
  };
};

// ================= STUDENT VIEW =================

// exports.getMyActivities = async (studentId) => {
//   const [rows] = await db.query(
//     `SELECT sa.*, at.name AS activity_type
//      FROM student_activities sa
//      JOIN activity_types at ON at.activity_type_id = sa.activity_type_id
//      WHERE sa.student_id = ? AND sa.is_active = 1
//      ORDER BY sa.created_at DESC`,
//     [studentId]
//   );

//   return rows;
// };

exports.getMyActivities = async (studentId) => {
  const [rows] = await db.query(
    `
    SELECT 
      sa.*,
      at.name AS activity_type,
      COALESCE(
        JSON_ARRAYAGG(
          IF(
            af.file_id IS NULL,
            NULL,
            JSON_OBJECT(
              'file_id', af.file_id,
              'file_url', af.file_url,
              'file_type', af.file_type
            )
          )
        ),
        JSON_ARRAY()
      ) AS files
    FROM student_activities sa
    JOIN activity_types at 
      ON at.activity_type_id = sa.activity_type_id
    LEFT JOIN activity_files af 
      ON af.activity_id = sa.activity_id
      AND af.is_active = 1
    WHERE sa.student_id = ?
      AND sa.is_active = 1
    GROUP BY sa.activity_id
    ORDER BY sa.created_at DESC
    `,
    [studentId]
  );

  return rows;
};


// ================= ROLE BASED FETCH =================

// exports.getActivitiesForRole = async (user) => {
//   let where = [];
//   let params = [];

//   if (user.role === "CA") {
//     where.push("sa.dept_id = ?", "sa.class_id = ?");
//     params.push(user.dept_id, user.assigned_class_id);
//   } else if (user.role === "HOD") {
//     where.push("sa.dept_id = ?");
//     params.push(user.dept_id);
//   } else if (user.role === "Principal") {
//     // no scope filter
//   } else {
//     throw new Error("Unauthorized");
//   }

//   where.push("sa.status = 'PENDING'", "sa.is_active = 1");

//   const [rows] = await db.query(
//     `SELECT sa.*, at.name AS activity_type
//      FROM student_activities sa
//      JOIN activity_types at ON at.activity_type_id = sa.activity_type_id
//      WHERE ${where.join(" AND ")}
//      ORDER BY sa.created_at DESC`,
//     params
//   );

//   return rows;
// };

exports.getActivitiesForRole = async (user) => {
  let where = [];
  let params = [];

  if (user.role === "CA") {
    where.push("sa.dept_id = ?", "sa.class_id = ?");
    params.push(user.dept_id, user.assigned_class_id);
  } else if (user.role === "HOD") {
    where.push("sa.dept_id = ?");
    params.push(user.dept_id);
  } else if (user.role === "Principal") {
    // full access
  } else {
    throw new Error("Unauthorized");
  }

  where.push("sa.status = 'PENDING'", "sa.is_active = 1");

  const [rows] = await db.query(
    `
    SELECT 
      sa.*,
      s.name AS student_name,
      at.name AS activity_type,
      COALESCE(
        JSON_ARRAYAGG(
          IF(
            af.file_id IS NULL,
            NULL,
            JSON_OBJECT(
              'file_id', af.file_id,
              'file_url', af.file_url,
              'file_type', af.file_type
            )
          )
        ),
        JSON_ARRAY()
      ) AS files
    FROM student_activities sa
    JOIN students s 
      ON s.roll_no = sa.register_no
    JOIN activity_types at 
      ON at.activity_type_id = sa.activity_type_id
    LEFT JOIN activity_files af 
      ON af.activity_id = sa.activity_id 
      AND af.is_active = 1
    WHERE ${where.join(" AND ")}
    GROUP BY sa.activity_id, s.name, at.name
    ORDER BY sa.created_at DESC
    `,
    params
  );

  return rows;
};


// ================= GET ACTIVITY FILES =================

exports.getActivityFiles = async (user, activityId) => {
  let where = ["af.activity_id = ?", "af.is_active = 1"];
  let params = [activityId];

  if (user.role === "student") {
    where.push("sa.student_id = ?");
    params.push(user.id);
  } else if (user.role === "CA") {
    where.push("sa.dept_id = ?", "sa.class_id = ?");
    params.push(user.dept_id, user.assigned_class_id);
  } else if (user.role === "HOD") {
    where.push("sa.dept_id = ?");
    params.push(user.dept_id);
  } else if (user.role === "Principal") {
    // full access
  } else {
    throw new Error("Unauthorized");
  }

  const [rows] = await db.query(
    `SELECT af.file_id, af.file_url, af.file_type
     FROM activity_files af
     JOIN student_activities sa ON sa.activity_id = af.activity_id
     WHERE ${where.join(" AND ")}`,
    params
  );

  return rows;
};


// ================= VERIFY / REJECT =================

exports.verifyActivity = async (user, activityId, status, remarks) => {
  if (!["VERIFIED", "REJECTED"].includes(status)) {
    throw new Error("Invalid status");
  }

  const [result] = await db.query(
    `UPDATE student_activities
   SET status = ?,  remarks = ?, verified_by = ?, verified_at = NOW()
   WHERE activity_id = ?
     AND status = 'PENDING'
     AND is_active = 1`,
    [status, remarks, user.id, activityId]
  );

  if (result.affectedRows === 0) {
    throw new Error("Activity already processed or not found");
  }

  console.log("status", status);
  // audit log
  await db.query(
    `INSERT INTO activity_verification_logs
     (activity_id, action, action_by, remarks)
     VALUES (?,?,?,?)`,
    [activityId, status, user.id, remarks || null]
  );



  return { message: `Activity ${status.toLowerCase()}` };
};

// ================= ACTIVITY TYPES =================

exports.getActivityTypes = async () => {
  const [rows] = await db.query(
    `SELECT activity_type_id, name
     FROM activity_types
     WHERE is_active = 1
     ORDER BY name`
  );

  return rows;
};





// ================= UPDATE ACTIVITY =================

exports.updateActivity = async (user, activityId, data) => {
  const [activity] = await db.query(
    `SELECT status
     FROM student_activities
     WHERE activity_id = ?
       AND student_id = ?
       AND is_active = 1`,
    [activityId, user.user_id]
  );

  if (activity.length === 0) {
    throw new Error("Activity not found or unauthorized");
  }

  if (activity[0].status !== "REJECTED") {
    throw new Error("Only rejected activities can be edited");
  }

  const {
    title,
    description,
    start_date,
    end_date,
    activity_type_id
  } = data;

  await db.query(
    `UPDATE student_activities
     SET title = ?, description = ?, start_date = ?, end_date = ?, activity_type_id = ?, status = 'PENDING'
     WHERE activity_id = ?`,
    [
      title,
      description,
      start_date,
      end_date,
      activity_type_id,
      activityId
    ]
  );

  return { message: "Activity updated and resubmitted" };
};


// ================= DELETE ACTIVITY =================

exports.deleteActivity = async (user, activityId) => {
  const [result] = await db.query(
    `UPDATE student_activities
     SET is_active = 0
     WHERE activity_id = ?
       AND student_id = ?
       AND status = 'REJECTED'`,
    [activityId, user.user_id]
  );

  if (result.affectedRows === 0) {
    throw new Error("Only rejected activities can be deleted");
  }

  return { message: "Activity removed" };
};


exports.uploadAndAttachFile = async (user, activityId, file) => {
  if (!file) throw new Error("No file uploaded");

  // ownership + status check
  const [activity] = await db.query(
    `SELECT status
     FROM student_activities
     WHERE activity_id = ?
       AND student_id = ?
       AND is_active = 1`,
    [activityId, user.id]
  );

  if (activity.length === 0)
    throw new Error("Activity not found or unauthorized");

  // max 2 files rule
  const [count] = await db.query(
    `SELECT COUNT(*) AS total
     FROM activity_files
     WHERE activity_id = ? AND is_active = 1`,
    [activityId]
  );

  if (count[0].total >= 2)
    throw new Error("Maximum 2 files allowed");

  // upload to OneDrive
  const fileUrl = await onedrive.uploadToOneDrive(
    file.path,
    file.filename,
    user,
  );

  // save link
  await db.query(
    `INSERT INTO activity_files
     (activity_id, file_url, file_type)
     VALUES (?,?,?)`,
    [activityId, fileUrl, "PROOF"]
  );

  // cleanup temp file
  fs.unlinkSync(file.path);

  return {
    message: "File uploaded successfully",
    file_url: fileUrl
  };
};
