export async function GET() {
	return new Response(
		`[
    {"user_agent": "prefetch-proxy", "disallow": true}
]`,
		{ headers: { "Content-Type": "application/trafficadvice+json" } }
	);
}
