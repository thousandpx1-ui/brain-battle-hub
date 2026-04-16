# Cloudflare Deployment Guide

This guide explains how to deploy Brain Battle Hub to Cloudflare.

## Architecture

- **Frontend**: Deployed to Cloudflare Pages (React + Vite app)
- **API**: Deployed to Cloudflare Workers (Express server)
- **Database**: PostgreSQL (external, e.g., Supabase, Neon, or your own)

## Prerequisites

1. A Cloudflare account (sign up at https://dash.cloudflare.com)
2. Node.js 24 installed
3. pnpm package manager

## Setup

### 1. Install Wrangler CLI

Wrangler is Cloudflare's CLI tool for managing deployments:

```bash
pnpm install
```

This installs Wrangler as a dev dependency (already configured in package.json).

### 2. Authenticate with Cloudflare

```bash
pnpm wrangler login
```

This will open a browser window to authenticate with your Cloudflare account.

### 3. Create API Token (for CI/CD)

For GitHub Actions or manual deployments:

1. Go to https://dash.cloudflare.com/profile/api-tokens
2. Click "Create Token"
3. Use the "Edit Cloudflare Workers" template
4. Add these permissions:
   - **Account**: Edit
   - **Workers**: Edit
   - **Pages**: Edit
5. Save the token securely

### 4. Set Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.cloudflare.example .env.local
```

Edit `.env.local` with your Cloudflare credentials.

## Local Development

### Frontend Development

```bash
pnpm --filter @workspace/brain-battle-hub run dev
```

### API Development

```bash
pnpm --filter @workspace/api-server run dev
```

### Test Worker Locally

```bash
pnpm dev:worker
```

This runs the API as a Cloudflare Worker locally using Wrangler.

## Deployment

### Option 1: Manual Deployment (Recommended for first deploy)

**Deploy everything:**
```bash
pnpm run deploy
```

**Deploy only frontend:**
```bash
pnpm run deploy:frontend
```

**Deploy only API:**
```bash
pnpm run deploy:api
```

### Option 2: Using Deployment Scripts

```bash
# Make scripts executable (first time only)
chmod +x scripts/deploy-frontend.sh scripts/deploy-api.sh

# Deploy frontend
./scripts/deploy-frontend.sh

# Deploy API
./scripts/deploy-api.sh
```

### Option 3: GitHub Actions (Automated CI/CD)

1. Push your code to GitHub
2. Go to your repository Settings → Secrets and variables → Actions
3. Add these repository secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare account ID

The workflow will automatically deploy on every push to `main`.

## Configuration Files

### `wrangler.toml`
Configuration for Cloudflare Workers (API server).

### `wrangler.pages.toml`
Configuration for Cloudflare Pages (frontend).

### `.github/workflows/deploy.yml`
GitHub Actions workflow for automated deployments.

## Environment Variables

### Frontend (Cloudflare Pages)

Set these in Cloudflare Pages dashboard → Settings → Environment Variables:

- `VITE_API_URL`: URL of your API (e.g., `https://brain-battle-hub-api.your-subdomain.workers.dev`)

### API (Cloudflare Workers)

Set these as Wrangler secrets or in `wrangler.toml`:

```bash
# Set database URL as a secret
pnpm wrangler secret put DATABASE_URL
```

## Database Setup

The API requires a PostgreSQL database. Recommended providers:

- **Supabase**: https://supabase.com (free tier available)
- **Neon**: https://neon.tech (free tier available)
- **Railway**: https://railway.app

After setting up your database, add the connection string as a secret:

```bash
pnpm wrangler secret put DATABASE_URL
```

## Custom Domain

### For Frontend (Cloudflare Pages):

1. Go to Cloudflare Pages dashboard
2. Select your project
3. Go to Custom domains
4. Add your domain

### For API (Cloudflare Workers):

1. Go to Workers dashboard
2. Select your worker
3. Go to Triggers
4. Add a route under "Custom domain"

## Monitoring

### View Logs

```bash
# API logs
pnpm wrangler tail brain-battle-hub-api
```

### View Deployments

```bash
# Pages deployments
pnpm wrangler pages deployment list

# Worker versions
pnpm wrangler versions list
```

## Troubleshooting

### Build fails on Cloudflare Pages

- Ensure Node version is set to 24 in Pages settings
- Check that the build command is: `pnpm --filter @workspace/brain-battle-hub run build`
- Verify output directory is: `artifacts/brain-battle-hub/dist`

### API can't connect to database

- Verify `DATABASE_URL` is set as a Wrangler secret
- Check database connection string format
- Ensure database allows connections from Cloudflare IPs

### CORS errors

- Update CORS configuration in the API server to allow requests from your Pages URL
- See `artifacts/api-server/src/index.ts` for CORS settings

## Useful Commands

```bash
# Login to Cloudflare
pnpm wrangler login

# Deploy frontend
pnpm run deploy:frontend

# Deploy API
pnpm run deploy:api

# Test API locally
pnpm dev:worker

# Set a secret
pnpm wrangler secret put SECRET_NAME

# View logs
pnpm wrangler tail brain-battle-hub-api

# Rollback to previous version
pnpm wrangler versions rollback
```

## Additional Resources

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
