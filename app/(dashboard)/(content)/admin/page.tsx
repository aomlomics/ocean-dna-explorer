import { permanentRedirect } from "next/navigation";

export default async function Admin() {
	permanentRedirect("/admin/users");
}
