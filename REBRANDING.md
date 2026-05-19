# Renaming everything to Waraqah

The **product name** in the app is already **Waraqah** (`src/constants/brand.js` → `APP_NAME`).  
What still says "InvoicePro" is usually **hosting**, **GitHub**, or **folder names** — those are changed separately.

---

## 1. In the app (already done)

| Item | Location |
|------|----------|
| Login / sidebar / titles | `APP_NAME` in `src/constants/brand.js` |
| Browser tab | `index.html` `<title>` |
| Package name | `package.json` → `"name": "waraqah"` |

To change the tagline, edit `APP_TAGLINE` in `brand.js` and `index.html`.

---

## 2. Vercel (what users see in the URL)

### Rename a project (optional)

1. Open the project on [vercel.com](https://vercel.com)
2. **Settings** → **General** → **Project Name**
3. Change e.g. `invoice-pro` → `waraqah`  
   → New default URL: `https://waraqah.vercel.app`

### Custom domain (recommended)

1. **Settings** → **Domains**
2. Add e.g. `www.waraqah.com` or `app.waraqah.com`
3. Follow DNS instructions at your registrar
4. Set backend `FRONTEND_URL` to that exact URL (no trailing `/`)

Do the same for the **backend** project when you deploy it (e.g. `waraqah-api` → `https://waraqah-api.vercel.app`).

---

## 3. GitHub repositories

1. Repo **Settings** → **General** → **Repository name**
2. Rename e.g. `InvoicePro` → `waraqah` and `InvoicePro-backend` → `waraqah-api`
3. On your PC, update the remote:
   ```bash
   git remote set-url origin https://github.com/YOUR_USER/waraqah.git
   ```
4. In Vercel, reconnect the project to the renamed repo if needed.

Local folder names (`InvoicePro`, `InvoicePro-backend`) can stay as-is; only the GitHub name affects clones and Vercel imports.

---

## 4. Environment variables (after URL changes)

| Project | Variable | Example |
|---------|----------|---------|
| Frontend | `VITE_API_URL` | `https://waraqah-api.vercel.app/api` |
| Backend | `FRONTEND_URL` | `https://www.waraqah.com` |
| Backend | `MONGO_URI` | Atlas DB (database name can stay `waraqah`) |

Redeploy **both** after changes.

---

## 5. Paystack & emails

- Paystack plan name: already **Waraqah Premium Monthly**
- Password-reset emails use `FRONTEND_URL` — update when your domain changes

---

## 6. What you do **not** need to rename

- Code names like `InvoiceContext`, `CreateInvoice` — internal only, not shown to users
- MongoDB collections — renaming does not change the product name
- Old Vercel URLs — they keep working until you delete the project

---

## Quick checklist

- [ ] Vercel frontend project renamed or custom domain added
- [ ] Vercel backend project created/renamed (`waraqah-api`)
- [ ] GitHub repos renamed (optional)
- [ ] `VITE_API_URL` + `FRONTEND_URL` updated and redeployed
- [ ] Open live site — login page shows **Waraqah**
