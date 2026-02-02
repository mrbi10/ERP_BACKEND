const axios = require("axios");

exports.getAccessToken = async () => {
  const url = `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`;

  const params = new URLSearchParams();
  params.append("client_id", process.env.MS_CLIENT_ID);
  params.append("client_secret", process.env.MS_CLIENT_SECRET);
  params.append("scope", "https://graph.microsoft.com/.default");
  params.append("grant_type", "client_credentials");

  const response = await axios.post(url, params, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" }
  });

  return response.data.access_token;
};
