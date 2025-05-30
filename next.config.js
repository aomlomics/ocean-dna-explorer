/** @type {import('next').NextConfig} */

module.exports = {
	experimental: {
		serverActions: {
			bodySizeLimit: "3mb",
		},
	},
}