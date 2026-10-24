import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [".next/**", "dist/**", "coverage/**"] },
  ...tseslint.configs.recommended,
);
