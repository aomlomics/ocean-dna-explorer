"use client";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { ThemedUserButton } from "../ThemedUserButton";

export default function User() {
	return (
		<>
			<SignedIn>
				<ThemedUserButton />
			</SignedIn>
			<SignedOut>
				<SignInButton>
					<button className="btn bg-primary text-white hover:bg-primary/80">Sign In</button>
				</SignInButton>
			</SignedOut>
		</>
	);
}
