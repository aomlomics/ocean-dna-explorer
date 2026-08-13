/** @type { import("eslint").Linter.Config[] } */
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import { globalIgnores } from "eslint/config";

const eslintConfig = [
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
			"react-hooks/exhaustive-deps": "off",
			"react-hooks/set-state-in-effect": "warn"
		}
	}
];

export default eslintConfig;
