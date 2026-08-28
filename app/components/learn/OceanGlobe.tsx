// Based on code from Eldora UI (https://github.com/karthikmudunuri/eldoraui)
// Licensed under the MIT License.
// Copyright (c) 2024 Karthik Mudunuri

"use client";

import createGlobe from "cobe";
import { useEffect, useRef, useCallback } from "react";
import { useTheme } from "next-themes";

// Ocean sampling locations - clustered groups representing eDNA sampling regions
const baseOceanMarkers: [number, number][] = [
	// North Atlantic cluster (Grand Banks / Gulf Stream)
	[42.0, -50.0],
	[40.0, -48.0],
	[43.5, -52.0],
	[38.0, -55.0],
	[44.0, -47.0],
	[39.0, -51.0],

	// Caribbean / Gulf of Mexico cluster
	[24.0, -88.0],
	[22.0, -85.0],
	[26.0, -90.0],
	[18.0, -65.0],
	[20.0, -68.0],
	[25.0, -83.0],
	[21.0, -87.0],
	[19.0, -62.0],

	// Sargasso Sea area
	[28.0, -70.0],
	[30.0, -67.0],
	[26.0, -72.0],
	[32.0, -65.0],

	// South Atlantic
	[-32.0, -15.0],
	[-35.0, -12.0],
	[-30.0, -18.0],
	[-38.0, -10.0],

	// Equatorial Atlantic
	[5.0, -25.0],
	[8.0, -22.0],
	[2.0, -28.0],
	[-2.0, -20.0],

	// North Pacific cluster (Hawaii region)
	[22.0, -158.0],
	[20.0, -155.0],
	[24.0, -160.0],
	[19.0, -157.0],
	[23.0, -154.0],
	[21.0, -162.0],

	// Central Pacific cluster
	[0.0, -170.0],
	[-3.0, -168.0],
	[3.0, -172.0],
	[-5.0, -175.0],
	[5.0, -165.0],
	[2.0, -178.0],

	// North Pacific Gyre
	[35.0, -145.0],
	[33.0, -140.0],
	[37.0, -142.0],
	[31.0, -148.0],
	[39.0, -138.0],

	// South Pacific cluster
	[-18.0, -150.0],
	[-15.0, -148.0],
	[-20.0, -152.0],
	[-22.0, -145.0],
	[-12.0, -155.0],

	// Southeast Pacific (off Chile)
	[-38.0, -85.0],
	[-42.0, -88.0],
	[-35.0, -82.0],
	[-45.0, -90.0],

	// Northwest Pacific (near Japan)
	[35.0, 145.0],
	[38.0, 148.0],
	[32.0, 142.0],
	[40.0, 150.0],
	[30.0, 140.0],
	[36.0, 152.0],

	// Coral Triangle cluster
	[-5.0, 120.0],
	[-2.0, 125.0],
	[-8.0, 118.0],
	[2.0, 128.0],
	[-4.0, 130.0],
	[0.0, 122.0],
	[-10.0, 125.0],

	// Central Indian Ocean cluster (large cluster)
	[-12.0, 72.0],
	[-10.0, 68.0],
	[-15.0, 75.0],
	[-8.0, 78.0],
	[-18.0, 70.0],
	[-5.0, 72.0],
	[-20.0, 65.0],
	[-14.0, 80.0],
	[-6.0, 68.0],
	[-16.0, 82.0],
	[-22.0, 75.0],
	[-3.0, 76.0],

	// // Arabian Sea (expanded)
	// [15.0, 65.0],
	// [18.0, 62.0],
	// [12.0, 68.0],
	// [20.0, 60.0],
	// [10.0, 72.0],
	// [22.0, 58.0],
	// [8.0, 65.0],
	// [16.0, 70.0],
	// [14.0, 58.0],

	// // Bay of Bengal (expanded)
	// [12.0, 88.0],
	// [15.0, 85.0],
	// [10.0, 90.0],
	// [8.0, 86.0],
	// [18.0, 88.0],
	// [14.0, 92.0],
	// [6.0, 88.0],
	// [16.0, 82.0],
	// [20.0, 90.0],
	// [5.0, 92.0],

	// // Southwest Indian Ocean (Madagascar region - expanded)
	// [-28.0, 55.0],
	// [-32.0, 52.0],
	// [-25.0, 58.0],
	// [-35.0, 48.0],
	// [-22.0, 52.0],
	// [-18.0, 48.0],
	// [-15.0, 55.0],
	// [-20.0, 58.0],
	// [-30.0, 45.0],
	// [-12.0, 50.0],

	// // Mozambique Channel
	// [-18.0, 42.0],
	// [-22.0, 40.0],
	// [-15.0, 44.0],

	// Southeast Indian Ocean (expanded)
	[-25.0, 95.0],
	[-30.0, 100.0],
	[-22.0, 90.0],
	[-28.0, 88.0],
	[-18.0, 95.0],
	[-32.0, 92.0],
	[-20.0, 102.0],

	// Andaman Sea (expanded)
	[10.0, 95.0],
	[8.0, 98.0],
	[12.0, 92.0],
	[6.0, 95.0],
	[14.0, 96.0],

	// Red Sea entrance
	[14.0, 42.0],
	[12.0, 45.0],

	// // TRUE Indian Ocean - west of Indonesia, south of India (40-80°E longitude)
	[-11.0, 61.0], // West Indian Ocean (shifted NE)
	[-16.0, 56.0], // Southwest
	[-21.0, 61.0], // South-central west
	[-26.0, 66.0], // South
	[-31.0, 61.0], // Far south
	[-36.0, 56.0], // Deep south
	[-41.0, 61.0], // Southern Indian Ocean
	[-46.0, 66.0], // Near Southern Ocean
	[-21.0, 51.0], // Near Madagascar
	[-26.0, 56.0], // South of Madagascar
	[-31.0, 51.0], // Southwest
	[-16.0, 66.0], // Central
	[-11.0, 56.0], // West-central
	[-6.0, 61.0], // Northwest
	[-1.0, 66.0], // North
	[-8.0, 71.0], // Central
	[-14.0, 64.0], // West
	[-18.0, 58.0], // Southwest
	[-24.0, 54.0], // Near Africa
	[-28.0, 61.0], // South
	[-34.0, 58.0], // Far south
	[-38.0, 64.0], // Deep south
	[-4.0, 56.0], // Northwest
	[-10.0, 54.0], // West

	// Greenland Sea / Arctic
	[72.0, -10.0],
	[75.0, -5.0],
	[70.0, -15.0],
	[78.0, 0.0],

	// Barents Sea
	[74.0, 30.0],
	[72.0, 35.0],
	[76.0, 25.0],

	// Southern Ocean / Drake Passage cluster
	[-58.0, -65.0],
	[-60.0, -60.0],
	[-55.0, -68.0],
	[-62.0, -55.0],
	[-56.0, -72.0],

	// South of Australia
	[-48.0, 140.0],
	[-50.0, 135.0],
	[-45.0, 145.0],

	// Mediterranean
	[36.0, 18.0],
	[38.0, 15.0],
	[35.0, 25.0],
	[40.0, 12.0],

	// North Sea
	[56.0, 3.0],
	[58.0, 0.0],
	[54.0, 5.0],

	// Bering Sea
	[58.0, -175.0],
	[55.0, -170.0],
	[60.0, 180.0],

	// Sea of Okhotsk
	[52.0, 148.0],
	[55.0, 150.0],
	[50.0, 145.0],

	// Great Australian Bight
	[-35.0, 130.0],
	[-33.0, 125.0],
	[-38.0, 135.0],

	// Scattered points throughout the oceans
	[48.0, -30.0],
	[-10.0, -5.0],
	[-45.0, -30.0],
	[15.0, -45.0],
	[-25.0, -40.0],
	[50.0, -135.0],
	[-30.0, -120.0],
	[10.0, -130.0],
	[-8.0, -100.0],
	[28.0, -175.0],
	[-40.0, -170.0],
	[45.0, 165.0],
	[-5.0, 155.0],
	[8.0, 140.0],
	[-15.0, 165.0],
	[-42.0, 80.0],
	[-5.0, 55.0],
	[5.0, 80.0],
	[-50.0, 30.0],
	[-65.0, 90.0],
	[-58.0, 0.0],
	[65.0, -35.0],
	[62.0, -20.0]
];

// Indian Ocean sampling locations (used for the globe markers)
const indianOceanMarkers: [number, number][] = [
	// Arabian Sea / west of India
	[15.0, 65.0],
	[12.0, 70.0],
	[8.0, 72.0],
	[18.0, 60.0],

	// Equatorial Indian Ocean
	[5.0, 75.0],
	[0.0, 80.0],
	[-5.0, 85.0],
	[2.0, 90.0],

	// Bay of Bengal / east of India
	[12.0, 88.0],
	[15.0, 85.0],
	[10.0, 92.0],
	[6.0, 90.0],

	// South-central Indian Ocean
	[-10.0, 68.0],
	[-15.0, 75.0],
	[-20.0, 70.0],
	[-25.0, 80.0],
	[-30.0, 88.0],

	// Southeast Indian Ocean / west of Australia
	[-22.0, 95.0],
	[-28.0, 100.0],
	[-18.0, 102.0],

	// Near Indonesia (eastern Indian Ocean)
	[-8.0, 110.0],
	[-5.0, 105.0],
	[-12.0, 115.0]
];

// A couple points next to Japan (kept explicitly so they don't get dropped by sampling)
const japanMarkers: [number, number][] = [
	[36.0, 145.0],
	[38.0, 148.0]
];

// COBE has a hard limit on markers due to shader uniform array size.
// Each marker uses 2 vec4 uniforms, and the shader allocates `u[64*2]`, so max markers = 64.
const TARGET_MARKERS = 60;

function sampleEvenly<T>(arr: T[], count: number): T[] {
	if (count >= arr.length) return arr;
	if (count <= 0) return [];
	const step = arr.length / count;
	return Array.from({ length: count }, (_, i) => arr[Math.floor(i * step)]!);
}

// Round-robin interleave so no single region dominates the start of the list.
function interleaveMarkers(
	base: [number, number][],
	indian: [number, number][],
	japan: [number, number][]
): { markers: [number, number][]; indianIndices: Set<number> } {
	const markers: [number, number][] = [];
	const indianIndices = new Set<number>();
	let bi = 0,
		ii = 0,
		ji = 0;
	while (bi < base.length || ii < indian.length || ji < japan.length) {
		if (bi < base.length) {
			markers.push(base[bi]!);
			bi++;
		}
		if (ii < indian.length) {
			markers.push(indian[ii]!);
			indianIndices.add(markers.length - 1);
			ii++;
		}
		if (ji < japan.length) {
			markers.push(japan[ji]!);
			ji++;
		}
	}
	return { markers, indianIndices };
}

const JAPAN_COUNT = 2;
const INDIAN_COUNT = 9;
const BASE_COUNT = TARGET_MARKERS - JAPAN_COUNT - INDIAN_COUNT; // 49

const sampledBase = sampleEvenly(baseOceanMarkers, BASE_COUNT);
const sampledIndian = sampleEvenly(indianOceanMarkers, INDIAN_COUNT);
const sampledJapan = sampleEvenly(japanMarkers, JAPAN_COUNT);

const { markers: allOceanMarkers, indianIndices: indianOceanIndices } = interleaveMarkers(
	sampledBase,
	sampledIndian,
	sampledJapan
);

interface OceanGlobeProps {
	className?: string;
}

export default function OceanGlobe({ className }: OceanGlobeProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const pointerInteracting = useRef<number | null>(null);
	const pointerInteractionMovement = useRef(0);
	const phiRef = useRef(0); // Start showing Americas/Atlantic
	const frameRef = useRef(0);
	const { theme, resolvedTheme } = useTheme();

	const isDark = theme === "dark" || (theme === "system" && resolvedTheme === "dark");

	const updatePointerInteraction = useCallback((value: number | null) => {
		pointerInteracting.current = value;
		if (canvasRef.current) {
			canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
		}
	}, []);

	const updateMovement = useCallback((clientX: number) => {
		if (pointerInteracting.current !== null) {
			const delta = clientX - pointerInteracting.current;
			pointerInteractionMovement.current = delta;
		}
	}, []);

	useEffect(() => {
		let width = 0;
		let globe: ReturnType<typeof createGlobe> | null = null;
		let animationFrameId = 0;

		const onResize = () => {
			if (canvasRef.current) {
				width = canvasRef.current.offsetWidth;
			}
		};
		onResize();
		window.addEventListener("resize", onResize);

		if (canvasRef.current) {
			globe = createGlobe(canvasRef.current, {
				devicePixelRatio: 2,
				width: width * 2,
				height: width * 2,
				phi: 0,
				theta: 0.2,
				dark: isDark ? 1 : 0,
				diffuse: isDark ? 2.5 : 2,
				mapSamples: 16000,
				mapBrightness: isDark ? 12 : 2.5,
				// Controls non-map surface brightness; prevents dark mode globe from reading as black.
				mapBaseBrightness: isDark ? 0.3 : 0.12,
				scale: 0.91,
				// Lower elevation tightens edge occlusion so dots hide/show closer to the globe edge.
				markerElevation: 0.006,
				// Light: clean white. Dark: closer to theme base-200 (#192136) so it doesn't read as black.
				baseColor: isDark ? [0.098, 0.129, 0.212] : [1, 1, 1],
				// Theme primary blue per mode (light: #233d7f, dark: #64abdc)
				markerColor: isDark ? [0.392, 0.671, 0.863] : [0.137, 0.239, 0.498],
				// Light: unchanged. Dark: dimmer glow in theme primary blue (#64abdc → dimmed)
				glowColor: isDark ? [0.1, 0.28, 0.36] : [0.9, 0.92, 0.95],
				markers: allOceanMarkers.map((location) => ({
					location,
					size: 0.056
				}))
			});

			const animate = () => {
				if (!globe) return;
				frameRef.current++;

				// Slow auto-rotate when not interacting
				if (pointerInteracting.current === null) {
					phiRef.current += 0.001;
				}

				// Staggered breathing animation - each marker pulses out of sync
				// Dark: smaller size/amplitude so overlapping markers don't show black blend artifact
				const animatedMarkers = allOceanMarkers.map((location, i) => {
					const phase = i * 0.5; // offset each marker's phase
					const isIndianOceanMarker = indianOceanIndices.has(i);
					const baseSize = isDark
						? 0.043 + (isIndianOceanMarker ? 0.004 : 0)
						: 0.055 + (isIndianOceanMarker ? 0.005 : 0);
					const amplitude = isDark
						? 0.006 + (isIndianOceanMarker ? 0.001 : 0)
						: 0.01 + (isIndianOceanMarker ? 0.002 : 0);
					const breathe = baseSize + Math.sin(frameRef.current * 0.025 + phase) * amplitude;
					return { location, size: breathe };
				});

				globe.update({
					phi: phiRef.current + pointerInteractionMovement.current / 200,
					width: width * 2,
					height: width * 2,
					markers: animatedMarkers
				});

				animationFrameId = window.requestAnimationFrame(animate);
			};

			animationFrameId = window.requestAnimationFrame(animate);
		}

		return () => {
			window.cancelAnimationFrame(animationFrameId);
			window.removeEventListener("resize", onResize);
			if (globe) {
				globe.destroy();
			}
		};
	}, [isDark]);

	return (
		<div
			className={`relative aspect-square w-full ${className ?? ""}`}
			role="img"
			aria-label="Rotating globe showing ocean eDNA sampling locations as dots across the Atlantic, Pacific, Indian, Arctic, and Southern Oceans"
		>
			<canvas
				ref={canvasRef}
				aria-hidden="true"
				className="w-full h-full cursor-grab"
				style={{
					contain: "layout paint size"
				}}
				onPointerDown={(e) => updatePointerInteraction(e.clientX)}
				onPointerUp={() => updatePointerInteraction(null)}
				onPointerOut={() => updatePointerInteraction(null)}
				onMouseMove={(e) => updateMovement(e.clientX)}
				onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
			/>
		</div>
	);
}
