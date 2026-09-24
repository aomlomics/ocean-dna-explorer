"use client";

import type { TaxonomySpotlightModel } from "@/app/generated/prisma/models";
import { exploreUrl } from "@/app/helpers/utils";
import Link from "next/link";
import ProjectCoverPhotoPreview from "../../explore/ProjectCoverPhotoPreview";
import type { ImageWithRelations } from "@/prismaImages/generated/zod";
import deleteSpotlightAction from "@/app/actions/taxonomySpotlight/deleteSpotlight";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import Modal from "../../Modal";

export default function SpotlightManager({
	spotlightsWithImage
}: {
	spotlightsWithImage: (TaxonomySpotlightModel & { Image: ImageWithRelations })[];
}) {
	const router = useRouter();

	const errorRef = useRef<HTMLDialogElement>(null);
	const [errorMessage, setErrorMessage] = useState("");

	async function handleDelete(
		project_id: TaxonomySpotlightModel["project_id"],
		taxonomy: TaxonomySpotlightModel["taxonomy"]
	) {
		const result = await deleteSpotlightAction(project_id, taxonomy);
		if (result.statusMessage === "success") {
			router.refresh();
		} else if (result.statusMessage === "error") {
			setErrorMessage(result.error);
			errorRef.current?.showModal();
		}
	}

	return (
		<>
			<div className="flex flex-col gap-2">
				{spotlightsWithImage.map((sl) => (
					<div key={sl.id} className="flex items-center justify-between gap-2">
						<div className="flex items-center gap-5">
							<ProjectCoverPhotoPreview src={sl.Image?.url} title={sl.project_id} />

							<Link
								href={exploreUrl({ table: "taxonomy", taxonomy: sl.taxonomy })}
								className="link link-primary link-hover break-all"
							>
								{sl.taxonomy}
							</Link>
						</div>

						<button
							className="btn btn-error aspect-square p-2 text-primary-content"
							onClick={() => handleDelete(sl.project_id, sl.taxonomy)}
						>
							<svg fill="currentColor" className="w-full h-full" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
								<path d="M20 6h-3.155a.949.949 0 0 0-.064-.125l-1.7-2.124A1.989 1.989 0 0 0 13.519 3h-3.038a1.987 1.987 0 0 0-1.562.75l-1.7 2.125A.949.949 0 0 0 7.155 6H4a1 1 0 0 0 0 2h1v11a2 2 0 0 0 1.994 2h10.011A2 2 0 0 0 19 19V8h1a1 1 0 0 0 0-2zm-9.519-1h3.038l.8 1H9.681zm6.524 14H7V8h10z" />
								<path d="M14 18a1 1 0 0 1-1-1v-7a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1zM10 18a1 1 0 0 1-1-1v-7a1 1 0 0 1 2 0v7a1 1 0 0 1-1 1z" />
							</svg>
						</button>
					</div>
				))}
			</div>

			<Modal ref={errorRef}>
				<h3 className="text-lg font-bold mb-2 text-error">Spotlight Delete Failed</h3>
				<span className="mb-2 font-light whitespace-pre-wrap">{errorMessage}</span>
			</Modal>
		</>
	);
}
