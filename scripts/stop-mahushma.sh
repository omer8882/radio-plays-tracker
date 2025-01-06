# stop_all.sh
# 1) Checks if Elasticsearch (elastic) is up.
# 2) Stops recognizer, webui, and tunnel services.
# 3) Verifies each one stopped successfully.

cd "$(dirname "$0")"

echo
echo "Stopping Recognizer"
sudo systemctl stop mahushma-recognizer
if systemctl is-active --quiet mahushma-recognizer; then
  echo "ERROR: Recognizer failed to stop!"
  exit 1
else
  echo "Recognizer stopped."
fi

echo "Stopping Server"
sudo systemctl stop mahushma-server
if systemctl is-active --quiet mahushma-server; then
  echo "ERROR: Server failed to stop!"
  exit 1
else
  echo "Server stopped."
fi

echo
echo "Stopping WebUI"
pm2 stop mahushma-webui
# Check if it’s “online” in PM2
if pm2 status mahushma-webui | grep -q "online"; then
  echo "ERROR: WebUI failed to stop or is online!"
  exit 1
else
  echo "WebUI stopped."
fi

echo
echo "Stopping cloudflared tunnel"
sudo systemctl stop cloudflared
if systemctl is-active --quiet cloudflared; then
  echo "ERROR: cloudflared failed to stop!"
  exit 1
else
  echo "cloudflared tunnel stopped."
fi

echo
echo "fin."
exit 0
