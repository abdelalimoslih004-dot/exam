"""
Test Auto-Create Free Challenge on Registration
Tests the new functionality:
1. Auto-creation of free challenge when trader registers
2. No auto-creation for admin/superadmin roles
3. Manual free challenge creation endpoint
4. Duplicate active challenge prevention
"""
import requests
import json
import time
import secrets

BASE_URL = "http://127.0.0.1:5000/api"

def print_test(title, response):
    """Print formatted test result"""
    print(f"\n{'='*70}")
    print(f"✅ {title}")
    print(f"{'='*70}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")

def test_trader_auto_challenge():
    """Test 1: Auto-creation of free challenge when trader registers"""
    print("\n🧪 TEST 1: Auto-Create Free Challenge on Trader Registration")
    print("="*70)
    
    # Create unique username to avoid conflicts
    username = f"trader_test_{secrets.token_hex(4)}"
    email = f"{username}@test.com"
    
    trader_data = {
        "username": username,
        "email": email,
        "password": "password123",
        "role": "trader"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=trader_data)
    print_test("Register Trader", response)
    
    # Verify response
    if response.status_code == 201:
        data = response.json()
        assert 'challenge' in data, "Challenge not found in response!"
        assert data['challenge'] is not None, "Challenge is None!"
        assert data['challenge']['type'] == 'Free Trial', "Challenge type incorrect!"
        assert data['challenge']['initial_balance'] == 5000.0, "Initial balance incorrect!"
        assert data['challenge']['current_balance'] == 5000.0, "Current balance incorrect!"
        assert data['challenge']['status'] == 'active', "Challenge status incorrect!"
        print("✅ PASS: Challenge auto-created with correct values")
        return response.json()
    else:
        print(f"❌ FAIL: Registration failed with status {response.status_code}")
        return None

def test_admin_no_challenge():
    """Test 2: No auto-creation for admin role"""
    print("\n🧪 TEST 2: No Auto-Create for Admin Role")
    print("="*70)
    
    # Create unique username to avoid conflicts
    username = f"admin_test_{secrets.token_hex(4)}"
    email = f"{username}@test.com"
    
    admin_data = {
        "username": username,
        "email": email,
        "password": "password123",
        "role": "admin"
    }
    
    response = requests.post(f"{BASE_URL}/register", json=admin_data)
    print_test("Register Admin", response)
    
    # Verify response
    if response.status_code == 201:
        data = response.json()
        assert data['challenge'] is None, "Challenge should be None for admin!"
        print("✅ PASS: No challenge created for admin")
        return True
    else:
        print(f"❌ FAIL: Registration failed with status {response.status_code}")
        return False

def test_manual_free_challenge(token):
    """Test 3: Manual free challenge creation endpoint"""
    print("\n🧪 TEST 3: Manual Free Challenge Creation")
    print("="*70)
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/challenges/create-free", headers=headers)
    print_test("Create Free Challenge", response)
    
    if response.status_code == 201:
        data = response.json()
        assert 'challenge' in data, "Challenge not found in response!"
        assert data['challenge']['type'] == 'Free Trial', "Challenge type incorrect!"
        assert data['challenge']['initial_balance'] == 5000.0, "Initial balance incorrect!"
        print("✅ PASS: Free challenge created manually")
        return True
    else:
        print(f"❌ FAIL: Free challenge creation failed with status {response.status_code}")
        return False

def test_duplicate_challenge_prevention(token):
    """Test 4: Prevent duplicate active challenges"""
    print("\n🧪 TEST 4: Duplicate Active Challenge Prevention")
    print("="*70)
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.post(f"{BASE_URL}/challenges/create-free", headers=headers)
    print_test("Try Create Duplicate Challenge", response)
    
    if response.status_code == 400:
        data = response.json()
        assert 'error' in data, "Error message not found!"
        assert 'already have an active challenge' in data['error'].lower(), "Wrong error message!"
        print("✅ PASS: Duplicate challenge correctly prevented")
        return True
    else:
        print(f"❌ FAIL: Should have returned 400, got {response.status_code}")
        return False

def test_challenge_verification(token):
    """Test 5: Verify challenge is accessible via /api/challenges"""
    print("\n🧪 TEST 5: Verify Challenge via GET /api/challenges")
    print("="*70)
    
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/challenges", headers=headers)
    print_test("Get User Challenges", response)
    
    if response.status_code == 200:
        data = response.json()
        assert data['count'] > 0, "No challenges found!"
        assert any(c['status'] == 'active' for c in data['challenges']), "No active challenge!"
        print("✅ PASS: Challenge found and accessible")
        return True
    else:
        print(f"❌ FAIL: Failed to get challenges with status {response.status_code}")
        return False

def test_trade_with_auto_challenge(token):
    """Test 6: Record a trade with the auto-created challenge"""
    print("\n🧪 TEST 6: Record Trade with Auto-Created Challenge")
    print("="*70)
    
    headers = {"Authorization": f"Bearer {token}"}
    trade_data = {
        "symbol": "BTCUSD",
        "side": "BUY",
        "entry_price": 50000.0,
        "exit_price": 50500.0,
        "quantity": 0.1
    }
    
    response = requests.post(f"{BASE_URL}/trades", json=trade_data, headers=headers)
    print_test("Record Trade", response)
    
    if response.status_code == 201:
        data = response.json()
        assert 'trade' in data, "Trade not found in response!"
        assert 'challenge' in data, "Challenge not found in response!"
        print(f"Trade P&L: {data['trade']['pnl']}")
        print(f"Challenge Balance: {data['challenge']['current_balance']}")
        print("✅ PASS: Trade recorded successfully")
        return True
    else:
        print(f"❌ FAIL: Trade recording failed with status {response.status_code}")
        return False

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*70)
    print("🚀 Starting Auto-Create Free Challenge Tests")
    print("="*70)
    print("Ensure the Flask server is running on http://127.0.0.1:5000\n")
    time.sleep(1)
    
    results = []
    
    # Test 1: Trader auto-creates challenge
    result1 = test_trader_auto_challenge()
    results.append(("Trader Auto-Challenge", result1 is not None))
    
    if result1 and result1.get('access_token'):
        trader_token = result1['access_token']
        
        # Test 5: Verify challenge exists
        results.append(("Challenge Verification", test_challenge_verification(trader_token)))
        
        # Test 6: Record trade
        results.append(("Trade Recording", test_trade_with_auto_challenge(trader_token)))
        
        # Test 4: Prevent duplicate (trader already has active challenge)
        results.append(("Duplicate Prevention", test_duplicate_challenge_prevention(trader_token)))
    
    # Test 2: Admin doesn't auto-create
    results.append(("Admin No Challenge", test_admin_no_challenge()))
    
    # Test 3: Manual free challenge creation (need user without active challenge)
    username = f"user_manual_{secrets.token_hex(4)}"
    email = f"{username}@test.com"
    user_data = {
        "username": username,
        "email": email,
        "password": "password123",
        "role": "admin"  # Admin doesn't auto-create, so we can test manual creation
    }
    response = requests.post(f"{BASE_URL}/register", json=user_data)
    if response.status_code == 201:
        manual_token = response.json()['access_token']
        results.append(("Manual Free Challenge", test_manual_free_challenge(manual_token)))
    
    # Print summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\n{passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 ALL TESTS PASSED! 🎉")
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
    
    print("="*70 + "\n")

if __name__ == "__main__":
    run_all_tests()
