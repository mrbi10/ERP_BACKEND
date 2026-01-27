const service = require("./announcement.service");

exports.getAnnouncements = async (req, res) => {
  try {
    const rows = await service.getAnnouncements(req.user);
    res.json(rows);
  } catch (err) {
    console.error("GET announcements error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.createAnnouncement = async (req, res) => {
  try {
    const id = await service.createAnnouncement(req.user, req.body);
    res.json({ message: "Announcement posted successfully", id });
  } catch (err) {
    console.error("POST announcement error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    await service.updateAnnouncement(req.user, req.params.id, req.body);
    res.json({ message: "Updated successfully" });
  } catch (err) {
    console.error("PATCH announcement error:", err);
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    await service.deleteAnnouncement(req.user, req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("DELETE announcement error:", err);
    res.status(500).json({ message: err.message });
  }
};
