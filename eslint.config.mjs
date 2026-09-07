import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
export default defineConfig([
  ...nextVitals,
  { rules: {
    // Existing forms intentionally initialize local editor state in effects.
    "react-hooks/set-state-in-effect": "off",
    "react-hooks/refs": "warn",
    "react-hooks/purity": "warn",
    "react/no-unescaped-entities": "warn",
  } },
  globalIgnores([".next/**", "node_modules/**", "public/**"]),
]);
