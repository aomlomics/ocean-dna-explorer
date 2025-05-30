import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: "ODE",
		short_name: "ODE",
		description: "Ocean DNA Explorer",
		start_url: "/",
		display: "standalone",
		background_color: "#ffffff",
		theme_color: "#ffffff",
		icons: [
			{
				src: "/icon.png",
				sizes: "any",
				type: "image/png"
			},
			{
				src: "/icon.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable"
			},
			{
				src: "/icon.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "maskable"
			}
		]
	};
}
