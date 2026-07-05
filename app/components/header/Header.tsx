import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import TabButton from "./TabButton";
import NodeLogo from "@/app/components/images/NodeLogo";
import User from "./User";
import { ExploreMegaMenu, SubmitMegaMenu, DocsMegaMenu, LearnMegaMenu, VisualizeMegaMenu } from "./MegaMenus";
import MobileMenu from "./MobileMenu";
import AdminButton from "./AdminButton";

export default async function Header() {
	// z-header + relative: navbar is a stacking context above page content, so its menus render over the page below
	return (
		<header className="navbar bg-base-100 border-b-4 border-primary h-20 xl:h-24 top-0 z-header relative overflow-visible">
			{/* Mobile hamburger menu + Logo */}
			<div className="navbar-start w-auto shrink-0 min-w-0 pr-2 md:pr-3 xl:pr-6">
				{/* Mobile hamburger dropdown */}
				<MobileMenu />

				{/* Logo */}
				<div className="flex items-center min-w-0">
					<Link
						className="px-2 md:px-3 xl:px-8 md:ml-2 xl:ml-6 normal-case text-xl h-16 w-56 md:w-64 xl:h-22 xl:w-80 flex flex-col items-center justify-center shrink"
						href="/"
					>
						<div className="avatar w-52 h-14 md:w-60 md:h-14 xl:w-88 xl:h-22 relative">
							<NodeLogo
								alt="Ocean DNA Explorer Logo"
								fill={true}
								style={{ objectFit: "contain" }}
								priority={true}
								sizes="(max-width: 1280px) 100vw, 33vw"
							/>
						</div>
					</Link>
					<div className="bg-orange-500 text-white font-semibold rounded-md ml-2 md:ml-3 xl:ml-8 text-[10px] md:text-[11px] xl:text-xs px-2.5 md:px-3 xl:px-4 py-1 md:py-1.5 leading-tight">
						BETA
					</div>
				</div>
			</div>

			{/* Desktop tabs - lg shows compact labels; xl is full size. Below lg, use the mobile menu. */}
			<div className="navbar-center hidden lg:flex flex-1 min-w-0 justify-center self-end px-2 xl:px-4">
				<div className="flex w-full max-w-4xl items-end justify-center gap-1.5 xl:gap-3 z-menu -mb-2">
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
			<div className="navbar-end w-auto shrink-0 ml-auto pl-2 md:pl-3 xl:pl-6 flex items-center gap-2 sm:gap-3 xl:gap-4">
				<AdminButton />
				<ThemeToggle />
				<div className="mr-2 sm:mr-5 flex items-center">
					<User />
				</div>
			</div>
		</header>
	);
}
