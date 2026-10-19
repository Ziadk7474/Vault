# DueVault - Track · Pay · Stay Ahead

## Files (upload the whole folder to GitHub)
- `index.html` - the app (paste your Firebase config into the `FB` block near the top)
- `sw.js`, `manifest.webmanifest`, `icons/` - installable PWA + notification handling
- `functions/` - scheduled reminder job (Firebase Cloud Functions)
- `database.rules.json`, `firebase.json` - security rules and deploy config

## Setup
1. **Firebase project**: add a Web app, copy its config into `FB` in `index.html`.
2. **VAPID key**: Project settings > Cloud Messaging > Web Push certificates > Generate; paste as `vapidKey`.
3. **Authentication**: enable the Anonymous provider; add `yourname.github.io` to Authorized domains.
4. **Realtime Database**: create one, then deploy `database.rules.json` (or paste it into the Rules tab).
5. **Reminder job**: switch to the Blaze plan, then in this folder run
   `npm i -g firebase-tools && firebase login && firebase use --add && cd functions && npm i && cd .. && firebase deploy --only functions,database`
6. **GitHub Pages**: push this folder, then Settings > Pages > deploy from branch `main` (root). Use the https link.
7. **On every device**: open the link, Add to Home Screen, Settings > create/join the workspace code, Notifications > Enable.

## Limits
- Closed-app notifications need steps 1-7. A bare HTML file cannot do it.
- iPhone/iPad: only after Add to Home Screen (iOS 16.4+). HTTPS is required everywhere.
- The reminder job runs hourly and delivers at the "Reminder time" and time zone in Settings.
- Offline edits sync automatically only while the page stays open; closing the tab offline can lose pending edits.
- Anyone who has the workspace code can join it. Keep the code private.
