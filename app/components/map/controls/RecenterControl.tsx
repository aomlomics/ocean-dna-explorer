"use client";

import LeafletControl from "./LeafletControl";

export default function RecenterControl({ reset }: { reset: () => void }) {
	//TODO: make this button merge with other control instead of being on its own
	return (
		<LeafletControl
			click
			className="cursor-pointer! bg-white hover:bg-gray-100 border-2 border-gray-300 rounded-sm"
			style={{ padding: "calc(var(--spacing) * 0.8)" }}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				className="text-black"
				stroke="currentColor"
				fill="currentColor"
				onClick={reset}
			>
				<path d="M12.5 17.402V21.5q0 .213-.143.357T12 22t-.357-.143q-.143-.144-.143-.357v-4.098l-1.13 1.13q-.141.141-.342.15t-.366-.155q-.16-.16-.16-.354t.16-.354l1.773-1.773q.242-.242.565-.242t.565.242l1.773 1.773q.14.14.153.342t-.153.366q-.16.16-.35.162t-.357-.156zM6.598 12.5H2.5q-.213 0-.357-.143T2 12t.143-.357q.144-.143.357-.143h4.098l-1.13-1.13q-.141-.141-.15-.342t.155-.366q.16-.16.354-.16t.354.16l1.773 1.773q.242.242.242.565t-.242.565L6.18 14.338q-.14.14-.342.153t-.366-.153q-.16-.16-.162-.35t.156-.357zm10.804 0l1.13 1.13q.141.141.15.342t-.155.366q-.16.16-.354.16t-.354-.16l-1.773-1.773q-.242-.242-.242-.565t.242-.565l1.773-1.773q.14-.14.342-.153t.366.153q.16.16.162.35t-.156.357L17.402 11.5H21.5q.213 0 .357.143T22 12t-.143.357q-.144.143-.357.143zM12 12.98q-.413 0-.697-.283T11.019 12t.284-.697t.697-.284t.697.284t.284.697t-.284.697t-.697.284m-.5-6.383V2.5q0-.213.143-.357T12 2t.357.143q.143.144.143.357v4.098l1.13-1.13q.141-.141.342-.15t.366.155q.16.16.16.354t-.16.354l-1.773 1.773q-.242.242-.565.242t-.565-.242L9.662 6.18q-.14-.14-.153-.342t.153-.366q.16-.16.35-.162t.357.156z" />
			</svg>
		</LeafletControl>
	);
}
