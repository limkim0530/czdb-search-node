import { defineConfig } from 'eslint/config';
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default defineConfig({
    files: ["src/**/*.ts"],
    extends: [
        eslint.configs.recommended,
        ...tseslint.configs.recommendedTypeChecked,
        ...tseslint.configs.stylisticTypeChecked,
        {
            languageOptions: {
                parserOptions: {
                    projectService: true
                }
            }
        }
    ]
});
