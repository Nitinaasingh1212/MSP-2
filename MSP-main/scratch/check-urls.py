import urllib.request

urls = [
    "https://mspharma.in/assets/uploads/products/1781107957266-547176812.webp",
    "https://mspharma.in/assets/uploads/products/1781107957266-13996674.jpg",
    "https://mspharma.in/assets/uploads/products/1781107658474-498454964.jpg",
    "https://mspharma.in/assets/uploads/products/1781107658475-374529324.jpg",
    "https://mspharma.in/assets/uploads/products/1781107658475-78579331.webp"
]

for url in urls:
    try:
        req = urllib.request.Request(
            url, 
            headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://mspharma.in/'
            }
        )
        with urllib.request.urlopen(req) as response:
            print(f"URL: {url} -> STATUS: {response.status}")
    except urllib.error.HTTPError as e:
        print(f"URL: {url} -> FAILED WITH HTTP ERROR: {e.code}")
    except Exception as e:
        print(f"URL: {url} -> FAILED: {e}")
