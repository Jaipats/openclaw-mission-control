#!/bin/bash

echo "🚀 Setting up OpenClaw Mission Control..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 16.0.0"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created (you may want to customize it)"
else
    echo "ℹ️  .env file already exists"
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the application, run:"
echo "  npm run dev"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:4000"
echo ""
