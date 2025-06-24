import { prisma } from "@/app/helpers/prisma";

export default async function Pcr_Primer_Name_Forward_Pcr_Primer_Name_Reverse({
	params
}: {
	params: Promise<{ pcr_primer_name_forward: string; pcr_primer_name_reverse: string }>;
}) {
	const { pcr_primer_name_forward, pcr_primer_name_reverse } = await params;

	const primer = await prisma.primer.findUnique({
		where: {
			pcr_primer_name_forward_pcr_primer_name_reverse: {
				pcr_primer_name_forward,
				pcr_primer_name_reverse
			}
		}
	});
	if (!primer) return <>Primer not found</>;

	return (
		<div>
			{primer.id} {primer.pcr_primer_forward} {primer.pcr_primer_reverse}
		</div>
	);
}
