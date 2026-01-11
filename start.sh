#!/bin/bash

# Quick Start Script for Service Performance Dashboard
# This script helps you test the dashboard locally

echo "🚀 Service Performance Dashboard - Quick Start"
echo "=============================================="
echo ""

# Check if data exists
if [ ! -f "public/data/data.json" ]; then
    echo "📥 No data found. Fetching from Google Sheet..."
    cd scripts
    npm install
    node fetch_sheet.js
    cd ..
    echo ""
fi

# Check if http-server is installed
if ! command -v http-server &> /dev/null; then
    echo "📦 Installing http-server..."
    npm install -g http-server
    echo ""
fi

# Start server
echo "🌐 Starting local server..."
echo "Dashboard will be available at: http://localhost:8000"
echo "Press Ctrl+C to stop the server"
echo ""

http-server -p 8000 -o
