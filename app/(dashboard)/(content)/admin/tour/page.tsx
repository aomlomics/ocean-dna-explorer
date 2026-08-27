import TourForm from "@/app/components/admin/TourForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Tour"
};

export default function Tour() {
	return <TourForm />;
}
