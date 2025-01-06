
# Navigate to the WebUI directory
cd "$(dirname "$0")"
cd ../frontend/radio-plays

# Ensure npm is installed
if ! command -v npm &> /dev/null; then
    echo "npm not found."
    exit
fi

# Install dependencies if node_modules folder doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing WebUI dependencies..."
    npm install
fi

npm run build

if ! command -v serve &> /dev/null; then
    echo "serve not found. installing serve..."
    npm install -g serve
fi

serve -s build -l 3000