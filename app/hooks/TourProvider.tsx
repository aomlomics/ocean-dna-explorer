"use client";

import { useRouter } from "next/navigation";
import { createContext, ReactNode, useEffect, useRef, useState } from "react";

export type TourStep = { url: string; stepTime?: number };

export const TourContext = createContext<(tourSteps: TourStep[], stepTime?: number) => void>(() => {});
export const DEFAULT_TOUR_STEP_TIME = 5; //seconds

export default function TourProvider({ children }: { children: ReactNode }) {
	const router = useRouter();
	const [tourSteps, setTourSteps] = useState(undefined as TourStep[] | undefined);
	const [step, setStep] = useState(undefined as number | undefined);
	const [stepTime, setStepTime] = useState(DEFAULT_TOUR_STEP_TIME);
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	function stopTour() {
		document.removeEventListener("click", stopTour);
		document.removeEventListener("keydown", stopTour);
		clearTimeout(timeoutRef.current!);

		setStep(undefined);
		timeoutRef.current = null;
	}

	function startTour(tourSteps: TourStep[], stepTime?: number) {
		if (stepTime && stepTime > 0) {
			setStepTime(stepTime);
		}
		setTourSteps(tourSteps);

		document.addEventListener("click", stopTour);
		document.addEventListener("keydown", stopTour);

		setStep(0);
	}

	useEffect(() => {
		if (tourSteps && step !== undefined) {
			const nextI = (step + 1) % tourSteps.length;

			//next step navigation timeout
			timeoutRef.current = setTimeout(() => setStep(nextI), (tourSteps[step].stepTime || stepTime) * 1000);

			//prefetch next step
			router.prefetch(tourSteps[nextI].url);

			//navigate to current step
			router.replace(tourSteps[step].url);
		}
	}, [step]);

	return <TourContext.Provider value={startTour}>{children}</TourContext.Provider>;
}
