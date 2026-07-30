import DocsSections from "@/types/docsSections";
import { redirect } from "next/navigation";

export default function DocsApiPage() {
	redirect(`/docs/api/${Object.keys(DocsSections.api)[0]}`);
}
