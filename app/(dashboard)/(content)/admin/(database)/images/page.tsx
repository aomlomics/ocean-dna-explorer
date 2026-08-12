import AddImageButton from "@/app/components/AddImageButton";
import { prismaImages } from "@/app/helpers/prismaImages";
import ImageDeleteButton from "@/app/components/images/ImageDeleteButton";
import Image from "next/image";

//TODO: add way to manage attributions
export default async function AdminImages() {
	const [attributions, images] = await prismaImages.$transaction([
		prismaImages.attribution.findMany(),
		prismaImages.image.findMany({
			where: { homePage: true },
			include: { Attribution: true },
			orderBy: { dateSubmitted: "desc" }
		})
	]);

	return (
		<div className="space-y-6">
			<AddImageButton attributions={attributions} title={"Add Carousel Image"} homePage />

			<div className="space-y-2">
				<h2 className="text-xl font-semibold">Carousel images</h2>
				<p className="text-sm opacity-70">
					{images.length} image{images.length === 1 ? "" : "s"} in database
				</p>
			</div>

			{images.length === 0 ? (
				<div className="alert">
					<span>No images found. Add one with the button above.</span>
				</div>
			) : (
				<div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{images.map((img) => (
						<div key={img.id} className="card bg-base-100 shadow">
							<figure className="aspect-video overflow-hidden bg-base-200">
								<Image src={img.url} alt={img.name} className="object-cover w-full h-full" />
							</figure>
							<div className="card-body p-4">
								<div className="flex items-center justify-between gap-2">
									<h3 className="card-title text-base truncate" title={img.name}>
										{img.name}
									</h3>
									<span className="badge badge-ghost">#{img.id}</span>
								</div>
								{img.description && <p className="text-sm opacity-80 line-clamp-2">{img.description}</p>}
								<div className="text-xs opacity-70 space-y-0.5">
									{img.location && <p>Location: {img.location}</p>}
									{img.dateTaken && <p>Date taken: {new Date(img.dateTaken).toLocaleDateString()}</p>}
									<p>Submitted: {new Date(img.dateSubmitted).toLocaleString()}</p>
									{img.Attribution && (
										<div className="space-y-0.5">
											<p>Attribution: {img.Attribution.attributionTitle}</p>
											{img.Attribution.attributionInstitution && (
												<p>Institution: {img.Attribution.attributionInstitution}</p>
											)}
											{img.Attribution.attributionUrl && (
												<p className="break-all">
													URL:{" "}
													<a className="link" href={img.Attribution.attributionUrl} target="_blank" rel="noreferrer">
														{img.Attribution.attributionUrl}
													</a>
												</p>
											)}
										</div>
									)}
								</div>
								<div className="pt-2">
									<ImageDeleteButton imageId={img.id} imageName={img.name} />
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
