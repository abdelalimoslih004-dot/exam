# 🔐 Guide Admin & SuperAdmin - PropSense

## 📋 Vue d'ensemble

PropSense implémente un système hiérarchique d'administration à 3 niveaux:

### 🎯 Hiérarchie des rôles

1. **👑 SuperAdmin** (Accès complet)
   - Gestion des utilisateurs (voir, modifier rôles, supprimer)
   - Gestion des challenges (passer/échouer)
   - Accès à tous les endpoints admin

2. **🔧 Admin** (Gestion challenges uniquement)
   - Gestion des challenges (passer/échouer)
   - Pas d'accès à la gestion utilisateurs

3. **📊 Trader** (Utilisateur standard)
   - Accès au dashboard de trading
   - Participation aux challenges
   - Accès au leaderboard et au chat

---

## 🔑 Comptes par défaut

### SuperAdmin
- **Username**: `superadmin`
- **Password**: `superadmin123`
- **Route**: `/superadmin`
- **Accès**: 
  - ✅ Gestion utilisateurs (voir, changer rôles, supprimer)
  - ✅ Gestion challenges (pass/fail)
  - ✅ Toutes les fonctionnalités trader

### Admin
- **Username**: `admin`
- **Password**: `admin123`
- **Route**: `/admin`
- **Accès**: 
  - ✅ Gestion challenges (pass/fail)
  - ✅ Toutes les fonctionnalités trader
  - ❌ Gestion utilisateurs

### Trader (Démo)
- **Username**: Créez votre compte sur `/register`
- **Route**: `/dashboard`
- **Accès**: 
  - ✅ Dashboard de trading avec TradingView
  - ✅ Challenges automatiques
  - ✅ Leaderboard et chat
  - ❌ Panels admin

---

## 🚀 Comment utiliser

### 1. Se connecter en tant que SuperAdmin

```bash
1. Allez sur http://localhost:3000/login
2. Entrez: superadmin / superadmin123
3. Cliquez sur le bouton "👑 SuperAdmin" dans le dashboard
4. Vous avez accès au SuperAdminPanel avec 2 onglets:
   - 👥 Gestion Utilisateurs
   - 🎯 Gestion Challenges
```

### 2. Gestion des Utilisateurs (SuperAdmin uniquement)

**Voir tous les utilisateurs**
- Liste complète avec ID, username, email, rôle, nombre de challenges, date de création

**Changer le rôle d'un utilisateur**
```
1. Sélectionnez le nouveau rôle dans le dropdown (Trader/Admin/SuperAdmin)
2. Confirmez dans la popup
3. Le changement est immédiat
```

**Supprimer un utilisateur**
```
1. Cliquez sur le bouton "🗑️ Suppr."
2. Confirmez dans la popup d'avertissement
3. L'utilisateur et TOUTES ses données (challenges, trades) sont supprimés
```

**⚠️ Protections de sécurité:**
- ❌ Impossible de modifier son propre rôle (prévention auto-démotion)
- ❌ Impossible de se supprimer soi-même
- ✅ Suppression en cascade: tous les challenges et trades liés sont supprimés

### 3. Gestion des Challenges (Admin + SuperAdmin)

**Forcer le statut d'un challenge**
```
1. Trouvez le challenge dans la liste
2. Cliquez sur "✅ Pass" pour réussir le challenge
3. Cliquez sur "❌ Fail" pour échouer le challenge
4. Le statut est mis à jour immédiatement
```

**Filtres disponibles:**
- Par statut: ALL / ACTIVE / PASSED / FAILED
- Par recherche: username ou ID du challenge

### 4. Statistiques en temps réel

**Onglet Utilisateurs (SuperAdmin):**
- 📊 Total Utilisateurs
- 👑 Nombre de SuperAdmins
- 🔧 Nombre d'Admins
- 📈 Nombre de Traders

**Onglet Challenges:**
- 📊 Total Challenges
- ⚡ Challenges Actifs
- ✅ Challenges Réussis
- ❌ Challenges Échoués

---

## 🛠️ API Endpoints

### SuperAdmin Endpoints

**GET /api/superadmin/users**
```json
{
  "users": [
    {
      "id": 1,
      "username": "trader1",
      "email": "trader1@example.com",
      "role": "trader",
      "created_at": "2024-01-01T00:00:00",
      "challenges_count": 5
    }
  ]
}
```

**POST /api/superadmin/user/<id>/role**
```json
// Body
{
  "role": "admin"  // trader | admin | superadmin
}

// Response
{
  "message": "Role updated successfully"
}
```

**DELETE /api/superadmin/user/<id>/delete**
```json
{
  "message": "User deleted successfully"
}
```

**GET /api/superadmin/user/<id>/challenges**
```json
{
  "challenges": [
    {
      "id": 1,
      "initial_balance": 100000,
      "current_balance": 110000,
      "status": "ACTIVE",
      "start_date": "2024-01-01T00:00:00"
    }
  ]
}
```

### Admin Endpoints (Admin + SuperAdmin)

**GET /api/admin/challenges**
```json
{
  "challenges": [
    {
      "id": 1,
      "username": "trader1",
      "initial_balance": 100000,
      "current_balance": 110000,
      "pnl": 10000,
      "status": "ACTIVE",
      "start_date": "2024-01-01T00:00:00"
    }
  ]
}
```

**POST /api/admin/challenge/<id>/force-status**
```json
// Body
{
  "status": "PASSED"  // PASSED | FAILED
}

// Response
{
  "message": "Challenge status updated",
  "challenge": { ... }
}
```

---

## 🔒 Sécurité

### Authentification JWT
- Tous les endpoints admin sont protégés par JWT
- Token valide 24 heures
- Token stocké dans localStorage + headers axios

### Vérification des rôles
```python
# Backend (app.py)
@jwt_required()
def superadmin_endpoint():
    user = User.query.get(get_jwt_identity())
    if not user or user.role != 'superadmin':
        return jsonify({'error': 'SuperAdmin access required'}), 403
```

### Frontend (React)
```jsx
// SuperAdminPanel.jsx
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token || user?.role !== 'superadmin') {
    navigate('/');
    return;
  }
}, [user, navigate]);
```

---

## 🧪 Scénarios de test

### Test 1: Connexion SuperAdmin
```
1. Login avec superadmin/superadmin123
2. Vérifier que le bouton "👑 SuperAdmin" apparaît
3. Accéder à /superadmin
4. Vérifier les 2 onglets (Utilisateurs + Challenges)
```

### Test 2: Gestion utilisateurs
```
1. Créer un nouveau compte trader via /register
2. Se connecter en SuperAdmin
3. Voir le nouveau trader dans la liste
4. Changer son rôle en "admin"
5. Vérifier que le rôle est mis à jour
6. Supprimer l'utilisateur
7. Vérifier qu'il n'apparaît plus dans la liste
```

### Test 3: Gestion challenges
```
1. Se connecter en trader et créer un challenge
2. Se connecter en Admin ou SuperAdmin
3. Aller dans l'onglet Challenges
4. Forcer le statut à "PASSED"
5. Vérifier que le statut change
6. Forcer à "FAILED"
7. Vérifier que le statut change
```

### Test 4: Restrictions Admin
```
1. Se connecter en admin/admin123
2. Vérifier que seul le bouton "🔧 Admin" apparaît
3. Accéder à /admin
4. Vérifier l'accès aux challenges uniquement
5. Essayer d'accéder à /superadmin (devrait rediriger)
```

### Test 5: Auto-protection
```
1. Se connecter en SuperAdmin
2. Essayer de changer son propre rôle (devrait échouer)
3. Essayer de se supprimer (bouton désactivé)
4. Vérifier que l'action est bloquée côté backend aussi
```

---

## 📊 Flux de données

```
User Login
    ↓
JWT Token Generated
    ↓
Token stored in localStorage
    ↓
Token sent in Authorization header
    ↓
Backend verifies token + role
    ↓
Return data or 403 Forbidden
```

---

## 🎨 Interface UI

### SuperAdmin Panel
- **Couleurs**: Gradient rouge-rose (👑)
- **Onglets**: 2 onglets (Utilisateurs / Challenges)
- **Filtres**: Par rôle (ALL/SUPERADMIN/ADMIN/TRADER) ou statut
- **Recherche**: Par username, email, ou ID
- **Actions**: Dropdowns pour rôles, boutons supprimer/pass/fail
- **Stats**: 4 cartes de statistiques par onglet

### Admin Panel  
- **Couleurs**: Gradient rouge-orange (🔧)
- **Vue**: Challenges uniquement
- **Filtres**: Par statut (ALL/ACTIVE/PASSED/FAILED)
- **Actions**: Boutons Force Pass / Force Fail

---

## 🐛 Troubleshooting

### Erreur: "SuperAdmin access required"
**Cause**: Token invalide ou rôle incorrect  
**Solution**: Se reconnecter avec les bons identifiants

### Erreur: "Cannot delete yourself"
**Cause**: Tentative de suppression de son propre compte  
**Solution**: Demander à un autre SuperAdmin

### Erreur: "Cannot change your own role"
**Cause**: Tentative de modification de son propre rôle  
**Solution**: Demander à un autre SuperAdmin

### Interface ne se charge pas
**Cause**: Backend non démarré  
**Solution**: 
```bash
cd backend
python app.py
```

### Bouton SuperAdmin invisible
**Cause**: Connecté avec un compte non-superadmin  
**Solution**: Se connecter avec superadmin/superadmin123

---

## 📝 Notes importantes

1. **Premier démarrage**: Les comptes superadmin et admin sont créés automatiquement
2. **Données de test**: Utilisez les scrapers pour générer des données réalistes
3. **Suppression en cascade**: La suppression d'un utilisateur supprime TOUTES ses données
4. **Tokens**: Les tokens JWT expirent après 24h, reconnectez-vous si nécessaire
5. **Auto-refresh**: Les données se rafraîchissent automatiquement toutes les 15 secondes

---

## 🚀 Prochaines fonctionnalités possibles

- [ ] Logs d'activité admin (qui a fait quoi et quand)
- [ ] Notifications push pour actions critiques
- [ ] Export CSV des utilisateurs/challenges
- [ ] Filtres avancés (date range, P&L range)
- [ ] Graphiques de statistiques
- [ ] Suspension temporaire de compte (au lieu de suppression)
- [ ] Historique des changements de rôle
- [ ] Permissions granulaires par fonctionnalité

---

**✅ Système entièrement fonctionnel et prêt pour la production!**
