# Maths Time! 🧮

A kid-friendly mental maths app for ages ~6-8. Built with React + Vite + Tailwind.

Progress, sticker collection, and the kid's name save automatically to the browser's localStorage on the device.

## Run locally

You need [Node.js](https://nodejs.org) 18 or newer. Then:

```bash
npm install
npm run dev
```

It opens at http://localhost:5173.

To make a production build to test it:

```bash
npm run build
npm run preview
```

## Deploy options

Pick one. All three are free.

### Option 1 — Vercel (easiest)

1. Push this folder to a new GitHub repo.
2. Go to [vercel.com](https://vercel.com), sign in with GitHub.
3. Click "Add New… → Project", pick the repo, click Deploy.

That's it. Vercel auto-detects Vite. You get a URL like `your-app.vercel.app`. Every push to `main` redeploys.

### Option 2 — GitHub Pages

This repo already includes the workflow at `.github/workflows/deploy.yml`. To use it:

1. Push this folder to a new GitHub repo named, say, `maths-app`.
2. In the repo on github.com: **Settings → Pages → Source: GitHub Actions**.
3. Push to `main` (or trigger the workflow manually from the Actions tab).

After about a minute it'll be live at `https://<your-username>.github.io/maths-app/`.

The workflow automatically sets Vite's `base` path to match the repo name, so assets load correctly from the subdirectory.

### Option 3 — Netlify

1. Push to GitHub.
2. Go to [netlify.com](https://netlify.com), "Add new site → Import from Git", pick the repo.
3. Build command: `npm run build`. Publish directory: `dist`. Click Deploy.

## Use it on a phone

Once it's live at any URL above, open the URL on your child's device and tap **Share → Add to Home Screen** in Safari (iOS) or the menu → "Install app" in Chrome (Android). It'll launch fullscreen like a native app.

## Editing problems

The maths problems are at the top of `src/MathsApp.jsx` in the `DAYS` constant. Each day has a `problems` array of `{ q: "12 + 5", a: 17 }` entries. Edit, save, redeploy.

## Editing stickers

The sticker catalog is also at the top of `src/MathsApp.jsx` in the `STICKERS` constant. Add, remove, or change which ones are marked `rare: true`.
