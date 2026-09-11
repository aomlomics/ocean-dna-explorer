export type TaxonomyVisualizeTabs = Record<string, { title: string; tabs?: TaxonomyVisualizeTabs }>;

export const TAXONOMY_VISUALIZE_TABS = {
	abundance: {
		title: "Relative Abundance"
	},
	treemap: {
		title: "Treemap"
	},
	prevalence: {
		title: "Prevalence Histogram"
	},
	heatmap: {
		title: "Sample Heatmap"
	},
	composition: {
		title: "Composition Explorer",
		tabs: {
			bar: {
				title: "Bar"
			},
			lollipop: {
				title: "Lollipop"
			},
			sunburst: {
				title: "Sunburst"
			}
		}
	},
	darkTaxa: {
		title: "Dark Taxa"
	}
} as TaxonomyVisualizeTabs;

let curr = Object.entries(TAXONOMY_VISUALIZE_TABS)[0]!;
export const FIRST_TAXONOMY_VISUALIZE_TAB = [curr[0]];
while (curr[1].tabs) {
	curr = Object.entries(curr[1].tabs)[0]!;
	FIRST_TAXONOMY_VISUALIZE_TAB.push(curr[0]);
}
