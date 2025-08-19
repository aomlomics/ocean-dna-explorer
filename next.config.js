/** @type {import('next').NextConfig} */

module.exports = {
	experimental: {
		serverActions: {
			bodySizeLimit: "3mb",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "img.clerk.com",
				port: "",
				pathname: "**"
			},
			{
				protocol: "https",
				hostname: "8on96ohcebg9je95.public.blob.vercel-storage.com",
				port: "",
				pathname: "/**"
			}
		]
	}
}