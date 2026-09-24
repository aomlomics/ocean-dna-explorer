import { ProjectIcon } from "@/app/components/icons";
import MySubmissionsSidebar from "@/app/components/mySubmissions/MySubmissionsSidebar";
import { prisma } from "@/app/helpers/prisma";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: {
		default: "My Submissions",
		template: "%s | My Submissions | ODE"
	}
};

export default async function MySubmissionsLayout({ children }: { children: ReactNode }) {
	const { userId } = await auth.protect();

	const projects = await prisma.project.findMany({
		where: {
			userIds: {
				has: userId
			}
		},
		select: {
			project_id: true,
			Analyses: {
				select: {
					analysis_run_name: true,
					trusted: true,
					_count: {
						select: {
							Libraries: {
								where: {
									Sample: {
										deleted_ODE: true
									}
								}
							}
						}
					}
				}
			},
			_count: {
				select: {
					Samples: {
						where: {
							deleted_ODE: true
						}
					}
				}
			}
		}
	});

	return (
		<div className="container mx-auto pt-4">
			<div className="mb-4 flex items-center gap-4">
				<div className="scale-150 pointer-events-none mb-0 mt-2.5 ml-2">
					<UserButton showName={false} />
				</div>
				<h1 className="text-4xl font-normal text-primary">My Submissions</h1>
			</div>

			{projects.length === 0 ? (
				<div className="card bg-base-200 shadow-sm min-h-65 h-fit hover:shadow-sm transition-shadow overflow-hidden">
					<div className="card-body">
						<p className="text-base text-base-content mb-6">No Projects found. Submit a new project to get started.</p>
						<div className="mt-auto">
							<Link href="/submit/project" className="btn btn-primary">
								Submit Project
							</Link>
						</div>
						<div className="absolute bottom-5 right-0 w-3/4 h-60 translate-x-1/3 translate-y-1/3">
							<ProjectIcon className="w-full h-full text-primary" />
						</div>
					</div>
				</div>
			) : (
				<div className="grid grid-cols-[25%_75%]">
					<div className="sticky top-5 self-start">
						<MySubmissionsSidebar projects={projects} />
					</div>

					<div className="pl-7 ml-2 border-l-2 border-base-300">{children}</div>
				</div>
			)}
		</div>
	);
}
