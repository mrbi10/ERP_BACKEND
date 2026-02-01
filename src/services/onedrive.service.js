const axios = require("axios");
const fs = require("fs");
const auth = require("./onedrive.auth");

exports.uploadToOneDrive = async (filePath, fileName, user) => {
  const fileData = fs.readFileSync(filePath);
  const accessToken = await auth.getOneDriveAccessToken();

  const driveId = process.env.SHAREPOINT_DRIVE_ID;
  if (!driveId) {
    throw new Error("SHAREPOINT_DRIVE_ID missing");
  }

  // 🔥 Folder structure
  const folderPath = `ProfileHub/dept_${user.dept_id}/class_${user.class_id}/${user.roll_no}`;

  const uploadUrl =
    `https://graph.microsoft.com/v1.0/drives/${driveId}` +
    `/root:/${folderPath}/${fileName}:/content`;

  try {
    const res = await axios.put(uploadUrl, fileData, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/octet-stream"
      }
    });

    return res.data.webUrl;
  } catch (err) {
    console.error("OneDrive upload error:");
    console.error(err.response?.data || err);
    throw err;
  }
};
