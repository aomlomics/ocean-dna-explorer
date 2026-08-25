import TourForm from "@/app/components/admin/TourForm";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: "Tour"
};

export default function Tour() {
	return <TourForm />;
}
