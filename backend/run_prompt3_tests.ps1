# Test automatique PROMPT 3
Write-Host "=================================================================="
Write-Host "PROMPT 3 - Test Automatique"
Write-Host "=================================================================="

# Démarrer le serveur en background
Write-Host "`n1. Démarrage du serveur Flask..."
$serverJob = Start-Job -ScriptBlock {
    Set-Location C:\Users\abdel\Desktop\propsens\backend
    & C:\Users\abdel\Desktop\propsens\backend\venv\Scripts\python.exe C:\Users\abdel\Desktop\propsens\backend\app.py
}

# Attendre que le serveur soit prêt
Write-Host "2. Attente du démarrage complet (15 secondes)..."
Start-Sleep -Seconds 15

# Vérifier que le serveur répond
Write-Host "3. Vérification du serveur..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing
    Write-Host "✅ Serveur opérationnel!" -ForegroundColor Green
} catch {
    Write-Host "❌ Serveur non accessible" -ForegroundColor Red
    Stop-Job $serverJob
    Remove-Job $serverJob
    exit 1
}

# Exécuter les tests
Write-Host "`n4. Exécution des tests PROMPT 3..."
Write-Host "==================================================================`n"
& C:\Users\abdel\Desktop\propsens\backend\venv\Scripts\python.exe C:\Users\abdel\Desktop\propsens\backend\test_prompt3.py

# Arrêter le serveur
Write-Host "`n`n5. Arrêt du serveur..."
Stop-Job $serverJob
Remove-Job $serverJob

Write-Host "`n=================================================================="
Write-Host "✅ Tests terminés!"
Write-Host "=================================================================="
