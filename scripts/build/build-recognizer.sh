echo "Building recognizer"
cd "$(dirname "$0")"
cd ../../backend/recognize

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "No virtual environment found. Creating one..."
    python3 -m venv venv
fi

# Ensure the 'activate' script is executable
if [ ! -x "venv/bin/activate" ]; then
    echo "Fixing permissions for activate script..."
    chmod +x venv/bin/activate
fi

source venv/bin/activate
pip install -r requirements.txt
deactivate

echo "Built recognizer."