# Repeatutor Web (Auth Shell)

 Simple Next.js frontend to exercise backend auth endpoints.

## Setup
- Install deps: `pnpm install`
- Run dev server: `pnpm dev` (defaults to http://localhost:3000)
- API calls default to `http://localhost:8787`; override with `NEXT_PUBLIC_API_BASE`.

## Pages
- `/` home: shows session info and logout button if signed in.
- `/signup`: create account (calls `POST /auth/signup`).
- `/signin`: sign in (calls `POST /auth/signin`).
- `/admin`: list users (calls `GET /admin/users`; needs admin token).

## Tokens
- Tokens are stored in `localStorage` (`repeatutor_token`). Admin page also accepts manual token entry (e.g., `dev-admin-token`, `seed-admin-token`, or a login token from admin user).

## Styling
- Minimal gradient theme in `app/globals.css`; adjust as needed.

## Build
- `pnpm build` / `pnpm start`
