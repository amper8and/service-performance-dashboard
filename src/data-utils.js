/**
 * Data Utilities for Service Performance Dashboard
 * 
 * This module provides functions for:
 * - Data filtering and grouping
 * - Metric calculations and aggregations
 * - Run rate computations
 * - Date handling
 */

/**
 * Parse date string to Date object
 */
function parseDate(dateStr) {
  return new Date(dateStr);
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

/**
 * Get year-month string from date (YYYY-MM)
 */
function getYearMonth(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Get number of days in a month
 */
function getDaysInMonth(yearMonth) {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

/**
 * Get unique values from data array for a specific field
 */
function getUniqueValues(data, field) {
  const values = [...new Set(data.map(row => row[field]))].filter(Boolean);
  return values.sort();
}

/**
 * Get all available months from data
 */
function getAvailableMonths(data) {
  const months = [...new Set(data.map(row => getYearMonth(row.date)))];
  return months.sort();
}

/**
 * Get all dates for a specific month
 */
function getDatesForMonth(data, yearMonth) {
  const datesInMonth = data
    .filter(row => getYearMonth(row.date) === yearMonth)
    .map(row => row.date);
  
  return [...new Set(datesInMonth)].sort();
}

/**
 * Filter data based on selected filters
 */
function filterData(data, filters) {
  return data.filter(row => {
    // Category filter
    if (filters.category && filters.category !== 'All' && row.category !== filters.category) {
      return false;
    }
    
    // Market filter
    if (filters.market && filters.market !== 'All' && row.market !== filters.market) {
      return false;
    }
    
    // Service filter
    if (filters.service && filters.service !== 'All' && row.service !== filters.service) {
      return false;
    }
    
    // Currency filter (only in construct view)
    if (filters.viewMode === 'construct' && filters.currency && filters.currency !== 'All') {
      if (row.currency !== filters.currency) {
        return false;
      }
    }
    
    // Month filter
    if (filters.month && getYearMonth(row.date) !== filters.month) {
      return false;
    }
    
    return true;
  });
}

/**
 * Group data by service construct (Category + Market + Service + Currency)
 */
function groupByConstruct(data) {
  const groups = {};
  
  data.forEach(row => {
    const key = `${row.category}|${row.market}|${row.service}|${row.currency}`;
    
    if (!groups[key]) {
      groups[key] = {
        category: row.category,
        market: row.market,
        service: row.service,
        currency: row.currency,
        rows: []
      };
    }
    
    groups[key].rows.push(row);
  });
  
  return Object.values(groups);
}

/**
 * Group data by service (Category + Market + Service), rolling up across currencies
 */
function groupByService(data) {
  const groups = {};
  
  data.forEach(row => {
    const key = `${row.category}|${row.market}|${row.service}`;
    
    if (!groups[key]) {
      groups[key] = {
        category: row.category,
        market: row.market,
        service: row.service,
        currency: 'Multiple', // Indicates rolled up
        rows: []
      };
    }
    
    groups[key].rows.push(row);
  });
  
  return Object.values(groups);
}

/**
 * Calculate aggregated metrics for a date from a group of rows
 */
function calculateDateMetrics(rows, targetDate) {
  // Filter rows for the target date
  const dateRows = rows.filter(row => row.date === targetDate);
  
  if (dateRows.length === 0) {
    return null;
  }
  
  // Aggregate basic metrics (sum)
  const mtdRevenue = dateRows.reduce((sum, row) => sum + row.monthRevenue, 0);
  const monthTarget = dateRows.reduce((sum, row) => sum + row.monthTarget, 0);
  const totalBase = dateRows.reduce((sum, row) => sum + row.totalSubs, 0);
  const netAddsToday = dateRows.reduce((sum, row) => sum + row.newSubs, 0);
  
  // Daily Revenue (ZAR) = Q (USD) * S (USD/ZAR)
  const dailyRevenueZAR = dateRows.reduce((sum, row) => {
    return sum + (row.dailyRevenue * row.usdZarRate);
  }, 0);
  
  // Net Adds Revenue (ZAR) = N * P * S
  const netAddsRevenueZAR = dateRows.reduce((sum, row) => {
    return sum + (row.newBilledRevenue * row.usdRate * row.usdZarRate);
  }, 0);
  
  // Calculate run rates from aggregated totals
  const dayNumber = dateRows[0].monthDay;
  const yearMonth = getYearMonth(dateRows[0].date);
  const daysInMonth = getDaysInMonth(yearMonth);
  
  // Actual Run Rate = MTD Revenue / day number
  const actualRunRate = dayNumber > 0 ? mtdRevenue / dayNumber : 0;
  
  // Required Run Rate = (Target - MTD) / remaining days
  const remainingDays = Math.max(1, daysInMonth - dayNumber);
  const requiredRunRate = Math.max(0, (monthTarget - mtdRevenue) / remainingDays);
  
  // % to Target
  const percentToTarget = monthTarget > 0 ? (mtdRevenue / monthTarget) * 100 : 0;
  
  return {
    date: targetDate,
    dayNumber,
    daysInMonth,
    mtdRevenue,
    monthTarget,
    percentToTarget,
    actualRunRate,
    requiredRunRate,
    totalBase,
    netAddsToday,
    dailyRevenueZAR,
    netAddsRevenueZAR
  };
}

/**
 * Calculate metrics for all dates in a month
 */
function calculateMonthMetrics(rows, yearMonth) {
  // Get all unique dates in the month from these rows
  const dates = [...new Set(rows
    .filter(row => getYearMonth(row.date) === yearMonth)
    .map(row => row.date)
  )].sort();
  
  return dates.map(date => calculateDateMetrics(rows, date)).filter(Boolean);
}

/**
 * Calculate target to date (for optional chart line)
 * TargetToDate(day) = (MonthTarget / DaysInMonth) * dayNumber
 */
function calculateTargetToDate(monthTarget, daysInMonth, dayNumber) {
  return (monthTarget / daysInMonth) * dayNumber;
}

/**
 * Get status color based on % to target
 */
function getStatusColor(percentToTarget) {
  if (percentToTarget >= 100) return 'green';
  if (percentToTarget >= 80) return 'amber';
  return 'red';
}

/**
 * Format number with thousands separators
 */
function formatNumber(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

/**
 * Format currency (ZAR)
 */
function formatCurrency(amount, decimals = 0) {
  if (amount === null || amount === undefined || isNaN(amount)) return '-';
  return 'R ' + formatNumber(amount, decimals);
}

/**
 * Format percentage
 */
function formatPercent(value, decimals = 1) {
  if (value === null || value === undefined || isNaN(value)) return '-';
  return formatNumber(value, decimals) + '%';
}

/**
 * Export data to CSV
 */
function exportToCSV(data, filename = 'dashboard-export.csv') {
  // Convert data to CSV format
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape quotes and wrap in quotes if contains comma
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  const csvContent = csvRows.join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get latest date in a month
 */
function getLatestDateInMonth(data, yearMonth) {
  const dates = getDatesForMonth(data, yearMonth);
  return dates.length > 0 ? dates[dates.length - 1] : null;
}

/**
 * Get latest month from data
 */
function getLatestMonth(data) {
  const months = getAvailableMonths(data);
  return months.length > 0 ? months[months.length - 1] : null;
}
