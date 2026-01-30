import SearchMap from "@/app/components/map/SearchMap";
import SearchResults from "@/app/components/search/SearchResults";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			{/* <SearchTabButtons /> */}
			{children}
			<SearchMap />
			<div className="mt-6" id="search-results">
				<SearchResults />
			</div>
		</>
	);
}
