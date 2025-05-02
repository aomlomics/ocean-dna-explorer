import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Role } from "./types/globals";

const isProtectedRoute = createRouteMatcher(["/mySubmissions(.*)", "/admin(.*)", "/submit(.*)"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isSubmitRoute = createRouteMatcher(["/submit(.*)"]);

const routes = {
	admin: {
		roles: ["admin", "moderator"]
	},
	submit: {
		roles: ["admin", "moderator", "contributor"],
		redirect: "/"
	}
} as Record<string, { roles: Role[]; redirect?: string }>;

export default clerkMiddleware(async (auth, req) => {
	const { userId, sessionClaims } = await auth();

	if (isProtectedRoute(req)) {
		//accessing protected routes
		if (userId) {
			//signed in
			const role = sessionClaims?.metadata?.role;

			if (isAdminRoute(req) && (!role || !routes.admin.roles.includes(role))) {
				//accessing admin routes without proper permissions
				const url = new URL(routes.admin.redirect || "/", req.url);
				return NextResponse.redirect(url);
			} else if (isSubmitRoute(req) && (!role || !routes.submit.roles.includes(role))) {
				//accessing submit routes without proper permissions
				const url = new URL(routes.submit.redirect || "/", req.url);
				return NextResponse.redirect(url);
			}
		} else {
			//not signed in
			await auth.protect();
		}
	}
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)"
	]
};
