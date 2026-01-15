# GitHub Deployment Instructions

## Step 1: Authorize GitHub (Required First)

Since GitHub authorization is not yet configured, you need to complete this step first:

1. **Look for the #github tab** in your interface (usually at the top)
2. Click on it and follow the authorization flow
3. You may need to:
   - Authorize the GitHub App
   - Grant permissions to your repositories
   - Optionally set up OAuth authorization

Once you see a success message, come back here and continue with Step 2.

---

## Step 2: Create GitHub Repository

After authorization is complete, you have two options:

### Option A: Using GitHub Web Interface (Recommended for first-time)

1. Go to https://github.com/new
2. Fill in the details:
   - **Repository name**: `service-performance-dashboard` (or your preferred name)
   - **Description**: Service Performance Dashboard with automated data refresh
   - **Visibility**: Public (required for GitHub Pages free tier)
   - **DO NOT** check "Initialize with README" (we already have one)
   - **DO NOT** add .gitignore or license (we already have them)
3. Click **Create repository**
4. Copy the repository URL (it will look like: `https://github.com/YOUR_USERNAME/service-performance-dashboard.git`)

### Option B: Using GitHub CLI (If you prefer command line)

Run this command in your terminal:
```bash
cd /home/user/webapp
gh repo create service-performance-dashboard --public --description "Service Performance Dashboard with automated data refresh"
```

---

## Step 3: Push Your Code to GitHub

Once you have your repository URL, run these commands:

```bash
# Navigate to your project
cd /home/user/webapp

# Add GitHub as remote (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/service-performance-dashboard.git

# Push your code to GitHub
git push -u origin main
```

**Note**: If you get an authentication error:
- Make sure you completed Step 1 (GitHub authorization)
- You may need to run: `gh auth login` and follow the prompts

---

## Step 4: Enable GitHub Pages

After successfully pushing your code:

1. Go to your repository on GitHub: `https://github.com/YOUR_USERNAME/service-performance-dashboard`
2. Click on **Settings** (tab at the top)
3. Scroll down and click on **Pages** (in the left sidebar)
4. Under **Source**:
   - Select **Deploy from a branch**
   - Branch: **main**
   - Folder: **/ (root)**
5. Click **Save**
6. Wait 2-3 minutes for the first deployment

---

## Step 5: Access Your Live Dashboard

After deployment completes, your dashboard will be available at:

```
https://YOUR_USERNAME.github.io/service-performance-dashboard/
```

GitHub will show you this URL in the Pages settings once deployment is complete.

---

## Step 6: Verify Everything Works

1. **Open the live URL** in your browser
2. **Check the dashboard loads** correctly
3. **Verify filters work** (try changing month, date, view mode)
4. **Test the table** (sort, search, export CSV)
5. **Check charts render** properly
6. **Verify data displays** with real financial values

---

## Step 7: Test Automated Data Refresh

Your dashboard has GitHub Actions configured to automatically refresh data daily.

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Click on **Refresh Dashboard Data** workflow (left sidebar)
4. Click **Run workflow** button (right side)
5. Select **main** branch
6. Click **Run workflow**
7. Wait for it to complete (usually 1-2 minutes)
8. Check that new data was committed to your repo

This workflow will now run automatically every day at 2 AM UTC.

---

## Troubleshooting

### "Permission denied" when pushing

**Solution**: Ensure GitHub authorization is complete
```bash
gh auth status
# If not authenticated:
gh auth login
```

### "Repository already exists"

**Solution**: Use a different name or connect to existing repo
```bash
# If you want to use existing repo:
git remote add origin https://github.com/YOUR_USERNAME/existing-repo-name.git
git push -u origin main
```

### GitHub Pages not working

**Common issues**:
1. Wait 3-5 minutes for first deployment
2. Make sure repository is **public** (Pages requires this for free tier)
3. Check that **main** branch is selected in Pages settings
4. Verify **/ (root)** folder is selected

### Dashboard loads but shows "No data"

**Solution**: The data files should be included in the repo. Check:
```bash
# Verify data files exist
ls -la public/data/

# If missing, regenerate:
cd scripts
node fetch_sheet.js
cd ..
git add public/data/
git commit -m "Add data files"
git push
```

### Charts or fonts not loading

**Check**:
1. Browser console for errors (F12 > Console)
2. Chart.js CDN is accessible: https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js
3. Google Fonts CDN is accessible

---

## Quick Reference Commands

```bash
# Check git status
cd /home/user/webapp
git status

# View recent commits
git log --oneline -5

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/service-performance-dashboard.git

# Push to GitHub
git push -u origin main

# Check GitHub authentication
gh auth status

# View all remotes
git remote -v
```

---

## What Happens After Deployment

### ✅ Your dashboard will be live at:
`https://YOUR_USERNAME.github.io/service-performance-dashboard/`

### ✅ Automatic daily data refresh:
- Runs every day at 2 AM UTC
- Fetches latest data from your Google Sheet
- Commits updated data to the repository
- Dashboard updates automatically

### ✅ Easy updates:
- Make changes locally
- Commit and push to GitHub
- Changes go live in 1-2 minutes

---

## Repository Information

**Current location**: `/home/user/webapp`

**Repository stats**:
- 📝 Total commits: 11+
- 📁 Files: 25+ files
- 💾 Size: ~100 KB (excluding node_modules)
- 🎨 Technologies: HTML, CSS, JavaScript, Node.js, GitHub Actions

**Key files**:
- `index.html` - Main dashboard
- `src/app.js` - Application logic
- `src/ui.js` - UI rendering
- `src/data-utils.js` - Data processing
- `src/styles.css` - Styles (Ubuntu + Inter fonts)
- `scripts/fetch_sheet.js` - Data fetcher
- `.github/workflows/refresh-data.yml` - Automated refresh

---

## Need Help?

If you encounter any issues:

1. **Check this guide** for troubleshooting steps
2. **View DEPLOY.md** in the repository for more details
3. **Check GitHub Actions logs** if data refresh fails
4. **Verify Google Sheet** is publicly accessible

---

**Ready to deploy?** Start with Step 1 above! 🚀
