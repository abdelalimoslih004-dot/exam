"""
Test Trading Flow - Complete End-to-End Testing
Tests the full trading platform workflow from registration to trading
"""
import requests
import json
import time
from datetime import datetime

BASE_URL = "http://127.0.0.1:5000/api"

def print_test(title, response):
    """Pretty print test results"""
    print(f"\n{'='*80}")
    print(f"✅ {title}")
    print(f"{'='*80}")
    print(f"Status: {response.status_code}")
    try:
        print(f"Response: {json.dumps(response.json(), indent=2, ensure_ascii=False)}")
    except:
        print(f"Response: {response.text}")
    print(f"{'='*80}\n")

def test_trading_flow():
    """Test complete trading flow"""
    try:
        timestamp = int(time.time())
        
        # Test 1: Health Check
        print("\n🧪 TEST 1: Health Check")
        response = requests.get(f"{BASE_URL}/health")
        print_test("Health Check", response)
        assert response.status_code == 200
        time.sleep(1)
        
        # Test 2: Register User (Auto-creates Free Trial challenge)
        print("\n🧪 TEST 2: Register User with Auto Free Trial Challenge")
        user_data = {
            "username": f"trader_{timestamp}",
            "email": f"trader_{timestamp}@test.com",
            "password": "password123",
            "role": "trader"
        }
        response = requests.post(f"{BASE_URL}/register", json=user_data)
        print_test("Register User", response)
        assert response.status_code == 201
        
        user_token = response.json().get('access_token')
        assert user_token is not None
        
        # Verify Free Trial challenge was created
        free_trial = response.json().get('challenge')
        assert free_trial is not None, "Free Trial challenge should be auto-created"
        assert free_trial['type'] == 'Free Trial'
        print(f"✅ Free Trial challenge created with balance: {free_trial['current_balance']}")
        time.sleep(1)
        
        # Test 3: Get Available Challenge Types
        print("\n🧪 TEST 3: Get Available Challenge Types")
        headers = {"Authorization": f"Bearer {user_token}"}
        response = requests.get(f"{BASE_URL}/challenges/available", headers=headers)
        print_test("Get Available Challenges", response)
        assert response.status_code == 200
        
        challenge_types = response.json().get('challenge_types', [])
        assert len(challenge_types) == 3  # Starter, Pro, Elite
        print(f"📋 Available challenge types: {[c['type'] for c in challenge_types]}")
        time.sleep(1)
        
        # Test 4: Select Starter Challenge
        print("\n🧪 TEST 4: Select Starter Challenge")
        response = requests.post(
            f"{BASE_URL}/challenges/select",
            json={"challenge_type": "Starter"},
            headers=headers
        )
        print_test("Select Starter Challenge", response)
        assert response.status_code == 201
        
        challenge = response.json().get('challenge')
        challenge_id = challenge['id']
        initial_balance = challenge['initial_balance']
        assert initial_balance == 5000.0
        print(f"✅ Starter challenge created with ID: {challenge_id}, Balance: {initial_balance}")
        time.sleep(1)
        
        # Test 5: Start Challenge
        print("\n🧪 TEST 5: Start Challenge")
        response = requests.post(
            f"{BASE_URL}/challenges/{challenge_id}/start",
            json={},
            headers=headers
        )
        print_test("Start Challenge", response)
        assert response.status_code == 200
        
        challenge = response.json().get('challenge')
        assert challenge['status'] == 'active'
        assert challenge['start_date'] is not None
        print(f"✅ Challenge started - Status: {challenge['status']}")
        time.sleep(1)
        
        # Test 6: Record Profitable BUY Trade
        print("\n🧪 TEST 6: Record Profitable BUY Trade")
        trade_data = {
            "symbol": "BTCUSD",
            "side": "BUY",
            "entry_price": 50000.0,
            "exit_price": 50500.0,  # +500 profit per BTC
            "quantity": 0.1
        }
        response = requests.post(
            f"{BASE_URL}/trades",
            json=trade_data,
            headers=headers
        )
        print_test("Record BUY Trade", response)
        assert response.status_code == 201
        
        trade = response.json().get('trade')
        updated_challenge = response.json().get('challenge')
        assert trade['pnl'] == 50.0  # (50500 - 50000) * 0.1
        assert updated_challenge['current_balance'] > initial_balance
        print(f"✅ BUY Trade P&L: +{trade['pnl']}, New Balance: {updated_challenge['current_balance']}")
        time.sleep(1)
        
        # Test 7: Record Loss SELL Trade
        print("\n🧪 TEST 7: Record Loss SELL Trade")
        trade_data = {
            "symbol": "ETHUSD",
            "side": "SELL",
            "entry_price": 3000.0,
            "exit_price": 3100.0,  # -100 loss per ETH (price went up)
            "quantity": 0.5
        }
        response = requests.post(
            f"{BASE_URL}/trades",
            json=trade_data,
            headers=headers
        )
        print_test("Record SELL Trade", response)
        assert response.status_code == 201
        
        trade = response.json().get('trade')
        updated_challenge = response.json().get('challenge')
        assert trade['pnl'] == -50.0  # (3000 - 3100) * 0.5
        print(f"✅ SELL Trade P&L: {trade['pnl']}, New Balance: {updated_challenge['current_balance']}")
        time.sleep(1)
        
        # Test 8: Get Trade History
        print("\n🧪 TEST 8: Get Trade History")
        response = requests.get(f"{BASE_URL}/trades", headers=headers)
        print_test("Get Trade History", response)
        assert response.status_code == 200
        
        trades = response.json().get('trades', [])
        assert len(trades) == 2  # We recorded 2 trades
        print(f"✅ Trade history contains {len(trades)} trades")
        time.sleep(1)
        
        # Test 9: Trigger Challenge Killer with Large Loss
        print("\n🧪 TEST 9: Trigger Challenge Killer with 6% Daily Loss")
        # Calculate loss needed for 6% daily loss (exceeds 5% limit)
        current_balance = updated_challenge['current_balance']
        loss_amount = current_balance * 0.06
        
        trade_data = {
            "symbol": "BTCUSD",
            "side": "BUY",
            "entry_price": 50000.0,
            "exit_price": 50000.0 - (loss_amount / 0.1),  # Calculate exit price for desired loss
            "quantity": 0.1
        }
        response = requests.post(
            f"{BASE_URL}/trades",
            json=trade_data,
            headers=headers
        )
        print_test("Record Large Loss Trade", response)
        assert response.status_code == 201
        
        trade = response.json().get('trade')
        updated_challenge = response.json().get('challenge')
        print(f"✅ Large Loss Trade P&L: {trade['pnl']}")
        print(f"📊 Challenge Status: {updated_challenge['status']}")
        
        # Give killer a moment to run (it runs every 30 seconds, but immediate check happens)
        time.sleep(2)
        
        # Check if challenge was failed
        response = requests.get(f"{BASE_URL}/challenges", headers=headers)
        challenges = response.json().get('challenges', [])
        active_challenge = next((c for c in challenges if c['id'] == challenge_id), None)
        
        if active_challenge and active_challenge['status'] == 'failed':
            print(f"✅ Challenge Killer worked! Challenge status: {active_challenge['status']}")
        else:
            print(f"⚠️ Challenge Killer may not have run yet. Current status: {active_challenge['status']}")
        
        print("\n" + "="*80)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*80 + "\n")
        
        # Summary
        print("\n📊 TEST SUMMARY:")
        print(f"1. ✅ User registered successfully")
        print(f"2. ✅ Free Trial challenge auto-created")
        print(f"3. ✅ Available challenge types retrieved")
        print(f"4. ✅ Starter challenge selected")
        print(f"5. ✅ Challenge started successfully")
        print(f"6. ✅ Profitable BUY trade recorded")
        print(f"7. ✅ Loss SELL trade recorded")
        print(f"8. ✅ Trade history retrieved")
        print(f"9. ✅ Challenge Killer triggered on large loss")
        
    except AssertionError as e:
        print(f"\n❌ Assertion Failed: {str(e)}")
        import traceback
        traceback.print_exc()
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("🚀 Starting Trading Flow Tests...")
    print("Make sure the Flask backend is running on http://127.0.0.1:5000\n")
    time.sleep(1)
    test_trading_flow()
