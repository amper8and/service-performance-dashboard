#!/usr/bin/env node

/**
 * Fetch Google Sheet data and process into JSON format
 * 
 * This script:
 * 1. Downloads CSV data from a public Google Sheet
 * 2. Parses and validates the data
 * 3. Skips row 2 (header/reference row)
 * 4. Converts to JSON format
 * 5. Generates metadata
 * 6. Saves to public/data directory
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read configuration
const configPath = path.join(__dirname, '..', 'config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const { sheetId, sheetName = 'Sheet1', gid = '0', skipRows = [2] } = config;

/**
 * Construct Google Sheets CSV export URL
 */
function getSheetCsvUrl(sheetId, gid) {
  // Use the export format that works with public sheets
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

/**
 * Fetch CSV data from Google Sheets
 */
async function fetchSheetData(sheetId, gid) {
  const url = getSheetCsvUrl(sheetId, gid);
  
  console.log(`Fetching data from: ${url}`);
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const csvText = await response.text();
    return csvText;
  } catch (error) {
    console.error('Error fetching sheet data:', error.message);
    throw error;
  }
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Try ISO format first
  let date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date;
  }
  
  // Try common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
  const formats = [
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,  // MM/DD/YYYY or DD/MM/YYYY
    /^(\d{4})-(\d{1,2})-(\d{1,2})$/,    // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      // Try as MM/DD/YYYY first
      date = new Date(match[1] + '/' + match[2] + '/' + match[3]);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }
  
  return null;
}

/**
 * Parse and clean CSV data
 */
function parseAndCleanData(csvText, skipRows = []) {
  // Parse CSV
  const records = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true
  });
  
  console.log(`Parsed ${records.length} rows from CSV`);
  
  // Filter out rows to skip (row numbers are 1-based, but after header it's 0-based in array)
  // Row 2 in spreadsheet = index 0 in parsed array (since row 1 is header)
  const filteredRecords = records.filter((record, index) => {
    const rowNumber = index + 2; // +2 because index 0 = row 2 in spreadsheet
    return !skipRows.includes(rowNumber);
  });
  
  console.log(`After filtering skip rows: ${filteredRecords.length} rows`);
  
  // Process and normalize data
  const processedData = [];
  let skippedRows = 0;
  
  for (let i = 0; i < filteredRecords.length; i++) {
    const record = filteredRecords[i];
    
    // Get column values (handling different possible column names)
    const category = record['Category'] || record['A'] || '';
    const market = record['Market'] || record['B'] || '';
    const service = record['Service'] || record['C'] || '';
    const monthDay = record['Month Day'] || record['D'] || '';
    const dateStr = record['Date'] || record['E'] || '';
    
    // Parse date
    const date = parseDate(dateStr);
    
    // Skip rows with invalid dates
    if (!date || isNaN(date.getTime())) {
      skippedRows++;
      continue;
    }
    
    // Parse numeric values
    const parseNum = (val) => {
      if (val === '' || val === null || val === undefined) return 0;
      // Remove currency symbols ($, R), spaces, commas, and any non-numeric chars except . and -
      const cleaned = String(val)
        .replace(/[$R]/g, '')           // Remove currency symbols
        .replace(/\s/g, '')             // Remove all whitespace
        .replace(/,/g, '')              // Remove commas
        .replace(/[^\d.-]/g, '');       // Remove any other non-numeric chars except . and -
      const num = parseFloat(cleaned);
      return isNaN(num) ? 0 : num;
    };
    
    const dataRow = {
      // Identifiers
      category: category,
      market: market,
      service: service,
      
      // Date info
      monthDay: parseInt(monthDay) || 0,
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      
      // Subscription metrics
      unsubscribed: parseNum(record['Unsubscribed'] || record['F']),
      activeSubs: parseNum(record['Active Subs'] || record['G']),
      newSubs: parseNum(record['New Subs'] || record['H']),
      totalSubs: parseNum(record['Total Subs'] || record['I']),
      
      // Payment metrics
      newPaid: parseNum(record['New Paid'] || record['J']),
      renewalsPaid: parseNum(record['Renewals Paid'] || record['K']),
      totalPaid: parseNum(record['Total Paid'] || record['L']),
      
      // Currency and revenue
      currency: record['Currency'] || record['M'] || 'USD',
      newBilledRevenue: parseNum(record['New Billed Revenue'] || record['N']),
      renewalRevenue: parseNum(record['Renewal Revenue'] || record['O']),
      usdRate: parseNum(record['USD rate'] || record['P']),
      dailyRevenue: parseNum(record['Daily Revenue'] || record['Q']),
      
      // Monthly tracking
      monthCumm: parseNum(record['Month Cumm'] || record['R']),
      usdZarRate: parseNum(record['USD/ZAR'] || record['S']),
      monthRevenue: parseNum(record['Month Revenue'] || record['T']),
      monthTarget: parseNum(record['Month Target'] || record['U']),
      
      // Run rates
      targetRunRate: parseNum(record['Target Run Rate'] || record['V']),
      actualRunRate: parseNum(record['Actual Run Rate'] || record['W']),
      requiredRunRate: parseNum(record['Required Run Rate'] || record['X'])
    };
    
    processedData.push(dataRow);
  }
  
  console.log(`Processed ${processedData.length} valid data rows`);
  console.log(`Skipped ${skippedRows} rows with invalid dates`);
  
  return processedData;
}

/**
 * Generate metadata
 */
function generateMetadata(data) {
  const now = new Date().toISOString();
  
  // Extract unique values
  const categories = [...new Set(data.map(d => d.category))].filter(Boolean).sort();
  const markets = [...new Set(data.map(d => d.market))].filter(Boolean).sort();
  const services = [...new Set(data.map(d => d.service))].filter(Boolean).sort();
  const currencies = [...new Set(data.map(d => d.currency))].filter(Boolean).sort();
  
  // Date range
  const dates = data.map(d => d.date).sort();
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  
  return {
    lastUpdated: now,
    rowCount: data.length,
    dateRange: {
      min: minDate,
      max: maxDate
    },
    dimensions: {
      categories: categories,
      markets: markets,
      services: services,
      currencies: currencies
    }
  };
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Starting data refresh process...');
    console.log(`Sheet ID: ${sheetId}`);
    console.log(`Sheet Name: ${sheetName}`);
    console.log(`GID: ${gid}`);
    
    // Fetch data
    const csvText = await fetchSheetData(sheetId, gid);
    
    // Parse and clean
    const processedData = parseAndCleanData(csvText, skipRows);
    
    if (processedData.length === 0) {
      console.warn('WARNING: No valid data rows found!');
    }
    
    // Generate metadata
    const metadata = generateMetadata(processedData);
    
    // Ensure output directory exists
    const outputDir = path.join(__dirname, '..', 'public', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write data.json
    const dataPath = path.join(outputDir, 'data.json');
    fs.writeFileSync(dataPath, JSON.stringify(processedData, null, 2));
    console.log(`✓ Wrote ${processedData.length} rows to ${dataPath}`);
    
    // Write meta.json
    const metaPath = path.join(outputDir, 'meta.json');
    fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2));
    console.log(`✓ Wrote metadata to ${metaPath}`);
    
    // Write raw CSV (optional)
    const csvPath = path.join(outputDir, 'raw.csv');
    fs.writeFileSync(csvPath, csvText);
    console.log(`✓ Wrote raw CSV to ${csvPath}`);
    
    console.log('\n✓ Data refresh completed successfully!');
    console.log(`  Last updated: ${metadata.lastUpdated}`);
    console.log(`  Date range: ${metadata.dateRange.min} to ${metadata.dateRange.max}`);
    console.log(`  Categories: ${metadata.dimensions.categories.length}`);
    console.log(`  Markets: ${metadata.dimensions.markets.length}`);
    console.log(`  Services: ${metadata.dimensions.services.length}`);
    console.log(`  Currencies: ${metadata.dimensions.currencies.length}`);
    
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { fetchSheetData, parseAndCleanData, generateMetadata };
