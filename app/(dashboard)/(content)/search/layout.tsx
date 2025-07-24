import SearchResults from "@/app/components/search/SearchResults";
import SearchTabButtons from "@/app/components/search/SearchTabButtons";

export default function SearchLayout({ children }: { children: React.ReactNode }) {
	return (
		<div>
			<SearchTabButtons />
			<div className="border border-base-300 rounded-lg rounded-tl-none p-6 mb-6">{children}</div>

			<SearchResults />
		</div>
	);
}
