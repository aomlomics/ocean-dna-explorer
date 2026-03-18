import { Project } from "@/app/generated/prisma/client";
import Link from "next/link";
import Image from "next/image";

export default function ProjectGridItem({ item }: { item: Project }) {
	return (
		<Link
			href={`/explore/project/${encodeURIComponent(item.project_id)}`}
			key={item.project_id}
			className="card bg-base-200 hover:bg-base-300 transition-colors duration-200 aspect-square"
		>
			<div className="card-body p-1 lg:p-2 gap-0">
				<div className="w-full wrap-break-word mb-1 text-primary">{item.project_id}</div>

				<div className="grow border-t pt-1 relative flex items-center justify-center">
					{item.imageFileUrl_ODE ? (
						<Image
							src={item.imageFileUrl_ODE}
							alt={`Cover image for the ${item.project_id} project.`}
							fill
							objectFit="cover"
							className="rounded-md pt-2"
						/>
					) : (
						<>No Image</>
					)}
				</div>
			</div>
		</Link>
	);
}
