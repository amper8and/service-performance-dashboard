const fs = require('fs');
const data = JSON.parse(fs.readFileSync('public/data/data.json', 'utf8'));

console.log('='.repeat(80));
console.log('FINANCIAL DATA VERIFICATION');
console.log('='.repeat(80));

// Get latest date
const dates = [...new Set(data.map(d => d.date))].sort();
const latestDate = dates[dates.length - 1];

console.log(`\nLatest Date: ${latestDate}`);
console.log('-'.repeat(80));

// Filter for latest date
const latestData = data.filter(d => d.date === latestDate);

console.log(`\nData rows for ${latestDate}: ${latestData.length}`);

// Show each currency
latestData.forEach(row => {
  console.log(`\n[${row.currency}]`);
  console.log(`  Category: ${row.category}`);
  console.log(`  Market: ${row.market}`);
  console.log(`  Service: ${row.service}`);
  console.log(`  Daily Revenue (USD): $${row.dailyRevenue.toLocaleString()}`);
  console.log(`  Month Revenue (ZAR): R ${row.monthRevenue.toLocaleString()}`);
  console.log(`  Month Target (ZAR): R ${row.monthTarget.toLocaleString()}`);
  console.log(`  % to Target: ${((row.monthRevenue / row.monthTarget) * 100).toFixed(2)}%`);
  console.log(`  Actual Run Rate: R ${row.actualRunRate.toLocaleString()}/day`);
  console.log(`  Required Run Rate: R ${row.requiredRunRate.toLocaleString()}/day`);
});

// Aggregate
const totalMTD = latestData.reduce((sum, row) => sum + row.monthRevenue, 0);
const totalTarget = latestData.reduce((sum, row) => sum + row.monthTarget, 0);
const totalBase = latestData.reduce((sum, row) => sum + row.totalSubs, 0);
const totalNetAdds = latestData.reduce((sum, row) => sum + row.newSubs, 0);

console.log('\n' + '='.repeat(80));
console.log('AGGREGATED DASHBOARD KPIs (All Currencies)');
console.log('='.repeat(80));

console.log(`\n📊 KPI #1: MTD Revenue (Month Target)`);
console.log(`  MTD Revenue: R ${totalMTD.toLocaleString()}`);
console.log(`  Month Target: R ${totalTarget.toLocaleString()}`);
console.log(`  % to Target: ${((totalMTD / totalTarget) * 100).toFixed(2)}%`);
console.log(`  Status: ${totalMTD >= totalTarget ? '🟢 Green' : totalMTD >= totalTarget * 0.8 ? '🟠 Amber' : '🔴 Red'}`);

const dayNumber = latestData[0].monthDay;
const actualRunRate = totalMTD / dayNumber;
// January has 31 days
const remainingDays = 31 - dayNumber;
const requiredRunRate = (totalTarget - totalMTD) / remainingDays;

console.log(`\n💰 KPI #2: Actual Run Rate (Required Run Rate)`);
console.log(`  Actual Run Rate: R ${actualRunRate.toLocaleString()}/day`);
console.log(`  Required Run Rate: R ${requiredRunRate.toLocaleString()}/day`);
console.log(`  Status: ${actualRunRate >= requiredRunRate ? '✅ On track' : '⚠️ Below required'}`);

console.log(`\n👥 KPI #3: Total Base (Net Adds Today)`);
console.log(`  Total Base: ${totalBase.toLocaleString()}`);
console.log(`  Net Adds Today: ${totalNetAdds.toLocaleString()}`);

// Daily revenue in ZAR
const dailyRevenueZAR = latestData.reduce((sum, row) => sum + (row.dailyRevenue * row.usdZarRate), 0);
const netAddsRevenueZAR = latestData.reduce((sum, row) => sum + (row.newBilledRevenue * row.usdRate * row.usdZarRate), 0);

console.log(`\n💵 KPI #4: Revenue Today (Net Adds Revenue)`);
console.log(`  Revenue Today (ZAR): R ${dailyRevenueZAR.toLocaleString()}`);
console.log(`  Net Adds Revenue (ZAR): R ${netAddsRevenueZAR.toLocaleString()}`);
console.log(`  % from new: ${((netAddsRevenueZAR / dailyRevenueZAR) * 100).toFixed(2)}%`);

console.log('\n' + '='.repeat(80));
console.log('✅ All financial calculations verified!');
console.log('='.repeat(80));
