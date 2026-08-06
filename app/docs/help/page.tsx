import DocsSections from "@/types/docsSections";
import { redirect } from "next/navigation";

export default function DocsHelpPage() {
	redirect(`/docs/help/${Object.keys(DocsSections.help)[0]}`);
}
