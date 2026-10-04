# Secrets Management

This document describes all secrets required by the Loot Web application, their purpose, and how to manage them.

## Required Secrets

### Vercel Deployment

| Secret              | Purpose                  | How to Obtain                                                         |
| ------------------- | ------------------------ | --------------------------------------------------------------------- |
| `VERCEL_TOKEN`      | Deploy to Vercel via CLI | [Vercel Account Settings > Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID`     | Organization identifier  | `.vercel/project.json` or Vercel Dashboard                            |
| `VERCEL_PROJECT_ID` | Project identifier       | `.vercel/project.json` or Vercel Dashboard                            |

### Loot API URL

| Secret            | Environment Variable  | Purpose                      |
| ----------------- | --------------------- | ---------------------------- |
| `STAGING_API_URL` | `NEXT_PUBLIC_API_URL` | Staging Loot API base URL    |
| `PROD_API_URL`    | `NEXT_PUBLIC_API_URL` | Production Loot API base URL |

### Google APIs

| Secret                          | Environment Variable                | Purpose              |
| ------------------------------- | ----------------------------------- | -------------------- |
| `STAGING_GOOGLE_PLACES_API_KEY` | `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Address autocomplete |
| `PROD_GOOGLE_PLACES_API_KEY`    | `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Address autocomplete |

### API server secrets (`apps/api`, set on the API host — never in the web app)

See `apps/api/.env.example` for the full list.

| Variable                                            | Purpose                                                       |
| --------------------------------------------------- | ------------------------------------------------------------- |
| `JWT_ACCESS_SECRET`                                 | Signs access tokens (≥ 32 random characters)                  |
| `OTP_SECRET`                                        | HMAC key for stored OTP hashes (≥ 32 random characters)       |
| `MONGODB_URI`                                       | MongoDB connection string                                     |
| `REDIS_URL`                                         | Redis connection string                                       |
| `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN` | WhatsApp Cloud API, for OTP delivery (required in production) |

## GitHub Secrets Setup

1. Go to your repository's **Settings > Secrets and variables > Actions**
2. Add each secret with **New repository secret**
3. For environment-specific secrets, use **Environments** and define secrets per environment

### Environments to Create

1. **staging** - For staging branch deployments
2. **production** - For production branch deployments (with protection rules)

## Rotation Procedures

### API secrets (`JWT_ACCESS_SECRET`, `OTP_SECRET`)

1. Generate a new value: `node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`
2. Update it on the API host and restart
3. Rotating `JWT_ACCESS_SECRET` invalidates live access tokens; clients refresh automatically.
   Rotating `OTP_SECRET` only invalidates codes sent in the last few minutes.

### Vercel Token

1. Create new token at Vercel Account Settings
2. Update `VERCEL_TOKEN` in GitHub Secrets
3. Test with a manual workflow dispatch
4. Revoke old token

### Google Maps API Key

1. Create new key in Google Cloud Console
2. Apply restrictions (HTTP referrers, API restrictions)
3. Update GitHub Secrets
4. Test address autocomplete functionality
5. Delete old key

## Security Best Practices

- **Never commit secrets** to the repository
- Use **environment-specific secrets** (dev vs prod)
- Enable **branch protection** on main
- Require **environment approval** for production
- **Rotate secrets** quarterly or after team changes
- Use **least privilege** - create service accounts with minimal permissions
