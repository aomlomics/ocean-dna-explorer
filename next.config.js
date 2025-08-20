/** @type {import('next').NextConfig} */

const blobHostname = process.env.BLOB_PUBLIC_HOSTNAME;

const remotePatterns = [
	{
		protocol: "https",
		hostname: "img.clerk.com",
		port: "",
		pathname: "**"
	}
];

if (blobHostname) {
	remotePatterns.push({
		protocol: "https",
		hostname: blobHostname,
		port: "",
		pathname: "/**"
	});
}

remotePatterns.push({
	protocol: "https",
	hostname: "rp5txgzsdmez0j3q.public.blob.vercel-storage.com",
	port: "",
	pathname: "/**"
});

module.exports = {
	experimental: {
		serverActions: {
			bodySizeLimit: "3mb",
		},
	},
	images: {
		remotePatterns
	}
}