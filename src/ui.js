/**
 * UI Rendering Module for Service Performance Dashboard
 * 
 * This module handles:
 * - Filter bar rendering
 * - KPI blocks rendering
 * - Chart rendering (Chart.js)
 * - Table rendering with sorting and search
 */

let currentCharts = {
  revenue: null,
  runRate: null
};

/**
 * Render filter bar
 */
function renderFilterBar(data, filters, metadata) {
  const filterBar = document.getElementById('filter-bar');
  
  const categories = ['All', ...metadata.dimensions.categories];
  const markets = ['All', ...metadata.dimensions.markets];
  const services = ['All', ...metadata.dimensions.services];
  const currencies = ['All', ...metadata.dimensions.currencies];
  const months = getAvailableMonths(data);
  
  // Get dates for selected month
  const dates = filters.month ? getDatesForMonth(data, filters.month) : [];
  
  filterBar.innerHTML = `
    <div class="filter-group">
      <label for="category-filter">Category</label>
      <select id="category-filter" class="filter-select">
        ${categories.map(c => `<option value="${c}" ${filters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="market-filter">Market</label>
      <select id="market-filter" class="filter-select">
        ${markets.map(m => `<option value="${m}" ${filters.market === m ? 'selected' : ''}>${m}</option>`).join('')}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="service-filter">Service</label>
      <select id="service-filter" class="filter-select">
        ${services.map(s => `<option value="${s}" ${filters.service === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="view-mode">View Mode</label>
      <select id="view-mode" class="filter-select">
        <option value="construct" ${filters.viewMode === 'construct' ? 'selected' : ''}>Service Construct (Service+Currency)</option>
        <option value="service" ${filters.viewMode === 'service' ? 'selected' : ''}>Service (sum across currencies)</option>
      </select>
    </div>
    
    <div class="filter-group" id="currency-filter-group" style="display: ${filters.viewMode === 'construct' ? 'block' : 'none'}">
      <label for="currency-filter">Currency</label>
      <select id="currency-filter" class="filter-select">
        ${currencies.map(c => `<option value="${c}" ${filters.currency === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="month-filter">Month</label>
      <select id="month-filter" class="filter-select">
        ${months.map(m => `<option value="${m}" ${filters.month === m ? 'selected' : ''}>${formatMonthYear(m)}</option>`).join('')}
      </select>
    </div>
    
    <div class="filter-group">
      <label for="date-filter">Date</label>
      <select id="date-filter" class="filter-select">
        ${dates.map(d => `<option value="${d}" ${filters.date === d ? 'selected' : ''}>${formatDate(d)}</option>`).join('')}
      </select>
    </div>
  `;
}

/**
 * Format month-year (YYYY-MM -> Jan 2024)
 */
function formatMonthYear(yearMonth) {
  const [year, month] = yearMonth.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}

/**
 * Render KPI blocks
 */
function renderKPIs(metrics) {
  if (!metrics) {
    document.getElementById('kpi-row').innerHTML = '<p class="no-data">No data available for selected filters</p>';
    return;
  }
  
  const kpiRow = document.getElementById('kpi-row');
  
  const statusColor = getStatusColor(metrics.percentToTarget);
  const statusClass = statusColor === 'green' ? 'status-good' : statusColor === 'amber' ? 'status-warning' : 'status-danger';
  
  kpiRow.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-label">MTD Revenue (Month Target)</div>
      <div class="kpi-value">${formatCurrency(metrics.mtdRevenue)}</div>
      <div class="kpi-sub">Target: ${formatCurrency(metrics.monthTarget)}</div>
      <div class="kpi-sub ${statusClass}">
        <strong>${formatPercent(metrics.percentToTarget)}</strong> to Target
      </div>
    </div>
    
    <div class="kpi-card">
      <div class="kpi-label">Actual Run Rate (Required)</div>
      <div class="kpi-value">${formatCurrency(metrics.actualRunRate)}/day</div>
      <div class="kpi-sub">Required: ${formatCurrency(metrics.requiredRunRate)}/day</div>
      <div class="kpi-sub ${metrics.actualRunRate >= metrics.requiredRunRate ? 'status-good' : 'status-danger'}">
        ${metrics.actualRunRate >= metrics.requiredRunRate ? '✓ On track' : '⚠ Below required'}
      </div>
    </div>
    
    <div class="kpi-card">
      <div class="kpi-label">Total Base (Net Adds Today)</div>
      <div class="kpi-value">${formatNumber(metrics.totalBase)}</div>
      <div class="kpi-sub">Net adds: ${formatNumber(metrics.netAddsToday)}</div>
      <div class="kpi-sub">
        Day ${metrics.dayNumber} of ${metrics.daysInMonth}
      </div>
    </div>
    
    <div class="kpi-card">
      <div class="kpi-label">Revenue Today (Net Adds Revenue)</div>
      <div class="kpi-value">${formatCurrency(metrics.dailyRevenueZAR)}</div>
      <div class="kpi-sub">Net adds: ${formatCurrency(metrics.netAddsRevenueZAR)}</div>
      <div class="kpi-sub">
        ${formatPercent((metrics.netAddsRevenueZAR / metrics.dailyRevenueZAR) * 100)} from new
      </div>
    </div>
  `;
}

/**
 * Render revenue chart
 */
function renderRevenueChart(monthMetrics, showTargetToDate = false) {
  const ctx = document.getElementById('revenue-chart');
  if (!ctx) return;
  
  // Destroy existing chart
  if (currentCharts.revenue) {
    currentCharts.revenue.destroy();
  }
  
  if (!monthMetrics || monthMetrics.length === 0) {
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    return;
  }
  
  const labels = monthMetrics.map(m => m.dayNumber);
  const cumulativeRevenue = monthMetrics.map(m => m.mtdRevenue);
  const target = monthMetrics.map(m => m.monthTarget);
  
  const datasets = [
    {
      label: 'Cumulative Revenue',
      data: cumulativeRevenue,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    },
    {
      label: 'Month Target',
      data: target,
      borderColor: 'rgb(156, 163, 175)',
      backgroundColor: 'transparent',
      borderDash: [5, 5],
      tension: 0,
      fill: false
    }
  ];
  
  // Add target to date line if enabled
  if (showTargetToDate && monthMetrics.length > 0) {
    const firstMetric = monthMetrics[0];
    const targetToDateData = monthMetrics.map(m => 
      calculateTargetToDate(m.monthTarget, m.daysInMonth, m.dayNumber)
    );
    
    datasets.push({
      label: 'Target to Date',
      data: targetToDateData,
      borderColor: 'rgb(34, 197, 94)',
      backgroundColor: 'transparent',
      borderDash: [3, 3],
      tension: 0,
      fill: false
    });
  }
  
  currentCharts.revenue = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Daily Revenue (Cumulative)'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Day of Month'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Revenue (ZAR)'
          },
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

/**
 * Render run rate chart
 */
function renderRunRateChart(monthMetrics) {
  const ctx = document.getElementById('runrate-chart');
  if (!ctx) return;
  
  // Destroy existing chart
  if (currentCharts.runRate) {
    currentCharts.runRate.destroy();
  }
  
  if (!monthMetrics || monthMetrics.length === 0) {
    ctx.getContext('2d').clearRect(0, 0, ctx.width, ctx.height);
    return;
  }
  
  const labels = monthMetrics.map(m => m.dayNumber);
  const actualRunRate = monthMetrics.map(m => m.actualRunRate);
  const requiredRunRate = monthMetrics.map(m => m.requiredRunRate);
  
  currentCharts.runRate = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Actual Run Rate',
          data: actualRunRate,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        },
        {
          label: 'Required Run Rate',
          data: requiredRunRate,
          backgroundColor: 'rgba(239, 68, 68, 0.8)',
          borderColor: 'rgb(239, 68, 68)',
          borderWidth: 1
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: 'Run Rate Comparison (ZAR/day)'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': ' + formatCurrency(context.parsed.y) + '/day';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Day of Month'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Run Rate (ZAR/day)'
          },
          ticks: {
            callback: function(value) {
              return formatCurrency(value);
            }
          }
        }
      }
    }
  });
}

/**
 * Render detail table
 */
function renderDetailTable(groups, filters) {
  const tableContainer = document.getElementById('detail-table');
  
  if (!groups || groups.length === 0) {
    tableContainer.innerHTML = '<p class="no-data">No data available for selected filters</p>';
    return;
  }
  
  // Calculate metrics for each group
  const tableData = groups.map(group => {
    const metrics = calculateDateMetrics(group.rows, filters.date);
    
    if (!metrics) return null;
    
    // Get latest MTD revenue in month
    const monthMetrics = calculateMonthMetrics(group.rows, filters.month);
    const latestMTD = monthMetrics.length > 0 ? monthMetrics[monthMetrics.length - 1].mtdRevenue : 0;
    const targetVariance = metrics.monthTarget - latestMTD;
    
    return {
      category: group.category,
      market: group.market,
      service: group.service,
      currency: group.currency,
      mtdRevenue: metrics.mtdRevenue,
      monthTarget: metrics.monthTarget,
      percentToTarget: metrics.percentToTarget,
      actualRunRate: metrics.actualRunRate,
      requiredRunRate: metrics.requiredRunRate,
      totalBase: metrics.totalBase,
      netAddsToday: metrics.netAddsToday,
      dailyRevenueZAR: metrics.dailyRevenueZAR,
      netAddsRevenueZAR: metrics.netAddsRevenueZAR,
      latestMTD: latestMTD,
      targetVariance: targetVariance
    };
  }).filter(Boolean);
  
  if (tableData.length === 0) {
    tableContainer.innerHTML = '<p class="no-data">No data available for selected date</p>';
    return;
  }
  
  // Build table HTML
  const currencyColumn = filters.viewMode === 'construct' ? '<th data-sort="currency">Currency</th>' : '';
  
  let html = `
    <div class="table-controls">
      <input type="text" id="table-search" placeholder="Search table..." class="search-input">
      <button id="export-csv" class="btn-export">Export CSV</button>
    </div>
    <div class="table-wrapper">
      <table class="detail-table" id="data-table">
        <thead>
          <tr>
            <th data-sort="category">Category</th>
            <th data-sort="market">Market</th>
            <th data-sort="service">Service</th>
            ${currencyColumn}
            <th data-sort="mtdRevenue">MTD Revenue</th>
            <th data-sort="monthTarget">Month Target</th>
            <th data-sort="percentToTarget">% to Target</th>
            <th data-sort="actualRunRate">Actual Run Rate</th>
            <th data-sort="requiredRunRate">Required Run Rate</th>
            <th data-sort="totalBase">Total Base</th>
            <th data-sort="netAddsToday">Net Adds</th>
            <th data-sort="dailyRevenueZAR">Revenue Today</th>
            <th data-sort="targetVariance">Target Variance</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  tableData.forEach(row => {
    const statusClass = getStatusColor(row.percentToTarget);
    const statusClassName = statusClass === 'green' ? 'status-good' : statusClass === 'amber' ? 'status-warning' : 'status-danger';
    
    const currencyCell = filters.viewMode === 'construct' ? `<td>${row.currency}</td>` : '';
    
    html += `
      <tr>
        <td>${row.category}</td>
        <td>${row.market}</td>
        <td>${row.service}</td>
        ${currencyCell}
        <td class="num">${formatCurrency(row.mtdRevenue)}</td>
        <td class="num">${formatCurrency(row.monthTarget)}</td>
        <td class="num ${statusClassName}">${formatPercent(row.percentToTarget)}</td>
        <td class="num">${formatCurrency(row.actualRunRate)}</td>
        <td class="num">${formatCurrency(row.requiredRunRate)}</td>
        <td class="num">${formatNumber(row.totalBase)}</td>
        <td class="num">${formatNumber(row.netAddsToday)}</td>
        <td class="num">${formatCurrency(row.dailyRevenueZAR)}</td>
        <td class="num ${row.targetVariance < 0 ? 'status-good' : 'status-danger'}">${formatCurrency(row.targetVariance)}</td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  tableContainer.innerHTML = html;
  
  // Store data for export
  window.currentTableData = tableData;
  
  // Add table sorting
  addTableSorting();
  
  // Add table search
  addTableSearch();
}

/**
 * Add table sorting functionality
 */
function addTableSorting() {
  const table = document.getElementById('data-table');
  if (!table) return;
  
  const headers = table.querySelectorAll('th[data-sort]');
  
  headers.forEach(header => {
    header.style.cursor = 'pointer';
    header.addEventListener('click', () => {
      const sortKey = header.getAttribute('data-sort');
      sortTable(table, sortKey);
    });
  });
}

/**
 * Sort table by column
 */
function sortTable(table, key) {
  const tbody = table.querySelector('tbody');
  const rows = Array.from(tbody.querySelectorAll('tr'));
  
  // Determine sort direction
  const currentSort = table.getAttribute('data-sort');
  const currentDir = table.getAttribute('data-sort-dir') || 'asc';
  const newDir = (currentSort === key && currentDir === 'asc') ? 'desc' : 'asc';
  
  // Sort rows
  rows.sort((a, b) => {
    const aVal = a.cells[getColumnIndex(table, key)].textContent;
    const bVal = b.cells[getColumnIndex(table, key)].textContent;
    
    // Try numeric comparison
    const aNum = parseFloat(aVal.replace(/[^0-9.-]/g, ''));
    const bNum = parseFloat(bVal.replace(/[^0-9.-]/g, ''));
    
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return newDir === 'asc' ? aNum - bNum : bNum - aNum;
    }
    
    // String comparison
    return newDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
  });
  
  // Re-append sorted rows
  rows.forEach(row => tbody.appendChild(row));
  
  // Update sort state
  table.setAttribute('data-sort', key);
  table.setAttribute('data-sort-dir', newDir);
}

/**
 * Get column index by sort key
 */
function getColumnIndex(table, key) {
  const headers = table.querySelectorAll('th[data-sort]');
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].getAttribute('data-sort') === key) {
      return i;
    }
  }
  return 0;
}

/**
 * Add table search functionality
 */
function addTableSearch() {
  const searchInput = document.getElementById('table-search');
  const table = document.getElementById('data-table');
  
  if (!searchInput || !table) return;
  
  searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = table.querySelectorAll('tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
  });
}
