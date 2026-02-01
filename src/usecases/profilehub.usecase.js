const service = require("../services/profilehub.services");
const { logActivity } = require("../services/activityLog.service");

const fs = require("fs");
const path = require("path");

// ================= MASTER =================

exports.getActivityTypes = async (req, res) => {
    try {
        const data = await service.getActivityTypes();
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// ================= STUDENT =================

exports.createActivity = async (req, res) => {
    try {
        const activity = await service.createActivity(req.user, req.body);

        await logActivity({
            req,
            user_id: req.user.user_id,
            action: "CREATE_ACTIVITY",
            description: `Created activity ${activity.activity_id}`
        });

        res.status(201).json(activity);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getMyActivities = async (req, res) => {
    try {
        const data = await service.getMyActivities(req.user.id);
        res.json(data);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.updateActivity = async (req, res) => {
    try {
        const result = await service.updateActivity(
            req.user,
            req.params.activityId,
            req.body
        );

        await logActivity({
            req,
            user_id: req.user.user_id,
            action: "UPDATE_ACTIVITY",
            description: `Updated rejected activity ${req.params.activityId}`
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteActivity = async (req, res) => {
    try {
        const result = await service.deleteActivity(
            req.user,
            req.params.activityId
        );

        await logActivity({
            user_id: req.user.user_id,
            action: "DELETE_ACTIVITY",
            description: `Deleted activity ${req.params.activityId}`
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// ================= FILES =================

exports.getActivityFiles = async (req, res) => {
    try {
        const data = await service.getActivityFiles(
            req.user,
            req.params.activityId
        );
        res.json(data);
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

// ================= REVIEW =================

exports.getActivitiesForReview = async (req, res) => {
    try {
        const data = await service.getActivitiesForRole(req.user);
        res.json(data);
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.verifyActivity = async (req, res) => {
    try {
        const result = await service.verifyActivity(
            req.user,
            req.params.activityId,
            req.body.status,
            req.body.remarks
        );

        await logActivity({
            user_id: req.user.user_id,
            action: "VERIFY_ACTIVITY",
            description: `Activity ${req.params.activityId} ${req.body.status}`
        });

        res.json(result);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};


exports.uploadActivityFile = async (req, res) => {
  try {
    const result = await service.uploadAndAttachFile(
      req.user,
      req.params.activityId,
      req.file
    );

    res.status(201).json(result);
  } catch (err) {
    console.error("UPLOAD FAILED:", err.response?.data || err);

    res.status(err.response?.status || 500).json({
      message: err.message,
      details: err.response?.data || null
    });
  }
};

