export default ({ env }) => ({
  auth: {
    secret: env("ADMIN_JWT_SECRET", "ielts-plus-plus-dev-admin-jwt-secret"),
  },
  apiToken: {
    salt: env("API_TOKEN_SALT", "ielts-plus-plus-dev-api-token-salt"),
  },
  transfer: {
    token: {
      salt: env("TRANSFER_TOKEN_SALT", "ielts-plus-plus-dev-transfer-token-salt"),
    },
  },
});
