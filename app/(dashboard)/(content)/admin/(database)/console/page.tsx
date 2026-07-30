import PrismaConsole from "@/app/components/PrismaConsole";
import { prisma } from "@/app/helpers/prisma";

export default function AdminConsole() {
	return <PrismaConsole modelQueries={Object.keys(prisma.project)} />;
}
