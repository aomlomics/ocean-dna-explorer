/** @type {import('next').NextConfig} */

module.exports = {
	experimental: {
		serverActions: {
			bodySizeLimit: "3mb",
		},
	},
	images: {
		remotePatterns: [{
			protocol: "https",
			hostname: "img.clerk.com",
			port: "",
			pathname: "**"
		}]
	}
}