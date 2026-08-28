import DocsSections from "@/types/docsSections";
import { permanentRedirect } from "next/navigation";

export default function DocsHelpPage() {
	permanentRedirect(`/docs/help/${Object.keys(DocsSections.help)[0]}`);
}
