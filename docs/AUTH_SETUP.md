# Password recovery and Google login

## Database

Back up your existing database. Apply these additive migrations once, in order:

1. `backend/db/migrations/001_password_recovery.sql`
2. `backend/db/migrations/002_google_identity.sql`

Run their SQL in your MySQL client against the database configured in backend `.env`. Do not rerun `schema.sql` on an existing database: it drops tables. New empty databases can use the updated schema instead of the migrations.

## Email

Install dependencies in both frontend and backend with `npm ci`. Copy each `.env.example` to `.env` and retain your existing database, JWT, and Gemini settings.

Set `FRONTEND_URL` to the browser application's origin, `EMAIL_USER` and `EMAIL_PASSWORD` to your mail credentials, and `EMAIL_SERVICE` to your provider (default Gmail). Gmail uses an app password. For another SMTP host, configure `SMTP_HOST`, `SMTP_PORT`, and `SMTP_SECURE`; `EMAIL_FROM` optionally sets a verified sender. Never commit `.env` or passwords.

## Google

Create a Google OAuth **Web application** client in Google Cloud Console. Add your frontend origin (`http://localhost:5173` locally) to Authorized JavaScript origins. Put the same client ID in backend `GOOGLE_CLIENT_ID` and frontend `VITE_GOOGLE_CLIENT_ID`. Restart both servers after changing environment files. An OAuth client secret is not needed for this ID-token sign-in flow.

Google login remains hidden when its frontend client ID is empty. Local password login stays available. The backend verifies Google's token signature, issuer, expiry and audience using `google-auth-library` and requires a verified email and Google subject. Returning accounts are identified by their immutable subject. Existing local accounts can link automatically only when Google is authoritative for the email (Gmail or verified hosted domain); other matching accounts must use their existing password or recovery.

## Recovery behavior

`POST /api/auth/forgot-password` takes `{ "email": "..." }` and gives the same message for known and unknown accounts. It sends an opaque link that expires after 15 minutes. Only the SHA-256 hash is stored, requests have a 60-second per-account cooldown, and public endpoints have an in-memory IP limiter. Mail delivery runs asynchronously outside the response; failed jobs clear the pending token. Delivery jobs are in-process, so a backend restart can interrupt an email. Request another link in that case.

`POST /api/auth/reset-password` takes `{ "token": "...", "password": "..." }`. New passwords follow the existing six-character minimum and bcrypt's 72-byte maximum. A transaction locks and consumes the token, changes the password, and increments the user's session version. Used or expired links cannot be replayed. Existing sessions must sign in again after a reset. Google-only users can recover through their email to set a local password.

The browser exposes `/forgot-password`, `/reset-password?token=...`, and a Google button on `/auth`. Recovery success offers an explicit sign-in action and does not automatically authenticate the user.

## Checks

Backend: `npm test`. Frontend: `npm test`, `npm run lint`, `npm run build`. Unit and HTTP tests mock mail, Google credentials and database operations; no real messages are sent. To validate live: apply migrations, configure providers, request and use a recovery email, confirm the same link fails on replay, confirm an older session is rejected, and try Google login with a new and existing account.

Sources: [Google ID-token verification](https://developers.google.com/identity/gsi/web/guides/verify-google-id-token), [Google email authority](https://developers.google.com/identity/gsi/web/reference/html-reference), [OWASP password recovery guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
