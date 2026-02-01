const axios = require("axios");

exports.getOneDriveAccessToken = async () => {
  const { TENANT_ID, CLIENT_ID, CLIENT_SECRET } = process.env;

  const tokenUrl = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "client_credentials",
    scope: "https://graph.microsoft.com/.default"
  });

  const res = await axios.post(tokenUrl, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  return res.data.access_token;
};
