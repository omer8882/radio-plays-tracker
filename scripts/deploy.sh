# deploy
cd "$(dirname "$0")"

echo "[ --- Stopping All Processes --- ]"
./stop-mahushma.sh
if [ $? -ne 0 ]; then
  echo "ERROR: stopping processes failed!"
  exit 1
fi

echo "[ --- Building All Processes --- ]"
./build-mahushma.sh
if [ $? -ne 0 ]; then
  echo "ERROR: building processes failed!"
  exit 1
fi

echo "[ --- Starting All Processes --- ]"
./start-mahushma.sh
if [ $? -ne 0 ]; then
  echo "ERROR: starting processes failed!"
  exit 1
fi

echo "Build process complete!"
exit 0
