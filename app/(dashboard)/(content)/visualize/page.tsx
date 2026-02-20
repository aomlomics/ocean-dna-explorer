import { permanentRedirect } from "next/navigation";

export default async function Visualize() {
	permanentRedirect("/visualize/metadata");
}
