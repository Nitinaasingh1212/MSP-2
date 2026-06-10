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
        print("=== LIVE DIRECTORY SCAN ===")
        print("public_html Contents:")
        print(data['publicHtmlContents'])
        print("\nnodejs/assets Contents:")
        print(data['assetsContents'])
        print("\nparentOfNode Subdirectories:")
        print(data['uploadsContents'])
except Exception as e:
    print("Failed to fetch debug data:", e)
