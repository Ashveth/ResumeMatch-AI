#!/bin/bash

# Customer Sentiment Alert System - Deployment Script
# This script helps deploy the application to various environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if ! command -v mongod &> /dev/null; then
        print_warning "MongoDB is not installed. Please install MongoDB or use a cloud service."
    fi
    
    print_success "Dependencies check completed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    npm install
    
    # Install server dependencies
    cd server
    npm install
    cd ..
    
    # Install client dependencies
    cd client
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Setup environment files
setup_environment() {
    print_status "Setting up environment files..."
    
    # Check if .env exists in server
    if [ ! -f "server/.env" ]; then
        if [ -f "server/.env.example" ]; then
            cp server/.env.example server/.env
            print_warning "Created server/.env from example. Please update with your actual values."
        else
            print_error "server/.env.example not found. Please create server/.env manually."
            exit 1
        fi
    fi
    
    # Check if .env exists in client
    if [ ! -f "client/.env" ]; then
        echo "REACT_APP_SERVER_URL=http://localhost:5000" > client/.env
        print_success "Created client/.env"
    fi
    
    print_success "Environment setup completed"
}

# Build the application
build_application() {
    print_status "Building application..."
    
    # Build client
    cd client
    npm run build
    cd ..
    
    print_success "Application built successfully"
}

# Start MongoDB (if available)
start_mongodb() {
    if command -v mongod &> /dev/null; then
        print_status "Starting MongoDB..."
        
        # Check if MongoDB is already running
        if pgrep -x "mongod" > /dev/null; then
            print_warning "MongoDB is already running"
        else
            # Start MongoDB in background
            mongod --fork --logpath /tmp/mongodb.log
            print_success "MongoDB started"
        fi
    else
        print_warning "MongoDB not found. Please ensure MongoDB is running or use a cloud service."
    fi
}

# Start the application
start_application() {
    print_status "Starting application..."
    
    # Start the server
    npm start &
    SERVER_PID=$!
    
    print_success "Application started successfully"
    print_status "Server PID: $SERVER_PID"
    print_status "Application URL: http://localhost:5000"
    print_status "Dashboard URL: http://localhost:3000"
}

# Docker deployment
docker_deploy() {
    print_status "Deploying with Docker..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Build and start containers
    docker-compose up -d --build
    
    print_success "Docker deployment completed"
    print_status "Application URL: http://localhost"
}

# Production deployment
production_deploy() {
    print_status "Starting production deployment..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Install production dependencies only
    cd server
    npm install --only=production
    cd ..
    
    # Build client for production
    cd client
    npm run build
    cd ..
    
    # Start with PM2 if available
    if command -v pm2 &> /dev/null; then
        print_status "Starting with PM2..."
        pm2 start server/index.js --name "sentiment-alerts"
        print_success "Application started with PM2"
    else
        print_warning "PM2 not found. Starting with node directly..."
        node server/index.js &
        print_success "Application started"
    fi
}

# Health check
health_check() {
    print_status "Performing health check..."
    
    # Wait for server to start
    sleep 5
    
    # Check if server is responding
    if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
        print_success "Health check passed"
    else
        print_error "Health check failed. Server may not be running properly."
        exit 1
    fi
}

# Cleanup function
cleanup() {
    print_status "Cleaning up..."
    
    # Kill background processes
    if [ ! -z "$SERVER_PID" ]; then
        kill $SERVER_PID 2>/dev/null || true
    fi
    
    print_success "Cleanup completed"
}

# Main deployment function
deploy() {
    local environment=${1:-development}
    
    print_status "Starting deployment for environment: $environment"
    
    case $environment in
        "development")
            check_dependencies
            install_dependencies
            setup_environment
            start_mongodb
            start_application
            health_check
            ;;
        "production")
            check_dependencies
            install_dependencies
            setup_environment
            build_application
            start_mongodb
            production_deploy
            health_check
            ;;
        "docker")
            docker_deploy
            ;;
        *)
            print_error "Unknown environment: $environment"
            print_status "Available environments: development, production, docker"
            exit 1
            ;;
    esac
    
    print_success "Deployment completed successfully!"
    print_status "Next steps:"
    print_status "1. Update environment variables in server/.env"
    print_status "2. Configure alert channels (Slack, Email)"
    print_status "3. Set up data sources (Twitter, Reddit, Google Reviews)"
    print_status "4. Test the application functionality"
}

# Trap cleanup on exit
trap cleanup EXIT

# Parse command line arguments
case "${1:-development}" in
    "development"|"production"|"docker")
        deploy "$1"
        ;;
    "help"|"-h"|"--help")
        echo "Customer Sentiment Alert System - Deployment Script"
        echo ""
        echo "Usage: $0 [environment]"
        echo ""
        echo "Environments:"
        echo "  development  - Deploy for development (default)"
        echo "  production   - Deploy for production"
        echo "  docker       - Deploy using Docker"
        echo ""
        echo "Examples:"
        echo "  $0                    # Deploy for development"
        echo "  $0 production         # Deploy for production"
        echo "  $0 docker            # Deploy with Docker"
        ;;
    *)
        print_error "Unknown command: $1"
        print_status "Use '$0 help' for usage information"
        exit 1
        ;;
esac