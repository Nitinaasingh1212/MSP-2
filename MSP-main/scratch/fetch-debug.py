import urllib.request
import json

try:
    url = "https://mspharma.in/api/debug-paths"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("=== LIVE SERVER DEBUG INFO ===")
        print(f"CWD: {data['cwd']}")
        print(f"__dirname: {data['__dirname']}")
        print("\nLocal Uploads Directory Contents:")
        print(data['localUploads'])
        print("\nPublic Uploads Directory Contents:")
        print(data['publicUploads'])
except Exception as e:
    print("Failed to fetch debug path info:", e)
