import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "Ocean DNA Explorer",
		short_name: "ODE",
		description: "An ocean environmental DNA data sharing platform, search engine, and visualization tool",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#ffffff",
		icons: [
			{
				src: "/android-chrome-192x192.png",
				sizes: "192x192",
				type: "image/png"
			},
			{
				src: "/android-chrome-512x512.png",
				sizes: "512x512",
				type: "image/png"
			}
		]
	};
}
