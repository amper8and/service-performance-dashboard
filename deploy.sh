#!/bin/bash

# GitHub Deployment Script
# Run this script to push your dashboard to GitHub

echo "🚀 Service Performance Dashboard - GitHub Deployment"
echo "======================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the webapp directory"
    exit 1
fi

# Check git status
echo "📋 Current Git Status:"
git status --short
echo ""

# Prompt for GitHub repository URL
echo "📝 Please provide your GitHub repository information:"
read -p "Enter your GitHub username: " GITHUB_USER
read -p "Enter repository name (default: service-performance-dashboard): " REPO_NAME
REPO_NAME=${REPO_NAME:-service-performance-dashboard}

# Construct repository URL
REPO_URL="https://github.com/${GITHUB_USER}/${REPO_NAME}.git"

echo ""
echo "Repository URL: ${REPO_URL}"
echo ""

# Check if remote already exists
if git remote get-url origin &> /dev/null; then
    echo "⚠️  Remote 'origin' already exists"
    read -p "Do you want to update it? (y/n): " UPDATE_REMOTE
    if [ "$UPDATE_REMOTE" = "y" ]; then
        git remote set-url origin "${REPO_URL}"
        echo "✅ Updated remote URL"
    fi
else
    git remote add origin "${REPO_URL}"
    echo "✅ Added remote URL"
fi

echo ""
read -p "Push to GitHub now? (y/n): " PUSH_NOW

if [ "$PUSH_NOW" = "y" ]; then
    echo ""
    echo "🔄 Pushing to GitHub..."
    
    # Try to push
    if git push -u origin main; then
        echo ""
        echo "✅ Successfully pushed to GitHub!"
        echo ""
        echo "📖 Next steps:"
        echo "1. Go to: https://github.com/${GITHUB_USER}/${REPO_NAME}/settings/pages"
        echo "2. Under 'Source', select 'Deploy from a branch'"
        echo "3. Select branch 'main' and folder '/ (root)'"
        echo "4. Click 'Save'"
        echo "5. Wait 2-3 minutes for deployment"
        echo ""
        echo "🌐 Your dashboard will be live at:"
        echo "   https://${GITHUB_USER}.github.io/${REPO_NAME}/"
        echo ""
    else
        echo ""
        echo "❌ Push failed. This might be because:"
        echo "1. The repository doesn't exist yet - create it at https://github.com/new"
        echo "2. You need to authenticate - run: gh auth login"
        echo "3. You don't have write access to the repository"
        echo ""
        echo "💡 Try creating the repository first:"
        echo "   gh repo create ${REPO_NAME} --public --source=. --remote=origin"
        echo "   git push -u origin main"
    fi
else
    echo ""
    echo "📝 Manual deployment commands:"
    echo "   git remote add origin ${REPO_URL}"
    echo "   git push -u origin main"
    echo ""
fi
