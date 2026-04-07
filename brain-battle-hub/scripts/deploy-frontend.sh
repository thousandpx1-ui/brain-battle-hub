#!/bin/bash
# Deploy frontend to Cloudflare Pages
set -e

echo "🚀 Deploying frontend to Cloudflare Pages..."

# Build the frontend
pnpm --filter @workspace/brain-battle-hub run build

# Deploy to Cloudflare Pages
wrangler pages deploy artifacts/brain-battle-hub/dist \
  --project-name=brain-battle-hub \
  --branch=main

echo "✅ Frontend deployed successfully!"
