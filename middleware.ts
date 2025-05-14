import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { Permission, Role } from "./types/globals";

const isProtectedRoute = createRouteMatcher(["/mySubmissions(.*)", "/admin(.*)", "/submit(.*)"]);
const isManageUsersRoute = createRouteMatcher(["/admin(.*)"]);
const isContributeRoute = createRouteMatcher(["/submit(.*)"]);

const routes = {
	manageUsers: {
		roles: ["admin", "moderator"],
		redirect: "/"
	},
	contribute: {
		roles: ["admin", "moderator", "contributor"],
		redirect: "/contribute"
	}
} as Record<Permission, { roles: Role[]; redirect: string }>;

export default clerkMiddleware(async (auth, req) => {
	if (isProtectedRoute(req)) {
		const { userId, sessionClaims } = await auth();
		//accessing protected routes
		if (userId) {
			//signed in
			const role = sessionClaims?.metadata?.role;

			if (isManageUsersRoute(req) && (!role || !routes.manageUsers.roles.includes(role))) {
				//accessing manageUsers routes without proper permissions
				const url = new URL(routes.manageUsers.redirect, req.url);
				return NextResponse.redirect(url);
			} else if (isContributeRoute(req) && (!role || !routes.contribute.roles.includes(role))) {
				//accessing contribute routes without proper permissions
				const url = new URL(routes.contribute.redirect, req.url);
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
