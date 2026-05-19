# Waraqah — Backend integration guide

This document describes how the **Waraqah** frontend (`InvoicePro`) connects to **InvoicePro-backend**.

## Quick start

### 1. MongoDB

Install MongoDB locally, or create a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).

### 2. Backend

```bash
cd InvoicePro-backend
cp .env.example .env
# Edit .env: MONGO_URI, JWT_SECRET (long random string)
npm install
npm run dev
```

Server runs at **http://localhost:5000**.

### 3. Frontend

```bash
cd InvoicePro
cp .env.example .env
npm install
npm run dev
```

Open **http://localhost:5173** → you will be redirected to **/auth** to register or log in.

## Environment variables

| App | Variable | Purpose |
|-----|----------|---------|
| Backend | `MONGO_URI` | MongoDB connection string |
| Backend | `JWT_SECRET` | Signs login tokens (required) |
| Backend | `PORT` | API port (default `5000`) |
| Backend | `ALLOW_DEV_PLAN` | `true` = Settings can toggle plan locally (never in production) |
| Backend | `FRONTEND_URL` | Password reset link target (e.g. `http://localhost:5173`) |
| Frontend | `VITE_API_URL` | API base URL (default `http://localhost:5000/api`) |

## API overview

All protected routes require:

```
Authorization: Bearer <token>
```

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/register` | Create account + business profile; returns JWT |
| `POST /api/auth/login` | Login; returns JWT |
| `GET/PUT /api/business-info` | Company settings (NGN, brand, logo if premium) |
| `GET/POST/PUT/DELETE /api/invoices` | Invoices |
| `GET/POST/PUT/DELETE /api/clients` | Clients |
| `PATCH /api/auth/admin/users/:id/plan` | Admin: set `free` or `premium` |

## Premium & logo

- **`plan`**: `free` (default) or `premium`
- **`businessLogo`**: base64 image; only stored when `plan === 'premium'`
- Users **cannot** set their own plan via Settings — only admins (`PATCH .../plan`) or dev toggle when `ALLOW_DEV_PLAN=true`
- PDF watermark uses logo when premium + logo exists

## Auth flow (frontend)

1. No token → `PrivateRoute` redirects to `/auth`
2. Login/register → token in `localStorage` → `app-login` event reloads settings & invoices
3. Logout → clears token → `app-logout` → redirect to `/auth`
4. Expired/invalid token (401) → auto logout

## Create first admin (MongoDB shell)

After registering a user, promote them in MongoDB:

```js
db.users.updateOne({ email: "you@example.com" }, { $set: { isAdmin: true } })
```

Then log in again to access **/admin** and set user plans.

## Production checklist

- [ ] Set strong `JWT_SECRET`
- [ ] Set `ALLOW_DEV_PLAN=false` or unset
- [ ] Use Atlas or managed MongoDB
- [ ] Configure SMTP for password reset
- [ ] Set `FRONTEND_URL` to your deployed app URL
- [ ] Consider moving logos to S3/GridFS instead of base64 in MongoDB
