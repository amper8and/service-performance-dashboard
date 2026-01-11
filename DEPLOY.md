# GitHub Deployment Guide

## Prerequisites

You need to have GitHub authorization set up. If you haven't done so already:

1. Go to the **#github** tab in the interface
2. Complete GitHub App authorization
3. Optionally set up OAuth authorization
4. Return here to continue

## Option 1: Push to Existing Repository (Recommended)

If you already have a repository you'd like to use:

```bash
cd /home/user/webapp

# Add your remote repository
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push code
git push -u origin main
```

## Option 2: Create New Repository via GitHub CLI

If you have GitHub CLI authenticated:

```bash
cd /home/user/webapp

# Create new repository
gh repo create service-performance-dashboard --public --source=. --remote=origin

# Push code
git push -u origin main
```

## Option 3: Manual Repository Creation

1. Go to https://github.com/new
2. Create a new repository named `service-performance-dashboard`
3. Do NOT initialize with README, .gitignore, or license
4. Copy the repository URL
5. Run:

```bash
cd /home/user/webapp
git remote add origin https://github.com/YOUR_USERNAME/service-performance-dashboard.git
git push -u origin main
```

## Enable GitHub Pages

After pushing your code:

1. Go to your repository on GitHub
2. Click **Settings** > **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Select branch: **main**, folder: **/ (root)**
5. Click **Save**
6. Wait 1-2 minutes for deployment

Your dashboard will be live at:
```
https://YOUR_USERNAME.github.io/service-performance-dashboard/
```

## Verify GitHub Actions

1. Go to **Actions** tab in your repository
2. You should see the workflow "Refresh Dashboard Data"
3. Click **Run workflow** to test manual trigger
4. Verify the workflow completes successfully

## Troubleshooting

### Permission Denied Error

If you get a permission error when pushing:

```bash
# Ensure you're authenticated
gh auth status

# If not authenticated, login
gh auth login
```

### Repository Already Exists

If the repository name is taken:

```bash
# Use a different name
gh repo create service-dashboard-2024 --public --source=. --remote=origin
```

### GitHub Pages Not Working

1. Check that index.html is in the root directory (✓)
2. Verify branch name is 'main' (✓)
3. Wait 2-3 minutes for first deployment
4. Check Pages settings for error messages
