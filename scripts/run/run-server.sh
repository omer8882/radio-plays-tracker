# Navigate to the Server directory
cd "$(dirname "$0")"
cd ../../backend/data_poll

# Check if venv exists
if [ ! -d "venv" ]; then
    echo "No virtual environment found. Try building project."
    exit 1
fi

source venv/bin/activate
python3 run.py
