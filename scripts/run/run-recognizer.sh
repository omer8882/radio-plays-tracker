# Navigate to the Recognizer directory
cd "$(dirname "$0")"
cd ../../backend/recognize

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "No virtual environment found. Try building project."
    exit 1
fi

source venv/bin/activate
python3 recognizer.py
