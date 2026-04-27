export async function GET(request: Request) {
	return new Response(
		`[
    {"user_agent": "prefetch-proxy", "disallow": true}
]`,
		{ headers: { "Content-Type": "application/trafficadvice+json" } }
	);
}
