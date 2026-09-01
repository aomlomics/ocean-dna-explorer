import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
	globalIgnores([
		"node_modules/**",
		".next/**",
		"out/**",
		"build/**",
		"next-env.d.ts",
		"app/generated/**",
		"prisma/generated/**",
		"prismaImages/generated/**"
	]),
	...nextCoreWebVitals,
	...nextTypescript,
	{
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/consistent-type-imports": "warn",
			"react-hooks/exhaustive-deps": "off",
			"react-hooks/set-state-in-effect": "warn"
		}
	}
]);

export default eslintConfig;
