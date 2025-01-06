# build-mahushma.sh
cd "$(dirname "$0")"

echo "[ --- Building Recognizer --- ]"
./build/build-recognizer.sh
if [ $? -ne 0 ]; then
  echo "ERROR: build-recognizer failed!"
  exit 1
fi

echo "[ --- Building Server --- ]"
./build/build-server.sh
if [ $? -ne 0 ]; then
  echo "ERROR: build-server failed!"
  exit 1
fi

echo "[ --- Building WebUI --- ]"
./build/build-webui.sh
if [ $? -ne 0 ]; then
  echo "ERROR: build-webui failed!"
  exit 1
fi
echo
echo "Build process complete!"
exit 0
