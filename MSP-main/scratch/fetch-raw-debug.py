import urllib.request

try:
    url = "https://mspharma.in/api/debug-paths"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as response:
        print("STATUS:", response.status)
        print("BODY:")
        print(response.read().decode())
except Exception as e:
    print("Failed to fetch debug data:", e)
