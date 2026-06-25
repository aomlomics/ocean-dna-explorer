import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
	schema: "prismaImages/schema.prisma",
	migrations: {
		path: "migrations"
	},
	datasource: {
		url: env("IMAGE_POSTGRES_PRISMA_URL")
	}
});
