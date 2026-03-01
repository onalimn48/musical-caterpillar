# 🐛 Musical Caterpillar

Fun music education games for kids! Learn to read notes, train your ear, and build chords.

**Live at:** [musicalcaterpillar.com](https://musicalcaterpillar.com)

## Games

- 📝 **Note Speller** — Read notes on the staff to spell words
- ⏱️ **Notes Per Minute** — Speed challenge for note reading
- ⛄ **Chord Snowman** — Intervals, chords, and ear training

---

## 🚀 Deployment Guide

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18 or newer)
- A [GitHub](https://github.com) account
- A [Cloudflare](https://cloudflare.com) account (free)

### Step 1: Set Up Locally

```bash
# Install dependencies
npm install

# Test locally
npm run dev
```

Open `http://localhost:5173` — you should see the landing page with all three games working.

### Step 2: Push to GitHub

```bash
# Create a new repo on github.com called "musical-caterpillar"
# Then in this folder:
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/musical-caterpillar.git
git push -u origin main
```

### Step 3: Buy Your Domain

Go to [Cloudflare Registrar](https://dash.cloudflare.com/?to=/:account/domains/register) and search for `musicalcaterpillar.com`. Purchase it there — this makes DNS setup automatic.

*(If you buy elsewhere like Namecheap, you'll need to point nameservers to Cloudflare later.)*

### Step 4: Deploy on Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Click **Workers & Pages** in the sidebar
3. Click **Create** → **Pages** → **Connect to Git**
4. Select your `musical-caterpillar` repository
5. Configure the build:
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
   - **Node.js version:** `18` (set in Environment Variables if needed)
6. Click **Save and Deploy**

It will build and give you a `*.pages.dev` URL. Test it!

### Step 5: Connect Your Domain

1. In Cloudflare Pages, go to your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `musicalcaterpillar.com`
4. Also add `www.musicalcaterpillar.com`
5. Cloudflare handles SSL automatically — your site will be HTTPS

### Done! 🎉

Your site is live. Every time you push to `main`, Cloudflare automatically rebuilds and deploys.

---

## 🔧 Development

```bash
npm run dev      # Start dev server (hot reload)
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## Project Structure

```
musical-caterpillar/
├── index.html                  # Entry point
├── package.json
├── vite.config.js
├── public/
│   └── _redirects              # SPA routing for Cloudflare Pages
└── src/
    ├── main.jsx                # Router setup
    ├── storage-polyfill.js     # localStorage adapter
    ├── LandingPage.jsx         # Home page
    ├── HomeButton.jsx          # Floating 🏠 button
    └── games/
        ├── NoteSpeller.jsx     # Note reading game
        ├── NotesPerMinute.jsx  # Speed challenge
        └── ChordSnowman.jsx   # Intervals & chords
```

## Tech Stack

- **React 18** — UI framework
- **Vite** — Build tool (fast!)
- **React Router** — Client-side routing
- **D3.js** — Charts in Notes Per Minute
- **Web Audio API** — All sounds generated in-browser
- **Cloudflare Pages** — Free hosting with global CDN
