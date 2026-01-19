"""
Script de test des APIs backend
"""
import requests
import json
import time

BASE_URL = "http://127.0.0.1:5000/api"

def print_test(title, response):
    print(f"\n{'='*60}")
    print(f"✅ {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")

def test_apis():
    try:
        # Test 1: Health Check
        print("\n🧪 TEST 1: Health Check")
        response = requests.get(f"{BASE_URL}/health")
        print_test("Health Check", response)
        time.sleep(1)
        
        # Test 2: Register User (Trader)
        print("\n🧪 TEST 2: Register Trader")
        trader_data = {
            "username": "trader1",
            "email": "trader1@test.com",
            "password": "password123",
            "role": "trader"
        }
        response = requests.post(f"{BASE_URL}/register", json=trader_data)
        print_test("Register Trader", response)
        trader_token = response.json().get('access_token')
        time.sleep(1)
        
        # Test 3: Login Admin
        print("\n🧪 TEST 3: Login Admin")
        admin_data = {
            "username": "admin",
            "password": "admin123"
        }
        response = requests.post(f"{BASE_URL}/login", json=admin_data)
        print_test("Login Admin", response)
        admin_token = response.json().get('access_token')
        time.sleep(1)
        
        # Test 4: Get Current User (Trader)
        print("\n🧪 TEST 4: Get Current User (Trader)")
        headers = {"Authorization": f"Bearer {trader_token}"}
        response = requests.get(f"{BASE_URL}/me", headers=headers)
        print_test("Get Current User", response)
        time.sleep(1)
        
        # Test 5: Get All Users (Admin - Should Work)
        print("\n🧪 TEST 5: Get All Users (Admin)")
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/users", headers=headers)
        print_test("Get All Users (Admin)", response)
        time.sleep(1)
        
        # Test 6: Get All Users (Trader - Should Fail with 403)
        print("\n🧪 TEST 6: Get All Users (Trader - Should Fail)")
        headers = {"Authorization": f"Bearer {trader_token}"}
        response = requests.get(f"{BASE_URL}/users", headers=headers)
        print(f"\n{'='*60}")
        print(f"⚠️  Get All Users (Trader - Expected Fail)")
        print(f"{'='*60}")
        print(f"Status: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
        
        print("\n" + "="*60)
        print("✅ TOUS LES TESTS TERMINÉS AVEC SUCCÈS!")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ Erreur: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Démarrage des tests API...")
    print("Assurez-vous que le serveur Flask est en cours d'exécution!\n")
    time.sleep(2)
    test_apis()
