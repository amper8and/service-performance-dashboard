# Detail Table Update - Daily Performance View

## Change Summary ✓

The **Detailed Breakdown** table has been updated to show **daily performance data** instead of service/construct summaries.

## Previous Behavior

The table showed:
- **One row per service construct** (or rolled-up service)
- Metrics for the selected date only
- Category, Market, Service, Currency columns
- Target variance calculations

## New Behavior

The table now shows:
- **One row per day** in the selected month
- All days from the 1st of the month **up to and including the selected date**
- Daily progression of all key metrics
- Clear visibility of performance trends over time

## New Table Columns

| Column | Description |
|--------|-------------|
| **Date** | Calendar date (e.g., "Dec 1, 2025") |
| **Day** | Day number in the month (1-31) |
| **Daily Revenue** | Revenue generated on that specific day (ZAR) |
| **Net Adds Rev** | Revenue from new subscribers that day (ZAR) |
| **MTD Revenue** | Cumulative revenue from start of month to that day (ZAR) |
| **Month Target** | Monthly target for the service(s) (ZAR) |
| **% to Target** | MTD Revenue as percentage of Month Target (color-coded) |
| **Actual Run Rate** | Average daily revenue rate up to that day (ZAR/day) |
| **Required Run Rate** | Daily rate needed for remaining days to hit target (ZAR/day) |
| **Total Base** | Total subscriber base on that day |
| **Net Adds** | New subscribers added that day (net) |

## Color Coding

### % to Target Status
- 🟢 **Green**: ≥100% (on or above target)
- 🟠 **Amber**: 80-99% (below target but close)
- 🔴 **Red**: <80% (significantly below target)

### Actual Run Rate Status
- 🟢 **Green**: Actual ≥ Required (on track)
- 🔴 **Red**: Actual < Required (needs to accelerate)

## Example Table View

If you select **January 10, 2026**, the table will show:

```
Date          Day  Daily Revenue  MTD Revenue   % to Target  Actual Run Rate  Required Run Rate
Jan 1, 2026    1   R 43,639      R 43,639       2.2%         R 43,639/day    R 64,530/day
Jan 2, 2026    2   R 45,248      R 88,887       4.4%         R 44,444/day    R 64,545/day
Jan 3, 2026    3   R 47,861      R 136,748      6.8%         R 45,583/day    R 64,659/day
...
Jan 10, 2026   10  R 62,172      R 644,875     32.2%         R 64,488/day    R 64,530/day
```

This allows you to:
- See daily revenue trends
- Track how MTD revenue builds up
- Monitor run rate changes day by day
- Identify specific days with high/low performance

## Benefits

1. **Daily Visibility**: See performance for every single day in the month
2. **Trend Analysis**: Identify patterns and anomalies in daily data
3. **Progressive View**: Shows how metrics evolved from day 1 to selected date
4. **Better Insights**: Understand which days contributed most to revenue
5. **Easy Export**: Export daily data to CSV for further analysis

## Data Aggregation

The daily metrics aggregate **all filtered services/constructs** based on:
- Current Category filter
- Current Market filter
- Current Service filter
- Current View Mode (Construct vs Service roll-up)
- Current Currency filter (if in Construct view)

## How It Works

1. **Date Range**: Shows all dates from the 1st day of the selected month up to (and including) the selected date
2. **Calculations**: Each row shows aggregated metrics for all matching services/constructs on that specific day
3. **Sorting**: Click any column header to sort (default: chronological)
4. **Search**: Type to filter rows by date or values
5. **Export**: Click "Export CSV" to download the current daily view

## Use Cases

### Track Monthly Progress
- See how close you are to target each day
- Identify if you're falling behind early in the month

### Analyze Daily Patterns
- Which days of the week perform best?
- Are there patterns in new subscriber additions?

### Performance Reviews
- Show daily progress in reports
- Highlight specific high-performing days

### Planning & Forecasting
- Use historical daily data to predict future performance
- Adjust strategies based on daily trends

## Files Modified

- ✅ `src/ui.js` - Updated `renderDetailTable()` function

## Commit

```bash
commit b2d58ce
Change detail table to show daily performance data for the month
```

## Live Dashboard

🌐 **View Updated Table**: https://3000-ic2ll7tq58dbyh0w6c4z1-6532622b.e2b.dev/

Select any month and date to see the daily breakdown. The table will automatically show all days from the 1st of that month up to your selected date.

---

**Status**: ✅ COMPLETED  
**Date**: 2026-01-11  
**Impact**: Enhanced daily visibility and trend analysis capabilities
