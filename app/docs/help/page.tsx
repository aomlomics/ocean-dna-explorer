import { DocsNavigation } from "@/types/docsSections";
import { redirect } from "next/navigation";

export default function DocsHelpPage() {
	redirect(`/docs/${DocsNavigation[0].page}/${DocsNavigation[0].section}`);
}
