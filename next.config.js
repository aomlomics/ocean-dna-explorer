/** @type {import('next').NextConfig} */

const remotePatterns = [
	{
		protocol: "https",
		hostname: "img.clerk.com",
		port: "",
		pathname: "**"
	},
	{
		protocol: "https",
		hostname: "*.public.blob.vercel-storage.com",
		port: "",
		pathname: "/**"
	}
];

module.exports = {
	experimental: {
		serverActions: {
			bodySizeLimit: "3mb"
		}
	},
	images: {
		remotePatterns
	},
	webpack: (config, { isServer }) => {
		if (isServer) {
			require("./sitemap-index");
			require("./prisma/seed");
		}

		return config;
	}
};
