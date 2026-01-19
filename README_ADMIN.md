# 👑 Système Admin & SuperAdmin - PropSense

## 📖 Vue d'ensemble

Ce document décrit le système de gestion hiérarchique à 3 niveaux implémenté dans PropSense, permettant un contrôle granulaire des utilisateurs et des challenges.

---

## 🎯 Hiérarchie des rôles

```
┌─────────────────────────────────────────────┐
│          👑 SUPERADMIN                      │
│  ┌───────────────────────────────────────┐  │
│  │ - Gestion complète des utilisateurs   │  │
│  │ - Modifier les rôles                  │  │
│  │ - Supprimer les utilisateurs          │  │
│  │ - Gestion des challenges              │  │
│  │ - Force Pass/Fail                     │  │
│  │ - Toutes fonctionnalités Trader       │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
         │
         ├── Peut tout faire
         │
┌────────▼─────────────────────────────────────┐
│           🔧 ADMIN                           │
│  ┌───────────────────────────────────────┐   │
│  │ - Gestion des challenges              │   │
│  │ - Force Pass/Fail                     │   │
│  │ - Toutes fonctionnalités Trader       │   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
         │
         ├── Peut gérer les challenges
         │
┌────────▼─────────────────────────────────────┐
│           📊 TRADER                          │
│  ┌───────────────────────────────────────┐   │
│  │ - Dashboard de trading                │   │
│  │ - Challenges automatiques             │   │
│  │ - TradingView charts                  │   │
│  │ - Leaderboard                         │   │
│  │ - Chat en temps réel                  │   │
│  └───────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

---

## 🚀 Démarrage rapide

### 1. Démarrer les serveurs

**Backend (Flask):**
```bash
cd backend
python app.py
```
- ✅ Crée automatiquement les comptes superadmin et admin
- ✅ Lance les scrapers de données
- ✅ Initialise la base de données
- Port: http://localhost:5000

**Frontend (React):**
```bash
cd frontend
npm run dev
```
- Port: http://localhost:3000

### 2. Se connecter

**SuperAdmin:**
```
URL: http://localhost:3000/login
Username: superadmin
Password: superadmin123
```

**Admin:**
```
URL: http://localhost:3000/login
Username: admin
Password: admin123
```

**Trader:**
```
URL: http://localhost:3000/register
Créez votre propre compte
```

---

## 🔐 Comptes par défaut

| Rôle | Identifiants | Route panel | Permissions |
|------|-------------|-------------|-------------|
| 👑 SuperAdmin | `superadmin` / `superadmin123` | `/superadmin` | Tout |
| 🔧 Admin | `admin` / `admin123` | `/admin` | Challenges seulement |
| 📊 Trader | À créer | `/dashboard` | Standard |

---

## 📡 API Endpoints

### Endpoints SuperAdmin (Accès: SuperAdmin uniquement)

#### GET /api/superadmin/users
Récupère tous les utilisateurs avec leurs statistiques.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Response 200:**
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

**Response 403:**
```json
{
  "error": "SuperAdmin access required"
}
```

---

#### POST /api/superadmin/user/<user_id>/role
Change le rôle d'un utilisateur.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "role": "admin"  // Options: "trader", "admin", "superadmin"
}
```

**Response 200:**
```json
{
  "message": "Role updated successfully"
}
```

**Response 403 (Auto-modification):**
```json
{
  "error": "Cannot change your own role"
}
```

**Response 400:**
```json
{
  "error": "Invalid role. Must be: trader, admin, or superadmin"
}
```

---

#### DELETE /api/superadmin/user/<user_id>/delete
Supprime un utilisateur et toutes ses données (cascade).

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Response 200:**
```json
{
  "message": "User deleted successfully"
}
```

**Response 403 (Auto-suppression):**
```json
{
  "error": "Cannot delete yourself"
}
```

---

#### GET /api/superadmin/user/<user_id>/challenges
Récupère tous les challenges d'un utilisateur spécifique.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Response 200:**
```json
{
  "challenges": [
    {
      "id": 1,
      "initial_balance": 100000.0,
      "current_balance": 110000.0,
      "pnl": 10000.0,
      "status": "ACTIVE",
      "start_date": "2024-01-01T00:00:00",
      "end_date": null
    }
  ]
}
```

---

### Endpoints Admin (Accès: Admin + SuperAdmin)

#### GET /api/admin/challenges
Récupère tous les challenges de tous les utilisateurs.

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>"
}
```

**Response 200:**
```json
{
  "challenges": [
    {
      "id": 1,
      "username": "trader1",
      "initial_balance": 100000.0,
      "current_balance": 110000.0,
      "pnl": 10000.0,
      "status": "ACTIVE",
      "start_date": "2024-01-01T00:00:00",
      "end_date": null,
      "violations": 0,
      "max_drawdown": -5000.0,
      "current_drawdown": -2000.0
    }
  ]
}
```

**Response 403:**
```json
{
  "error": "Admin access required"
}
```

---

#### POST /api/admin/challenge/<challenge_id>/force-status
Force le statut d'un challenge (Pass ou Fail).

**Headers:**
```json
{
  "Authorization": "Bearer <jwt_token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "status": "PASSED"  // Options: "PASSED", "FAILED"
}
```

**Response 200:**
```json
{
  "message": "Challenge status updated",
  "challenge": {
    "id": 1,
    "status": "PASSED",
    "end_date": "2024-01-02T10:30:00"
  }
}
```

**Response 400:**
```json
{
  "error": "Status must be PASSED or FAILED"
}
```

---

## 🎨 Interface utilisateur

### SuperAdmin Panel (`/superadmin`)

**Caractéristiques:**
- 🎨 Gradient rouge-rose avec icône 👑
- 📑 2 onglets: Utilisateurs et Challenges
- 📊 Statistiques en temps réel
- 🔍 Filtres et recherche
- 🔄 Auto-refresh toutes les 15 secondes

**Onglet Utilisateurs:**
```
┌──────────────────────────────────────────────────────┐
│  👑 SuperAdmin Panel                      🔄 Refresh │
├──────────────────────────────────────────────────────┤
│  [👥 Gestion Utilisateurs] [🎯 Gestion Challenges]  │
├──────────────────────────────────────────────────────┤
│  🔍 [Rechercher...]  [ALL][SUPERADMIN][ADMIN][TRADER]│
├──────────────────────────────────────────────────────┤
│  📊 Stats:                                            │
│  ┌─────────┬─────────┬─────────┬─────────┐          │
│  │ Total   │ SuperA. │ Admins  │ Traders │          │
│  │   15    │    2    │    3    │   10    │          │
│  └─────────┴─────────┴─────────┴─────────┘          │
├──────────────────────────────────────────────────────┤
│  ID │ User │ Email │ Rôle │ Challenges │ Actions   │
│  ───┼──────┼───────┼──────┼────────────┼─────────  │
│  1  │ usr1 │ @...  │ 🔵   │     5      │ [▼][🗑️]  │
│  2  │ usr2 │ @...  │ 🟠   │     3      │ [▼][🗑️]  │
└──────────────────────────────────────────────────────┘
```

**Onglet Challenges:**
```
┌──────────────────────────────────────────────────────┐
│  👑 SuperAdmin Panel                      🔄 Refresh │
├──────────────────────────────────────────────────────┤
│  [👥 Gestion Utilisateurs] [🎯 Gestion Challenges]  │
├──────────────────────────────────────────────────────┤
│  🔍 [Rechercher...]  [ALL][ACTIVE][PASSED][FAILED]  │
├──────────────────────────────────────────────────────┤
│  📊 Stats:                                            │
│  ┌─────────┬─────────┬─────────┬─────────┐          │
│  │ Total   │ Actifs  │ Réussis │ Échoués │          │
│  │   50    │   30    │   15    │    5    │          │
│  └─────────┴─────────┴─────────┴─────────┘          │
├──────────────────────────────────────────────────────┤
│  ID │ Trader │ Balance │ P&L │ Status │ Actions    │
│  ───┼────────┼─────────┼─────┼────────┼──────────  │
│  1  │ usr1   │ 110k    │ +10k│ ACTIVE │ [✅][❌]   │
│  2  │ usr2   │ 95k     │ -5k │ ACTIVE │ [✅][❌]   │
└──────────────────────────────────────────────────────┘
```

### Admin Panel (`/admin`)

**Caractéristiques:**
- 🎨 Gradient rouge-orange avec icône 🔧
- 📑 Vue unique: Challenges seulement
- 📊 Statistiques des challenges
- 🔍 Filtres et recherche
- 🔄 Auto-refresh toutes les 10 secondes

**Interface:**
```
┌──────────────────────────────────────────────────────┐
│  🔧 Admin Panel                           🔄 Refresh │
├──────────────────────────────────────────────────────┤
│  🔍 [Rechercher...]  [ALL][ACTIVE][PASSED][FAILED]  │
├──────────────────────────────────────────────────────┤
│  📊 Stats:                                            │
│  ┌─────────┬─────────┬─────────┬─────────┐          │
│  │ Total   │ Actifs  │ Réussis │ Échoués │          │
│  │   50    │   30    │   15    │    5    │          │
│  └─────────┴─────────┴─────────┴─────────┘          │
├──────────────────────────────────────────────────────┤
│  ID │ Trader │ Balance │ P&L │ Status │ Actions    │
│  ───┼────────┼─────────┼─────┼────────┼──────────  │
│  1  │ usr1   │ 110k    │ +10k│ ACTIVE │ [✅][❌]   │
│  2  │ usr2   │ 95k     │ -5k │ ACTIVE │ [✅][❌]   │
└──────────────────────────────────────────────────────┘
```

---

## 🔒 Sécurité

### Protection JWT

**Backend (Flask):**
```python
from flask_jwt_extended import jwt_required, get_jwt_identity

@app.route('/api/superadmin/users')
@jwt_required()
def superadmin_get_users():
    current_user = User.query.get(get_jwt_identity())
    if not current_user or current_user.role != 'superadmin':
        return jsonify({'error': 'SuperAdmin access required'}), 403
    # ...
```

**Frontend (React):**
```jsx
useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token || user?.role !== 'superadmin') {
    navigate('/');
    return;
  }
}, [user, navigate]);
```

### Protection auto-modification

**Empêche:**
- ❌ Changer son propre rôle
- ❌ Se supprimer soi-même

**Backend:**
```python
@app.route('/api/superadmin/user/<int:user_id>/role', methods=['POST'])
@jwt_required()
def superadmin_change_user_role(user_id):
    current_user = User.query.get(get_jwt_identity())
    
    # Empêcher auto-modification
    if user_id == current_user.id:
        return jsonify({'error': 'Cannot change your own role'}), 403
```

### Suppression en cascade

Quand un utilisateur est supprimé, toutes ses données sont supprimées:
```python
# models.py
class Challenge(db.Model):
    user_id = db.Column(db.Integer, db.ForeignKey('user.id', ondelete='CASCADE'))
    
class Trade(db.Model):
    challenge_id = db.Column(db.Integer, db.ForeignKey('challenge.id', ondelete='CASCADE'))
```

**Résultat:**
```
DELETE User #5
  ↓
  ├── DELETE Challenge #10 (user_id=5)
  │     ↓
  │     └── DELETE Trade #20 (challenge_id=10)
  │     └── DELETE Trade #21 (challenge_id=10)
  │
  ├── DELETE Challenge #11 (user_id=5)
  │     ↓
  │     └── DELETE Trade #22 (challenge_id=11)
  │
  └── ✅ User #5 supprimé avec toutes ses données
```

---

## 🧪 Tests

### Tests automatiques

**Lancer les tests:**
```bash
python test_admin.py
```

**Ce qui est testé:**
- ✅ Endpoints SuperAdmin (users, role, delete, challenges)
- ✅ Endpoints Admin (challenges, force-status)
- ✅ Contrôles d'accès (Trader → Admin → SuperAdmin)
- ✅ Protection auto-modification
- ✅ JWT authentication
- ✅ Validation des rôles

**Sortie attendue:**
```
============================================================
  🧪 TESTS SYSTÈME ADMIN/SUPERADMIN - PROPSENSE
============================================================

============================================================
  TEST ENDPOINTS SUPERADMIN
============================================================

✅ Connecté en tant que superadmin (rôle: superadmin)

1️⃣ Test GET /api/superadmin/users
✅ 3 utilisateurs trouvés:
   - superadmin (superadmin) - 0 challenges
   - admin (admin) - 0 challenges
   - test_trader (trader) - 2 challenges

... (plus de tests)

============================================================
  RÉSUMÉ
============================================================
✅ Tous les tests terminés!
```

### Tests manuels

**Voir:** [QUICK_START.md](./QUICK_START.md) pour les scénarios de test détaillés.

---

## 📁 Structure des fichiers

```
propsens/
├── backend/
│   ├── app.py                    # ✨ Routes SuperAdmin ajoutées
│   ├── models.py                 # User model avec role
│   ├── instance/
│   │   └── database.db           # SQLite avec superadmin
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx               # ✨ Route /superadmin ajoutée
│   │   ├── pages/
│   │   │   ├── SuperAdminPanel.jsx  # ✨ NOUVEAU
│   │   │   ├── AdminPanel.jsx    # Existant
│   │   │   ├── Dashboard.jsx     # ✨ Bouton SuperAdmin ajouté
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   └── context/
│   │       └── AuthContext.jsx
│   └── package.json
│
├── test_admin.py                 # ✨ NOUVEAU - Tests automatiques
├── ADMIN_GUIDE.md                # ✨ NOUVEAU - Guide complet
├── QUICK_START.md                # ✨ NOUVEAU - Démarrage rapide
└── README_ADMIN.md               # ✨ CE FICHIER
```

---

## 🎯 Cas d'usage

### 1. Promouvoir un trader en admin

```
Scénario: Un trader performant devient admin

1. SuperAdmin se connecte
2. SuperAdmin Panel → Onglet Utilisateurs
3. Trouve le trader dans la liste
4. Change le rôle via dropdown: "Trader" → "Admin"
5. Confirme l'action
6. Le trader peut maintenant accéder à /admin
7. Le trader voit le bouton "🔧 Admin" dans son dashboard
```

### 2. Gérer un challenge problématique

```
Scénario: Un challenge bloqué nécessite intervention manuelle

1. Admin ou SuperAdmin se connecte
2. Panel → Onglet Challenges
3. Recherche le challenge par ID ou username
4. Analyse le P&L et les violations
5. Décision:
   - Si mérite réussite: Cliquer "✅ Pass"
   - Si mérite échec: Cliquer "❌ Fail"
6. Le statut change immédiatement
7. Le trader voit le nouveau statut dans son dashboard
```

### 3. Nettoyer un compte inactif

```
Scénario: Supprimer un utilisateur et toutes ses données

1. SuperAdmin se connecte
2. SuperAdmin Panel → Onglet Utilisateurs
3. Trouve l'utilisateur à supprimer
4. Clic sur "🗑️ Suppr."
5. Confirme dans la popup d'avertissement
6. L'utilisateur et toutes ses données disparaissent
7. La base de données est nettoyée (cascade)
```

### 4. Audit des utilisateurs

```
Scénario: Vérifier qui a quels rôles et combien de challenges

1. SuperAdmin se connecte
2. SuperAdmin Panel → Onglet Utilisateurs
3. Vue d'ensemble:
   - Statistiques en haut (Total, SuperAdmins, Admins, Traders)
   - Liste complète avec challenges_count
4. Filtrer par rôle si nécessaire
5. Rechercher un utilisateur spécifique
6. Analyser l'activité (nombre de challenges)
```

---

## 💡 Bonnes pratiques

### Pour les SuperAdmins

✅ **À FAIRE:**
- Créer un compte SuperAdmin de secours
- Documenter les changements de rôles importants
- Vérifier avant de supprimer (action irréversible)
- Utiliser les filtres pour trouver rapidement
- Rafraîchir régulièrement les données

❌ **À ÉVITER:**
- Ne jamais partager les identifiants superadmin
- Ne pas supprimer tous les SuperAdmins (gardez-en au moins 2)
- Ne pas changer les rôles sans raison valide
- Ne pas supprimer des utilisateurs actifs sans backup

### Pour les Admins

✅ **À FAIRE:**
- Vérifier le contexte avant de force pass/fail
- Documenter les décisions importantes
- Communiquer avec les traders si nécessaire
- Utiliser les filtres pour prioriser les challenges

❌ **À ÉVITER:**
- Ne pas forcer le statut sans analyse
- Ne pas modifier tous les challenges en masse
- Ne pas ignorer les violations de règles

---

## 🔄 Workflow complet

```
┌─────────────────┐
│  Landing Page   │
│  /              │
└────────┬────────┘
         │
         ├──► [Se connecter] ──┐
         │                     │
         └──► [S'inscrire] ────┤
                               │
                    ┌──────────▼──────────┐
                    │   Login/Register    │
                    │   /login /register  │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   JWT Token créé    │
                    │   + Role vérifié    │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
    [Trader]              [Admin]           [SuperAdmin]
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   Dashboard     │   │   Dashboard     │   │   Dashboard     │
│  + Trading      │   │  + Trading      │   │  + Trading      │
│  + Challenges   │   │  + Challenges   │   │  + Challenges   │
│  + Leaderboard  │   │  + Leaderboard  │   │  + Leaderboard  │
│  + Chat         │   │  + Chat         │   │  + Chat         │
│                 │   │  + [🔧 Admin]   │   │  + [👑 SuperA.] │
└─────────────────┘   └────────┬────────┘   └────────┬────────┘
                               │                      │
                               ▼                      ▼
                      ┌─────────────────┐    ┌─────────────────┐
                      │  Admin Panel    │    │ SuperAdmin Panel│
                      │  /admin         │    │  /superadmin    │
                      │                 │    │                 │
                      │ ├─ Challenges   │    │ ├─ Utilisateurs │
                      │ │  ├─ View all  │    │ │  ├─ View all  │
                      │ │  ├─ Force Pass│    │ │  ├─ Change role│
                      │ │  └─ Force Fail│    │ │  └─ Delete    │
                      │ └─────────────  │    │ └──────────────  │
                      └─────────────────┘    │ ├─ Challenges    │
                                             │ │  ├─ View all   │
                                             │ │  ├─ Force Pass │
                                             │ │  └─ Force Fail │
                                             │ └──────────────  │
                                             └─────────────────┘
```

---

## 📞 Support

### En cas de problème

1. **Vérifier les logs backend**
   ```bash
   cd backend
   python app.py
   # Observer les messages d'erreur
   ```

2. **Vérifier la console du navigateur**
   ```
   F12 → Console
   Chercher les erreurs 403, 401, ou 500
   ```

3. **Vérifier le token JWT**
   ```javascript
   // Console navigateur
   console.log(localStorage.getItem('token'));
   console.log(localStorage.getItem('user'));
   ```

4. **Reconnecter en cas de doute**
   ```
   1. Se déconnecter
   2. Vider le localStorage
   3. Se reconnecter avec les bons identifiants
   ```

### Erreurs communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| 403 Forbidden | Rôle insuffisant | Se reconnecter avec le bon compte |
| 401 Unauthorized | Token invalide | Se reconnecter |
| 404 Not Found | Backend non démarré | Lancer `python app.py` |
| Cannot read property 'role' | User non chargé | Attendre le chargement |

---

## 🚀 Évolutions possibles

### Court terme
- [ ] Logs d'activité admin (qui a fait quoi)
- [ ] Notifications pour actions critiques
- [ ] Export CSV des données
- [ ] Historique des changements

### Moyen terme
- [ ] Permissions granulaires
- [ ] Rôles personnalisés
- [ ] Dashboard d'analytics
- [ ] Multi-tenancy

### Long terme
- [ ] API publique documentée (Swagger)
- [ ] Webhooks pour événements
- [ ] Intégration SSO
- [ ] Audit trail complet

---

## ✅ Checklist de déploiement

Avant de déployer en production:

- [ ] Changer les mots de passe par défaut
- [ ] Configurer JWT_SECRET_KEY unique
- [ ] Activer HTTPS
- [ ] Configurer CORS correctement
- [ ] Ajouter rate limiting
- [ ] Implémenter logs d'audit
- [ ] Configurer backups automatiques
- [ ] Tester tous les scénarios
- [ ] Documenter les procédures
- [ ] Former les administrateurs

---

**✨ Système Admin & SuperAdmin entièrement fonctionnel et documenté!**

Pour plus de détails:
- 📖 [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - Guide d'utilisation complet
- 🚀 [QUICK_START.md](./QUICK_START.md) - Démarrage rapide
- 🧪 [test_admin.py](./test_admin.py) - Tests automatiques
