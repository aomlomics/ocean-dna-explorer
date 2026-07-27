export default function LoadingControl({ loading }: { loading: boolean }) {
	if (!loading) {
		return null;
	}

	return (
		<div className="leaflet-top leaflet-left w-full h-full">
			<div className="leaflet-control leaflet-bar border-none! w-full h-full m-0!">
				<div className="bg-base-100 w-full h-full opacity-10" />
			</div>
		</div>
	);
}
