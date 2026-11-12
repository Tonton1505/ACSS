# Credi dashboard — overrides

## Current API integration (2026-11-12)

The frontend now connects to the unchanged ACSS `feature/backend-core` backend. This supersedes all mock authentication, role switching, score 720, and local-only submission descriptions below. Authenticate via POST /api/login, use the returned JWT and role, submit to POST /api/applications, and use admin GET /api/applications and PUT /api/applications/:id/status. The current backend score range is 300–470; do not apply generic 850-point risk bands. User history is explicitly a browser receipt list because no personal-history API exists. Do not fabricate admin fields absent from its response. Keep the existing visual identity and motion.

The user explicitly requested Apple Design alongside UI UX Pro Max. This is an application dashboard, so the master document's marketing sections and conversion CTA are not used.

- Inter variable, locally bundled; no embedded SF files.
- User revision: transparent glass, jelly transitions, left navigation, horizontal layout, and a harmonious green + white background with fresh young green (not olive/sage). This explicitly overrides the Apple skill's opaque-content recommendation.
- White-dominant canvas with pale fresh-green corner glows and a flowing ribbon at 14% opacity, translucent panels and bright refractive rims. Fresh green #68d68c on the gauge; #d5fbdc to #a6edbd for primary controls. Text #263b2e, muted #5e7264. No olive or yellow-green cast.
- Floating glass sidebar on the LEFT, never a top or bottom navigation dock. On phones, the same sidebar opens from the left via a menu button. A single active lens uses an interruptible damped spring (680ms), stretching along the movement axis and compressing across it. Page content settles in 460ms. No looping decorative motion.
- Prefer horizontal screen use: broad content area, two-column overview, a horizontal strip of financial metrics and compact desktop card heights. At shallow laptop heights, reduce vertical spacing without changing the content order.
- Large page titles, restrained secondary copy, 4/8px rhythm, 24–28px glass radii, capsule action buttons.
- Primary flow: overview → three-step application → browser receipts. Admin navigation follows the role returned by the backend.
- Scores come from the backend; proposal amounts and local receipts are labeled accurately. No invented security or approval claims.
- Latest user revision: explicit light/dark toggle as a sun/moon ICON beside the avatar and account name, outside the account dropdown. Default light; persist choice and initialize before paint. Never switch automatically from OS preferences.
- Account menu uses a native auto popover with username and role, account details, applications, help and Logout as the LAST row. Escape and outside click dismiss. Logout clears the API session and shows the login page. Do not invent a name or email absent from the API.
- Dark surfaces are translucent deep green with readable pale foregrounds and green accents. Reduced motion, high contrast, native dialog focus handling and visible keyboard focus remain supported. The user's explicit theme control overrides the Apple skill's recommendation to follow system appearance.

- Motion revision: visibly stretch and compress the active lens, preserve its rendered center when interrupted, and settle with a damped spring. Sun/moon symbols rotate and crossfade in place (480ms); the native account popover springs open (400ms) and dismisses faster (160ms). All motion respects reduced-motion preferences.

- Readability revision: 12–13px control/body labels, 18px section headings, larger financial values; use a white-dominant canvas and a compact glass sidebar with a help entry. The account identity appears in the header. Replace the decorative card and random mini-bars with the latest application ID/status and a history shortcut. Financial metrics use the latest submitted profile when present, otherwise explicitly labeled samples. Keep current palette and layout in `src/fresh.css`, loaded after theme definitions.

## Clear glass revision (2026-11-12)

- `src/glass-material.css` is the last material layer after `fresh.css`: lower-opacity neutral fills, 18–20px backdrop blur, reflective white rims and soft inset highlights. Keep the scene white-dominant with a fresh green glow in both authentication and dashboard layouts.
- A static translucent glass ring provides depth behind the login panel. Pointer-driven sheen follows a mouse without moving form controls; disable it under reduced motion. Keep the existing 680ms jelly navigation lens.
- Login uses persistent input labels, decorative field icons, a 44px password visibility control, and collapsed local-account help. Desktop uses two centered columns; mobile stacks content with no horizontal overflow.
- Preserve readable dark surfaces, visible keyboard focus, opaque high-contrast and unsupported-backdrop fallbacks. Keep QA screenshots outside frontend source.
- Reference color revision: pale green glass inspired by the user's glassware photo. Use white with #c9e0cd and #c4dccb glows, neutral pale green ribbon and darker green at refractive edges. Avoid saturated aqua or a yellow/olive cast.

## Reactive glass for user and admin

- `reactive-glass.css` is the final layer. Neutral translucent panels with 14px blur receive their local color from the moving background, rather than a uniform green panel fill. A white light pool and pale green glass pool create spatial variation.
- `useGlassMotion` runs one on-demand animation frame loop. Mouse movement and native scrolling shift the background smoothly; the hovered panel receives a pointer-positioned reflection. Score/limit cards and admin statistic tiles tilt by at most about one degree and lift 3px. Forms, tables and navigation remain stable.
- Page-entry animation runs after login as well as tab changes: panels settle in 560ms with a short capped stagger. Keep the existing jelly navigation lens.
- Stop motion when the page is hidden or reduced motion/high contrast is requested. Touch scrolling remains native. Preserve opaque contrast fallbacks and all backend behavior. Do not push until explicitly requested.

## Sliding tab bubble

- The single active sidebar lens now travels as a glass bubble over 760ms. It visibly elongates along the movement direction, narrows across it and gives a short jelly rebound before matching the selected button exactly. Apply the same component to user and admin navigation.
- Resting corner radius is 20px with bright refractive edges. Animate the bubble's dimensions separately from its translation so the rim retains its thickness. Interrupted clicks begin from the current rendered rectangle. Reduced motion and resizing immediately align it with the selected item.

- Navigation supports both click and direct mouse/touch dragging. After a 6px vertical threshold, pointer capture keeps the bubble under the pointer; release selects the nearest item and settles it. Previewing a drag does not change pages. Suppress the generated click after a drag, while preserving normal clicks and keyboard activation.
- Keep slides running through scrollbar-induced resize events and align once they finish. Reduced-motion mode uses a short 160ms glide without stretching or rebound; default motion remains 760ms jelly. The application heading no longer shows the time estimate badge.
