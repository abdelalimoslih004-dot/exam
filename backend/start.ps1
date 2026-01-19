# Script de lancement du serveur Flask
Write-Host "🚀 Démarrage du serveur Flask..." -ForegroundColor Cyan

# Activer l'environnement virtuel
& ".\venv\Scripts\Activate.ps1"

# Variables d'environnement
$env:FLASK_ENV = "development"

# Lancer le serveur
python app.py
