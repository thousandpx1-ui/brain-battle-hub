#!/bin/bash
# Deploy frontend to Cloudflare Pages
set -e

echo "🚀 Deploying frontend to Cloudflare Pages..."

# Check for Cloudflare authentication
if [ -z "$CLOUDFLARE_API_TOKEN" ] && [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ Error: Cloudflare authentication required!"
  echo ""
  echo "Set one of these environment variables:"
  echo "  CLOUDFLARE_API_TOKEN=<your-token>    (recommended)"
  echo "  or"
  echo "  Run 'npx wrangler login' first"
  echo ""
  echo "Get an API token at: https://dash.cloudflare.com/profile/api-tokens"
  echo "Use the 'Cloudflare Pages - Edit' template"
  exit 1
fi

# Build the frontend
echo "📦 Building frontend..."
export PORT=5173
export BASE_PATH=/
pnpm --filter @workspace/brain-battle-hub run build

# Deploy to Cloudflare Pages
echo "📤 Deploying to Cloudflare Pages..."
npx wrangler pages deploy artifacts/brain-battle-hub/dist/public \
  --project-name=brain-battle-hub \
  --branch=main

echo "✅ Frontend deployed successfully!"
