/** @type {import('next').NextConfig} */

const remotePatterns = [
	{
		protocol: "https",
		hostname: "img.clerk.com",
		port: "",
		pathname: "/**"
	},
	{
		protocol: "https",
		hostname: "*.public.blob.vercel-storage.com",
		port: "",
		pathname: "/**"
	},
	{
		protocol: "https",
		hostname: "images.phylopic.org",
		port: "",
		pathname: "/**"
	},
	{
		protocol: "https",
		hostname: "wsrv.nl",
		port: "",
		pathname: "/**"
	},
	{
		protocol: "https",
		hostname: "inaturalist-open-data.s3.amazonaws.com",
		port: "",
		pathname: "/photos/**"
	}
];

const securityHeaders = [
	{
		key: "X-Content-Type-Options",
		value: "nosniff"
	},
	{
		key: "Referrer-Policy",
		value: "strict-origin-when-cross-origin"
	},
	{
		key: "X-Frame-Options",
		value: "DENY"
	},
	{
		key: "Permissions-Policy",
		value: [
			"fullscreen=(self)",
			"camera=()",
			"microphone=()",
			"geolocation=()",
			"payment=()",
			"usb=()",
			"bluetooth=()",
			"serial=()",
			"hid=()",
			"midi=()",
			"magnetometer=()",
			"gyroscope=()",
			"accelerometer=()",
			"display-capture=()",
			"local-fonts=()",
			"screen-wake-lock=()",
			"xr-spatial-tracking=()"
		].join(", ")
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
	poweredByHeader: false,
	async headers() {
		return [
			{
				source: "/(.*)",
				headers: securityHeaders
			}
		];
	}
};
