# Secrets Management

This document describes all secrets required by the Loot Web application, their purpose, and how to manage them.

## Required Secrets

### Vercel Deployment

| Secret | Purpose | How to Obtain |
|--------|---------|---------------|
| `VERCEL_TOKEN` | Deploy to Vercel via CLI | [Vercel Account Settings > Tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Organization identifier | `.vercel/project.json` or Vercel Dashboard |
| `VERCEL_PROJECT_ID` | Project identifier | `.vercel/project.json` or Vercel Dashboard |

### Firebase Configuration (Development/Staging)

| Secret | Environment Variable | Purpose |
|--------|---------------------|---------|
| `STAGING_FIREBASE_API_KEY` | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `STAGING_FIREBASE_AUTH_DOMAIN` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `STAGING_FIREBASE_PROJECT_ID` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `STAGING_FIREBASE_STORAGE_BUCKET` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `STAGING_FIREBASE_MESSAGING_SENDER_ID` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender |
| `STAGING_FIREBASE_APP_ID` | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Firebase Configuration (Production)

| Secret | Environment Variable | Purpose |
|--------|---------------------|---------|
| `PROD_FIREBASE_API_KEY` | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API key |
| `PROD_FIREBASE_AUTH_DOMAIN` | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth domain |
| `PROD_FIREBASE_PROJECT_ID` | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID |
| `PROD_FIREBASE_STORAGE_BUCKET` | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Storage bucket |
| `PROD_FIREBASE_MESSAGING_SENDER_ID` | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | FCM sender |
| `PROD_FIREBASE_APP_ID` | `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase app ID |

### Google APIs

| Secret | Environment Variable | Purpose |
|--------|---------------------|---------|
| `STAGING_GOOGLE_PLACES_API_KEY` | `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Address autocomplete |
| `PROD_GOOGLE_PLACES_API_KEY` | `NEXT_PUBLIC_GOOGLE_PLACES_API_KEY` | Address autocomplete |

### AWS Configuration

| Secret | Environment Variable | Purpose |
|--------|---------------------|---------|
| `AWS_REGION` | `NEXT_PUBLIC_AWS_REGION` | AWS region for Cognito |
| `AWS_COGNITO_IDENTITY_POOL_ID` | `NEXT_PUBLIC_AWS_COGNITO_IDENTITY_POOL_ID` | Face liveness |

### Firebase Function Secrets (set via Firebase CLI, not GitHub)

These are stored in Google Cloud Secret Manager and injected at runtime into Cloud Functions.
Set them with: `firebase functions:secrets:set SECRET_NAME`

| Secret Name | Purpose |
|---|---|
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint — used by counter triggers to bust the cache |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST auth token — used by counter triggers to bust the cache |

## GitHub Secrets Setup

1. Go to your repository's **Settings > Secrets and variables > Actions**
2. Add each secret with **New repository secret**
3. For environment-specific secrets, use **Environments** and define secrets per environment

### Environments to Create

1. **staging** - For develop branch deployments
2. **production** - For main branch deployments (with protection rules)

## Rotation Procedures

### Firebase API Keys

1. Generate new key in Firebase Console
2. Update GitHub Secrets
3. Redeploy affected environments
4. Remove old key after confirming new deployment works

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
