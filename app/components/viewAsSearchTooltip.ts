export const SHARED_TOOLTIP_THEME_CLASS =
	"[--tt-bg:var(--color-base-300)] [--tt-text:var(--color-base-content)] before:max-w-[min(90vw,24rem)] before:whitespace-pre-wrap before:rounded-md before:bg-(--tt-bg) before:px-3 before:py-2 before:text-sm before:leading-relaxed before:text-(--tt-text) before:shadow-xl";

export const VIEW_AS_SEARCH_TOOLTIP_CLASS = `tooltip tooltip-top relative z-[2200] before:z-[2201] after:z-[2201] ${SHARED_TOOLTIP_THEME_CLASS}`;
