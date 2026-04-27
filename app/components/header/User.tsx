"use client";

import { Show, SignInButton } from "@clerk/nextjs";
import { ThemedUserButton } from "./ThemedUserButton";

export default function User() {
	return (
        <>
            <Show when="signed-in">
				<ThemedUserButton />
			</Show>
            <Show when="signed-out">
				<SignInButton>
					<button className="btn bg-primary text-white hover:bg-primary/80">Sign In</button>
				</SignInButton>
			</Show>
        </>
    );
}
