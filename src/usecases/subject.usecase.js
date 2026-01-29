const subjectService = require("../services/subject.service");


/**
 * Create Subject
 */
exports.createSubject = async (req, res) => {
  try {
    const data = {
      ...req.body,
      created_by: req.user.user_id
    };

    const result = await subjectService.createSubject(data);
    res.status(201).json({ message: "Subject created", subject_id: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create subject" });
  }
};

/**
 * Get Subjects (role-aware)
 */
exports.getSubjects = async (req, res) => {
  try {
    const subjects = await subjectService.getSubjects({
      role: req.user.role,
      dept_id: req.query.dept_id || req.user.dept_id,
      class_id: req.query.class_id || req.user.assigned_class_id
    });

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch subjects" });
  }
};
  

/**
 * Update Subject
 */
exports.updateSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;
    const data = {
      ...req.body,
      updated_by: req.user.user_id
    };

    await subjectService.updateSubject(subject_id, data);
    res.json({ message: "Subject updated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update subject" });
  }
};

/**
 * Soft Delete Subject
 */
exports.deleteSubject = async (req, res) => {
  try {
    const { subject_id } = req.params;
    await subjectService.softDeleteSubject(subject_id, req.user.user_id);
    res.json({ message: "Subject deactivated" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete subject" });
  }
};
