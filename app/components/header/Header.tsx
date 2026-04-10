import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import TabButton from "./TabButton";
import NodeLogo from "@/app/components/images/NodeLogo";
import User from "./User";
import { ExploreMegaMenu, SubmitMegaMenu, DocsMegaMenu, LearnMegaMenu, VisualizeMegaMenu } from "./MegaMenus";
import MobileMenu from "./MobileMenu";
import AdminButton from "./AdminButton";

export default async function Header() {
	return (
		<header className="navbar bg-base-100 border-b-4 border-primary h-20 xl:h-24 top-0 z-header relative overflow-visible">
			{/* Mobile hamburger menu + Logo */}
			<div className="navbar-start w-auto xl:w-1/2 pr-2 xl:pr-8">
				{/* Mobile hamburger dropdown */}
				<MobileMenu />

				{/* Logo */}
				<div className="flex items-center min-w-0">
					<Link
						className="px-2 xl:px-8 xl:ml-6 normal-case text-xl h-14 w-48 xl:h-22 xl:w-80 flex flex-col items-center justify-center shrink"
						href="/"
					>
						<div className="avatar w-44 h-12 xl:w-88 xl:h-22 relative">
							<NodeLogo
								alt="Ocean DNA Explorer Logo"
								fill={true}
								style={{ objectFit: "contain" }}
								priority={true}
								sizes="(max-width: 1280px) 100vw, 33vw"
							/>
						</div>
					</Link>
					<div className="bg-orange-500 text-white font-semibold rounded-md ml-2 xl:ml-8 text-xs px-3 py-1.5 leading-tight xl:px-4">
						BETA
					</div>
				</div>
			</div>

			{/* Desktop tabs - lg shows compact labels; xl is full size. Below lg, use the mobile menu. */}
			<div className="navbar-center hidden lg:flex self-end">
				<div className="flex items-end space-x-1 xl:space-x-4 z-dropdown -mb-2">
					<TabButton tabName="Home" route="/" />
					<ExploreMegaMenu />
					<TabButton tabName="Search" route="/search" />
					<VisualizeMegaMenu />
					<SubmitMegaMenu />
					{/* <TabButton tabName="Contribute" route="/contribute" /> */}
					<DocsMegaMenu />
					<LearnMegaMenu />
					<TabButton tabName="About" route="/about" />
				</div>
			</div>

			{/* Right side - theme toggle, user, admin */}
			<div className="navbar-end w-auto xl:w-1/2 ml-auto flex items-center gap-2 sm:gap-4">
				<AdminButton />
				<ThemeToggle />
				<div className="mr-2 sm:mr-5 flex items-center">
					<User />
				</div>
			</div>
		</header>
	);
}
