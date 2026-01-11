/**
 * Main Application Logic for Service Performance Dashboard
 * 
 * This module:
 * - Loads data from JSON
 * - Manages application state and filters
 * - Orchestrates UI updates
 * - Handles user interactions
 */

// Global state
let appState = {
  rawData: [],
  filteredData: [],
  metadata: null,
  filters: {
    category: 'All',
    market: 'All',
    service: 'All',
    currency: 'All',
    viewMode: 'construct',
    month: null,
    date: null
  },
  showTargetToDate: false
};

/**
 * Initialize application
 */
async function initApp() {
  try {
    showLoading(true);
    
    // Load data and metadata
    await loadData();
    
    // Initialize filters with defaults
    initializeFilters();
    
    // Render initial view
    renderDashboard();
    
    // Setup event listeners
    setupEventListeners();
    
    showLoading(false);
    
  } catch (error) {
    console.error('Error initializing app:', error);
    showError('Failed to load dashboard data. Please try again later.');
    showLoading(false);
  }
}

/**
 * Load data from JSON files
 */
async function loadData() {
  try {
    // Load data.json
    const dataResponse = await fetch('./data/data.json');
    if (!dataResponse.ok) {
      throw new Error('Failed to load data.json');
    }
    appState.rawData = await dataResponse.json();
    
    // Load meta.json
    const metaResponse = await fetch('./data/meta.json');
    if (metaResponse.ok) {
      appState.metadata = await metaResponse.json();
      updateLastUpdated(appState.metadata.lastUpdated);
    }
    
    console.log(`Loaded ${appState.rawData.length} rows of data`);
    
  } catch (error) {
    console.error('Error loading data:', error);
    throw error;
  }
}

/**
 * Initialize filters with default values
 */
function initializeFilters() {
  // Set default month to latest available
  const latestMonth = getLatestMonth(appState.rawData);
  appState.filters.month = latestMonth;
  
  // Set default date to latest in that month
  if (latestMonth) {
    const latestDate = getLatestDateInMonth(appState.rawData, latestMonth);
    appState.filters.date = latestDate;
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Filter changes
  document.getElementById('category-filter')?.addEventListener('change', (e) => {
    appState.filters.category = e.target.value;
    renderDashboard();
  });
  
  document.getElementById('market-filter')?.addEventListener('change', (e) => {
    appState.filters.market = e.target.value;
    renderDashboard();
  });
  
  document.getElementById('service-filter')?.addEventListener('change', (e) => {
    appState.filters.service = e.target.value;
    renderDashboard();
  });
  
  document.getElementById('view-mode')?.addEventListener('change', (e) => {
    appState.filters.viewMode = e.target.value;
    
    // Toggle currency filter visibility
    const currencyGroup = document.getElementById('currency-filter-group');
    if (currencyGroup) {
      currencyGroup.style.display = e.target.value === 'construct' ? 'block' : 'none';
    }
    
    renderDashboard();
  });
  
  document.getElementById('currency-filter')?.addEventListener('change', (e) => {
    appState.filters.currency = e.target.value;
    renderDashboard();
  });
  
  document.getElementById('month-filter')?.addEventListener('change', (e) => {
    appState.filters.month = e.target.value;
    
    // Update date filter to latest date in new month
    const latestDate = getLatestDateInMonth(appState.rawData, e.target.value);
    appState.filters.date = latestDate;
    
    renderDashboard();
  });
  
  document.getElementById('date-filter')?.addEventListener('change', (e) => {
    appState.filters.date = e.target.value;
    renderDashboard();
  });
  
  // Target to date toggle
  document.getElementById('toggle-target-to-date')?.addEventListener('change', (e) => {
    appState.showTargetToDate = e.target.checked;
    renderCharts();
  });
  
  // Export CSV button (delegated event handling)
  document.addEventListener('click', (e) => {
    if (e.target.id === 'export-csv') {
      exportCurrentTable();
    }
  });
}

/**
 * Render entire dashboard
 */
function renderDashboard() {
  // Filter data based on current filters
  appState.filteredData = filterData(appState.rawData, appState.filters);
  
  // Group data based on view mode
  const groups = appState.filters.viewMode === 'construct' 
    ? groupByConstruct(appState.filteredData)
    : groupByService(appState.filteredData);
  
  // Render filter bar
  renderFilterBar(appState.rawData, appState.filters, appState.metadata);
  
  // Re-attach filter listeners after re-render
  setupEventListeners();
  
  // Calculate metrics for selected date
  const allRows = groups.flatMap(g => g.rows);
  const dateMetrics = calculateDateMetrics(allRows, appState.filters.date);
  
  // Render KPIs
  renderKPIs(dateMetrics);
  
  // Render charts
  renderCharts();
  
  // Render detail table
  renderDetailTable(groups, appState.filters);
}

/**
 * Render charts
 */
function renderCharts() {
  // Group data based on view mode
  const groups = appState.filters.viewMode === 'construct' 
    ? groupByConstruct(appState.filteredData)
    : groupByService(appState.filteredData);
  
  const allRows = groups.flatMap(g => g.rows);
  
  // Calculate month metrics
  const monthMetrics = calculateMonthMetrics(allRows, appState.filters.month);
  
  // Render charts
  renderRevenueChart(monthMetrics, appState.showTargetToDate);
  renderRunRateChart(monthMetrics);
}

/**
 * Export current table data to CSV
 */
function exportCurrentTable() {
  if (!window.currentTableData || window.currentTableData.length === 0) {
    alert('No data to export');
    return;
  }
  
  const filename = `dashboard-export-${appState.filters.date}.csv`;
  exportToCSV(window.currentTableData, filename);
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated(timestamp) {
  const element = document.getElementById('last-updated');
  if (element && timestamp) {
    const date = new Date(timestamp);
    element.textContent = date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
  const loader = document.getElementById('loading');
  if (loader) {
    loader.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Show error message
 */
function showError(message) {
  const container = document.getElementById('error-container');
  if (container) {
    container.innerHTML = `
      <div class="error-message">
        <strong>Error:</strong> ${message}
      </div>
    `;
    container.style.display = 'block';
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}
