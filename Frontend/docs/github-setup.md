# GitHub Setup Guide

This guide covers the GitHub-specific configuration required for the CI/CD pipelines.

## Creating Environments

GitHub Environments are required for the staging and production deployment workflows.

### Step 1: Navigate to Environments Settings

1. Go to your repository: https://github.com/realitysynthesizer/momento-web
2. Click **Settings** → **Environments**

### Step 2: Create Staging Environment

1. Click **"New environment"**
2. Name: `staging`
3. Click **"Configure environment"**
4. **Deployment branches**: Select "Selected branches" → Add `develop`
5. Click **"Save protection rules"**

### Step 3: Create Production Environment

1. Click **"New environment"**
2. Name: `production`
3. Click **"Configure environment"**
4. **Protection rules** (recommended):
   - ✅ Required reviewers → Add yourself
   - ✅ Wait timer → 0 minutes (or set delay)
5. **Deployment branches**: Select "Selected branches" → Add `main`
6. Click **"Save protection rules"**

---

## Adding Repository Secrets

Secrets are needed for deployment and API access.

### Step 1: Navigate to Secrets

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **"New repository secret"**

### Step 2: Add Required Secrets

| Secret Name | Description | Where to Get |
|-------------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel API token | [Vercel Account Settings](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Vercel organization ID | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID` | Vercel project ID | `.vercel/project.json` after `vercel link` |

### Step 3: Add Environment-Specific Secrets

For each environment (staging/production), add these in **Settings → Environments → [env] → Environment secrets**:

**Staging Environment:**
| Secret | Value Source |
|--------|--------------|
| `STAGING_FIREBASE_API_KEY` | Firebase Console (dev project) |
| `STAGING_FIREBASE_AUTH_DOMAIN` | Firebase Console |
| `STAGING_FIREBASE_PROJECT_ID` | `momento-dev-e3b30` |
| `STAGING_FIREBASE_STORAGE_BUCKET` | Firebase Console |
| `STAGING_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console |
| `STAGING_FIREBASE_APP_ID` | Firebase Console |
| `STAGING_APP_URL` | `https://staging.momentomemories.com` |
| `STAGING_GOOGLE_PLACES_API_KEY` | Google Cloud Console |
| `AWS_REGION` | `ap-south-1` |
| `AWS_COGNITO_IDENTITY_POOL_ID` | AWS Console |

**Production Environment:**
| Secret | Value Source |
|--------|--------------|
| `PROD_FIREBASE_API_KEY` | Firebase Console (prod project) |
| `PROD_FIREBASE_AUTH_DOMAIN` | Firebase Console |
| `PROD_FIREBASE_PROJECT_ID` | `momento-b7d02` |
| `PROD_FIREBASE_STORAGE_BUCKET` | Firebase Console |
| `PROD_FIREBASE_MESSAGING_SENDER_ID` | Firebase Console |
| `PROD_FIREBASE_APP_ID` | Firebase Console |
| `PROD_APP_URL` | `https://www.momentomemories.com` |
| `PROD_GOOGLE_PLACES_API_KEY` | Google Cloud Console |
| `AWS_REGION` | `ap-south-1` |
| `AWS_COGNITO_IDENTITY_POOL_ID` | AWS Console |

---

## Getting Vercel Credentials

1. **Install Vercel CLI** (if not installed):
   ```bash
   npm install -g vercel
   ```

2. **Link your project**:
   ```bash
   vercel link
   ```

3. **Get IDs** from `.vercel/project.json`:
   ```json
   {
     "orgId": "your-org-id",
     "projectId": "your-project-id"
   }
   ```

4. **Create API Token**:
   - Go to https://vercel.com/account/tokens
   - Click "Create"
   - Name: "GitHub Actions"
   - Copy the token

---

## Branch Protection Rules (Optional)

For additional safety on the `main` branch:

1. Go to **Settings** → **Branches**
2. Click **"Add branch protection rule"**
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1)
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date
5. Add required status checks:
   - `Validate`
   - `E2E Tests`
6. Click **"Create"**
