#!/bin/bash
# Deploy API to Cloudflare Workers
set -e

echo "🚀 Deploying API to Cloudflare Workers..."

# Deploy to Cloudflare Workers
wrangler deploy

echo "✅ API deployed successfully!"
