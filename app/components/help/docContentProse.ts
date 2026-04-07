/** Shared prose wrapper for Help + API doc bodies: one body size, one in-flow heading style (h4/h5), tighter gap from heading → following text. Page-level h2/h3 are outside this wrapper. */
export const docContentProseClassName =
	"prose max-w-none " +
	"[&_p]:text-base [&_p]:leading-relaxed " +
	"[&_ul]:text-base [&_ol]:text-base " +
	"[&_h4]:text-lg [&_h4]:font-medium [&_h4]:text-base-content [&_h4]:mt-6 [&_h4]:mb-1.5 " +
	"[&_div>h4:first-child]:!mt-0 " +
	"[&_h5]:text-lg [&_h5]:font-medium [&_h5]:text-base-content [&_h5]:mt-6 [&_h5]:mb-1.5 " +
	"[&_table_code]:text-base [&_table_code]:font-mono";
