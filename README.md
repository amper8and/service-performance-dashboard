# 📊 Service Performance Dashboard

A production-ready dashboard for tracking **Revenue vs Target** per service on a daily basis, with automated data refresh from Google Sheets.

![Dashboard Preview](https://via.placeholder.com/800x400/3b82f6/ffffff?text=Service+Performance+Dashboard)

## 🌟 Features

- **Real-time Filtering**: Filter by Category, Market, Service, Currency, Month, and Date
- **Dual View Modes**:
  - Service Construct view (Service + Currency breakdown)
  - Service roll-up view (aggregated across all currencies)
- **4 Key Performance Indicators**:
  - MTD Revenue vs Month Target with % to Target
  - Actual vs Required Run Rate
  - Total Base with Net Adds Today
  - Revenue Today with Net Adds Revenue
- **Interactive Charts**:
  - Daily Revenue Line Chart (Cumulative vs Target)
  - Run Rate Bar Chart (Actual vs Required)
- **Detailed Table**: Sortable, searchable, exportable to CSV
- **Automated Data Refresh**: GitHub Actions updates data daily
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🚀 Quick Start

### 1. Fork or Clone This Repository

```bash
git clone https://github.com/YOUR_USERNAME/service-performance-dashboard.git
cd service-performance-dashboard
```

### 2. Configure Your Google Sheet

Edit `config.json` with your Google Sheet details:

```json
{
  "sheetId": "YOUR_SHEET_ID",
  "sheetName": "Sheet1",
  "gid": "0",
  "skipRows": [2]
}
```

**Important**: Your Google Sheet must be publicly accessible (Share > Anyone with the link can view).

**How to find these values:**
- **sheetId**: From your sheet URL: `https://docs.google.com/spreadsheets/d/{sheetId}/edit`
- **sheetName**: The tab name (visible at bottom of sheet)
- **gid**: From the URL when viewing a specific tab: `#gid={gid}`
- **skipRows**: Array of row numbers to skip (default: [2] to skip row 2)

### 3. Enable GitHub Pages

1. Go to repository **Settings** > **Pages**
2. Under **Source**, select **Deploy from a branch**
3. Select branch: **main** and folder: **/ (root)**
4. Click **Save**

Your dashboard will be available at: `https://YOUR_USERNAME.github.io/service-performance-dashboard/`

### 4. Trigger Initial Data Refresh

1. Go to **Actions** tab
2. Click **Refresh Dashboard Data** workflow
3. Click **Run workflow** > **Run workflow**

The workflow will fetch your Google Sheet data and commit it to `public/data/`.

## 📊 Data Structure

### Google Sheet Columns (A-X)

| Column | Field | Description |
|--------|-------|-------------|
| A | Category | Service category |
| B | Market | Geographic market |
| C | Service | Service name |
| D | Month Day | Day number in month (1-31) |
| E | Date | Date (YYYY-MM-DD or MM/DD/YYYY) |
| F | Unsubscribed | Count of unsubscribed users |
| G | Active Subs | Active subscriptions |
| H | New Subs | Net adds for the day |
| I | Total Subs | Total subscriber base |
| J | New Paid | New paid subscriptions |
| K | Renewals Paid | Renewal payments |
| L | Total Paid | Total payments |
| M | Currency | Currency code (USD/ZWG/ZAR) |
| N | New Billed Revenue | New revenue in construct currency |
| O | Renewal Revenue | Renewal revenue in construct currency |
| P | USD rate | Construct currency → USD rate |
| Q | Daily Revenue | Revenue in USD |
| R | Month Cumm | Monthly cumulative (optional) |
| S | USD/ZAR | USD to ZAR conversion rate |
| T | Month Revenue | MTD revenue in ZAR |
| U | Month Target | Monthly target in ZAR |
| V | Target Run Rate | Target run rate (ZAR/day) |
| W | Actual Run Rate | Actual run rate (ZAR/day) |
| X | Required Run Rate | Required run rate (ZAR/day) |

**Note**: Row 2 is skipped by default (treated as a header/reference row).

## 🧮 Calculation Logic

### Key Entities

1. **Service Construct** = Category + Market + Service + Currency
2. **Service (rolled-up)** = Category + Market + Service (sum across all currencies)

### Aggregation Rules

For a selected date and filter combination:

#### MTD Revenue (ZAR)
```
Sum of Column T across all included constructs for the date
```

#### Month Target (ZAR)
```
Sum of Column U across all included constructs for the month
(assumes target is constant within month per construct)
```

#### Daily Revenue (ZAR)
```
Sum of (Column Q * Column S) across all included rows for the date
= Sum of (Daily Revenue USD * USD/ZAR rate)
```

#### Net Adds Revenue (ZAR)
```
Sum of (Column N * Column P * Column S) across all included rows
= Sum of (New Billed Revenue in construct currency * USD rate * USD/ZAR rate)
```

#### Run Rates

**Mathematically correct approach** (used when aggregating multiple constructs):

```javascript
dayNumber = Column D for selected date
daysInMonth = number of days in the selected month

actualRunRate = aggregatedMTDRevenue / dayNumber
requiredRunRate = max(0, (aggregatedMonthTarget - aggregatedMTDRevenue) / max(1, (daysInMonth - dayNumber)))
```

This ensures run rates are calculated from aggregated totals, not summed from individual construct run rates.

### Target to Date (Optional Chart Line)

```javascript
targetToDate(day) = (monthTarget / daysInMonth) * dayNumber
```

This creates a linear progression line from 0 to the month target.

### Status Colors

| % to Target | Color | Status |
|-------------|-------|--------|
| >= 100% | 🟢 Green | On or above target |
| 80-99% | 🟠 Amber | Below target but close |
| < 80% | 🔴 Red | Significantly below target |

## 🔧 Development

### Local Development

To test the dashboard locally:

```bash
# Install a simple HTTP server
npm install -g http-server

# Serve the dashboard
http-server -p 8000

# Open in browser
open http://localhost:8000
```

**Note**: You need valid data in `public/data/data.json` for the dashboard to work.

### Manual Data Refresh

To manually fetch and process data:

```bash
cd scripts
npm install
node fetch_sheet.js
```

This will:
1. Download CSV from your Google Sheet
2. Parse and clean the data (skip row 2)
3. Generate `public/data/data.json`
4. Generate `public/data/meta.json`
5. Save raw CSV to `public/data/raw.csv`

### Automated Refresh Schedule

The GitHub Action runs automatically:
- **Daily at 2 AM UTC** (configured in `.github/workflows/refresh-data.yml`)
- **On demand** (via workflow dispatch)
- **When config or scripts change** (on push to main)

## 📁 Project Structure

```
service-performance-dashboard/
├── index.html                  # Main dashboard page
├── config.json                 # Google Sheet configuration
├── README.md                   # This file
├── LICENSE                     # MIT License
│
├── .github/
│   └── workflows/
│       └── refresh-data.yml    # GitHub Action for data refresh
│
├── public/
│   └── data/
│       ├── data.json          # Processed data (auto-generated)
│       ├── meta.json          # Metadata (auto-generated)
│       └── raw.csv            # Raw CSV backup (auto-generated)
│
├── scripts/
│   ├── package.json           # Node.js dependencies
│   └── fetch_sheet.js         # Data fetching script
│
└── src/
    ├── app.js                 # Main application logic
    ├── data-utils.js          # Data processing utilities
    ├── ui.js                  # UI rendering functions
    └── styles.css             # Dashboard styles
```

## 🛠️ Technologies

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Charts**: [Chart.js](https://www.chartjs.org/) v4
- **Data Processing**: Node.js with csv-parse
- **Automation**: GitHub Actions
- **Hosting**: GitHub Pages (static site)

## 🎯 Usage Tips

### Filtering Strategy

1. **Start broad**: Begin with "All" for each filter
2. **Narrow down**: Apply category/market/service filters as needed
3. **Compare views**: Toggle between Construct and Service views
4. **Time travel**: Use month/date selectors to analyze historical performance

### Interpreting Run Rates

- **Actual Run Rate**: Your current daily average for the month
- **Required Run Rate**: What you need to achieve daily for remaining days to hit target
- **If Actual >= Required**: You're on track! ✅
- **If Actual < Required**: Need to accelerate to meet target ⚠️

### Exporting Data

1. Apply your desired filters
2. Scroll to the detail table
3. Use the search box to further filter
4. Click **Export CSV** to download the current view

## 🔒 Security & Privacy

- All data processing happens in your GitHub repository
- No external servers or databases required
- Google Sheet must be public for automated refresh
- No authentication tokens stored in code

## 🐛 Troubleshooting

### Dashboard shows "No data available"

1. Check that `public/data/data.json` exists and contains data
2. Run the GitHub Action manually to refresh data
3. Verify your Google Sheet is publicly accessible
4. Check browser console for JavaScript errors

### Data refresh fails in GitHub Actions

1. Verify `config.json` has correct `sheetId` and `gid`
2. Ensure Google Sheet is public (Share > Anyone with link can view)
3. Check Actions logs for specific error messages
4. Confirm sheet has data starting from row 3 (row 2 is skipped)

### Date parsing errors

The script supports these date formats:
- `YYYY-MM-DD` (ISO format)
- `MM/DD/YYYY` (US format)
- `DD/MM/YYYY` (International format)

If dates aren't parsing, check your sheet's date format.

### Charts not displaying

1. Ensure Chart.js CDN is accessible
2. Check that data exists for the selected month
3. Verify browser console for Chart.js errors
4. Try clearing browser cache

## 📝 License

MIT License - feel free to use this for your projects!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For issues or questions, please open an issue on GitHub.

---

**Built with ❤️ for data-driven decision making**
