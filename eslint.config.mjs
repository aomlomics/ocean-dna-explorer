/** @type { import("eslint").Linter.Config[] } */
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
	...nextCoreWebVitals,
	...nextTypescript,
	{
		ignores: [
			"node_modules/**",
			".next/**",
			"out/**",
			"build/**",
			"next-env.d.ts",
			"app/generated/**",
			"app/prisma/generated/**",
			"app/prismaImages/generated/**"
		],
		rules: {
			"@typescript-eslint/no-explicit-any": "off",
			"react-hooks/exhaustive-deps": "off"
		}
	}
];

export default eslintConfig;
