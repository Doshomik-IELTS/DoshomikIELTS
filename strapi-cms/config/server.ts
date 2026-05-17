export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  app: {
    keys: env.array("APP_KEYS", [
      "ielts-plus-plus-dev-app-key-1",
      "ielts-plus-plus-dev-app-key-2",
      "ielts-plus-plus-dev-app-key-3",
      "ielts-plus-plus-dev-app-key-4",
    ]),
  },
});
