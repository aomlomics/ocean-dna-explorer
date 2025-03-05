import Link from "next/link";
import UnderConstruction from "@/app/components/UnderConstruction";
import SchemaDisplay from "@/app/components/SchemaDisplay";

export default function Api() {
	return (
		<main className="flex flex-col grow p-8 max-w-7xl mx-auto space-y-10">
			<SchemaDisplay />
			{/* API Introduction Section */}
			<section className="relative">
				<div className="text-center space-y-6 relative z-10">
					<h1 className="text-6xl font-semibold text-primary tracking-tight">API Usage</h1>
					<div className="max-w-3xl mx-auto space-y-4 text-lg text-base-content/90">
						<p>
							Access NODE's comprehensive eDNA datasets programmatically through a RESTful API. Build applications,
							conduct analyses, and integrate environmental DNA data directly into your research workflow using your
							preferred programming language.
						</p>
						<p className="font-bold">GET requests only.</p>
					</div>
				</div>
				<div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10 rounded-3xl"></div>
			</section>

			{/* Quick Start Guide */}
			<section className="relative">
				<div className="absolute left-0 top-10 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
				{/* <h2 className="text-3xl text-primary mb-12 text-center">Implementation Guide</h2> */}
				<h2 className="text-3xl text-primary mb-20 text-center"></h2>
				<div className="grid md:grid-cols-3 gap-12">
					<div className="relative">
						<div className="text-7xl font-bold text-primary/20 absolute -top-8 -left-4">1</div>
						<div className="relative z-10 mt-8">
							<h3 className="text-xl font-semibold mb-3">Authentication</h3>
							<p className="text-base-content/80 leading-relaxed">
								Generate your API key through the dashboard. This unique identifier enables secure access to NODE's data
								endpoints.
							</p>
						</div>
					</div>
					<div className="relative">
						<div className="text-7xl font-bold text-primary/20 absolute -top-8 -left-4">2</div>
						<div className="relative z-10 mt-8">
							<h3 className="text-xl font-semibold mb-3">Request Formation</h3>
							<p className="text-base-content/80 leading-relaxed">
								Structure HTTP requests with your API key and desired parameters to query specific datasets or subsets.
							</p>
						</div>
					</div>
					<div className="relative">
						<div className="text-7xl font-bold text-primary/20 absolute -top-8 -left-4">3</div>
						<div className="relative z-10 mt-8">
							<h3 className="text-xl font-semibold mb-3">Data Integration</h3>
							<p className="text-base-content/80 leading-relaxed">
								Process JSON responses containing standardized eDNA data ready for integration into your analysis
								pipeline.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Code Example */}
			<section className="bg-base-200/50 rounded-2xl p-8 backdrop-blur-sm border border-base-300">
				<h2 className="text-2xl text-primary mb-6">Example Implementation</h2>
				<div className="grid md:grid-cols-2 gap-8">
					<div className="space-y-4">
						<p className="text-base-content/80 leading-relaxed">
							Retrieve eDNA samples from specific locations or time periods using our RESTful endpoints. The example
							shows a basic query for samples with taxonomic filtering.
						</p>
						<div className="space-y-2">
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-primary"></div>
								<span className="text-sm text-base-content/70">Returns JSON formatted data</span>
							</div>
							<div className="flex items-center gap-2">
								<div className="w-2 h-2 rounded-full bg-primary"></div>
								<span className="text-sm text-base-content/70">
									Can be accessed using your preferred programming language
								</span>
							</div>
						</div>
					</div>
					<div className="bg-base-300 p-6 rounded-xl -mt-16 font-mono text-sm shadow-inner">
						<p className="text-primary">GET https://api.node.org/v1/samples</p>
						<p className="text-base-content/70 mt-4">Headers:</p>
						<p className="text-base-content ml-4">Authorization: Bearer YOUR_API_KEY</p>
						<p className="text-base-content">Content-Type: application/json</p>
						<p className="text-base-content/70 mt-4">Query Parameters:</p>
						<p className="text-base-content ml-4">taxonomy=Salmonidae&limit=100</p>
					</div>
				</div>
			</section>
		</main>
	);
}
