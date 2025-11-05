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
    // ignore generated prisma client and runtime artifacts which are not meant to be linted
    "prisma/generated/**",
    "prisma/**/generated/**",
    // ignore prisma client wasm/runtime files
    "prisma/**/runtime/**",
    // optional: ignore server build outputs or artifacts
    "server/**/dist/**",
  ]),
  // Project-specific overrides: relax some TypeScript rules for backend and API files
  {
    files: ["server/**", "src/**", "prisma/**"],
    rules: {
      // the codebase contains several `any` usages intentionally for rapid development and
      // some generated code; relax this rule for those areas to reduce noisy errors.
      "@typescript-eslint/no-explicit-any": "off"
    }
  }
]);

export default eslintConfig;
