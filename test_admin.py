#!/usr/bin/env python3
"""
Script de test pour le système Admin/SuperAdmin
"""
import requests
import json

BASE_URL = "http://localhost:5000"

def print_section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")

def login(username, password):
    """Se connecter et retourner le token"""
    response = requests.post(f"{BASE_URL}/api/register", json={
        "username": username,
        "password": password
    })
    
    if response.status_code == 400:  # User exists
        response = requests.post(f"{BASE_URL}/api/login", json={
            "username": username,
            "password": password
        })
    
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Connecté en tant que {username} (rôle: {data['user']['role']})")
        return data['token']
    else:
        print(f"❌ Erreur de connexion: {response.json()}")
        return None

def test_superadmin_endpoints():
    """Test des endpoints SuperAdmin"""
    print_section("TEST ENDPOINTS SUPERADMIN")
    
    # Se connecter en tant que SuperAdmin
    token = login("superadmin", "superadmin123")
    if not token:
        print("❌ Impossible de se connecter en SuperAdmin")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Récupérer tous les utilisateurs
    print("\n1️⃣ Test GET /api/superadmin/users")
    response = requests.get(f"{BASE_URL}/api/superadmin/users", headers=headers)
    if response.status_code == 200:
        users = response.json()['users']
        print(f"✅ {len(users)} utilisateurs trouvés:")
        for user in users[:5]:  # Afficher les 5 premiers
            print(f"   - {user['username']} ({user['role']}) - {user['challenges_count']} challenges")
    else:
        print(f"❌ Erreur: {response.json()}")
    
    # Test 2: Créer un utilisateur test
    print("\n2️⃣ Test création utilisateur test")
    test_token = login("test_trader", "test123")
    if test_token:
        # Récupérer l'ID du nouvel utilisateur
        response = requests.get(f"{BASE_URL}/api/superadmin/users", headers=headers)
        test_user = next((u for u in response.json()['users'] if u['username'] == 'test_trader'), None)
        
        if test_user:
            user_id = test_user['id']
            print(f"✅ Utilisateur test créé avec ID: {user_id}")
            
            # Test 3: Changer le rôle
            print(f"\n3️⃣ Test POST /api/superadmin/user/{user_id}/role")
            response = requests.post(
                f"{BASE_URL}/api/superadmin/user/{user_id}/role",
                headers=headers,
                json={"role": "admin"}
            )
            if response.status_code == 200:
                print(f"✅ Rôle changé en admin: {response.json()['message']}")
            else:
                print(f"❌ Erreur: {response.json()}")
            
            # Test 4: Récupérer les challenges de l'utilisateur
            print(f"\n4️⃣ Test GET /api/superadmin/user/{user_id}/challenges")
            response = requests.get(
                f"{BASE_URL}/api/superadmin/user/{user_id}/challenges",
                headers=headers
            )
            if response.status_code == 200:
                challenges = response.json()['challenges']
                print(f"✅ {len(challenges)} challenges trouvés pour test_trader")
            else:
                print(f"❌ Erreur: {response.json()}")
            
            # Test 5: Supprimer l'utilisateur
            print(f"\n5️⃣ Test DELETE /api/superadmin/user/{user_id}/delete")
            response = requests.delete(
                f"{BASE_URL}/api/superadmin/user/{user_id}/delete",
                headers=headers
            )
            if response.status_code == 200:
                print(f"✅ Utilisateur supprimé: {response.json()['message']}")
            else:
                print(f"❌ Erreur: {response.json()}")

def test_admin_endpoints():
    """Test des endpoints Admin"""
    print_section("TEST ENDPOINTS ADMIN")
    
    # Se connecter en tant qu'Admin
    token = login("admin", "admin123")
    if not token:
        print("❌ Impossible de se connecter en Admin")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test 1: Récupérer tous les challenges
    print("\n1️⃣ Test GET /api/admin/challenges")
    response = requests.get(f"{BASE_URL}/api/admin/challenges", headers=headers)
    if response.status_code == 200:
        challenges = response.json()['challenges']
        print(f"✅ {len(challenges)} challenges trouvés:")
        for challenge in challenges[:5]:  # Afficher les 5 premiers
            status = challenge['status']
            pnl = challenge['pnl']
            print(f"   - Challenge #{challenge['id']} ({challenge['username']}) - {status} - P&L: {pnl:.2f} MAD")
        
        # Test 2: Forcer le statut d'un challenge (si des challenges existent)
        if len(challenges) > 0:
            challenge_id = challenges[0]['id']
            new_status = 'PASSED' if challenges[0]['status'] != 'PASSED' else 'FAILED'
            
            print(f"\n2️⃣ Test POST /api/admin/challenge/{challenge_id}/force-status")
            response = requests.post(
                f"{BASE_URL}/api/admin/challenge/{challenge_id}/force-status",
                headers=headers,
                json={"status": new_status}
            )
            if response.status_code == 200:
                print(f"✅ Statut forcé à {new_status}: {response.json()['message']}")
            else:
                print(f"❌ Erreur: {response.json()}")
    else:
        print(f"❌ Erreur: {response.json()}")

def test_access_control():
    """Test des contrôles d'accès"""
    print_section("TEST CONTRÔLES D'ACCÈS")
    
    # Créer un trader
    trader_token = login("test_trader2", "test123")
    if not trader_token:
        print("❌ Impossible de créer un trader")
        return
    
    headers = {"Authorization": f"Bearer {trader_token}"}
    
    # Test 1: Trader ne peut pas accéder aux endpoints superadmin
    print("\n1️⃣ Test: Trader -> /api/superadmin/users (devrait échouer)")
    response = requests.get(f"{BASE_URL}/api/superadmin/users", headers=headers)
    if response.status_code == 403:
        print("✅ Accès refusé (403) - Contrôle OK")
    else:
        print(f"❌ Erreur: Le trader a accès (status: {response.status_code})")
    
    # Test 2: Trader ne peut pas accéder aux endpoints admin
    print("\n2️⃣ Test: Trader -> /api/admin/challenges (devrait échouer)")
    response = requests.get(f"{BASE_URL}/api/admin/challenges", headers=headers)
    if response.status_code == 403:
        print("✅ Accès refusé (403) - Contrôle OK")
    else:
        print(f"❌ Erreur: Le trader a accès (status: {response.status_code})")
    
    # Test 3: Admin ne peut pas accéder aux endpoints superadmin
    print("\n3️⃣ Test: Admin -> /api/superadmin/users (devrait échouer)")
    admin_token = login("admin", "admin123")
    headers = {"Authorization": f"Bearer {admin_token}"}
    response = requests.get(f"{BASE_URL}/api/superadmin/users", headers=headers)
    if response.status_code == 403:
        print("✅ Accès refusé (403) - Contrôle OK")
    else:
        print(f"❌ Erreur: L'admin a accès (status: {response.status_code})")
    
    # Test 4: SuperAdmin peut accéder aux endpoints admin
    print("\n4️⃣ Test: SuperAdmin -> /api/admin/challenges (devrait réussir)")
    superadmin_token = login("superadmin", "superadmin123")
    headers = {"Authorization": f"Bearer {superadmin_token}"}
    response = requests.get(f"{BASE_URL}/api/admin/challenges", headers=headers)
    if response.status_code == 200:
        print("✅ Accès autorisé (200) - Contrôle OK")
    else:
        print(f"❌ Erreur: Le superadmin n'a pas accès (status: {response.status_code})")

def test_self_protection():
    """Test des protections contre l'auto-modification"""
    print_section("TEST PROTECTIONS AUTO-MODIFICATION")
    
    # Se connecter en tant que SuperAdmin
    token = login("superadmin", "superadmin123")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Récupérer l'ID du superadmin
    response = requests.get(f"{BASE_URL}/api/superadmin/users", headers=headers)
    superadmin = next((u for u in response.json()['users'] if u['username'] == 'superadmin'), None)
    
    if superadmin:
        user_id = superadmin['id']
        
        # Test 1: Essayer de changer son propre rôle
        print(f"\n1️⃣ Test: SuperAdmin change son propre rôle (devrait échouer)")
        response = requests.post(
            f"{BASE_URL}/api/superadmin/user/{user_id}/role",
            headers=headers,
            json={"role": "trader"}
        )
        if response.status_code == 403:
            print(f"✅ Blocage réussi: {response.json()['error']}")
        else:
            print(f"❌ Erreur: Le superadmin a pu changer son propre rôle")
        
        # Test 2: Essayer de se supprimer
        print(f"\n2️⃣ Test: SuperAdmin se supprime (devrait échouer)")
        response = requests.delete(
            f"{BASE_URL}/api/superadmin/user/{user_id}/delete",
            headers=headers
        )
        if response.status_code == 403:
            print(f"✅ Blocage réussi: {response.json()['error']}")
        else:
            print(f"❌ Erreur: Le superadmin a pu se supprimer")

def main():
    """Exécuter tous les tests"""
    print("\n" + "="*60)
    print("  🧪 TESTS SYSTÈME ADMIN/SUPERADMIN - PROPSENSE")
    print("="*60)
    
    try:
        test_superadmin_endpoints()
        test_admin_endpoints()
        test_access_control()
        test_self_protection()
        
        print_section("RÉSUMÉ")
        print("✅ Tous les tests terminés!")
        print("\nPour tester l'interface:")
        print("1. Frontend: http://localhost:3000")
        print("2. Login SuperAdmin: superadmin / superadmin123")
        print("3. Login Admin: admin / admin123")
        print("\nRoutes:")
        print("- SuperAdmin Panel: /superadmin")
        print("- Admin Panel: /admin")
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERREUR: Impossible de se connecter au backend")
        print("Assurez-vous que le backend Flask est démarré:")
        print("  cd backend")
        print("  python app.py")
    except Exception as e:
        print(f"\n❌ ERREUR: {str(e)}")

if __name__ == "__main__":
    main()
