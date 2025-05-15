import roleApplicationAction from "@/app/actions/roleApplication";
import { auth } from "@clerk/nextjs/server";

export default async function Contribute() {
	const { sessionClaims } = await auth();
	const roleApplication = sessionClaims?.metadata.roleApplication;

	const roleApplicationActionWithRole = roleApplicationAction.bind(null, "contributor");

	return (
		<main className="max-w-7xl mx-auto p-6">
			<div className="py-8 max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-start gap-6 md:gap-8 lg:gap-12">
				<div className="w-full md:max-w-xl lg:max-w-2xl">
					<h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-primary mb-4 md:mb-6">
						Looking to contribute?
					</h1>
					<p className="text-base md:text-lg text-base-content/80 leading-relaxed mb-4">
						Are you looking to contribute your data to Ocean DNA Explorer's growing collection? Sign up to be a
						Contributor now!
					</p>
					{roleApplication ? (
						<div>Thanks for applying!</div>
					) : (
						<form className="flex flex-col gap-5" action={roleApplicationActionWithRole}>
							<fieldset className="fieldset">
								<legend className="fieldset-legend">Why would you like to contribute?</legend>
								<textarea name="description" className="textarea textarea-primary h-24 w-full"></textarea>
								<div className="label">Optional</div>
							</fieldset>
							<button className="btn btn-primary">Apply now</button>
						</form>
					)}
				</div>
			</div>
		</main>
	);
}
