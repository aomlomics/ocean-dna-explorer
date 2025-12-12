import SearchResults from "@/app/components/search/SearchResults";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			{/* <SearchTabButtons /> */}
			{children}
			<div className="mt-6" id="search-results">
				<SearchResults />
			</div>
		</>
	);
}
