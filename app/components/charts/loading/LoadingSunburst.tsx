type LoadingSunburstProps = {
	size?: string;
};

const sections = [
	{
		start: 0,
		end: 72,
		color: "var(--color-error)",
		children: 3
	},
	{
		start: 72,
		end: 144,
		color: "var(--color-warning)",
		children: 4
	},
	{
		start: 144,
		end: 216,
		color: "var(--color-success)",
		children: 2
	},
	{
		start: 216,
		end: 288,
		color: "var(--color-info)",
		children: 3
	},
	{
		start: 288,
		end: 360,
		color: "var(--color-secondary)",
		children: 4
	}
];

export default function LoadingSunburst({ size = "min(55vw, 500px)" }: LoadingSunburstProps) {
	const innerRingWidth = 10;
	const innerRadius = 22;
	const outerRadius = innerRadius + innerRingWidth;
	const totalRadius = outerRadius + innerRingWidth * 2;

	const parentGradient = sections.map((section) => `${section.color} ${section.start}deg ${section.end}deg`).join(", ");

	const childStops: string[] = [];

	for (const section of sections) {
		const childWidth = (section.end - section.start) / section.children;

		for (let i = 0; i < section.children; i++) {
			const start = section.start + i * childWidth;
			const end = start + childWidth;

			//clockwise lightening
			const mixAmount = section.children === 1 ? 0 : (i / (section.children - 1)) * 8;

			childStops.push(
				`${`color-mix(in srgb, ${section.color} ${100 - mixAmount}%, white ${mixAmount}%)`} ${start + 0.5}deg ${end - 0.5}deg`,
				`var(--color-base-100) ${end - 0.5}deg ${end}deg`
			);
		}
	}

	const circleStyle = (radius: number) => ({
		left: `${50 - radius}%`,
		top: `${50 - radius}%`,
		width: `${radius * 2}%`,
		height: `${radius * 2}%`
	});

	return (
		<div
			className="relative mx-auto"
			style={{
				width: size,
				aspectRatio: "1"
			}}
		>
			<div
				className="absolute rounded-full"
				style={{
					...circleStyle(totalRadius),
					background: `conic-gradient(from 0deg, ${childStops.join(", ")})`,
					border: "1px solid black"
				}}
			/>

			<div
				className="absolute rounded-full"
				style={{
					...circleStyle(outerRadius),
					background: `conic-gradient(from 0deg, ${parentGradient})`,
					border: "1px solid black"
				}}
			/>

			<div
				className="absolute rounded-full bg-base-100"
				style={{
					...circleStyle(innerRadius)
				}}
			/>
		</div>
	);
}
