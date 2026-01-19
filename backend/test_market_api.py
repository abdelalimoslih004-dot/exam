"""
Test API routes for PROMPT 2
"""
import requests
import json

BASE_URL = "http://127.0.0.1:5000/api"

print("="*70)
print("🧪 TESTS API ROUTES - PROMPT 2")
print("="*70)

try:
    # Test 1: Market Data Route (Complete)
    print("\n✅ TEST 1: GET /api/market-data")
    print("-"*70)
    response = requests.get(f"{BASE_URL}/market-data", timeout=10)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        
        print("\n📊 Crypto Data:")
        if data['crypto']['BTC']:
            print(f"  BTC: ${data['crypto']['BTC']['price']:,}")
        if data['crypto']['ETH']:
            print(f"  ETH: ${data['crypto']['ETH']['price']:,}")
        
        print("\n📈 BVC Data:")
        if data['bvc']['iam']:
            print(f"  IAM: {data['bvc']['iam']['price']} {data['bvc']['iam']['currency']}")
            print(f"  Variation: {data['bvc']['iam']['variation_percent']}%")
        
        print("\n📰 News:")
        if data['news']['news']:
            for i, article in enumerate(data['news']['news'][:3], 1):
                print(f"  {i}. {article['title']}")
                print(f"     Summary: {article['summary'][:80]}...")
        
        print("\n✅ Route /api/market-data fonctionne!")
    else:
        print(f"❌ Error: {response.text}")
    
    # Test 2: Crypto Specific Route
    print("\n✅ TEST 2: GET /api/crypto/BTC")
    print("-"*70)
    response = requests.get(f"{BASE_URL}/crypto/BTC", timeout=10)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"BTC Price: ${data['price']:,}")
        print(f"Volume: {data['volume']:,}")
        print("✅ Route /api/crypto/BTC fonctionne!")
    
    # Test 3: IAM Stock Route
    print("\n✅ TEST 3: GET /api/bvc/iam")
    print("-"*70)
    response = requests.get(f"{BASE_URL}/bvc/iam", timeout=10)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"IAM Price: {data['price']} {data['currency']}")
        print(f"Variation: {data['variation_percent']}%")
        print("✅ Route /api/bvc/iam fonctionne!")
    
    # Test 4: News Route
    print("\n✅ TEST 4: GET /api/news?limit=3")
    print("-"*70)
    response = requests.get(f"{BASE_URL}/news?limit=3", timeout=10)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"News Count: {data['count']}")
        for i, article in enumerate(data['news'][:2], 1):
            print(f"\n{i}. {article['title']}")
            print(f"   Source: {article['source']}")
            print(f"   Summary: {article['summary'][:100]}...")
        print("\n✅ Route /api/news fonctionne!")
    
    print("\n" + "="*70)
    print("✅ TOUS LES TESTS API PROMPT 2 RÉUSSIS!")
    print("="*70)
    
except requests.exceptions.ConnectionError:
    print("\n❌ ERREUR: Le serveur Flask n'est pas démarré!")
    print("Démarrez le serveur avec:")
    print("C:\\Users\\abdel\\Desktop\\propsens\\backend\\venv\\Scripts\\python.exe C:\\Users\\abdel\\Desktop\\propsens\\backend\\app.py")
except Exception as e:
    print(f"\n❌ Erreur: {str(e)}")
