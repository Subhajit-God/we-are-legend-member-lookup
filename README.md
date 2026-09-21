# ⚜️ WE ARE LEGEND — Member Lookup (Read-Only)

A single-purpose public page: anyone can type a Member ID and view that member's full registry record. There is no add, edit, or delete anywhere on this site — it only ever calls the `list` action on your existing Apps Script backend and displays a match.

## Files

- `index.html` — the page (crest header, search field, result area)
- `style.css` — matching black/navy/gold registry design
- `config.js` — already points at your live Apps Script Web App URL (same backend as the main dashboard)
- `app.js` — fetch + search + render logic; read-only

## How it works

1. Visitor types a Member ID (e.g. `WAL-SD-S-A-1203-001`) and selects **Look Up**.
2. The page makes **one** call to your Apps Script Web App (`action: "memberFull"`), which returns the matching member plus every related record already filtered server-side — this used to be 10 separate requests, which is why early versions of this page felt slow.
3. If found, it displays the member's full profile — photo, name, role, status, family info, contact details, school info, emergency contact, address, notes — plus every related record on file for that member: **Awards, Achievements, Documents & Certificates (with file links), Uploaded Forms, Activities, Memories, Meetings Attended, and Diary Entries**. Each section shows its own count and an empty state when there's nothing on file yet.
4. If not found, it shows a clear "no match" message — nothing is created or changed.
5. A successful lookup updates the URL to `?id=<MemberID>`, so you can share a direct link straight to a member's record.

## Deploying

This is a static site — upload the four files to any web host (or open `index.html` directly). It uses the same Apps Script deployment as the main WE ARE LEGEND dashboard, so both sites always show the same live data. No further setup is required since `config.js` is already configured.

If you ever redeploy `Code.gs` with a new URL, update `API_URL` in `config.js` here too.


## Privacy (security refactor)

This site is public and unauthenticated, so it can only reach four server-side actions — `publicDirectory`, `publicMember`, `publicSearch`, `publicWallOfFame` — each returning a sanitized projection.

**Previously** this page called `list("Members")`, which downloaded the *entire* Members sheet — every private field plus the `PINHash` credential column — to every visitor, and `memberFull`, which returned DOB, parents' names, phone, email, address, emergency contacts, diary entries and documents.

**Now** a public record contains only: MemberID, FullName, Role, Status, PhotoURL, joining year, and published awards/achievements. Everything else is withheld server-side — not hidden in the browser. Only members with `ListedInDirectory = Yes` are publicly viewable at all; any other ID returns the same "not found" shape so the endpoint cannot be used to enumerate members.

Files: `api.js` (shared client with request dedup + caching), `app.js`, `directory.js`, `wall-of-fame.js`.
