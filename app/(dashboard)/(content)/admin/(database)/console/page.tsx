import PrismaConsole from "@/app/components/admin/PrismaConsole";
import { prisma } from "@/app/helpers/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "⚠️ Prisma Console ⚠️"
};

export default function AdminConsole() {
	return <PrismaConsole modelQueries={Object.keys(prisma.project)} />;
}
