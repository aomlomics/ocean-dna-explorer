import ThemeToggle from "./ThemeToggle";
import Link from "next/link";
import TabButton from "./TabButton";
import NodeLogo from "@/app/components/NodeLogo";
import User from "./User";
import TabDropdown from "./TabDropdown";
import { EXPLORE_ROUTES } from "@/types/objects";

export default function Header() {
	return (
		<header className="top-0 z-header bg-base-100 border-b-4 border-primary h-24">
			<div className="relative h-full flex justify-between items-center">
				{/* Logo section */}
				<div className="flex items-center">
					<Link className="px-4 sm:px-6 lg:px-8 normal-case text-xl pt-1 h-24 w-64 flex flex-col items-center" href="/">
						<div className="avatar w-full h-full relative">
							<NodeLogo
								alt="NODE Logo"
								fill={true}
								style={{ objectFit: "contain" }}
								priority={true}
								sizes="(max-width: 768px) 100vw, 33vw"
							/>
						</div>
						{/* <div className="h-8 w-48 relative -mt-5">
							<Image
								src="/images/NOAA_TEXT_LOGO_HORIZONTAL.png"
								alt="NOAA Text Logo"
								fill={true}
								style={{ objectFit: "contain" }}
							/>
						</div> */}
					</Link>
				</div>

				{/* Right side elements */}
				<div className="flex items-center gap-4">
					{/* Theme toggle and User profile should be aligned */}
					<div className="flex items-center gap-4">
						<ThemeToggle />
						<div className="mr-5 flex items-center">
							<User />
						</div>
					</div>

					{/* Rest of the tabs section */}
					<div className="absolute bottom-0 right-[240px] hidden lg:flex space-x-4">
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
						<TabButton tabName="Tourmaline" route="/tourmaline" />
						<TabButton tabName="API" route="/api" />
						<TabButton tabName="Help" route="/help" />
					</div>
				</div>
			</div>
		</header>
	);
}
