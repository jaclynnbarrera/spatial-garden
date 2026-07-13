---
name: run-dev
description: Start, verify, and drive the spatial-garden dev server (Vite client + Express API), including how to authenticate admin writes to the posts API
---

# Running spatial-garden in dev

## Start

```bash
npm run dev
```

Run it in the background — it stays up until stopped. This uses `concurrently` to launch both processes:

- **Client (Vite)**: http://localhost:5173/ — the 3D garden UI, proxies `/api` to the server
- **Server (Express)**: http://localhost:3001 — API + SQLite

The server reads `.env` and `.env.local` via Node's `--env-file-if-exists` (no dotenv). A missing `.env` logs a warning and is fine. Startup is fast (~1s); the server logs `Server running on http://localhost:3001` and the db/uploads paths with a post count.

## Verify

```bash
curl -s -o /dev/null -w '%{http_code}' http://localhost:5173          # expect 200
curl -s http://localhost:3001/api/posts                                # expect JSON array of posts
```

## Admin writes

Read routes are public. Write routes (`POST /api/posts`, `POST /api/posts/preview-link`, `POST /api/posts/image`, deletes) require the `x-admin-key` header matching `ADMIN_SECRET` in `.env.local`.

Create a text post:

```bash
curl -s -X POST http://localhost:3001/api/posts \
  -H 'Content-Type: application/json' \
  -H "x-admin-key: $(grep '^ADMIN_SECRET=' .env.local | cut -d= -f2)" \
  -d '{"type":"text","title":"my title","excerpt":"optional body"}'
```

- `type` must be `link`, `image`, or `text`; `title` is required; `link` posts also require `url`.
- A 201 response returns the post with its generated `id` and random 3D `position`.
- The compose UI (`+` button) is always visible in dev (`VITE_ADMIN=true`), but UI visibility alone doesn't grant writes — the header is what matters.

## Data

- SQLite db: `data/posts.db` (seeded with 3 posts on first run)
- Uploaded images: `public/uploads/`

## Stop

Stop the background `npm run dev` task (it kills both processes). Confirm both ports return connection errors afterward.

## Screenshots / driving the UI

The scene is Three.js WebGL with an intro animation, so give it a few seconds before capturing. No Playwright or chromium-cli is installed in this repo; headless Chrome works:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new \
  --screenshot=/path/to/out.png --window-size=1440,900 \
  --virtual-time-budget=8000 --hide-scrollbars http://localhost:5173/
```
