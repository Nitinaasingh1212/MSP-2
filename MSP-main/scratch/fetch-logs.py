import urllib.request
import json
import time

# Wait 5 seconds for Node to restart and load the new script
time.sleep(5)

try:
    url = "https://mspharma.in/api/debug-paths"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("=== LIVE SERVER CONSOLE LOG ===")
        print(data.get('consoleLog', 'No console.log found'))
        print("\n=== LIVE SERVER STDERR LOG ===")
        print(data.get('stderrLog', 'No stderr.log found'))
except Exception as e:
    print("Failed to fetch logs:", e)
