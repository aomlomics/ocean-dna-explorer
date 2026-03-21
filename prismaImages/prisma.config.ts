import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
	schema: "prismaImages/schema.prisma",
	migrations: {
		path: "prismaImages/migrations"
	},
	datasource: {
		url: process.env.IMAGE_POSTGRES_PRISMA_URL
	}
});
