# 💜 Finance Tracker — PWA

Personal finance tracker with Expenses, Loans, EV Charging & Dashboard.

## 🚀 Deploy to Netlify (5 minutes)

### Option A — Drag & Drop (easiest, no terminal needed)
1. Go to [netlify.com](https://netlify.com) and create a free account
2. On your dashboard click **"Add new site" → "Deploy manually"**
3. Follow steps below to build first, then drag the `dist/` folder

### Option B — Via Terminal

**Prerequisites:** Node.js 18+ installed ([nodejs.org](https://nodejs.org))

```bash
# 1. Install dependencies
npm install

# 2. Build the app
npm run build

# 3. Preview locally (optional)
npm run preview
```

Then drag the generated `dist/` folder to Netlify.

---

## 📱 Install on iPhone

1. Open your Netlify URL in **Safari** (not Chrome)
2. Tap the **Share** button (□ with ↑ arrow) at the bottom
3. Scroll down and tap **"Add to Home Screen"**
4. Tap **Add** — done! 🎉

The app will appear on your home screen like a native app.

---

## 🛠 Run locally for development

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173)

---

## 📁 Project Structure

```
finance-app/
├── public/
│   ├── icon-192.png      # App icon
│   └── icon-512.png      # App icon (large)
├── src/
│   ├── App.jsx           # Main app (all tabs & logic)
│   ├── main.jsx          # React entry point
│   └── index.css         # Global reset
├── index.html            # HTML shell with iOS meta tags
├── vite.config.js        # Vite + PWA config
└── package.json
```
