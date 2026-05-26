import type { MetadataRoute } from "next";

const manifest = (): MetadataRoute.Manifest => ({
	name: "ChurchFlow",
	short_name: "ChurchFlow",
	description: "Record tithes, offerings, and giving for your church.",
	start_url: "/",
	scope: "/",
	display: "standalone",
	orientation: "portrait",
	background_color: "#ffffff",
	theme_color: "#ffffff",
	categories: ["finance", "productivity", "lifestyle"],
	icons: [
		{
			src: "/icons/icon-192.png",
			sizes: "192x192",
			type: "image/png",
			purpose: "any",
		},
		{
			src: "/icons/icon-512.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "any",
		},
		{
			src: "/icons/icon-maskable-512.png",
			sizes: "512x512",
			type: "image/png",
			purpose: "maskable",
		},
	],
});

export default manifest;
