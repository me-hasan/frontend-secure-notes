# Secure Notes — Frontend

[![CI](https://github.com/me-hasan/frontend-secure-notes/actions/workflows/ci.yml/badge.svg)](https://github.com/me-hasan/frontend-secure-notes/actions/workflows/ci.yml)

The React client for the [Secure Note-Taking API](https://github.com/me-hasan/backend-secure-notes). The
task brief explicitly deprioritises the UI (`"DO NOT waste time improving the frontend"`), so this app
is deliberately thin: no component library, no router, and no styling beyond Tailwind plus one small
file of shared primitives (`src/components/ui.tsx`). Its only job is to prove that the API integrates
end to end and that the `user` / `admin` roles behave differently.

---

## Live deployment

| | |
|---|---|
| App | <https://frontend-secure-notes-v1.vercel.app> |
| API base | <https://backend-secure-notes.onrender.com/api> |

Deployed on Vercel, pointed at the Render-hosted API. Both are free tiers — the Render instance sleeps
after ~15 minutes idle, so the first sign-in can take up to a minute while it wakes. The seeded logins
under [Seeded logins](#seeded-logins) work here unchanged.

---

## Stack

| Piece | Choice | Why |
|---|---|---|
| Framework | React 19 | — |
| Build | Vite 8 | Instant dev server, static `dist/` for the host |
| Styling | Tailwind 4 (`@tailwindcss/vite`) | No config file, no PostCSS pipeline |
| Language | TypeScript (strict) | The API contract is typed in one file (`src/api/types.ts`) |
| Routing | Local state (`useState`) | Seven screens do not need a router dependency |

---

## Running it

The backend has to be up first — see its README for the full sequence, in short:

```bash
cd ../backend
docker compose up -d          # local MongoDB
pnpm run seed                 # admin + 20 users + notes + posts
pnpm run start:dev            # http://localhost:3000
```

Then:

```bash
pnpm install
pnpm run dev                  # http://localhost:5173
```

The frontend reads its configuration from `.env`, which Vite loads automatically. Copy the committed
template once after cloning:

```bash
cp .env.example .env
```

`.env` is git-ignored, so `.env.example` is the file that travels with the repo — keep the two in
step when you add a variable.

### Seeded logins

| Role | Email | Password |
|---|---|---|
| admin | `admin@example.com` | `Password123!` |
| user | `user01@example.com` … `user20@example.com` | `Password123!` |

Signing in as both is the fastest way to see the role split: the **Users** tab only exists for an
admin, and an admin's **Notes** tab lists everyone's notes instead of only their own.

These are the only accounts that exist after seeding — `pnpm run seed` is what creates them, and the
`supersecret1` string in the backend's Swagger examples is a request-shape placeholder, not a login.

---

## Configuration

| Variable | Default | Meaning |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000/api` | Base URL of the backend, **including** the `/api` prefix |

It lives in `.env` locally; on the host, set it in the project's environment variables instead. Vite
inlines the value at build time, so changing it requires a rebuild.

Two things have to line up locally:

- The dev server is pinned to **port 5173** (`strictPort: true`), because the backend's `CORS_ORIGIN`
  defaults to exactly `http://localhost:5173`. If 5173 is taken, Vite now fails loudly instead of
  moving to 5174 — where every request would fail CORS for a reason that looks unrelated.
- Change one side and you must change the other: `CORS_ORIGIN` in the backend `.env`, or the port here.

---

## Reading the UI

The screens are written for the business first, so the rules are visible without reading the code:

- A **role guide** sits under the header on every signed-in screen, listing exactly what the current
  account may do — the same rules the API enforces.
- The sign-in screen explains the product in four lines and offers **one-click demo buttons** for the
  seeded admin and user accounts, so both sides of the role split are one click apart.
- Each screen opens with a plain-language subtitle ("Posts are public: everyone can read them…"), so
  the business meaning is what a reader parses first.
- Destructive actions say what they will destroy: deleting an account asks for confirmation and warns
  that the user's notes and posts go with it.
- The visual layer stops at that: one `src/components/ui.tsx` of shared primitives (buttons, cards,
  callouts, badges) with Tailwind utilities. It exists to make the rules readable, not to turn the UI
  into the deliverable — the graded work is still the API.

## Screens → endpoints

| Screen | Endpoints | Notes |
|---|---|---|
| Sign in / Register | `POST /api/auth/login`, `POST /api/auth/register` | The token is kept in `localStorage` so a reload does not sign you out |
| Public feed (signed out) | `GET /api/posts`, `GET /api/users/:id/posts` | Both are public — reachable with no token at all |
| My notes / Every note *(admin)* | `GET/POST /api/notes`, `PATCH/DELETE /api/notes/:id` | Your own notes; every note for an admin, with an owner filter |
| Posts | `GET/POST /api/posts` | Create needs a token; the feed does not |
| One person's posts | `GET /api/users/:id/posts` | Aggregation Scenario 2 (`$lookup`) — the public profile view |
| People who share an interest | `GET /api/users/grouped-by-interests` | Aggregation Scenario 1 (one `aggregate()` call) |
| Every account *(admin)* | `GET/POST /api/users`, `PATCH/DELETE /api/users/:id` | Create, edit, delete, and jump to a user's notes or posts |
| Your account | `GET /api/users/me` | The profile the JWT resolves to |

Every list screen drives the same `?page=&limit=` contract and renders the same
`{ data, meta }` envelope, so pagination behaves identically everywhere.

---

## Where the graded work shows up

- **Scenario 1** — the *Interests* tab renders `$unwind` → `$group` output; users without interests
  are absent by design.
- **Scenario 2** — the *One person's posts* panel is a single `$lookup` pipeline. The **View posts**
  button on the admin *Every account* screen hands a user id straight to it.
- **Roles** — the tab bar is built from the decoded session, so a `user` never even sees the admin
  screens; the API is still the real gate (it answers `403` regardless of what the UI shows).

---

## Scripts

| Command | What it does |
|---|---|
| `pnpm run dev` | Dev server on `:5173` |
| `pnpm run build` | `tsc --noEmit` then a production build into `dist/` |
| `pnpm run preview` | Serves the built `dist/` locally |
| `pnpm run typecheck` | Types only |

---

## Deploying

Any static host works. On Vercel:

- Build command `pnpm run build`, output directory `dist`
- Environment variable `VITE_API_URL` → the deployed backend URL, e.g. `https://<api-host>/api`
- Add the deployed frontend origin to the backend's `CORS_ORIGIN` before testing, otherwise the
  browser blocks every request.

`VITE_API_URL` is inlined at build time, so changing it requires a rebuild — not just a restart.
