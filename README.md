# CompanyVault — Setup

A real app: Firebase Authentication + Firestore + Cloud Storage, with role-based
access enforced in security rules (not just hidden buttons). No mock data, no
localStorage-only "cloud."

## 1. Create the Firebase project

1. console.firebase.google.com → Add project.
2. Build → Authentication → get started → enable **Email/Password**.
3. Build → Firestore Database → create database (production mode, closest region to UAE, e.g. `europe-west1` or `asia-south1`).
4. Build → Storage → get started (production mode).
5. Project settings → General → "Your apps" → Add app → Web → copy the config object.

## 2. Paste your config

Open `index.html`, find `firebaseConfig` near the top of the `<script type="module">`
block, and replace the `REPLACE_ME` values with what you copied.

## 3. Deploy the security rules

Install the Firebase CLI once: `npm install -g firebase-tools`, then `firebase login`.

In this folder:
```
firebase init firestore storage   # point at your existing project, keep the filenames as-is
firebase deploy --only firestore:rules,storage:rules
```
Or paste `firestore.rules` / `storage.rules` directly into the Rules tab in the console —
either way works, but **do not skip this step**. Without it Firestore/Storage default
to locked (good) or, if you ever chose "test mode," wide open (bad) — the rules in this
repo are what actually implement the Owner/Admin/Manager/Member permissions.

## 4. Create yourself as the first Owner/Admin

The app itself can't grant the very first admin — there'd be nobody to approve them.
One-time manual step:

1. Deploy/host `index.html` (step 6) and open it.
2. Click "Request access," sign up with your own email — you'll land on "Waiting for access."
3. In the Firebase console → Firestore Database → `users` collection → find your new user
   document (its ID is your Auth UID, visible under Authentication → Users) → edit the field
   `isSuperAdmin` from `false` to `true`.
4. Reload the app. You're now Owner/Admin and can grant everyone else access from
   **Team & Access** — no more console edits needed after this.

The four companies and the default category list are seeded automatically the first
time an Owner/Admin loads the app (see `DEFAULT_COMPANIES` near the top of the script
if you want to rename or add to them before first load).

## 5. Inviting the team

There's no separate "invite" email flow (that needs a Cloud Function + email service,
which isn't included — see Known Limitations). Instead:

1. Tell the person to open the app and "Request access" (creates their account, no
   permissions yet).
2. You go to **Team & Access** and set their role per company (Manager or Member).
3. They reload the app and now see exactly the companies you assigned — nothing else.

## 6. Hosting

Any static host works — this is plain HTML/JS, no build step, matching your other
apps. Two easy options:

- **GitHub Pages** (same pattern as your ERP): push this folder to a repo, enable
  Pages on the `main` branch.
- **Firebase Hosting** (keeps everything in one project): `firebase init hosting`
  (public directory = this folder), `firebase deploy --only hosting`.

Either way, also add your hosting domain under Authentication → Settings →
Authorized domains, or sign-in will be rejected.

## What's real vs. simplified — please read this

**Real and working, once you complete steps 1–4:**
- Firebase Auth sign-in/sign-up, Firestore-backed documents/companies/categories,
  Cloud Storage file upload/download, live sync across devices.
- Server-side permission enforcement in `firestore.rules` / `storage.rules` — a
  Member with no `canDownload` flag genuinely cannot fetch the file, even by
  guessing a URL, because Storage rules check their Firestore role on every request.
- Global search across name, document number, description, tags, original
  filename, and company/category filters — done as a real client-side keyword
  match against every document your account can see (all fields are indexed into
  a `searchTokens` array at upload/edit time). This is honest keyword search, not
  a fake "filters only what's on screen" search.
- Upload with progress bars, retry on failure, drag-and-drop, multi-file batches.
- Star, recently viewed (per-device), trash with restore, permanent delete gated
  to Admin, activity log, metadata editing, moving between company/category,
  secure sharing to a named existing member with view/download permission and
  optional expiry, revoke.

**Simplified from your spec — on purpose, so this ships as something real
instead of a half-built version of everything:**
- **Roles are two-tier per company** (Manager, Member) plus one **global**
  Owner/Admin flag, rather than a separate Owner/Admin per company. If you later
  want company-scoped admins, that's a rules change, not a rewrite.
- **PDF text-content search is not included.** Firestore has no built-in
  full-text search; real PDF-content search needs a paid indexing service
  (Algolia, Typesense, or a Cloud Function pipeline) synced from Firestore. Metadata
  search (name, tags, description, document number, filename) works fully; searching
  *inside* a PDF's text does not, yet.
- **Invite emails aren't sent.** People request access in-app and you approve them
  from Team & Access (step 5). Adding real email invites needs a Cloud Function +
  an email provider (e.g. SendGrid) — happy to add that as a follow-up.
- **Version history is not implemented.** Editing metadata is versionless; replacing
  a file's content (not just its metadata) isn't in this build.
- **No App Check / Cloud Functions.** Rules alone enforce access control, which is
  real security — but App Check (bot/abuse protection) and Functions (for the
  invite-email flow, or server-side atomic operations) are follow-up work if you
  want them.
- **Share links open inside the app, not as public URLs.** A "share" grants another
  *existing, authenticated* member permission to a document — there's no
  unauthenticated public link, by design, per your "no permanent unrestricted URLs"
  requirement.

## Testing the flow yourself

1. Sign in as your admin account → Upload a PDF to a company/category.
2. Search for it in All Documents; filter by company/category.
3. Open it → Preview, Download, Print, Share, Star, Edit, Move to Trash, Restore.
4. In Team & Access, create a Member with `canDownload` off for that company, sign in
   as them in an incognito window — confirm they can see and search the document but
   the Download button doesn't appear, and (if you're thorough) confirm a direct
   Storage URL for that file returns permission-denied for them.
5. Sign in on a second device/browser — confirm the same documents appear.

## Backup

Firestore and Storage are Google-managed and durable by default. For your own backup
habit: Firestore → set up scheduled exports to a Storage bucket (console → Firestore →
Backups), and Storage itself is already redundant — no extra step needed there.
