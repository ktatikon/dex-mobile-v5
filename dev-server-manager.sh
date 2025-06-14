#!/bin/bash

# DEX Mobile V5 Development Server Manager
# This script helps manage the development server and resolve port conflicts

echo "🚀 DEX Mobile V5 Development Server Manager"
echo "==========================================="

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "⚠️  Port $port is in use"
        return 0
    else
        echo "✅ Port $port is available"
        return 1
    fi
}

# Function to kill processes on a specific port
kill_port() {
    local port=$1
    echo "🔄 Checking for processes on port $port..."
    
    if check_port $port; then
        echo "🛑 Killing processes on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 2
        
        if check_port $port; then
            echo "❌ Failed to free port $port"
            return 1
        else
            echo "✅ Port $port is now free"
            return 0
        fi
    fi
}

# Function to start the development server
start_server() {
    local port=${1:-3001}
    
    echo "🔍 Checking port $port availability..."
    
    # Kill any existing processes on the port
    kill_port $port
    
    echo "🚀 Starting development server on port $port..."
    echo "📱 Testing URLs will be available at:"
    echo "   • Main App: http://localhost:$port/"
    echo "   • Button Showcase: http://localhost:$port/showcase"
    echo "   • UI Test Suite: http://localhost:$port/ui-test"
    echo ""
    echo "🎨 Features to test:"
    echo "   • Dark Orange Theme (#B1420A)"
    echo "   • Poppins Typography"
    echo "   • 3D Button Effects with Ambient Glow"
    echo "   • Theme Toggle (Settings Page)"
    echo "   • Frosted Glass Modals"
    echo "   • Enhanced Form Components"
    echo "   • Performance Optimization"
    echo ""
    
    # Start the development server
    npm run dev -- --port $port
}

# Function to show help
show_help() {
    echo "Usage: $0 [COMMAND] [PORT]"
    echo ""
    echo "Commands:"
    echo "  start [PORT]    Start development server (default port: 3001)"
    echo "  stop [PORT]     Stop processes on specified port"
    echo "  check [PORT]    Check if port is available"
    echo "  help           Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start        # Start server on port 3001"
    echo "  $0 start 3002   # Start server on port 3002"
    echo "  $0 stop 8080    # Stop processes on port 8080"
    echo "  $0 check 3001   # Check if port 3001 is available"
}

# Main script logic
case "${1:-start}" in
    "start")
        start_server ${2:-3001}
        ;;
    "stop")
        if [ -z "$2" ]; then
            echo "❌ Please specify a port number"
            echo "Usage: $0 stop [PORT]"
            exit 1
        fi
        kill_port $2
        ;;
    "check")
        if [ -z "$2" ]; then
            echo "❌ Please specify a port number"
            echo "Usage: $0 check [PORT]"
            exit 1
        fi
        check_port $2
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        show_help
        exit 1
        ;;
esac
