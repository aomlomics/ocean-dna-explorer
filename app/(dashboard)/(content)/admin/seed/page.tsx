import seedDatabaseAction from "@/app/actions/seedDatabase";

export default function SeedDatabase() {
	return (
		<form action={seedDatabaseAction}>
			<button className="btn btn-warning">Seed Database</button>
		</form>
	);
}
