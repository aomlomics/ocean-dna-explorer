import { MainStats, AssayStats } from "@/app/components/DataSummary";
import Link from "next/link";
import Image from "next/image";
import ThemeAwareLogo from "../components/images/ThemeAwareLogo";
import { publicPrisma } from "../helpers/prisma";
import { prismaImages } from "../helpers/prismaImages";
import Carousel from "../components/images/Carousel";
import Map from "@/app/components/map/Map";
import { Suspense } from "react";
import TopTaxonomiesSummary from "@/app/components/TopTaxonomiesSummary";

export default async function Home() {
	return <main className="relative flex flex-col grow bg-base-400 text-base-content"></main>;
}

async function SuspenseCarousel() {
	const carouselImages = await prismaImages.image.findMany({ include: { Attribution: true } });

	let currentIndex = carouselImages.length;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		let randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[carouselImages[currentIndex], carouselImages[randomIndex]] = [
			carouselImages[randomIndex],
			carouselImages[currentIndex]
		];
	}

	return <Carousel images={carouselImages} />;
}
