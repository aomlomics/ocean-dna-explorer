import { redirect } from "next/navigation";

const VALID_SECTIONS = ["edna101", "impact", "discoveries"] as const;

type PageProps = { searchParams: Promise<{ section?: string }> };

/** Keep /learn and legacy ?section= URLs working for existing links. */
export default async function LearnIndexPage({ searchParams }: PageProps) {
	const params = await searchParams;
	if (params.section && (VALID_SECTIONS as readonly string[]).includes(params.section)) {
		redirect(`/learn/${params.section}`);
	}
	redirect("/learn/edna101");
}
