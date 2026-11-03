# Deploying Loot

How to put the API, website and Android app online. Follow the sections in order: each one needs
the URL or credentials from the one before.

```
Android app (EAS build) ─┐
                         ├──► API  api.<your-domain>  (Docker, always on) ──► MongoDB Atlas
Website (Vercel) ────────┘        HTTP + Socket.io + background jobs     ──► Redis
  <your-domain>                                                          ──► WhatsApp Cloud API (OTP)
```

Replace `<your-domain>` everywhere with your real domain, e.g. `getloot.in`.

---

## 0. Before you start

**Accounts:** MongoDB Atlas, a Redis provider, an API host (Railway, Render, Fly.io or a VPS),
Vercel, Meta (WhatsApp), Expo (already linked to the app), Google Play Console, and a domain.

**Generate two secrets** and keep them in a password manager. Run this twice:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```

The first value is `JWT_ACCESS_SECRET` (it signs session tokens), the second is `OTP_SECRET`
(it hashes sign-in codes). They must be different. Changing them later signs everyone out.

**Region:** keep the API, MongoDB and Redis in the same region, as close to India as each provider
allows (Mumbai, else Singapore). Every API request talks to both databases.

---

## 1. MongoDB Atlas

1. Create a project, then a cluster in **AWS Mumbai (ap-south-1)**.
   - Closed beta: the free tier is enough.
   - Public launch: a paid tier (M10 or above), which adds automatic backups. The free tier has none.
2. **Database Access:** add a database user with a long random password and the
   *Read and write to any database* role.
3. **Network Access:** add the API host's outbound IP addresses. If your host has no fixed IP
   (Railway and Render's lower plans don't), allow `0.0.0.0/0`. The password is then the only
   protection, so keep it long.
4. **Connect → Drivers** gives a connection string. Add the database name `loot` before the `?`:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/loot?retryWrites=true&w=majority
   ```

   This is `MONGODB_URI`. The API creates its collections and indexes (including the geo
   indexes) on first start.

---

## 2. Redis

The API uses Redis for rate limits, live updates across connections and the background jobs
(expiry, ending-soon and trending). Requirements:

- **Redis 7** or newer.
- **Eviction policy `noeviction`.** The job queue (BullMQ) loses jobs if Redis evicts keys.
  Most providers default to an evicting policy; change it in the database settings.
- **Persistence on**, so queued jobs survive a Redis restart.
- **Same region as the API.**

Good options: **Redis Cloud** (set the eviction policy to `noeviction`), or the Redis add-on of
your API host (Railway and Render both offer one). Serverless per-request plans such as Upstash
work, but the job queue polls constantly, so pick a fixed-price plan there.

The connection URL is `REDIS_URL`. Use `rediss://` (two s's) when the provider requires TLS.

---

## 3. WhatsApp Cloud API (sign-in codes)

The API won't start in production without these. **Start this first:** Meta's business
verification and template review can take days.

1. In [Meta for Developers](https://developers.facebook.com/), create an app of type
   **Business** and add the **WhatsApp** product. It asks you to pick or create a business portfolio.
2. **Add a phone number** for sending. It must not be registered on the WhatsApp app already.
   Use a new SIM or a number you're happy to dedicate to Loot.
3. **Create the message template** (WhatsApp Manager → Message templates):
   - Category: **Authentication**
   - Name: **`send_otp`** (or set `WHATSAPP_OTP_TEMPLATE` to your name)
   - Language: **English (US)**, which the API sends as `en_US`
   - Button: **Copy code**

   Wait for it to be approved.
4. **Create a permanent access token.** The token on the *API Setup* page expires after 24 hours;
   don't use it in production. Instead go to Business settings → *System users*, add a system user
   (Admin), assign it the app and the WhatsApp account, then generate a token with the
   `whatsapp_business_messaging` and `whatsapp_business_management` permissions and no expiry.
   This is `WHATSAPP_ACCESS_TOKEN`.
5. Copy the **Phone number ID** from *API Setup*. It's a long number, not the phone number itself.
   This is `WHATSAPP_PHONE_NUMBER_ID`.
6. **Add a payment method** to the WhatsApp account. Authentication messages are charged per
   message. **Complete business verification** to raise the daily sending limit.

---

## 4. Deploy the API

The API ships as a Docker image ([apps/api/Dockerfile](apps/api/Dockerfile)). It installs only the
API's own dependencies, so it builds in about a minute. Build it **from the repo root**:

```bash
docker build -f apps/api/Dockerfile -t loot-api .
```

### Environment variables

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` (already set in the image) |
| `MONGODB_URI` | from step 1 |
| `REDIS_URL` | from step 2 |
| `JWT_ACCESS_SECRET` | secret 1 from step 0 |
| `OTP_SECRET` | secret 2 from step 0 |
| `WHATSAPP_PHONE_NUMBER_ID` | from step 3 |
| `WHATSAPP_ACCESS_TOKEN` | from step 3 |
| `CORS_ORIGINS` | `https://<your-domain>,https://www.<your-domain>` (the website, step 5) |
| `PORT` | leave unset where the host sets it; the image defaults to `4000` |
| `LOG_LEVEL` | optional, default `info` |

The API checks these on start and exits with a clear message if one is missing or invalid.

### Rules for any host

- **Always on.** Not serverless and not a free tier that sleeps: live updates hold connections
  open and the background jobs run inside the API process.
- **One instance** for now. Running two needs sticky sessions for Socket.io; not worth it yet.
- **Health check path: `/ready`.** It returns 200 only when MongoDB and Redis are both connected.
  (`/health` only says the process is up.)
- **HTTPS** with a custom domain: `api.<your-domain>`.
- The API trusts exactly one proxy in front of it (the host's load balancer) when working out
  client IPs for rate limits. Don't put a second proxy, such as Cloudflare's orange cloud, in front
  without telling the code.

### Railway

1. New project → *Deploy from GitHub repo* → this repo.
2. Service → *Variables*: add the table above, plus `RAILWAY_DOCKERFILE_PATH=apps/api/Dockerfile`.
   Leave the root directory empty; the build needs the whole repo.
3. *Settings*: region closest to India; health check path `/ready`.
4. *Networking*: add the custom domain `api.<your-domain>` and create the CNAME it shows at your DNS provider.

### Render

1. New → *Web Service* → this repo → runtime **Docker**.
2. Dockerfile path `apps/api/Dockerfile`, Docker build context `.`.
3. Region Singapore, a paid instance type (the free one sleeps), health check path `/ready`.
4. Add the environment variables, then the custom domain `api.<your-domain>`.

### Your own server (VPS)

```bash
docker build -f apps/api/Dockerfile -t loot-api .
docker run -d --name loot-api --restart unless-stopped --env-file api.env -p 127.0.0.1:4000:4000 loot-api
```

Put [Caddy](https://caddyserver.com/) in front for automatic HTTPS. Caddy passes WebSockets
through, so Socket.io works:

```
api.<your-domain> {
  reverse_proxy 127.0.0.1:4000
}
```

### Check it

```bash
curl https://api.<your-domain>/ready
# {"status":"ready","mongo":true,"redis":true}
```

The logs should show `MongoDB connected`, `Redis connected`, `Loot lifecycle jobs started` and
`Loot API listening`. On redeploys the host sends SIGTERM and the API shuts down cleanly.

Don't seed production: `npm run seed` refuses to run with `NODE_ENV=production`. Real businesses
sign up through the Android app.

---

## 5. Deploy the website (Vercel)

1. *Add New → Project* → import this repo.
2. **Root Directory: `apps/web`.** Keep *Include files outside the root directory* on, because the
   site imports `packages/shared`. Vercel detects Next.js and the npm workspace on its own.
3. Environment variables (Production):

   | Variable | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://api.<your-domain>` (no trailing slash) |
   | `NEXT_PUBLIC_APP_URL` | `https://<your-domain>` |
   | `NEXT_PUBLIC_ANDROID_APP_URL` | optional: the Play Store or APK link (adds a download button on business pages) |

   `NEXT_PUBLIC_` values are baked in at build time: **redeploy after changing one**.
4. Deploy, then add the domains `<your-domain>` and `www.<your-domain>` under *Settings → Domains*.
5. **Make sure the API allows the website:** `CORS_ORIGINS` on the API must list both domains
   exactly as the browser shows them (`https://`, no trailing slash). Redeploy the API after
   changing it. Vercel preview URLs aren't in the list, so sign-in fails on preview deployments.

### Check it

Open the site and sign in with your phone; the code arrives on WhatsApp. Then run the smoke tests
against the live site from `apps/web`:

```bash
npx playwright install chromium
PLAYWRIGHT_BASE_URL=https://<your-domain> npx playwright test --project=chromium
```

On Windows PowerShell, set the URL first with `$env:PLAYWRIGHT_BASE_URL = "https://<your-domain>"`,
then run `npx playwright test --project=chromium`. With that variable set, Playwright tests the
deployed site instead of starting a local dev server.

---

## 6. Android app (EAS Build)

The app is already linked to its Expo project (`extra.eas.projectId` in
[apps/mobile/app.json](apps/mobile/app.json)). Run these from `apps/mobile`.

1. Sign in: `npx eas-cli@latest login`.
2. **Point the app at the API.** The URL is baked into each build:

   ```bash
   npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://api.<your-domain> --environment production --visibility plaintext
   npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://api.<your-domain> --environment preview --visibility plaintext
   ```

   Or add it on expo.dev → the project → *Environment variables*. With an `https://` URL, the build
   blocks plain-http traffic and includes every phone CPU type (see [apps/mobile/app.config.js](apps/mobile/app.config.js)).

### Closed beta: an APK you share by link

```bash
npx eas-cli@latest build --platform android --profile preview
```

EAS gives you a link to the APK to send to testers. On the first build it offers to generate an
Android signing key and keeps it on Expo's servers; say yes. Don't share the APKs from
`npx expo run:android --variant release`: those are signed with the debug key.

### Google Play

```bash
npx eas-cli@latest build --platform android --profile production
```

This builds an `.aab` and bumps the Android version code automatically (`autoIncrement` in
[apps/mobile/eas.json](apps/mobile/eas.json)).

1. In Play Console create the app; the package name is **`app.loot.mobile`**. Keep *Play App Signing* on.
2. Upload the `.aab` to **Internal testing** first (up to 100 testers, available within minutes).
3. Before production review, Play requires:
   - a **privacy policy URL** (you need a page on the website)
   - the **Data safety** form: the app collects phone number and approximate/precise location
   - content rating, target audience and the store listing (icon, screenshots, description)
   - **App access:** instructions for reviewers to sign in. See *Known gaps* below.
4. **Personal developer accounts** (not organisation accounts) must run a **closed test with at
   least 12 testers for 14 days** before they can publish to production. Start it early.

Later uploads can use `npx eas-cli@latest submit --platform android` once a Google service account
key is set up.

---

## 7. After the first deploy

- [ ] `https://api.<your-domain>/ready` returns `ready`.
- [ ] Sign in on the website with your phone (WhatsApp code arrives).
- [ ] On Android: sign in, *Profile → Set up a business account*, add a branch, publish loot.
- [ ] On a second phone: the loot appears under Nearby; claim it; the business redeems the code;
      the hunter's screen flips to *Redeemed* live.
- [ ] Add an uptime monitor (e.g. UptimeRobot) on `/ready`, and Atlas alerts for disk and connections.
- [ ] Note where every secret lives: MongoDB, Redis, JWT, OTP, WhatsApp token, Expo account.

## Known gaps before a public launch

- **Play reviewer sign-in.** Reviewers can't receive a WhatsApp code on a number they don't own.
  The API needs a review account (a fixed test number with a code set in config) before Play
  submission.
- **Privacy policy and terms pages** on the website.
- **Media upload:** businesses paste image links (Cloudflare R2/Stream is planned).
- **Push notifications:** live updates only reach open apps for now.
- **Backups:** the Atlas free tier has none. Move to a paid tier before real users rely on it.
