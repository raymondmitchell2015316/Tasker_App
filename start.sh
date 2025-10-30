#!/bin/bash

echo "🐦 Starting Tasker Application..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "   Please create .env file with required variables"
    echo "   See .env.example for reference"
    exit 1
fi

# Run database push
echo "🗄️  Syncing database schema..."
npm run db:push --force

# Start the development server
echo "🚀 Starting development server..."
npm run dev
