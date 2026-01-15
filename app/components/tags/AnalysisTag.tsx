import { getTextColorHex } from "@/app/helpers/utils";
import { Tag } from "../../generated/prisma/client";
import "./AnalysisTag.css";

export default function AnalysisTag({ tag, hideDescription }: { tag: Omit<Tag, "id">; hideDescription?: true }) {
	const textColor = getTextColorHex(tag.color);

	return (
		<div
			className={`AnalysisTag rounded-xl px-3 inline-flex items-center justify-center text-nowrap select-none${
				hideDescription ? "" : " tooltip"
			}`}
			style={{
				backgroundColor: tag.color,
				color: textColor,
				["--analysisTagTooltipBGColor" as any]: tag.color,
				["--analysisTagTooltipTextColor" as any]: textColor
			}}
			data-tip={tag.description || "\u200b"}
		>
			{tag.tagName || "\u200b"}
		</div>
	);
}
