import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config({
  files: ["src/*.ts"],
  extends: [
    js.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir: import.meta.dirname,
        },
      }
    }
  ]
});