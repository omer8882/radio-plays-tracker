# start_all.sh
# 1) Checks if Elasticsearch (elastic) is up.
# 2) Starts recognizer, webui, and tunnel services.
# 3) Verifies each one started successfully.

cd "$(dirname "$0")"

echo "Checking Elasticsearch status..."
if systemctl is-active --quiet elastic; then
  echo "elasticsearch is up."
else
  echo "WARNING: Elasticsearch is NOT running. Some services may fail to run correctly."
fi

echo
echo "Starting Recognizer"
sudo systemctl start mahushma-recognizer
if systemctl is-active --quiet mahushma-recognizer; then
  echo "Recognizer started successfully."
else
  echo "ERROR: Recognizer failed to start!"
fi

echo
echo "Starting Server"
sudo systemctl start mahushma-sevrer
if systemctl is-active --quiet mahushma-server; then
  echo "Server started successfully."
else
  echo "ERROR: Server failed to start!"
fi

echo
echo "Starting WebUI"
pm2 start mahushma-webui
if pm2 status mahushma-webui | grep -q "online"; then
  echo "WebUI is online."
else
  echo "ERROR: WebUI failed to start or is not online!"
fi

echo
echo "Starting cloudflared tunnel"
sudo systemctl start cloudflared
if systemctl is-active --quiet cloudflared; then
  echo "cloudflared tunnel started successfully."
else
  echo "ERROR: cloudflared failed to start!"
fi

echo
echo "fin."
exit 0
