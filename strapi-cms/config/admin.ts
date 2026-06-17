export default ({ env }) => ({
  auth: {
    secret: env("ADMIN_JWT_SECRET", "doshomik-ielts-dev-admin-jwt-secret"),
  },
  apiToken: {
    salt: env("API_TOKEN_SALT", "doshomik-ielts-dev-api-token-salt"),
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT", "doshomik-ielts-dev-transfer-token-salt"),
    },
  },
});
