import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import TabButton from "./TabButton";
import NodeLogo from "@/app/components/images/NodeLogo";
import User from "./User";
import TabDropdown from "./TabDropdown";
import { EXPLORE_ROUTES, RolePermissions } from "@/types/objects";
import { auth } from "@clerk/nextjs/server";
import { Role } from "@/types/globals";

export default async function Header() {
	const { sessionClaims } = await auth();
	const role = sessionClaims?.metadata.role as Role;

	return (
		<header className="navbar bg-base-100 border-b-4 border-primary h-20 lg:h-24 top-0 z-header relative overflow-visible">
			{/* Mobile hamburger menu + Logo */}
			<div className="navbar-start">
				{/* Mobile hamburger dropdown */}
				<div className="dropdown">
					<div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
						<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
						</svg>
					</div>
					<ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100 rounded-box z-[1] mt-3 w-52 p-2 shadow">
						<li><Link href="/">Home</Link></li>
						<li>
							<details>
								<summary>Explore</summary>
								<ul className="p-2">
									{Object.entries(EXPLORE_ROUTES).map(([route, label]) => (
										<li key={route}><Link href={`/explore/${route}`}>{label}</Link></li>
									))}
								</ul>
							</details>
						</li>
						<li><Link href="/search">Search</Link></li>
						<li>
							<details>
								<summary>Submit</summary>
								<ul className="p-2">
									<li><Link href="/submit/project">Project</Link></li>
									<li><Link href="/submit/analysis">Analysis</Link></li>
								</ul>
							</details>
						</li>
						<li><Link href="/contribute">Contribute</Link></li>
						<li><Link href="/api">API</Link></li>
						<li><Link href="/help">Help</Link></li>
					</ul>
				</div>
				
				{/* Logo */}
				<Link className="px-1 sm:px-2 lg:px-8 lg:ml-6 normal-case text-xl h-14 w-56 sm:h-18 sm:w-64 lg:h-22 lg:w-80 flex flex-col items-center justify-center" href="/">
					<div className="avatar w-52 h-12 sm:w-60 sm:h-16 lg:w-88 lg:h-22 relative">
						<NodeLogo
							alt="NODE Logo"
							fill={true}
							style={{ objectFit: "contain" }}
							priority={true}
							sizes="(max-width: 768px) 100vw, 33vw"
						/>
					</div>
				</Link>
			</div>

			{/* Desktop tabs - absolute positioned to header bottom */}
			<div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 hidden lg:flex space-x-4 z-[9999]">
				<TabButton tabName="Home" route="/" />
				<TabDropdown
					tabName="Explore"
					route="/explore"
					dropdown={Object.entries(EXPLORE_ROUTES).map(([route, label]) => ({ label, href: `/explore/${route}` }))}
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
				<TabButton tabName="Contribute" route="/contribute" />
				<TabButton tabName="API" route="/api" />
				<TabButton tabName="Help" route="/help" />
			</div>

			{/* Right side - theme toggle, user, admin */}
			<div className="navbar-end flex items-center gap-4">
				{role && RolePermissions[role].includes("manageUsers") && (
					<Link href="/admin" className="btn hidden sm:inline-flex">
						Admin
					</Link>
				)}
				<ThemeToggle />
				<div className="mr-5 flex items-center">
					<User />
				</div>
			</div>
		</header>
	);
}
