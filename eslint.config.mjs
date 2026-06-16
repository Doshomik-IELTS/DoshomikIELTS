import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "strapi-cms/**",
    "design_X/**",
  ]),
  // Allow common React patterns - disable strict rules that flag safe patterns
  {
    rules: {
      // Allow setState in useEffect - common pattern for syncing fetched data to form state
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);

export default eslintConfig;
