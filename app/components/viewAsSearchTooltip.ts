export const SHARED_TOOLTIP_THEME_CLASS =
	"[--tt-bg:var(--color-base-200)] [--tt-color:var(--color-base-content)] before:max-w-[min(90vw,24rem)] before:whitespace-pre-wrap before:rounded-md before:bg-[var(--tt-bg)] before:px-3 before:py-2 before:text-sm before:leading-relaxed before:text-[var(--tt-color)] before:shadow-xl";

export const VIEW_AS_SEARCH_TOOLTIP_CLASS = `tooltip tooltip-top relative z-tooltip before:z-tooltip after:z-tooltip ${SHARED_TOOLTIP_THEME_CLASS}`;
