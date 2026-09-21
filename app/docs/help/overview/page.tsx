import DocsPageSection from "@/app/components/docs/DocsPageSection";
import { TrustedShieldIcon } from "@/app/components/home/HomeTrustedIndicator";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Overview | Help",
	description:
		"Learn about Ocean DNA Explorer's features, login system, submissions manager, bug reports, and frequently asked questions."
};

export default function HelpOverviewPage() {
	return (
		<DocsPageSection
			page="help"
			section="overview"
			header={
				<>
					<p className="mb-4">
						The Ocean DNA Explorer is a data portal and visualization platform for uploading and exploring marine eDNA
						data.
					</p>
					<p className="mb-4">
						Our goal is to make marine eDNA data more findable, accessible, interoperable, and reusable for researchers,
						policymakers, and to the public.
					</p>
				</>
			}
			subsections={[
				{
					id: "features-overview",
					title: "Features Overview",
					content: (
						<>
							<ul className="list-disc ml-6 mb-4">
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/explore">
										Explore
									</Link>{" "}
									projects, samples, analyses, features, and taxonomies with filters and a graphical user interface
								</li>
								<li>
									Leverage the{" "}
									<Link className="link link-primary font-semibold" href="/api">
										API
									</Link>{" "}
									to access data programmatically
								</li>
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/search">
										Search
									</Link>{" "}
									across datasets using powerful query capabilities
								</li>
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/visualize">
										Visualize
									</Link>{" "}
									data by making charts directly in your browser
								</li>
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/learn">
										Learn
									</Link>{" "}
									about the eDNA data journey
								</li>
								<li>
									{" "}
									<Link className="link link-primary font-semibold" href="/submit">
										Submit
									</Link>{" "}
									your own data in standardized formats
								</li>
								<li>Download existing datasets via the API or individual Explore pages</li>
							</ul>
						</>
					)
				},
				{
					id: "trusted-vs-untrusted-data",
					title: "Trusted vs Untrusted Data",
					content: (
						<>
							<p className="mb-4">
								ODE can show only reviewed analyses, or every analysis (and their associated Taxonomies, Samples, Occurrences, etc.) in the database. Switch the data presented to you with the shield in the
								header, or with the persistent menu in the bottom-left corner of every page.
							</p>
							<div className="mb-4 flex items-start gap-3">
								<TrustedShieldIcon trusted className="mt-0.5 h-6 w-6 shrink-0 fill-current text-primary" />
								<p className="mb-0">
									<strong>Trusted data</strong> (default) includes only analyses that have been reviewed for contamination, noise, and other potential causes of innacurate identifications.
								</p>
							</div>
							<div className="mb-4 flex items-start gap-3">
								<TrustedShieldIcon trusted={false} className="mt-0.5 h-6 w-6 shrink-0 fill-current text-primary" />
								<p className="mb-0">
									<strong>All data</strong> includes everything submitted to the database.
								</p>
							</div>
							<p className="mb-4">
								The data presented to you will change when you use the Trusted toggle: the points on maps, the numbers in the data cards, the data
								points on visualizations, the results of your searches, and the rows of data on Explore pages.
							</p>
							<p className="mb-4">
								eDNA often picks up contamination, so unreviewed analyses can include false detections. Trusted mode
								hides those until they have been checked. A real example: the human and turkey DNA identified in a particular project was likely caused by the scientist having a turkey sandwich for lunch!
							</p>
						</>
					)
				},
				{
					id: "login-and-roles",
					title: "Login and Roles",
					content: (
						<>
							<p className="mb-4">
								ODE requires login to access certain features of the platform, like submitting data.
							</p>
							<p className="mb-4">
								You can login using the Sign-In button in the top right corner of the website. Your personal data is not
								stored in our database. Authentication is handled by Clerk, a user management platform. You can delete
								your account by clicking your profile picture in the top right corner of the website, then clicking
								Manage Account ❯ Security ❯ Delete Account.
							</p>
							<p className="mb-4">
								Contributor is required to submit data. The other roles are mostly for internal use by the ODE team:
							</p>
							<ul className="list-disc ml-6 mb-4">
								<li>Admin: Full access to the platform, including managing other user&apos;s roles</li>
								<li>Moderator: Similar to admin, except they cannot manage Admin&apos;s roles</li>
								<li>
									Contributor: Allows you to submit data to the platform, and to access the Submissions Manager to view,
									delete, or edit your own submissions. Click{" "}
									<Link className="link link-primary font-bold" href="/contribute">
										HERE
									</Link>{" "}
									to request to be a Contributor.
								</li>
								<li>
									Non-signed in User: View datasets, query the API, browse the Explore pages, and use the Search
									page{" "}
								</li>
							</ul>
						</>
					)
				},
				{
					id: "submissions-manager",
					title: "Submissions Manager",
					content: (
						<>
							<p className="mb-4">
								If you have any role (Contributor or higher), you can access the Submissions Manager.
							</p>
							<p className="mb-4">
								To find it, click your profile picture in the top right corner of the website, and then click My
								Submissions in the dropdown.
							</p>
							<p className="mb-4">The Submissions Manager lets you:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>View all of your submitted projects and analyses</li>
								<li>Delete any of your submissions</li>
								<li>Edit your submissions (change values without a re-upload)</li>
							</ul>
						</>
					)
				},
				{
					id: "contact-us",
					title: "Contact Us, Report a Bug, Request a Feature",
					content: (
						<>
							<p className="mb-4">
								You can submit bug reports, feature requests, or general feedback through our GitHub issues page:
							</p>
							<p className="mb-4">
								<Link
									href="https://github.com/aomlomics/node/issues"
									className="text-primary hover:underline"
									target="_blank"
								>
									Ocean DNA Explorer GitHub Issues
								</Link>
							</p>
							<p className="mb-4">When reporting bugs, please include:</p>
							<ul className="list-disc ml-6 mb-4">
								<li>A clear description of the issue</li>
								<li>Steps to reproduce the problem</li>
								<li>What you expected to happen</li>
								<li>What actually happened</li>
								<li>Screenshots if applicable</li>
							</ul>
						</>
					)
				},
				{
					id: "help-faq",
					title: "FAQ",
					content: (
						<>
							<div className="space-y-4">
								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do I submit data / become a Contributor?</div>
									<div className="collapse-content">
										<p>
											Submitting data requires you to have the role of Contributor. You can request this role{" "}
											<Link className="link link-primary" href="/contribute">
												here
											</Link>
											.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do I use the API?</div>
									<div className="collapse-content">
										<p>
											The API has a dedicated{" "}
											<Link className="link link-primary" href="/api">
												documentation page
											</Link>
											, or you can use the Explore page to view the data through the website.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do I contact the Ocean DNA Explorer team?</div>
									<div className="collapse-content">
										<p>
											Please contact us via the{" "}
											<Link className="link link-primary" href="https://github.com/aomlomics/node/issues">
												GitHub issues page
											</Link>
											.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">Can I download the entire database?</div>
									<div className="collapse-content">
										<p>
											While individual datasets can be downloaded, we currently don&apos;t provide a bulk download of
											the entire database. For large-scale data access, please contact us to discuss your needs.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do I cite data from the Ocean DNA Explorer?</div>
									<div className="collapse-content">
										<p>
											Each project has a project_contact, recordedBy, institution, and institutionID, which can be used
											to cite the project.
										</p>
									</div>
								</div>

								<div className="collapse collapse-arrow bg-base-200/50">
									<input type="checkbox" />
									<div className="collapse-title font-medium">How do you protect our personal data?</div>
									<div className="collapse-content">
										<p>
											There is no personal data stored in the Ocean DNA Explorer database. User authentication is
											handled by the platform&apos;s reputable authentication provider, Clerk, and all data is stored in
											a secure database.
										</p>
									</div>
								</div>
							</div>
						</>
					)
				}
			]}
		/>
	);
}
