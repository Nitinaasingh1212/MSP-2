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
        print("=== PARENT DIRECTORIES ===")
        for d in data['parentDirs']:
            print(f"Path: {d['path']}")
            if 'error' in d:
                print(f"  Error: {d['error']}")
            else:
                print("  Contents:")
                for c in d['contents']:
                    print(f"    - {c}")
except Exception as e:
    print("Failed to fetch parent dirs:", e)
