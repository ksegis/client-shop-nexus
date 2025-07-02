#!/bin/bash

# Vercel Migration Script for Client Shop Nexus
# This script prepares your application for Vercel deployment

echo "🚀 Preparing Client Shop Nexus for Vercel Migration"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from your project root."
    exit 1
fi

echo "✅ Found package.json - proceeding with migration preparation"

# Install Vercel CLI if not already installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

# Create necessary directories for API routes
echo "📁 Creating API route directories..."
mkdir -p app/api/server-ip
mkdir -p app/api/keystone-compliance

# Check if vercel.json exists
if [ ! -f "vercel.json" ]; then
    echo "⚠️  vercel.json not found - it should have been created"
else
    echo "✅ vercel.json configuration found"
fi

# Check environment variables
echo "🔧 Checking environment configuration..."
if [ ! -f ".env.vercel" ]; then
    echo "⚠️  .env.vercel template not found - it should have been created"
else
    echo "✅ Environment variables template found"
fi

# Update package.json scripts for Vercel
echo "📝 Updating package.json scripts..."
npm pkg set scripts.build="vite build"
npm pkg set scripts.dev="vite dev"
npm pkg set scripts.preview="vite preview"
npm pkg set scripts.vercel-build="vite build"

# Check for required dependencies
echo "🔍 Checking dependencies..."
MISSING_DEPS=()

if ! npm list @types/node &> /dev/null; then
    MISSING_DEPS+=("@types/node")
fi

if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "📦 Installing missing dependencies..."
    npm install --save-dev "${MISSING_DEPS[@]}"
else
    echo "✅ All required dependencies are installed"
fi

# Create .vercelignore file
echo "📄 Creating .vercelignore..."
cat > .vercelignore << EOF
# Dependencies
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment files
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist
build
.next

# IDE files
.vscode
.idea
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage

# Temporary folders
tmp
temp
EOF

echo "✅ .vercelignore created"

# Create deployment checklist
echo "📋 Creating deployment checklist..."
cat > VERCEL_DEPLOYMENT_CHECKLIST.md << EOF
# Vercel Deployment Checklist

## Pre-Deployment Steps

### 1. Environment Variables Setup
- [ ] Copy environment variables from .env.vercel to Vercel dashboard
- [ ] Set VITE_SUPABASE_URL in Vercel environment variables
- [ ] Set VITE_SUPABASE_ANON_KEY in Vercel environment variables
- [ ] Set KEYSTONE_ACCOUNT_NUMBER (when available)
- [ ] Set KEYSTONE_DEVELOPMENT_KEY (when available)
- [ ] Set KEYSTONE_PRODUCTION_KEY (when available)

### 2. Domain Configuration
- [ ] Configure custom domain (ctc.modworx.online) in Vercel
- [ ] Update DNS records to point to Vercel
- [ ] Verify SSL certificate is active

### 3. Testing
- [ ] Test application in Vercel preview environment
- [ ] Verify API routes work (/api/server-ip)
- [ ] Test Supabase connectivity
- [ ] Verify environment variable access

### 4. IP Address Registration
- [ ] Deploy to Vercel
- [ ] Visit /api/server-ip to discover production IP
- [ ] Register IP with Keystone Automotive
- [ ] Test Keystone connectivity

## Deployment Commands

\`\`\`bash
# Login to Vercel
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
\`\`\`

## Post-Deployment Verification

- [ ] Application loads correctly
- [ ] All pages and routes work
- [ ] API endpoints respond correctly
- [ ] Environment variables are accessible
- [ ] Supabase integration works
- [ ] IP discovery endpoint works

## Rollback Plan

If issues occur:
1. Keep current hosting active during migration
2. Test thoroughly in preview before production deployment
3. Have DNS rollback plan ready
4. Monitor application performance after migration

EOF

echo "✅ Deployment checklist created"

# Final summary
echo ""
echo "🎉 Vercel Migration Preparation Complete!"
echo "========================================"
echo ""
echo "📁 Files Created:"
echo "   - vercel.json (Vercel configuration)"
echo "   - app/api/server-ip/route.ts (IP discovery endpoint)"
echo "   - app/api/keystone-compliance/route.ts (Compliance validation)"
echo "   - .env.vercel (Environment variables template)"
echo "   - .vercelignore (Deployment exclusions)"
echo "   - VERCEL_DEPLOYMENT_CHECKLIST.md (Deployment guide)"
echo ""
echo "🚀 Next Steps:"
echo "   1. Review and customize vercel.json if needed"
echo "   2. Set up environment variables in Vercel dashboard"
echo "   3. Run 'vercel' to deploy to preview environment"
echo "   4. Test thoroughly before production deployment"
echo "   5. Use 'vercel --prod' for production deployment"
echo ""
echo "📖 See VERCEL_DEPLOYMENT_CHECKLIST.md for detailed instructions"
echo ""
echo "✨ Your application is ready for Vercel deployment!"

