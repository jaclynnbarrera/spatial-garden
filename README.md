# spatial garden

A personal internet brain — saved links, images, and notes rendered as floating square cards in a white void.

Scroll to drift. Drag to orbit. Click to open.

Built by Naomi Barrera.

---

## the idea

Most portfolios flatten everything into a grid. This one keeps the mess — bookmarks, screenshots, half-formed thoughts — and gives it depth. Each post is a card in 3D space. Proximity, hover, and focus do the editorial work that a timeline usually does.

The void is intentional. `#f6f6f4` background, exponential fog, no chrome until you need it.

---

## stack

| layer | tools |
|-------|-------|
| scene | Three.js, custom GLSL shaders, GSAP |
| frontend | Vite, vanilla JS |
| backend | Express, SQLite (`better-sqlite3`) |
| content | link previews (Cheerio), image upload (Multer) |

Cards are **point sprites** — one draw call, distance-scaled in the vertex shader, texture-sampled from a runtime **canvas atlas**. Text and link posts without images get rendered into the atlas as typographic tiles.

---

## run locally

```bash
npm install
npm run dev
```

Opens the client on Vite (default `:5173`) with the API proxied to `:3001`.

Create `.env.local`:

```env
VITE_ADMIN=true
VITE_ADMIN_KEY=your-secret-here
ADMIN_SECRET=your-secret-here
```

Admin compose UI (`+` button) is always on in dev. Uploads and writes require the secret header — same as production.

---

## admin

Public visitors see the garden only.

**Production:** visit once with your secret in the query string:

```
https://your-domain/?admin=YOUR_SECRET
```

The URL cleans itself. The compose panel stays for that browser session. Server routes are gated by `x-admin-key` — UI visibility alone isn't enough to write.

See [`src/adminMode.js`](src/adminMode.js) for the prod/dev split.

---

## deploy

Single Node service: `npm run build` → static assets in `dist/`, Express serves API + SPA.

Persistent volume at `/data` for SQLite and uploads. Full Railway checklist → [`RAILWAY.md`](RAILWAY.md).

---

## structure

```
src/
  scene.js          camera, void, fog
  particles.js      point geometry + shader uniforms
  shaders/          distance-based sizing, atlas sampling
  atlas.js          canvas texture grid from post media
  garden.js         orchestration, rebuild on new post
  interaction.js    hover picking, focus states
  detail.js         click-to-open lightbox
  admin/            compose panel (link · image · text)
server/
  db.js             SQLite schema + seed posts
  routes/posts.js   CRUD, link preview, image upload
```

---

## license

Private project. All rights reserved unless otherwise noted.
