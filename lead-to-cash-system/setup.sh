#!/bin/bash

# One-Click Setup Script for Lead-to-Cash System
echo "🚀 Starting Lead-to-Cash System Setup..."

# 1. Check if Docker is installed
if ! [ -x "$(command -v docker)" ]; then
  echo "❌ Error: Docker is not installed. Please install Docker first: https://www.docker.com/"
  exit 1
fi

# 2. Check if Docker Compose is installed
if ! [ -x "$(command -v docker-compose)" ]; then
  echo "❌ Error: docker-compose is not installed."
  exit 1
fi

# 3. Build and Start the containers
echo "📦 Building and starting containers..."
docker-compose up -d --build

# 4. Success message
echo "✅ Setup complete!"
echo "🌐 You can access the application at:"
echo "   - Local: http://localhost:3000"
echo "   - LAN:   http://$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $1}'):3000"
echo ""
echo "📝 To see logs, run: docker-compose logs -f"
