import DocsSections from "@/types/docsSections";
import { permanentRedirect } from "next/navigation";

export default function DocsApiPage() {
	permanentRedirect(`/docs/api/${Object.keys(DocsSections.api)[0]}`);
}
