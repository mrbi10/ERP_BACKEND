const facultyService = require("../services/faculty.service");

exports.getFacultyList = async (req, res) => {
  try {
    const data = await facultyService.getFacultyList(req);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFacultyById = async (req, res) => {
  try {
    const data = await facultyService.getFacultyById(req.params.user_id);
    res.json({ success: true, data });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

exports.createFaculty = async (req, res) => {
  try {
    const data = await facultyService.createFaculty(req.body);
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateFaculty = async (req, res) => {
  try {
    const data = await facultyService.updateFaculty(
      req.params.user_id,
      req.body
    );
    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteFaculty = async (req, res) => {
  try {
    await facultyService.deleteFaculty(req.params.user_id);
    res.json({ success: true, message: "Faculty removed" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
