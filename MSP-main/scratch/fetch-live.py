import urllib.request
import json

try:
    url = "https://mspharma.in/api/products"
    req = urllib.request.Request(
        url, 
        headers={'User-Agent': 'Mozilla/5.0'}
    )
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode())
        print("=== LIVE PRODUCTS ===")
        for p in data:
            if p['name'].lower() in ['test no 1', 'hello']:
                print(f"Name: {p['name']}")
                print(f"Slug: {p['slug']}")
                print(f"Image URL: {p['imageUrl']}")
                print(f"Images: {p['images']}")
                print("---------------------")
except Exception as e:
    print("Failed to fetch products:", e)
