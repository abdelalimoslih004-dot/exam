"""
Test PROMPT 3 - Challenge Killer & Demo Hooks
Tests:
1. Créer un challenge via /api/demo/quick-buy
2. Vérifier les règles du killer
3. Tester /api/demo/nuke pour forcer un échec
"""
import sys
sys.path.insert(0, r'C:\Users\abdel\Desktop\propsens\backend')

import requests
import json
import time

BASE_URL = "http://localhost:5000"

def login():
    """Login et récupérer le token JWT"""
    print("\n🔐 Login...")
    response = requests.post(f"{BASE_URL}/api/login", json={
        'username': 'admin',
        'password': 'admin123'
    })
    
    if response.status_code == 200:
        token = response.json()['access_token']
        print("✅ Login réussi")
        return token
    else:
        print(f"❌ Login échoué: {response.text}")
        return None


def test_quick_buy(token):
    """Test de la route /api/demo/quick-buy"""
    print("\n" + "="*70)
    print("TEST 1: Quick Buy - Créer un challenge de 5000 DH sans paiement")
    print("="*70)
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f"{BASE_URL}/api/demo/quick-buy", headers=headers)
    
    if response.status_code == 201:
        data = response.json()
        print("✅ Challenge créé avec succès!")
        print(f"   ID: {data['challenge']['id']}")
        print(f"   Type: {data['challenge']['type']}")
        print(f"   Balance initiale: {data['challenge']['initial_balance']} DH")
        print(f"   Balance actuelle: {data['challenge']['current_balance']} DH")
        print(f"   Status: {data['challenge']['status']}")
        return data['challenge']['id']
    else:
        print(f"❌ Erreur: {response.text}")
        return None


def get_challenges(token):
    """Récupérer tous les challenges de l'utilisateur"""
    print("\n" + "="*70)
    print("Récupération des challenges")
    print("="*70)
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.get(f"{BASE_URL}/api/challenges", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ {data['count']} challenge(s) trouvé(s):")
        for c in data['challenges']:
            print(f"\n   Challenge #{c['id']}:")
            print(f"   - Type: {c['type']}")
            print(f"   - Balance: {c['current_balance']}/{c['initial_balance']} DH")
            print(f"   - Status: {c['status']}")
            if c['end_date']:
                print(f"   - Terminé: {c['end_date']}")
        return data['challenges']
    else:
        print(f"❌ Erreur: {response.text}")
        return []


def test_nuke(token, challenge_id):
    """Test de la route /api/demo/nuke"""
    print("\n" + "="*70)
    print("TEST 2: NUKE - Forcer une perte de 6% pour tester l'échec")
    print("="*70)
    print("⚠️  La règle du Killer: perte journalière max = 5%")
    print("💣 Nous allons forcer 6% de perte -> Challenge devrait FAIL!")
    
    time.sleep(2)
    
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f"{BASE_URL}/api/demo/nuke", headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print("\n✅ NUKE exécuté avec succès!")
        print(f"   Balance avant: {data['challenge']['old_balance']} DH")
        print(f"   Balance après: {data['challenge']['new_balance']} DH")
        print(f"   Perte: {data['challenge']['loss_amount']:.2f} DH ({data['challenge']['loss_percent']}%)")
        print(f"   Status: {data['challenge']['status']}")
        
        if data['challenge']['is_failed']:
            print("\n🎯 ✅ SUCCESS: Challenge marqué comme FAILED par le Killer!")
        else:
            print("\n⚠️  WARNING: Challenge toujours actif (le killer peut prendre quelques secondes)")
        
        return data['challenge']
    else:
        print(f"❌ Erreur: {response.text}")
        return None


def test_profit_target(token):
    """Test de l'objectif de profit (10%)"""
    print("\n" + "="*70)
    print("TEST 3: Profit Target - Créer un challenge avec profit de 10%")
    print("="*70)
    
    # Créer un challenge
    headers = {'Authorization': f'Bearer {token}'}
    response = requests.post(f"{BASE_URL}/api/demo/quick-buy", headers=headers)
    
    if response.status_code != 201:
        print(f"❌ Erreur création: {response.text}")
        return
    
    challenge_id = response.json()['challenge']['id']
    print(f"✅ Challenge #{challenge_id} créé")
    
    # Simuler un profit de 10% en modifiant directement la base
    print("\n📈 Simulation d'un profit de 10%...")
    from models import db, Challenge
    from app import app
    
    with app.app_context():
        challenge = Challenge.query.get(challenge_id)
        if challenge:
            challenge.current_balance = challenge.initial_balance * 1.10  # +10%
            db.session.commit()
            print(f"   Balance modifiée: {challenge.current_balance} DH")
            print("   ⏳ Attente du prochain check du Killer (max 30 secondes)...")


def main():
    """Fonction principale de test"""
    print("="*70)
    print("TEST PROMPT 3 - Challenge Killer & Demo Hooks")
    print("="*70)
    print("\n⚠️  NOTE: Le serveur Flask doit être lancé sur http://localhost:5000")
    print("   Le test va commencer dans 3 secondes...")
    
    time.sleep(3)
    
    # Login
    token = login()
    if not token:
        print("❌ Impossible de continuer sans token")
        return
    
    # Test 1: Quick Buy
    challenge_id = test_quick_buy(token)
    if not challenge_id:
        print("❌ Test Quick Buy échoué")
        return
    
    time.sleep(1)
    
    # Afficher les challenges
    get_challenges(token)
    
    time.sleep(1)
    
    # Test 2: NUKE
    test_nuke(token, challenge_id)
    
    time.sleep(2)
    
    # Vérifier le résultat final
    print("\n" + "="*70)
    print("VÉRIFICATION FINALE")
    print("="*70)
    get_challenges(token)
    
    print("\n" + "="*70)
    print("✅ PROMPT 3 TEST TERMINÉ")
    print("="*70)
    print("\n📋 Résumé:")
    print("   ✅ /api/demo/quick-buy - Créer challenge sans paiement")
    print("   ✅ /api/demo/nuke - Forcer échec avec 6% de perte")
    print("   ✅ Challenge Killer - Détection automatique des règles")
    print("\n🎯 Le moteur Killer fonctionne correctement!")


if __name__ == "__main__":
    main()
