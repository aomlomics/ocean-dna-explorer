# Ocean DNA Explorer — Pre-Release Readiness Audit

**Scope:** full-application review of this repository — routing, public API, server actions, the Prisma query layer, page UI/UX, accessibility, and responsive behavior.

**Method:** static, read-only code review. No commands were run and no application code was modified. No `.env*` or credential files were opened (they are excluded by `.cursorignore`), so anything that depends on an environment value is listed for verification rather than asserted.

**Ranking:** findings are ordered by demonstrated repository evidence multiplied by user-facing impact. Coverage is deliberately spread across security, performance and availability, correctness, code quality, and accessibility/UX rather than weighted toward any single area.

**Status:** ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) ![WIP](https://img.shields.io/badge/%E2%86%BB_WIP-2563eb?style=flat-square)

**"Leaving beta"** in this document refers to removing the in-app beta notices at `app/(dashboard)/page.tsx:28-30` and `app/components/header/Header.tsx:36`, and to the readiness bar that implies: external users reading data through the public API and outside contributors submitting real datasets.

---

## 1) Executive summary

Seven issues are blockers, and they fall into three groups: a route migration that left roughly a dozen internal links pointing at URLs that no longer exist, an unauthenticated path to submitter names and email addresses, and accessibility gaps that make the site unusable by keyboard on narrow viewports.

The foundations are sound. TypeScript `strict` is enabled, there is a real Prisma migration history rather than `db push` improvisation, `next.config.js` does not suppress build or lint errors, server actions consistently verify `auth()` plus a role permission before mutating (the only exception is noted in P1-4), the blob upload route is properly gated with an allowlisted content type and a random suffix, cron routes check a shared secret, raw SQL is parameterized, and `parseApiQuery` validates filter field names against generated table metadata. The information architecture — Explore tabs, mega menus, breadcrumbs, and `loading.tsx` skeletons across Explore — is coherent and navigable. The findings below are gaps in an otherwise well-built application.

**The highest-visibility defect is broken navigation, not a security bug.** The analysis detail route now lives at `/explore/analysis/[project_id]/[analysis_run_name]`, but about a dozen call sites still emit the old single-segment `/explore/analysis/{analysis_run_name}`. The single-segment route does not exist on disk, so every one of those links 404s — including the "View analysis" button on the homepage dashboard, the analysis links on occurrence and assignment detail pages, `mySubmissions`, and the alpha-diversity panel. The analysis page itself contains a `redirect()` to the dead shape, and `explore/analysis/sitemap.ts` publishes the dead shape to search engines. This compounds with a second finding: there is no `not-found.tsx` anywhere in the repository, so all of those 404s — plus the `notFound()` calls in all ten entity detail pages — render the unstyled Next.js default page with no header, no navigation, and no way back.

**There is an unauthenticated path from public data to submitter identities.** `/api/user` and `/api/user/[userId]` call `clerkClient()` with no `auth()` check and return Clerk records including primary email addresses; the single-user endpoint returns the entire Clerk `User` object with no field selection. Separately, the public data API never strips `userIds` from `Project` rows: `stripSecureFields` runs only on the schema-metadata endpoint, and `GlobalOmit` is a client-side render filter, not a server guard. An anonymous request can read a project's `userIds` and feed them straight into `/api/user?userIds=...` to obtain the names and email addresses of the researchers who submitted that dataset.

**The "Manage Users" area is gated by login rather than by role.** `admin/layout.tsx` calls bare `auth.protect()`, which asserts only that some user is signed in, and the nested users layout and target-user page add no permission check. Any authenticated account can read the full user roster with emails, roles, and role applications. The destructive actions underneath independently verify `manageUsers`, so this is disclosure rather than privilege escalation, and the adjacent database admin section already implements the correct pattern.

**The public API has no server-side result ceiling and no rate limiting.** `/api/[table]` and `/api/[table]/swapToTable` call `findMany` with whatever `limit` the caller supplies, or none at all, so `GET /api/occurrence` attempts to serialize an entire table. `proxy.ts` is a bare `clerkMiddleware()` with no route rules, and there is no rate-limiting dependency or code anywhere in the repository. The `pagination` route requires `take` and is the model to follow, but its `deepRelations=true` mode issues one `count()` per row per relation inside a single transaction — roughly 375 count queries for a 25-row page — and its `relations` + `relationsAllFields` parameters embed unbounded related rows inside each returned row.

**Accessibility has load-bearing structural gaps.** The mobile navigation trigger is a `<div role="button">` with no `tabIndex` and no key handler, and since the desktop tab bar is `hidden lg:flex`, keyboard and screen-reader users have no way to navigate at all below the `lg` breakpoint. Neither shared layout emits a `<main>` landmark and there is no skip link, so every page requires traversing the entire header before reaching content. Beyond the blockers, table sorting is a click-only `<div>`, `<td>` is used for header cells inside `<thead>`, filter inputs have no accessible name, and every chart and map canvas is unlabeled.

Two cross-cutting notes. There are **no automated tests, and linting cannot run at all**: the `lint` script still calls `next lint`, which Next.js 16 removed, and no ESLint flat config exists — so `eslint-plugin-jsx-a11y`, which ships with `eslint-config-next` and would flag several accessibility findings below, has never executed against this code. That is the direct explanation for how a route rename broke a dozen links silently. And **every API route returns HTTP 200 on error**, including unauthorized cron requests, while the shared SWR `fetcher` returns an error object instead of throwing; the net effect is that HTTP status is not usable by API consumers and the `error` branch in three table components is unreachable.

The blocker list is a few focused days of work. The broken links, the two auth gates, and the accessibility basics are each small and well-scoped.

---

## 2) Findings

Severity tiers: **P0 = blocker for leaving beta**, **P1 = fix soon (weeks)**, **P2 = worthwhile, not urgent**, **HV = needs human verification**.

### P0 — Blockers *(partial)*

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P0-1 · Correctness / Navigation — Analysis deep links 404 after a route rename
**Location**
- Route that exists: `app/(dashboard)/(content)/explore/analysis/[project_id]/[analysis_run_name]/page.tsx`
- Redirect to a dead URL inside that same file: line 38
- Call sites emitting the dead single-segment shape:
  - `app/components/DataSummaryHighlights.tsx:346`, `:400` (homepage "View analysis" button and info-panel link)
  - `app/(dashboard)/(content)/explore/occurrence/[project_id]/[analysis_run_name]/[lib_id]/[featureid]/page.tsx:156`, `:214`
  - `app/(dashboard)/(content)/explore/assignment/[project_id]/[analysis_run_name]/[featureid]/page.tsx:56`, `:105`
  - `app/(dashboard)/(content)/mySubmissions/page.tsx:178`
  - `app/components/charts/wrappers/AlphaDiversityDisplay.tsx:453`
  - `app/components/explore/ProjectFileDownloads.tsx:314`
  - `app/components/tags/DeleteTagButton.tsx:69`
  - `app/(dashboard)/(content)/admin/users/[targetUserId]/page.tsx:177`
  - `app/(dashboard)/(content)/admin/tour/page.tsx:289`, `:292`
  - `app/(dashboard)/(content)/explore/analysis/sitemap.ts:41`

**Issue**
The analysis detail route requires two path segments. Every call site above emits one:

```tsx
href={`/explore/analysis/${encodeURIComponent(analysis.analysis_run_name)}`}
```

A read of `app/(dashboard)/(content)/explore/analysis/[analysis_run_name]/page.tsx` returns "file not found", so no legacy route remains to catch these URLs and they resolve to a 404. Line 38 of the current analysis page is the same bug pointed inward: when a `view` search param is present it redirects to the dead single-segment URL, making that branch a guaranteed 404. `sitemap.ts:41` publishes the dead shape to search engines, so crawl errors will accumulate quietly.

**Impact**
"View analysis" on the homepage dashboard is a primary entry point, and `mySubmissions` is the page a contributor uses to confirm an upload landed. Both currently dead-end. Because there is no custom 404 page (P1-1), each failure lands on an unstyled page with no navigation.

**Suggested direction**
Two approaches, and both are worth doing in this order:

1. **Fix the call sites** by threading `project_id` into each link. Correct and explicit. The occurrence and assignment pages already have `project_id` in scope, so those are trivial; others need the surrounding query to select it.
2. **Add a compatibility route** at `explore/analysis/[analysis_run_name]/page.tsx` that resolves the analysis by run name and `redirect()`s to the canonical two-segment URL.

Fixing call sites makes the application internally correct; the compatibility redirect covers URLs already indexed by search engines, bookmarked, or shared during beta — a URL that has been published cannot be unpublished. One constraint applies: the schema uses a compound key `project_id_analysis_run_name`, which implies `analysis_run_name` is not unique on its own. The compatibility route should redirect when exactly one analysis matches and render a small disambiguation page otherwise, rather than guessing. Fix line 38 and the sitemap regardless of approach.

The `occurrence` and `assignment` routes were renamed in the same pass, so they are worth the same sweep.

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P0-2 · Security — `/api/user` and `/api/user/[userId]` are unauthenticated and return email addresses
**Location** `app/api/user/route.ts` (whole file — no `auth()` call), `app/api/user/[userId]/route.ts`

**Issue**
Neither handler authenticates. The list endpoint returns up to 500 Clerk users including `primaryEmailAddress`, `firstName`, `lastName`, `banned`, `imageUrl`, and `publicMetadata` (which carries both `role` and any pending `roleApplication`):

```ts
export async function GET(request: Request): Promise<NextResponse<NetworkPacket>> {
	const client = await clerkClient();
	// ...no auth() anywhere in this file
	users = (await client.users.getUserList({ limit: 500 })).data;
```

The single-user endpoint is worse in kind: it returns the raw Clerk `User` object with no field selection at all. `proxy.ts` is a bare `clerkMiddleware()` with no route protection, so nothing upstream compensates — access control in this codebase is per-route, and these two routes have none.

**Impact**
An anonymous request yields a roster of every account holder plus email addresses. Chained with P0-3 it becomes an attribution map linking named researchers to the datasets they submitted.

**Suggested direction**
Both endpoints need `auth()` plus a permission check, but they cannot share one gate. Callers were traced: `app/components/UserList.tsx:17` is the admin roster (needs `manageUsers`), while `app/components/UserAdder.tsx:52` and `:96` are the project-collaborator picker used by `app/components/submit/ProjectSubmit.tsx:348` and `app/components/mySubmissions/SubmissionUsersButton.tsx:38` — contributor-facing surfaces that would break under a `manageUsers` gate.

The clean split is a narrow authenticated lookup returning only `{ id, firstName, lastName, imageUrl }` for the collaborator picker, with the full email-bearing list reserved for `manageUsers`. For `[userId]`, stop returning the raw Clerk object and build an explicit response shape the way `getUsersResult()` already does in the list route. The general principle: allowlist the fields returned rather than returning an upstream object and assuming it holds nothing sensitive — a raw object silently starts leaking new fields whenever the upstream provider adds them.

---

#### ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) P0-3 · Security / Privacy — `userIds` and `editHistory` are returned by the public data API *(potentially not an issue)*
**Location**
- `types/objects.ts:78` — `GlobalOmit = ["userId", "userIds", "editHistory", "deleted_ODE"]`
- `app/helpers/queries.ts:821-834` — `secureFields = ["userIds"]` and `stripSecureFields()`
- Only server-side callers of `stripSecureFields`: `app/api/[table]/fields/route.ts:23` and `app/components/SchemaDisplay.tsx:32`
- Data routes with no field protection: `app/api/[table]/route.ts:64`, `app/api/[table]/pagination/route.ts:311`, `app/api/[table]/swapToTable/route.ts:21`, `app/api/[table]/[id]/route.ts:35`
- Schema: `prisma/schemas/project.prisma:4` (`userIds String[]`), `:9` (`editHistory Json?`), `prisma/schemas/analysis.prisma:7`

**Issue**
Two field-hiding mechanisms exist and neither protects data responses. `GlobalOmit` is imported only by client components (`Table.tsx:4`, `DataDisplay.tsx:2`, `ExploreSearch.tsx:5`, `SearchUI.tsx:14`, `ActualMap.tsx:29`, `SampleVisualize.tsx:5`, `TaxonomyVisualize.tsx:5`) where it decides which columns to *render*, so the values still travel to the browser inside the JSON payload. `stripSecureFields` does run server-side but only on the endpoint that describes the schema, never on the endpoints that return rows.

A search for `omit:` across the repository finds exactly one use, in `explore/sample/[project_id]/[samp_name]/page.tsx:239` — `parseApiQuery` never sets a Prisma `omit` clause. With no `fields` parameter, `prisma[model].findMany(query)` returns every scalar column, so `GET /api/project` returns `userIds` and `editHistory` for every project. `editHistory` is a raw JSON audit trail that includes historical edit records and previously referenced blob URLs.

**Impact**
On its own, a moderate metadata leak. Combined with P0-2 it forms a complete deanonymization chain requiring no authentication: `GET /api/project` → collect `userIds` → `GET /api/user?userIds=...` → names and emails keyed to datasets. A Clerk user ID is also a credential-adjacent identifier that other Clerk-facing surfaces key on, so publishing it is undesirable independent of the chain.

**Suggested direction**
Enforce this once at the query-construction layer rather than per route. `parseApiQuery` in `app/helpers/queries.ts` is the correct choke point since every data route funnels through it, and Prisma's `omit` clause driven from the existing `secureFields` list keeps the columns inside Postgres. Two advantages over filtering the result array after the fact: no wasted transfer, and a new route cannot forget to apply it.

The strongest version is Prisma's **client-level `omit`**, configured once where the client is constructed in `app/helpers/prisma.ts`. That makes the field invisible by default everywhere and forces code that genuinely needs it to opt in. Default-deny is the right posture here; default-allow makes every future endpoint a fresh opportunity to leak. Audit the opt-in sites when making this change — ownership checks of the form `project.userIds.includes(userId)` appear in `projectSubmit.ts:38`, `projectUpdateUserIds.ts:54`, `projectUpdateImage.ts:66`, `analysisEdit.ts:96`, `occEdit.ts:48`, `analysisDelete.ts:66`, `projectDelete.ts:54`, and `fixDeletedSamples.ts:40`, and each will silently fail if the field is omitted and not re-requested. That is precisely the kind of change a test should cover, and there are none (P1-8).

Whether `editHistory` should be public at all deserves an explicit decision. There is a reasonable FAIR provenance argument for it, but if it is published it should be a curated shape rather than a raw internal audit blob containing old blob URLs.

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P0-4 · Security — "Manage Users" is gated by login, not by role
**Location** `app/(dashboard)/(content)/admin/layout.tsx:6`, `app/(dashboard)/(content)/admin/users/layout.tsx` (whole file — no auth), `app/(dashboard)/(content)/admin/users/[targetUserId]/page.tsx`

**Issue**
The admin layout's only gate is:

```tsx
export default async function AdminLayout({ children }: { children: ReactNode }) {
	await auth.protect();
```

`auth.protect()` with no arguments asserts only that a user is signed in. The nested users layout renders `<UserList />` with no permission check, and the target-user page loads that user's email, role, role applications, and associated projects and analyses without checking `manageUsers`. Any authenticated account can browse to `/admin/users` and read the full roster and per-user detail.

The mutations underneath are safe — `editUser.ts:27` independently verifies `manageUsers` and enforces a role hierarchy — so this is information disclosure and UI exposure, not privilege escalation.

**Impact**
The area is currently obscured only by conditional rendering in `AdminTabs.tsx`. Hiding a link is not access control: the URL is guessable and predictable.

**Suggested direction**
The correct pattern already exists in this repository at `app/(dashboard)/(content)/admin/(database)/layout.tsx:7-12`, which reads the role from session claims and redirects when `manageDatabase` is absent. Apply the equivalent `manageUsers` check in `admin/users/layout.tsx`. Doing it in the layout rather than in each page matters because layouts wrap every current and future child route, so a page added later under `admin/users/` inherits protection instead of needing to remember it.

Two related habits: prefer `auth.protect({ role })` or an explicit permission check over bare `auth.protect()` so intent is visible at the call site, and treat tab visibility in `AdminTabs.tsx` strictly as UX rather than as a boundary.

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P0-5 · Reliability / UX — Visualize pages render a loading skeleton indefinitely when a fetch fails
**Location** `app/(dashboard)/(content)/visualize/taxonomy/page.tsx:52-114` (read in full); the same pattern in `visualize/metadata/page.tsx` and `visualize/alphaDiversity/page.tsx`

**Issue**
`doFetch()` throws on any failure and the call site does not catch:

```ts
const [loading, setLoading] = useState(true);

useEffect(() => {
	setLoading(true);
	async function doFetch() {
		const occRes = await fetch(`/api/occurrence/swapToTable?...`);
		if (!occRes.ok) throw new Error("Occurrence query failed to reach the server.");
		// ...three more fetches, each throwing on failure...
		setLoading(false);   // only reached on the fully successful path
	}
	doFetch();               // no .catch()
}, [searchParams]);

if (loading || !occurrences || !assignments || !taxonomies || !samples) {
	return <LoadingTaxonomyVisualize />;
}
```

Any of the four failures skips `setLoading(false)`, so the component renders `LoadingTaxonomyVisualize` forever and the thrown error becomes an unhandled rejection visible only in the console. The error messages written at lines 63, 74, 85, and 98 are never displayed.

**Impact**
This is the most likely visible failure in the application, and it compounds with two other findings. These pages call `swapToTable`, which has no server-enforced limit (P1-2), four times in series across the largest tables. On a large query the realistic outcome is a timeout, and a timeout renders as a permanent skeleton — indistinguishable from "slow" to the person watching. Neon cold starts make the trigger more likely.

**Suggested direction**
The minimum fix is an `error` state alongside `loading`, a `try/catch` around `doFetch()`, `setLoading(false)` in a `finally`, and rendering the already-written error message with a retry affordance.

The better structural fix is to move these three pages to SWR, which the rest of the application already uses. `Table.tsx:255`, `Pagination.tsx:52`, and `Grid.tsx:92` all use `useSWR`, which supplies `error` and `isLoading` and makes this class of bug unrepresentable — a flag that isn't hand-managed cannot be left stranded. The codebase currently has two competing data-fetching idioms, and the hand-rolled one is where this bug lives; converging removes the category. SWR also brings request deduplication and `keepPreviousData`, which helps the perceived-latency problem in P1-9. Note that the shared `fetcher` needs the fix in P1-3 for SWR's `error` to populate at all.

Also worth fixing while in these files: the four fetches are independent but awaited in series (lines 59, 72, 83, 94). `Promise.all` reduces latency to the slowest request instead of the sum of all four.

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P0-6 · Accessibility — Mobile navigation is not keyboard-operable
**Location** `app/components/header/MobileMenu.tsx:53`; same pattern at `app/components/docs/MobileTOC.tsx:72`

**Issue**
```tsx
<div role="button" className="btn btn-ghost lg:hidden p-1 sm:p-2" onClick={handleToggle}>
```

`role="button"` describes what the element is but does not make it focusable and does not synthesize keyboard activation. A `<div>` has no implicit tab stop, and there is no `tabIndex={0}`, no `onKeyDown` for Enter or Space, no `aria-expanded`, and no accessible name — the only child is a bare `<svg>` with no label.

Below the `lg` breakpoint the desktop tab bar is `hidden lg:flex` (`Header.tsx:42`), so this trigger is the only navigation available. Keyboard-only users on a narrow viewport, and screen-reader users generally, cannot reach any page except by typing URLs directly.

**Impact**
This is a total loss of navigation rather than a degradation, it affects the primary control on every mobile page view, and it is reproducible in seconds: load the site at phone width and press Tab.

**Suggested direction**
Use a real `<button>`. That is not pedantry — focusability, Enter/Space activation, correct semantics, and browser-provided focus and disabled behavior all come for free. Add `aria-label="Open navigation menu"` and `aria-expanded={isOpen}` so the state is conveyed rather than merely visual. The repo-wide rule worth adopting: if it is clickable, it is a `<button>` or an `<a>`; reach for `role` plus `tabIndex` plus `onKeyDown` only when building something HTML genuinely lacks, which is rare.

Related, one level up the tree: `app/(dashboard)/layout.tsx:8` renders `<button id="unfocusButton" className="w-0 h-0">`, a zero-size focusable element that is the first tab stop on every page, so keyboard users encounter an invisible control before any content. If it is load-bearing for a focus workaround, it should be removed from the tab order with `tabIndex={-1}` and `aria-hidden`.

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P0-7 · Accessibility — No skip link and no `<main>` landmark on most routes
**Location** `app/layout.tsx:50-58`, `app/(dashboard)/layout.tsx:5-14`, `app/(dashboard)/(content)/layout.tsx:3-9`

**Issue**
The dashboard layout is a plain `<div>` wrapping `<Header />`, `{children}`, and `<Footer />`; the content layout is another plain `<div>`. Neither emits `<main>`, and no skip link exists anywhere in the tree — the root `<body>` goes straight into providers. Some individual pages do this correctly (`app/(dashboard)/page.tsx:27` and the submit pages use `<main>`), but the shared layouts do not, so most routes have no main landmark.

Consequently, on every page a screen-reader or keyboard user must traverse the entire header — logo, hamburger or eight tab buttons with mega-menus, admin button, theme toggle, user menu — before reaching content, with no landmark to jump to and no bypass mechanism. This fails WCAG 2.4.1 (Bypass Blocks, Level A) and 1.3.1.

**Impact**
Because the header contains mega-menus with many nested links, the per-page cost is plausibly dozens of tab stops before the first content. It is also a two-file fix, making it the highest-value accessibility work available.

**Suggested direction**
Add `<main id="main-content">` in `app/(dashboard)/(content)/layout.tsx` so every content route inherits it, and add a skip link as the first focusable element inside `app/layout.tsx`'s `<body>`. The conventional implementation is an anchor to `#main-content` that is visually hidden until focused (`sr-only focus:not-sr-only` in Tailwind); hiding rather than removing matters because the link must remain reachable by Tab, which `display: none` would prevent. Audit for duplicate landmarks while doing this, since the homepage and submit pages already declare their own `<main>` — exactly one per page is the rule.

---

### P1 — Fix soon *(partial)*

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P1-1 · UX / Correctness — No custom 404 page and no root error boundary
**Location** Repository-wide: no `not-found.tsx` and no `global-error.tsx` exist anywhere under `app/`. Only two error boundaries exist: `app/(dashboard)/error.tsx` and `app/(dashboard)/(content)/(tour)/showcase/error.tsx`. `notFound()` is called by all ten entity detail pages (`explore/project/[project_id]`, `explore/analysis/[project_id]/[analysis_run_name]`, `explore/sample/[project_id]/[samp_name]`, `explore/library/[project_id]/[lib_id]`, `explore/assayPrep/[project_id]/[assay_name]`, `explore/occurrence/...`, `explore/assignment/...`, `explore/feature/[featureid]`, `explore/taxonomy/[taxonomy]`).

**Issue**
Every not-found path renders the built-in Next.js 404: unstyled, no header, no navigation, no branding, no route back into the application. The paths that reach it are ordinary, not exotic — the broken internal links in P0-1, a mistyped or stale entity URL, a record that was deleted after being shared, or a crawler following the dead sitemap entries. The absent `global-error.tsx` means an error thrown in the root layout or in the root error boundary itself falls back to the framework default as well.

**Impact**
This multiplies the cost of every other 404 in the application. It is also among the cheapest fixes available: one file, reusing existing layout components.

**Suggested direction**
Add `app/not-found.tsx` with the site header and footer, a plain explanation, and links into Explore and Search. Consider a second `not-found.tsx` inside `(dashboard)/(content)/` if entity-specific copy is wanted, since Next.js resolves the nearest boundary. Add a minimal `app/global-error.tsx` — it must render its own `<html>` and `<body>` because it replaces the root layout.

---

#### ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) P1-2 · Performance / Availability — No result ceiling, no rate limiting, and two amplification paths on public endpoints
**Location**
- Unbounded `findMany`: `app/api/[table]/route.ts:64`, `app/api/[table]/swapToTable/route.ts:21`
- Optional, uncapped `limit` parsing: `app/helpers/queries.ts:681-691`
- Required `take` (the correct pattern): `app/api/[table]/pagination/route.ts:236-243`
- Per-row relation counts: `app/api/[table]/pagination/route.ts:335-371`, driven by `app/components/paginated/Table.tsx:233-250`
- Unbounded nested includes: `app/api/[table]/pagination/route.ts:159-176`
- Shape/map filtering in application memory: `app/api/[table]/pagination/route.ts:271-280`, `:302-308`, `app/helpers/utils.ts:152-221`
- Unbounded distinct scans: `app/api/[table]/fields/distinct/route.ts:64-83`
- Middleware: `proxy.ts` (bare `clerkMiddleware()`, no route rules); no rate-limiting dependency or code found anywhere

**Issue**
Four related problems on endpoints reachable without authentication.

1. **No default or maximum result count.** `parseApiQuery` reads `limit` and validates it is a positive integer, but applies no default and no ceiling, and `/api/[table]` and `/api/[table]/swapToTable` call `findMany` with whatever comes back. `GET /api/occurrence` attempts to serialize the entire occurrence table.
2. **Per-row relation counts.** In the pagination route, `deepRelations` resolves to every other table when passed `true`, then issues one `count()` per returned row per relation inside a single `$transaction`. At the default page size of 25 rows and roughly 15 tables that is on the order of 375 count queries for one request. `Table.tsx:233-250` also contains an inversion: when the deep-relations selection is empty, the code sets `deepRelations=true`, so deselecting everything requests the most expensive query available rather than none.
3. **Unbounded nested rows.** `relations` combined with `relationsAllFields=true` sets `query.include[rel] = true`, which includes every related record with every field. `take` bounds the top-level rows only, so a 25-row page of projects can carry every sample belonging to those projects.
4. **Geometry filtering in application memory.** When shapes are present, DB pagination is skipped and the full matching set is loaded and filtered in JavaScript by `getLocationsInsideShapes`, which loops over locations × shapes × polygon edges. Every map-region search materializes all matching rows in function memory.

There is no rate limiting at any layer, so nothing bounds how often any of the above can be requested.

**Impact**
`swapToTable` is the endpoint all three visualize pages call four times each, which is the mechanism behind the timeouts in P0-5. `/api/[table]` is documented as a public API, so an outside consumer will eventually request a full table — not maliciously, simply because nothing indicates a limit — and exhaust a serverless function's memory or duration, or the Neon connection budget.

**Suggested direction**
Enforce a default and a maximum `limit` inside `parseApiQuery` so every route inherits it, for the same single-choke-point reason as P0-3. Return the applied limit in the response and document it, so consumers can tell a truncated page from a complete one; silent truncation is worse than an explicit ceiling because it produces incorrect analyses quietly. Validate `relations` and `relCounts` against `TableMetadata[model].relations` (`parseApiQuery` already does this at `queries.ts:545-552`), cap or remove `relationsAllFields`, and replace the per-row `count()` fan-out with a single `groupBy`. Fix the empty-selection inversion in `Table.tsx`.

Rate limiting is worth adding at the platform layer rather than in application code — Vercel's firewall or WAF rules require no code and cannot be bypassed by a route that forgets to call a helper.

For the visualize pages the deeper issue is architectural: they fetch raw rows in order to aggregate client-side, so the payload is orders of magnitude larger than the resulting chart needs. The long-term shape is a purpose-built aggregation endpoint that performs the `GROUP BY` in Postgres and returns chart-ready buckets. For map filtering, the real fix is geometry in the database (PostGIS), or at minimum a bounding-box `WHERE` on latitude and longitude to shrink the candidate set before the exact point-in-polygon test in JavaScript. The bounding-box prefilter is cheap and captures most of the benefit.

---

#### ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) P1-3 · API contract / Security / UX — Errors return HTTP 200, expose raw database messages, and never reach client error states
**Location**
- Every API route returns 200 on error: `app/api/[table]/route.ts:74-83`, `[id]/route.ts:18` and `:40-49`, `count/route.ts:91`, `pagination/route.ts:398`, `swapToTable/route.ts:35`, `fields/distinct/route.ts:105`, `fields/[distinctField]/route.ts:49`, `crons/seedDatabase/route.ts:9`, `crons/cleanEmptyTables/route.ts:8`, `api/file/upload/route.ts:65-68`. A search for `status: 4xx`/`5xx` across `app/api` returns no matches.
- Shared fetcher swallows failures: `app/helpers/utils.ts:7-13`
- Raw messages rendered in the UI: `app/components/paginated/Table.tsx:347-351`, `Pagination.tsx:76`, `Grid.tsx:118`, `app/(dashboard)/error.tsx:59`
- Unvalidated include parameters: `app/api/[table]/pagination/route.ts:148-176`
- `handlePrismaError` in `app/helpers/queries.ts` returns `err.message` for unrecognized codes
- Always-false condition: `app/components/paginated/Table.tsx:343`

**Issue**
Three defects that interlock.

**Status codes carry no information.** Every route responds 200 with `{ statusMessage: "error", error }`, including an unauthorized cron request. Consumers cannot distinguish success from failure by status, monitoring cannot alert on error rates, and `/api/[table]/[id]:40-44` models "no matching record" as an error rather than an empty result, forcing clients to treat absence as failure.

**The shared SWR fetcher never throws.** On `!res.ok` it returns `{ error: data.error }` instead of raising, so SWR's `error` value is never populated. All three paginated components destructure `error` from `useSWR` and branch on it; that branch is unreachable. Errors surface only through the separate `data.statusMessage === "error"` check, and when a genuine non-200 does occur (a platform timeout, for instance) `data.statusMessage` is `undefined`, so the component falls through to rendering with no `result` present. Relatedly, `Table.tsx:343` reads `error.toString() instanceof Error ? error.message : String(error)`, and `error.toString()` is a string, so the condition is always false.

**Raw Prisma messages reach the browser.** Every data route ends with the same pattern, which carries an in-repo TODO acknowledging it:

```ts
} catch (err) {
	const error = err as Error;
	//TODO: replace database error messages with generic error message
	return NextResponse.json({ statusMessage: "error", error: error.message });
}
```

Those strings are rendered directly by the table components. Prisma errors are verbose by design: model names, field names, constraint names, and sometimes fragments of the failing query. This becomes a schema-reconnaissance oracle because `pagination/route.ts:148-176` builds `query.include` from raw `relCounts` and `relations` parameters without validating them, so a guessed relation name returns a Prisma error describing the real schema.

**Impact**
Two costs. For security, error handling doubles as schema discovery. For usability, a mistyped filter surfaces a Prisma-flavored string rather than "no results match that filter," and the error and empty states that `TableStatusState.tsx` was written to display are partly unreachable.

**Suggested direction**
Return real HTTP status codes (400 for invalid input, 401/403 for auth failures, 404 for a missing record, 500 for unexpected errors) while keeping the `statusMessage` envelope for backward compatibility, and make `fetcher` throw on `!res.ok` so SWR's `error` populates. Return a generic client-facing message plus a stable error code, and log the real error server-side where it is debuggable — the message a user sees and the detail an engineer needs are two different artifacts, and conflating them means either the user sees too much or the logs show too little. Extend `handlePrismaError` to map known codes to friendly copy (`P2002` → already exists, `P2025` → not found) with a generic fallback plus a logged correlation ID. Validate `relCounts` and `relations` against `TableMetadata` so bad input produces a clear 400 instead of a leaked Prisma error. Fix the always-false condition at `Table.tsx:343`. Gating `error.message` behind a toggle in `app/(dashboard)/error.tsx:59` is a reasonable development affordance, but it should be limited to non-production builds.

---

#### ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) P1-4 · Security — `getBlobSizes` server action has no authentication and no input bounds *(not on dev)*
**Location** `app/actions/file/getBlobSizes.ts`, called from `app/components/explore/ProjectFileDownloads.tsx:146`

**Issue**
```ts
"use server";
import { head } from "@vercel/blob";

export async function getBlobSizes(urls: string[]): Promise<Record<string, number | null>> {
	const unique = [...new Set(urls.filter(Boolean))];
	const entries = await Promise.all(unique.map(async (url) => {
		try {
			const meta = await head(url);
```

No `auth()`, no host allowlist, and no cap on array length. This is the one server action in the repository without an auth check — every other action under `app/actions/` verifies `auth()` and, where relevant, a role permission or project ownership. A `"use server"` export is a network-reachable POST endpoint callable by anyone who can obtain its action ID, independent of whether the UI exposes it. Caller-supplied URLs are passed to `head()`, and `Promise.all` over an unbounded array lets one request fan out to arbitrarily many outbound calls.

**Impact**
Whether this is a true SSRF depends on whether `@vercel/blob`'s `head()` rejects non-blob hosts, which cannot be determined from this repository, so that possibility is not asserted. The unbounded `Promise.all` is a straightforward amplification primitive against the function budget regardless, which on Vercel means real cost and function-duration pressure. Downgraded from a blocker because the confirmed impact is resource consumption and file metadata, not data exposure.

**Suggested direction**
Three cheap layers: add `auth()`, validate each URL against the blob hostname (the `*.public.blob.vercel-storage.com` pattern already in `next.config.js:12` is the natural source of truth), and cap the array length. The general principle, easy to miss with the server-actions model: treat every `"use server"` export as a public API endpoint and validate its inputs accordingly. The mental model where it is "just a function the component calls" is what produces this class of gap.

---

#### ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) P1-5 · Performance — Explore > Features pays four compounding costs per page view
**Location** `app/api/[table]/pagination/route.ts:291-318`, `app/components/paginated/Table.tsx:223-231`, `:255-258`, `app/(dashboard)/(content)/explore/feature/page.tsx:6-13`, `app/helpers/queries.ts:388-402`

**Issue**
Four costs stack on every interaction:

1. **`COUNT(*)` per request.** Line 294 runs `tx[model].count({ where: query.where })` in the same transaction as the page fetch, on every page change, sort, and filter. Unfiltered, that is a full count over `Feature`. Postgres cannot satisfy `COUNT(*)` from an index alone under MVCC — it walks rows — so this grows linearly and permanently.
2. **Full `dna_sequence` in every row.** Line 311 calls `findMany(query)` with no `select` unless the client passes `fields`, and `Table.tsx` never does. Twenty-five complete sequences are fetched and serialized to build a table that does not display them.
3. **Three relation counts per row.** `Table.tsx:229` always sets `relCounts`, so the query requests `_count` for `Occurrences`, `Assignments`, and `BlastQueryResults` for each row. These are the largest child tables and the cost scales with both feature count and child-table size.
4. **A server aggregate before HTML.** `explore/feature/page.tsx:6-13` awaits a `min`/`max` aggregate on `sequenceLength_ODE` before streaming, after which the client fires the pagination request — a sequential round trip that adds Neon latency to first paint.

Search compounds it: `parseSearchQuery` (`queries.ts:388-402`) builds `{ OR: [...] }` with `contains` and `mode: "insensitive"` across every string column including `dna_sequence`, which has no supporting index (`Feature` declares only `@unique featureid`). A leading-wildcard `ILIKE` cannot use a B-tree index, so that is a sequential scan over a large text column.

**Impact**
Items 1 through 3 all scale with row count, so current latency degrades as data grows, and per P0-5 a timeout on the visualize pages renders as a permanent skeleton.

**Suggested direction** (roughly in value-per-effort order)

- **Stop fetching `dna_sequence`.** Have `Table.tsx` pass an explicit `fields` list covering only rendered columns. Largest win for the least risk: it shrinks payload, database I/O, and JSON serialization simultaneously.
- **Make `relCounts` opt-in.** Request counts only for currently visible columns rather than all to-many relations unconditionally.
- **Decouple the count from the page fetch.** In increasing order of effort: cache it briefly (it drives "showing 1–25 of N" and rarely needs to be exact to the second); fetch it in a separate request so rows render while the count resolves; or move to cursor-based pagination, which eliminates both the `COUNT(*)` and the `OFFSET` scan. Cursor pagination is the real fix, since `OFFSET` also degrades on deep pages as Postgres walks skipped rows, but it is a larger change and it costs random page access, which a data-browsing UI may genuinely want. Caching the count first is the pragmatic order.
- **Index for the search actually offered, or narrow the search.** Substring search over `dna_sequence` requires a trigram (`pg_trgm` GIN) index to be viable. If arbitrary substring search over sequences is not a real requirement — and BLAST is the correct tool for sequence similarity — excluding `dna_sequence` from the searchable field set is a one-line change that removes the problem entirely. Worth deciding deliberately rather than indexing reflexively.
- **Cache the min/max aggregate.** It changes only on ingest, so `unstable_cache` or a periodic revalidate removes a round trip from every visit.

---

#### ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) P1-6 · Performance — Explore list pages scan whole tables to build filter dropdowns
**Location** `app/(dashboard)/(content)/explore/sample/page.tsx:8-17`, `explore/project/page.tsx:8-13`, `explore/analysis/page.tsx:8-19`, `explore/assay/page.tsx:9-19`, with `getOptions` in `app/helpers/utils.ts`

**Issue**
Each of these server components fetches selected columns for **every row** in the table on every request, purely to derive the distinct values shown in filter dropdowns:

```tsx
const samples = await prisma.sample.findMany({
	select: {
		project_id: true,
		geo_loc_name: true,
		env_broad_scale: true,
		env_local_scale: true,
		env_medium: true,
		size_frac: true
	}
});
```

There is no `where`, no `take`, and no caching — a search of the repository finds no `unstable_cache` usage and a single `revalidate` export (`showcase/page.tsx:7`), so these run on every page view. The sample table is among the largest in the schema, and this query blocks first paint for the page.

**Impact**
A full-table scan on the entry page for each Explore section, growing linearly with ingest, on the routes most likely to be visited first. It also sits directly in the critical path: the query is awaited before any HTML streams.

**Suggested direction**
Two options, both better than the current shape. Replace each `findMany` with `groupBy` or `findMany({ distinct: [...] })` so Postgres returns distinct values instead of shipping every row into the function; then wrap the result in `unstable_cache` with a tag invalidated on submission, since the option lists change only on ingest. For high-cardinality fields, a server-side typeahead endpoint is more appropriate than a fully materialized dropdown.

---

#### P1-7 · Security / Reliability — BLAST request parameters are interpolated unencoded and unvalidated *(not an issue)*
**Location** `app/helpers/blast.ts:204-215` (`blastRequestToString`), `:104-106` (`task`), `:107-134` (numeric options), `:235-248` (upstream fetch), `:253` (cookie growth), `:261` (upstream error passthrough). Called from `app/api/[table]/route.ts:48-53` and the `pagination` and `count` routes.

**Issue**
The upstream BLAST request is assembled by string concatenation with no encoding:

```ts
function blastRequestToString(blast: BlastRequest) {
	return (
		blast.queries.map((q) => `query=${q}`).join("&") +
		(blast.assay_name ? `&assay_name=${blast.assay_name}` : "") +
		...
```

Every interpolated value is caller-controlled and none is passed through `encodeURIComponent` or `URLSearchParams`, so a value containing `&` or `=` injects additional parameters into the request sent to `${process.env.NEXT_PUBLIC_SERVER_URL}/blast`. The `task` option is accepted as an arbitrary string with no allowlist (`:104-106`), and the numeric options are parsed but never range-checked (`:107-134`), so `max_target_seqs` accepts any integer. Upstream error text is returned to the caller verbatim at `:261`. The `fetch` at `:235` has no timeout or `AbortSignal`, so a hung upstream holds the serverless function until the platform terminates it. Separately, `:253` appends to a `savedBlasts` cookie without bound, and cookies are capped near 4 KB, so a heavy session eventually produces oversized request headers.

**Impact**
Parameter injection into an internal service, with the concrete effect depending on how that service consumes the values — the reason this is stated as an unencoded-input and missing-allowlist defect rather than as a confirmed injection. Independent of that, unbounded `max_target_seqs` and a timeout-free upstream call are cost and availability problems on an endpoint reachable without authentication.

**Suggested direction**
Build the upstream URL with `URLSearchParams` so encoding is automatic and structural rather than remembered. Allowlist `task` against the BLAST tasks actually supported, clamp `max_target_seqs`, `evalue`, `perc_identity`, and `qcov_hsp_perc` to sane ranges, and add an `AbortSignal.timeout()` to the fetch. Replace the verbatim upstream error passthrough with a generic message plus a server-side log, consistent with P1-3. Cap or restructure the `savedBlasts` cookie, which is a better fit for server-side storage keyed by user.

---

#### ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) P1-8 · Security — No security response headers are configured
**Location** `next.config.js` (no `headers()` function; only `experimental.serverActions` and `images.remotePatterns`), `proxy.ts` (no header manipulation)

**Issue**
The application sets no Content-Security-Policy, `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` or `frame-ancestors`, or `Permissions-Policy`. Vercel supplies HSTS at the edge for its domains, but the rest are application responsibilities. Without `frame-ancestors` or `X-Frame-Options`, the site can be embedded in a third-party frame, which is the precondition for clickjacking against authenticated admin controls. Without a CSP there is no defense-in-depth if an injection is introduced later.

Two useful constraints on the CSP work: `images.remotePatterns` is already tightly scoped to `img.clerk.com` and `*.public.blob.vercel-storage.com`, and the inline theme-initialization script at `app/layout.tsx:27-48` will require a nonce or hash under a strict `script-src`.

**Impact**
No known active exploit, which is why this is P1 rather than a blocker. It is also inexpensive: one `headers()` block in `next.config.js`. Missing headers are the kind of item that surfaces immediately in any external security review or institutional assessment.

**Suggested direction**
Add a `headers()` entry in `next.config.js` covering `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (or `frame-ancestors 'none'`), and a `Permissions-Policy` disabling unused features. Introduce CSP in `Report-Only` mode first and promote it once the report stream is clean — a CSP written blind against a Clerk, Leaflet, Chart.js, and Vercel Analytics stack will otherwise break something on the first deploy. Set `poweredByHeader: false` while in the file.

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P1-9 · UX — Table refetches replace content with a skeleton; several async states are unannounced
**Location** `app/components/paginated/Table.tsx:255-258` and `:337`, `app/components/paginated/Pagination.tsx:52-58`, `Grid.tsx:92-98`, `app/(dashboard)/(content)/search/page.tsx:39`, `app/components/paginated/TableStatusState.tsx:27-41`, `app/components/charts/wrappers/AlphaDiversityDisplay.tsx:466-511`

**Issue**
- **The main table shows a full skeleton on every refetch.** `Table.tsx:255` calls `useSWR(url, fetcher)` with no options, so changing a filter or a page replaces the rendered table with `<LoadingTable />`. `Pagination.tsx:56` and `Grid.tsx:96` both pass `keepPreviousData: true`, so the correct pattern already exists in the codebase and simply is not applied to the main table. Content disappearing reads as much slower than content updating in place, so this likely accounts for a meaningful share of perceived latency independent of query time.
- **Search renders nothing on first paint.** `if (!table) return <></>` yields a blank page until the `useEffect` resolves the table parameter, and `/search` has no `loading.tsx` unlike the Explore routes.
- **No `aria-live` region on async status.** `TableStatusState.tsx` handles loading, error, and empty visually, but screen readers are not notified when results change. `AlphaDiversityDisplay.tsx:466-511` implements this correctly and is the in-repo model.

**Suggested direction**
Add `keepPreviousData: true` to the `Table.tsx` SWR call — a one-line change with an outsized effect on perceived speed. `revalidateOnFocus: false` and a `dedupingInterval` are also worth considering, since this data is not real-time and refetching on tab focus is pure cost. Replace the search page's empty fragment with a skeleton and add a `loading.tsx`. Wrap the status output of `TableStatusState` in `aria-live="polite"`.

---

#### ![DONE](https://img.shields.io/badge/%E2%9C%93_DONE-16a34a?style=flat-square) P1-10 · Accessibility — Data table semantics and controls
**Location** `app/components/paginated/Table.tsx:497-660`; sort handlers at `:505-513`, `:580-588`, `:631-639`; header cells at `:504` and `:536` (`<th>`) versus `:561`, `:579`, `:606`, `:630` (`<td>`); filter inputs at `:519-533`, `:649-655`

**Issue**
Four problems in the component that constitutes the data-browsing experience:

1. **Sorting is a click-only `<div>`** — `<div className="cursor-pointer select-none ..." onClick={...}>` with no `tabIndex`, `onKeyDown`, or `aria-sort`. Keyboard users cannot sort, and screen readers receive no indication that a column is sortable or how it is currently sorted.
2. **`<td>` inside `<thead>`.** The title column uses `<th>`, but the remaining header cells are `<td>`. Assistive technology relies on `<th>` to announce the column when moving between cells; with `<td>` headers the table degrades to an unlabeled grid of values.
3. **Filter inputs have no accessible name.** The wrapping `<label>` is a DaisyUI styling container holding only `<SearchIcon />` and the input, so the sole hint is `placeholder="Press Enter to search"`. Placeholders are not accessible names and disappear on input.
4. **No `scope`, `<caption>`, or `aria-label`** on the table, so nothing identifies what it contains.

**Impact**
Every Explore and Search page routes through this component, so one fix pays out across the application. It sits below the P0 accessibility items only because those are cheaper and affect navigation itself; on merit it is close to blocking, since a data portal whose primary table cannot be operated without a mouse fails any Section 508 review.

**Suggested direction**
Make each sortable header a `<button>` inside a `<th scope="col">` and put `aria-sort="ascending|descending|none"` on the `<th>` — the standardized attribute screen readers already announce, which is why it is preferable to a custom convention. Convert the remaining `<td>` header cells to `<th scope="col">`. Give each filter input a real name via `sr-only` label text or `aria-label={head}`. Add `<caption className="sr-only">` naming the table. The `overflow-x-auto` wrapper at `:497` is correct, but a scroll container needs `tabIndex={0}` and an accessible name to be scrollable by keyboard, or off-screen columns remain unreachable.

---

#### ![WIP](https://img.shields.io/badge/%E2%86%BB_WIP-2563eb?style=flat-square) P1-11 · Accessibility — Charts, maps, and the globe have no text alternative
**Location** `app/components/charts/**` (for example `SampleScatterPlot.tsx:404`, `BoxWhiskerPlot.tsx:114`, `TaxaBarChart.tsx`, `DoughnutChart.tsx`), `app/components/OceanGlobe.tsx:491-510`, Leaflet maps under `app/components/map/**`

**Issue**
Chart.js renders to `<canvas>`, which is an opaque bitmap to assistive technology with no readable DOM inside it. None of the chart components supply `role="img"` with a summarizing `aria-label`, an `aria-describedby` pointing at a text summary, or a data-table fallback. Chart.js tooltips are hover affordances and are not exposed to screen readers. The net effect is that the entire Visualize section conveys no information to a screen-reader user.

**Progress**
Globe done: `OceanGlobe` now wraps the canvas in `role="img"` with a summarizing `aria-label` (same pattern as the ambient word cloud) and sets `aria-hidden` on the canvas so AT does not announce an unlabeled bitmap. Charts and Leaflet are still open.

**Suggested direction**
Two layers, and the second is the one worth pushing for:

1. **Minimum:** `role="img"` plus a generated `aria-label` describing what the chart shows and its headline numbers, for example "Bar chart of relative abundance by phylum across 412 samples; most abundant: Proteobacteria at 34%."
2. **Better:** render a visually hidden `<table>` of the underlying series alongside each chart. This is the standard accessible-charting pattern and it fits this application particularly well because the data behind the charts is the product — a screen-reader user gets real numbers rather than a summary sentence, and the same structure is most of the work for a "download this chart's data as CSV" feature that data users tend to request anyway. Accessibility work and a broadly useful feature land in the same change.

For Leaflet, ensure markers are keyboard-reachable with accessible names and provide a non-map path to the same records; the Explore table already is that path, so linking the two explicitly may be most of the work. `app/(dashboard)/(content)/(tour)/ambient/page.tsx:510-511` already applies `role="img"` with an `aria-label` to the word cloud and is the in-repo pattern to follow.

---

#### ![TODO](https://img.shields.io/badge/%E2%9C%97_TODO-dc2626?style=flat-square) P1-12 · Mobile — Search, BLAST, and the query builder do not reflow at phone widths
**Location** `app/(dashboard)/(content)/search/page.tsx:68`, `app/components/search/SearchUI.tsx:1142`, `:1240-1242`, `app/components/search/BlastSearchResult.tsx:110`, `:146`, `app/(dashboard)/(content)/visualize/layout.tsx:8`, `app/components/VisualizeTabs.tsx:11`

**Issue**
Several fixed multi-column grids have no responsive variant:

```tsx
// search/page.tsx:68 — BLAST form and results side by side at every breakpoint
<div key={table + "blast"} className="collapse-content grid grid-cols-2 gap-10">
	<BlastSearch />
	<BlastSearchResult ... className="h-200" />
```

```tsx
// SearchUI.tsx:1241 — percentage columns shrink rather than stack
className={`grid ${type === "relation" && !noTable ? "grid-cols-[30px_14%_14%_20%_1fr]" : "grid-cols-[30px_14%_26%_1fr]"}`}
```

At roughly 390px, `grid-cols-2` leaves the BLAST textarea and its results about 175px each, and `h-200` forces a tall fixed panel. The query builder's percentage columns compress instead of stacking, so each field becomes unusably narrow. `BlastSearchResult` uses `grid-cols-[auto_1fr_auto]` and a six-column grid with `break-all`, which on a phone produces either horizontal scroll or near-single-character columns. Because `visualize/layout.tsx:8` embeds `<SearchUI noTable />`, all three visualize pages inherit the query-builder problem. `VisualizeTabs.tsx:11` is a `flex` with no `flex-wrap` holding three `px-6 py-3` buttons.

**Impact**
The query builder is the control that makes the underlying API usable interactively, and it is the component that degrades first on a small screen.

**Suggested direction**
Mobile-first variants: `grid-cols-1 lg:grid-cols-2` for the BLAST section, and for query-builder rows, stack to labeled full-width fields below `md`. That choice is worth being deliberate about — a query-builder row is conceptually a record (field, operator, value), and the columnar desktop layout is one presentation of it. On a phone the correct move is to change the presentation to stacked labeled inputs rather than compress the columns, the same reasoning behind converting wide tables to cards; compressing preserves the visual metaphor and destroys usability. Replace `h-200` with a responsive max-height and add `flex-wrap` plus horizontal scroll to `VisualizeTabs`. Test at 390px and 360px, which cover most phone traffic.

---

#### ![WIP](https://img.shields.io/badge/%E2%86%BB_WIP-2563eb?style=flat-square) P1-13 · Code quality — No automated tests, and linting is entirely non-functional
**Location** Repository-wide. No `*.test.*`, `*.spec.*`, `vitest.config.*`, `jest.config.*`, or `playwright.config.*` exists. No `eslint.config.*` or `.eslintrc*` exists, despite `eslint@^9.39.1` and `eslint-config-next@16.2.10` being dependencies (`package.json:51-52`) and `package.json:24` defining `"lint": "next lint"` on `next@16.2.6` (`:61`).

**Issue**
No automated check verifies that any behavior in the application still works.

Linting is not merely unconfigured — it cannot run. `next lint` was **removed** in Next.js 16 in favor of invoking the ESLint CLI directly, and `next build` no longer lints as part of the build, so `npm run lint` fails on this version. ESLint 9 also requires flat config (`eslint.config.mjs`), and no config file of either format exists. The practical result is that `eslint-plugin-jsx-a11y` — bundled with `eslint-config-next` and capable of catching several accessibility findings above automatically — has never run against this codebase, and nothing in CI or the build would report it.

**Impact**
P0-1 is the argument. A route rename broke roughly a dozen links and nothing caught it: no test, no lint rule, and no type error, because template-literal `href`s are just strings. This is the class of defect least likely to be caught by review alone.

**Suggested direction**
Target the specific failure modes present rather than chasing coverage:

1. **A working ESLint setup with `jsx-a11y` enabled.** Highest value per minute, because it converts a category of accessibility findings into automated feedback and prevents regression after they are fixed. The plugin is already a transitive dependency. The migration is mechanical — `npx @next/codemod@canary next-lint-to-eslint-cli .` generates `eslint.config.mjs` and rewrites the `lint` script to `eslint .` — after which the script needs wiring into CI or the `build` script, since Next 16 no longer lints during builds.
2. **A handful of Playwright smoke tests** that load the main routes and assert no 404 and no console error. This is the test that would have caught P0-1; an "every internal link resolves" crawl is a cheap superset.
3. **Typed route helpers** in place of raw template-literal `href`s, for example `analysisUrl(project_id, analysis_run_name)`. This is the structural fix for P0-1 because it converts a broken link from a runtime 404 into a compile error, which is strictly stronger than testing for it. Next.js typed routes are worth evaluating for the same reason.

Enabling `noUncheckedIndexedAccess` in `tsconfig.json` is also worth considering. `strict` is already on, but that flag is what catches `array[i]` and `record[key]` accesses that TypeScript otherwise types as always defined — a common source of production `undefined` errors. It will surface a batch of existing errors, so treat it as a deliberate cleanup task rather than a switch flip.

---

### P2 — Worthwhile, not urgent

| # | Status | Area | Location | Issue | Direction |
| --- | --- | --- | --- | --- | --- |
| P2-1 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Security | `app/api/file/upload/route.ts:30-36` | `onBeforeGenerateToken` sets `allowedContentTypes` and `addRandomSuffix` but no `maximumSizeInBytes`, so any contributor-role account can upload arbitrarily large blobs | Set an explicit size cap sized to the largest legitimate TSV. The rest of this route is a good model — auth, role check, content-type allowlist, random suffix |
| P2-2 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Reliability | `app/api/file/upload/route.ts:63-68` | The catch block returns an error body with no status code, so failures respond 200; the in-file comment notes the upload webhook retries until it receives a 200 | Return a 4xx/5xx so retry semantics work as intended (see P1-3) |
| P2-3 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Correctness | `deleted_ODE` on `prisma/schemas/project.prisma:76`; set in `projectEdit.ts:338`; cleared by `fixDeletedSamples.ts` | Samples flagged for deletion are excluded only by the client-side `GlobalOmit` list; no server-side filter exists in `parseApiQuery`, so pending-deletion rows are still returned by the API and counted in totals | Filter `deleted_ODE` server-side in the query layer alongside the P0-3 `omit` work, so "deleted" means the same thing in the UI and the API |
| P2-4 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Perf | `app/api/[table]/pagination/route.ts:335-371`, `app/components/paginated/Table.tsx:233-250` | Deep-relations mode issues `rows × relations` individual `count()` calls in one transaction; the empty-selection case requests all relations. Covered in P1-2; listed separately because the mapping between checkbox state and requested relations also appears inverted and deserves review | Batch via `groupBy`; review the filter-to-parameter mapping. The user-facing warning at `Table.tsx:455-457` does not cover the inverted case |
| P2-5 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | A11y | `app/components/Modal.tsx:25-41`, `:47-48` | Close button is a bare `✕`; the backdrop button's only text is "close" — neither has an `aria-label` | Add `aria-label="Close dialog"`. Using native `<dialog>` is already correct — focus trapping and Escape come free |
| P2-6 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | A11y | `PaginationControls.tsx:22-49`, `:86-109`; `ThemeToggle.tsx:40-46`; `BlastSearchResult.tsx:111-116` | Icon-only controls (first/prev/next/last, theme swap, `❮`/`❯`) with no accessible name | Add `aria-label` to each; a lint rule prevents recurrence |
| P2-7 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | A11y | `DocsPageSection.tsx:49`; `visualize/*/page.tsx`; `BlastSearchResult.tsx:123-137`; `BlastSearch.tsx:300`; `ExploreSearch.tsx:105` | Heading hierarchy: docs pages start at `<h2>`, visualize subpages have no heading, and `<h1>` labels subsections in several BLAST components | One `<h1>` per page describing the page, `<h2>`+ for sections. Headings are the primary screen-reader navigation structure, so this is more than cosmetic |
| P2-8 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | A11y | 80+ uses of `text-base-content/50`, `/60`, `opacity-50`; e.g. `DashboardExtras.tsx:575`, `:585`, `DataSummaryHighlights.tsx:246`, `GbifImage.tsx:171` | 10–11px text at 50% opacity likely fails 4.5:1 in both themes | Measure with a contrast checker, then raise to `/70`+ for small text. Both themes are properly defined in `styles/globals.css:6-61`, so this is a token-value fix rather than a theming change |
| P2-9 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | A11y | Framer Motion under `(tour)/**`; `.sponsors-logo` infinite animation; `OrganismOutlines.tsx:83` `animate-float` | `prefers-reduced-motion` is respected only in `StatCountUp.tsx:13` and one rule at `globals.css:480-483` | Gate looping and large-movement animation behind `motion-reduce:` or `useReducedMotion`. Infinite animations are the worst offenders for vestibular disorders |
| P2-10 | ![DONE](https://img.shields.io/badge/%E2%9C%93-16a34a?style=flat-square) | A11y / Mobile | `UserAdder.tsx`; `SearchUI.tsx`; `TaxonomyVisualToggle.tsx` | Touch targets around 20px, well under the ~44px guideline | Icon-only controls bumped from `btn-xs` (~20px) to `btn-sm` (~32px). Taxonomy toggle uses `h-10`. Query-builder first column is 2rem so the delete button fits |
| P2-11 | ![DONE](https://img.shields.io/badge/%E2%9C%93-16a34a?style=flat-square) | Mobile | `MobileMenu.tsx:106-121` vs `MegaMenus.tsx:83-84` and `VisualizeTabs.tsx:28-35` | The mobile Visualize submenu listed only Metadata and Taxonomy; Alpha Diversity exists but had no mobile entry point | Added the missing `/visualize/alphaDiversity` link so the mobile submenu matches desktop |
| P2-12 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Mobile | `EditHistory.tsx:30` (`min-w-[600px]`); `Table.tsx:453` (`grid-cols-3` toolbar); `Header.tsx:22-25` (fixed logo widths) | Fixed widths likely overflow near 390px | Responsive variants or scroll containers |
| P2-13 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Code quality | ~20 `@ts-ignore` sites, notably `api/[table]/route.ts:63`, `pagination/route.ts:293`, `:310`, `:360`, `swapToTable/route.ts:20`; `explore/taxonomy/[taxonomy]/page.tsx:148`, `:169` (`(dbTaxonomy as any)[rank]`) | Dynamic `prisma[model]` access defeats type checking on the core public API | A typed model map (`Record<TableName, Delegate>`) restores safety at the boundary. These are load-bearing suppressions on the most-used code path, not incidental ones |
| P2-14 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Code quality | `explore/project/page.tsx:14`, `explore/sample/page.tsx:18` (`if (!projects) return <>Loading...</>`); `Table.tsx:917`, `:939` (`"test" === null`) | Unreachable branches: `findMany` always returns an array, and the string comparison is constantly false. Dead code rather than user-visible defects | Remove. Worth noting because these read as real states during review and obscure genuine error handling |
| P2-15 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Code quality | `SearchUI.tsx:185` (`console.log(err)` swallowing URL parse errors); `AnalysisSubmit.tsx:210`; `explore/*/sitemap.ts:21-27` | Errors logged to console only; the user sees nothing or a generic message | Use `console.error` server-side and surface something actionable. The `SearchUI` case means a malformed shared search URL fails silently |
| P2-16 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Code quality | `featuredOrganisms.tsx` (~1777 lines), `SearchUI.tsx` (~1755), `ActualMap.tsx` (~1113), `queries.ts` (~1119), `Table.tsx` (~1041) | Very large files | Not urgent, but `SearchUI.tsx` and `Table.tsx` are the two files most affected by the UI work above, so splitting them first reduces that work. Separating static data from components in `featuredOrganisms.tsx` is the easiest win |
| P2-17 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Content | `TaxonomyBubbleChart.tsx:73-76` ("temporarily disabled", ~70 commented lines); `learn/page.tsx:371`, `:383`; `learn/discoveries/page.tsx:302`, `:314` ("Coming Soon!"); `ImpactLearnPage.tsx:376`, `:394` ("Photo placeholder"); `featuredOrganisms.tsx:1656` ("Attribution details coming soon.") | Visible unfinished content on live pages | Finish or hide behind a flag. "Coming Soon!" reads as beta regardless of whether the badge is removed |
| P2-18 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Content | `app/(dashboard)/page.tsx:196-204` | `FeaturedOrganismsSection` and the taxonomy spotlight row are commented out ("temporarily disabled for main merge"), though `TopTaxonomiesSummary.tsx` appears fully implemented | Check whether the component can simply be re-enabled; if not, the blocking issue is worth recording |
| P2-19 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Content | `app/(dashboard)/(content)/tourmaline/page.tsx` renders `UnderConstruction` | A live route displays "Under Construction" | Correctly disallowed in `robots.ts:8`, so exposure is low, but confirm no in-app links point at it |
| P2-20 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Schema | `prisma/schemas/*.prisma` — no `createdAt`/`updatedAt` on any model (some have `dateSubmitted`); no `onDelete` on `Assay` relations (`analysis.prisma:13`, and `Library`/`AssayPrep` → `Assay` in `project.prisma`); no `@@index` on `Taxonomy` rank columns | Timestamps aid debugging and provenance; missing `onDelete` risks failed or orphaning deletes; `TopTaxonomiesSummary` filters `Taxonomy` by kingdom with no supporting index | Add `createdAt`/`updatedAt` going forward, set explicit `onDelete` on every relation, and index filtered columns. Most core relations already declare cascade deletes; this concerns the remaining gaps |
| P2-21 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | SEO | ~119 of ~125 `page.tsx` files export no `metadata`; only `learn/edna101`, `learn/discoveries`, `learn/impact`, `explore/assignment`, and `explore/occurrence` do | Every other page inherits the root title "Ocean DNA Explorer", so search results and browser tabs are indistinguishable | Add per-page `metadata`, and `generateMetadata` for dynamic entity pages so a shared link previews the actual record. Cheap, and directly serves findability |
| P2-22 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Nav | `Header.tsx:49` (`{/* <TabButton tabName="Contribute" route="/contribute" /> */}`) vs `static-sitemap.xml/route.ts:95-97` | `/contribute` is commented out of the nav but remains routable and listed in the sitemap | Ship it or remove it from the sitemap; currently search engines can route users to a page the nav hides |
| P2-23 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Perf | `app/helpers/prisma.ts:28-34` | Prisma via `@prisma/adapter-pg` with no visible pool tuning; no `unstable_cache` anywhere and a single `revalidate` in the repository (`showcase/page.tsx:7`) | Effectively everything is dynamic and uncached, so every interaction pays full Neon latency including cold starts. Caching genuinely static data (schema metadata, `deadValues`, table counts, min/max aggregates, filter options per P1-6) is the cheapest available latency win |
| P2-24 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Docs | `app/docs/page.tsx:5` (`//TODO: add content`); `app/docs/api/endpoints/page.tsx:138` documents `?limit=3` | The docs landing page is a stub (title, quick-nav, "Get Started" button). The documented endpoints describe `limit` but not the absence of a default or maximum, which will change when P1-2 lands | Fill in the landing page, and document the pagination contract and applied limit once P1-2 introduces one. Internal endpoints (`pagination`, `count`, `swapToTable`, `fields/distinct`) do not need public documentation; a short "internal, may change without notice" note is sufficient if their existence needs acknowledging at all. `/api/user` should be removed from the public surface per P0-2 rather than documented |
| P2-25 | ![TODO](https://img.shields.io/badge/%E2%9C%97-dc2626?style=flat-square) | Cleanup | `BlastSearch.tsx:30` (unused `prevQueries` state), `:20-22` (in-repo TODOs: clear button, query history, use `useRouter` instead of `window.location.href`), `:227`; numeric inputs render `NaN` when unset (`:333`, `:372`, `:393`) | `NaN` appearing in a form field is the most user-visible of these. The `window.location.href` navigation at `:227` forces a full page reload where `useRouter` would perform a client transition | Address the `NaN` rendering first; the navigation change is small and improves perceived speed |

---

### Likely false positives and downgraded items

Recorded so they are not re-raised, and so the reasoning is available if the surrounding code changes.

1. **Homepage Suspense boundaries with commented-out children do not show permanent skeletons.** `app/(dashboard)/page.tsx:166-169` and `:173` wrap `WidgetCardSkeleton` fallbacks around commented-out `MetadataCompletenessCard` and `TableCountsCard`. React renders a fallback only while a child suspends; with no children there is nothing to suspend, so these render as empty. The markup is dead and should be removed, but no loading placeholder is displayed to users.
2. **`if (!projects) return <>Loading...</>` is unreachable.** `prisma.findMany` resolves to an array, never a nullish value, so this branch in `explore/project/page.tsx:14` and `explore/sample/page.tsx:18` never executes. Dead code (P2-14), not a missing skeleton.
3. **The inline script in `app/layout.tsx:27-48` is not an injection vector.** It is a static theme-initialization function with no interpolated values. It does constrain the CSP work in P1-8, since a strict `script-src` will need a nonce or hash for it.
4. **The admin Prisma console cannot execute queries.** `app/actions/unsafeConsole.ts:42` has the execution line commented out, so the action parses input and returns success without touching the database. It is also correctly gated on `manageDatabase`. This is a non-functional admin feature to finish or remove, not a security issue — and the parse-only path means the console UI silently reports success without doing anything, which is worth knowing before someone relies on it.
5. **Role application does not permit privilege escalation.** `app/actions/roleApplication.ts:23-25` writes `publicMetadata.roleApplication` for the caller's own user ID after validating the role against `Roles`; it does not write `role`, and grants are issued only through `editUser.ts`, which enforces `manageUsers` plus a role hierarchy.
6. **Clerk session-claim role mapping fails closed.** Role checks read `sessionClaims?.metadata?.role` while `editUser.ts:42` writes Clerk `publicMetadata`, so the mapping lives in dashboard configuration rather than in code. A misconfiguration yields no permissions rather than universal permissions, so it is a configuration item (HV-1), not a vulnerability.
7. **SSRF via `getBlobSizes` is not established.** Only the unauthenticated access and the unbounded fan-out are asserted in P1-4; whether `head()` will fetch arbitrary hosts is listed in HV.
8. **Search-index staleness affected earlier verification.** Workspace search returns paths for files that no longer exist following the route rename, including the legacy single-segment analysis, occurrence, and assignment routes. When grep output conflicts with a file read, trust the file read.

---

### HV — Needs human verification

Items that could not be settled from source. Several gate findings above.

1. **`CRON_SECRET` is set in production.** `api/crons/seedDatabase/route.ts:7-9` compares `authHeader !== \`Bearer ${process.env.CRON_SECRET}\``. If the variable is unset, the expected value becomes the literal string `"Bearer undefined"`, which is guessable — converting a protected endpoint into a public one that reseeds the database. Env files were not read. **Verify before release**; it is a one-minute check with a severe worst case. The endpoint should also fail closed explicitly when the variable is missing, so a deployment misconfiguration cannot silently open it. Note that both cron routes currently return HTTP 200 on rejection (P1-3), which makes monitoring for abuse harder.
2. **Vercel plan function timeout.** No `maxDuration` is set anywhere (`vercel.json` contains only crons), so platform defaults apply. BLAST runs synchronously inside `/api/[table]`, `/api/[table]/pagination`, and `/api/[table]/count` via `fetchBlast`, and the pagination transaction sets a 30-second timeout (`pagination/route.ts:316`) that may exceed the function limit. Confirm the ceiling; if BLAST can exceed it, that flow needs a job-and-poll pattern rather than a synchronous request.
3. **`@vercel/blob`'s `head()` behavior on non-blob URLs**, which determines whether P1-4 is only an amplification issue.
4. **Whether the public data API is intentionally fully open**, including whether any table holds embargoed or pre-publication data that a submitter would expect to remain private. The API currently returns every scalar column of every table to anonymous callers.
5. **Whether `analysis_run_name` is globally unique.** This gates which P0-1 fix is safe; the compound key `project_id_analysis_run_name` implies it is not.
6. **Clerk JWT template maps `publicMetadata.role` → `sessionClaims.metadata.role`.** Invisible in the repository and confusing to debug later; it fails closed, so this is confirmation rather than risk.
7. **`NODE_ENV` is not `development` in production.** `app/helpers/withDb.ts:6-9` returns `true` from `validateBlobs` unconditionally when `NODE_ENV === "development"`, bypassing blob validation. Normal for Vercel, but the failure mode is silent.
8. **Real contrast ratios** for P2-8, measured against both rendered themes.
9. **Actual mobile rendering** at 390px and 360px. The mobile findings are read from class names; device emulation will confirm which overflow in practice and may surface issues static reading cannot.

**Manual checks worth running before release**

- Tab through the site at phone width without touching the mouse. Confirms P0-6 and P0-7 in about two minutes.
- Click "View analysis" from the homepage dashboard card. Confirms P0-1 and P1-1 immediately.
- Run a visualize query large enough to time out. Confirms P0-5.
- From a logged-out private window, request `/api/user` and `/api/project`. Confirms P0-2 and P0-3.
- Sign in with a non-admin account and navigate to `/admin/users`. Confirms P0-4.
- Request `/api/occurrence` with no `limit`, and `/api/project/pagination?take=25&deepRelations=true`, and compare response times and payload sizes. Confirms P1-2.
- Run a screen reader (NVDA on Windows) over Explore > Features and one visualize page. Grounds P1-10 and P1-11.
- Run Lighthouse on the homepage, Explore > Features, and Search under mobile emulation.

---

### Open decisions

These are product choices rather than defects. Each is currently decided implicitly by the code; making the decision explicit is the action.

1. **The submit flow is desktop-only.** `submit/project/page.tsx:13-14`, `submit/analysis/page.tsx:14`, and `app/components/submit/SubmitMobileGate.tsx` hide the form below `lg` and show a gate directing users to a desktop. Multi-file TSV upload with progress tracking is a poor fit for a phone, and an explicit gate is better than a broken form, so this is defensible — but it is currently the default behavior rather than a stated policy. Options: keep the gate and invest in its copy (explain why, offer to email a resume link); support a mobile review mode where submitters can check status and metadata without uploading; or build full mobile submit. If the gate stays, documenting it prevents it from reading as a bug.
2. **Whether `editHistory` should be public.** There is a real FAIR provenance argument for publishing it, but if so it should be a curated shape rather than the raw audit blob, which contains historical blob URLs. Currently it is public as a side effect of the missing `omit` clause (P0-3).
3. **Whether substring search over `dna_sequence` is a supported feature.** If not, removing it from the searchable field set is a one-line fix for the worst search-performance problem (P1-5), and BLAST already covers sequence similarity properly.
4. **Whether the public API carries a stability guarantee once beta ends.** This determines how much of P2-24 matters. If external consumers will script against `/api/{table}`, the applied limit and the response envelope need documenting before the guarantee is implied.

---

## 3) Suggested fix order

Ordered by user-facing impact divided by effort, with dependencies respected.

| # | Fix | Findings | Why this position |
|---|-----|----------|-------------------|
| 1 | Verify `CRON_SECRET` is set in production | HV-1 | Two minutes, and the worst case is a publicly reseedable database. First purely on risk-to-effort |
| 2 | Fix analysis deep links, the `redirect()` at line 38, and the sitemap; add a compatibility redirect; add `not-found.tsx` | P0-1, P1-1 | Most visible defect, on a primary navigation path. Small, well-scoped, blocks nothing else. The 404 page belongs in the same change because it is what those links currently reach |
| 3 | Add auth to `/api/user` and `/api/user/[userId]` (split narrow lookup vs. admin list); add auth and bounds to `getBlobSizes` | P0-2, P1-4 | Small and self-contained, and closes the PII exposure before external accounts exist. Caller split is already traced in P0-2 |
| 4 | Omit `userIds` and `editHistory` server-side at the query layer; filter `deleted_ODE` in the same pass | P0-3, P2-3 | Completes the chain started in step 3 — it is not closed until both halves are done. Requires care because eight ownership checks read `userIds` |
| 5 | Add the `manageUsers` gate to `admin/users/layout.tsx` | P0-4 | One check, copying the pattern `admin/(database)/layout.tsx` already uses |
| 6 | Add error states to the three visualize pages, ideally by moving them to SWR; make `fetcher` throw | P0-5, P1-3 (partial) | Turns the most likely visible failure from a permanent spinner into an honest message. The `fetcher` fix is a prerequisite for SWR error handling anywhere |
| 7 | Accessibility basics: `<main>` plus skip link, a real `<button>` for the mobile trigger, `aria-label`s on icon-only controls, the mobile Alpha Diversity link | P0-6, P0-7, P2-5, P2-6, P2-11 | Cheapest high-impact accessibility work, concentrated in about four shared files, and it removes a total navigation failure |
| 8 | Enforce default and maximum `limit` in `parseApiQuery`; validate `relations`/`relCounts`; fix the deep-relations fan-out and the empty-selection inversion; add platform rate limiting; return real status codes | P1-2, P1-3 | All in the same layer, so they belong in one change. Removes both the accidental-overload and the deliberate-amplification scenarios and stops leaking schema detail |
| 9 | Explore > Features performance: stop sending `dna_sequence`, make `relCounts` opt-in, add `keepPreviousData`, cache the min/max aggregate and the filter-option queries | P1-5, P1-6, P1-9 | Addresses both real and perceived latency on the heaviest routes. Ordered after step 8 because the query-layer work overlaps. `keepPreviousData` alone changes how fast the application feels |
| 10 | Security headers in `next.config.js`, CSP in report-only mode | P1-8 | Low effort, no user-visible risk, and the item most likely to appear in an external review |
| 11 | Encode and validate BLAST parameters; add a fetch timeout | P1-7 | Contained to one helper. Ordered here because impact depends on the separate BLAST service, but the fix is small |
| 12 | Mobile responsive fixes for Search, BLAST, and the query builder | P1-12 | The largest of the pre-release items, on the component that most defines interactive value |

**Immediately after release:** ESLint with `jsx-a11y` (P1-13 — worth doing *before* the accessibility fixes so they stay fixed), table semantics in `Table.tsx` (P1-10), chart text alternatives (P1-11), smoke tests and typed route helpers (P1-13), removing or finishing the visible "Coming Soon" content (P2-17), per-page metadata (P2-21), and finally the beta notices themselves (`app/components/header/Header.tsx:36` and `app/(dashboard)/page.tsx:28-30`) — a two-line change, deliberately last, because removing the badge is the consequence of the work above rather than a substitute for it.

---

## Notes on this audit

- **Read-only.** No files other than `audit.md` were created or modified, and no commands were run.
- **Secrets skipped.** No `.env*` files were opened; `.cursorignore:6` excludes them. Everything environment-dependent appears in HV rather than as an assertion. No hardcoded secrets were found in tracked source.
- **Not covered:** runtime behavior, production metrics, real device and screen-reader testing, measured contrast ratios, query plans, bundle sizes, and Clerk, Vercel, or Neon dashboard configuration. HV lists the specific gaps that follow.
- **What is already solid**, since a findings list distorts the picture: `strict` TypeScript, a real migration history, no build-error suppression, `auth()` plus role and ownership checks in every server action except one, a properly gated upload route with an allowlisted content type and random suffix, cron secret checks, parameterized raw SQL, filter field names validated against generated table metadata in `parseApiQuery`, a required `take` on the pagination route, `loading.tsx` coverage across Explore, tightly scoped image `remotePatterns`, code-split Leaflet, a consistent shared `Modal` built on native `<dialog>`, `keepPreviousData` correctly applied in two of three paginated components, a robots and sitemap setup that blocks admin and submit routes, and an information architecture that is genuinely navigable. The findings above are gaps in a well-built application, not symptoms of a shaky one.
