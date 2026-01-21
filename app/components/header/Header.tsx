import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import TabButton from "./TabButton";
import NodeLogo from "@/app/components/images/NodeLogo";
import User from "./User";
import TabDropdown from "./TabDropdown";
import MobileMenu from "./MobileMenu";
import { RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@/types/globals";
import { Prisma } from "@/app/generated/prisma/client";
import TableMetadata, { DataTableNames } from "@/types/tableMetadata";
import { uncapitalizeTable } from "@/app/helpers/utils";

export default async function Header() {
	const { sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role as Role;

	return (
		<header className="navbar bg-base-100 border-b-4 border-primary h-20 lg:h-24 top-0 z-header relative overflow-visible">
			{/* Mobile hamburger menu + Logo */}
			<div className="navbar-start w-auto xl:w-1/2 pr-2 sm:pr-6 xl:pr-8">
				{/* Mobile hamburger dropdown */}
				<MobileMenu />

				{/* Logo */}
				<div className="flex items-center min-w-0">
					<Link
						className="px-1 sm:px-2 lg:px-8 lg:ml-6 normal-case text-xl h-14 w-48 sm:h-18 sm:w-64 lg:h-22 lg:w-80 flex flex-col items-center justify-center shrink"
						href="/"
					>
						<div className="avatar w-44 h-12 sm:w-60 sm:h-16 lg:w-88 lg:h-22 relative">
							<NodeLogo
								alt="Ocean DNA Explorer Logo"
								fill={true}
								style={{ objectFit: "contain" }}
								priority={true}
								sizes="(max-width: 768px) 100vw, 33vw"
							/>
						</div>
					</Link>
					<div className="bg-orange-500 text-white font-semibold rounded-md ml-1 sm:ml-2 lg:ml-8 text-[clamp(9px,2.6vw,12px)] px-[clamp(6px,2vw,12px)] py-[clamp(2px,0.9vw,4px)] leading-none sm:text-xs sm:px-3 sm:py-1.5 sm:leading-tight lg:px-4">
						BETA
					</div>
				</div>
			</div>

			{/* Desktop tabs - centered between logo and user controls and aligned to bottom */}
			<div className="navbar-center hidden xl:flex self-end">
				<div className="flex items-end space-x-4 z-dropdown -mb-2">
					<TabButton tabName="Home" route="/" />
					<TabDropdown
						tabName="Explore"
						route="/explore"
						dropdown={DataTableNames.map((table) => ({
							label: TableMetadata[table as Prisma.ModelName].plural,
							href: `/explore/${uncapitalizeTable(table as Prisma.ModelName)}`
						}))}
					/>
					<TabButton tabName="Search" route="/search" />
					<TabDropdown
						tabName="Submit"
						route="/submit"
						dropdown={[
							{ label: "Project", href: "/submit/project" },
							{ label: "Analysis", href: "/submit/analysis" }
						]}
					/>
					{/* <TabButton tabName="Contribute" route="/contribute" /> */}
					<TabButton tabName="API" route="/api" />
					<TabButton tabName="Help" route="/help" />
				<TabButton tabName="About" route="/about" />
				</div>
			</div>

			{/* Right side - theme toggle, user, admin */}
			<div className="navbar-end w-auto xl:w-1/2 ml-auto flex items-center gap-2 sm:gap-4">
				{role && RolePermissions[role].includes("manageUsers") && (
					<Link href="/admin" className="btn hidden sm:inline-flex">
						Admin
					</Link>
				)}
				<ThemeToggle />
				<div className="mr-2 sm:mr-5 flex items-center">
					<User />
				</div>
			</div>
		</header>
	);
}
