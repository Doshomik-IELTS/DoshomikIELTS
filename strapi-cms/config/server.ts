export default ({ env }) => ({
  host: env("HOST", "0.0.0.0"),
  port: env.int("PORT", 1337),
  app: {
    keys: env.array("APP_KEYS", [
      "doshomik-ielts-dev-app-key-1",
      "doshomik-ielts-dev-app-key-2",
      "doshomik-ielts-dev-app-key-3",
      "doshomik-ielts-dev-app-key-4",
    ]),
  },
});
