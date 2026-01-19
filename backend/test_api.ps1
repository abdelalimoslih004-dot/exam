# Script de test des APIs
$baseUrl = "http://127.0.0.1:5000/api"

Write-Host "`n=== TEST 1: Health Check ===" -ForegroundColor Green
$response = Invoke-RestMethod -Uri "$baseUrl/health" -Method Get
$response | ConvertTo-Json
Start-Sleep -Seconds 1

Write-Host "`n=== TEST 2: Register New User (Trader) ===" -ForegroundColor Green
$registerData = @{
    username = "trader1"
    email = "trader1@test.com"
    password = "password123"
    role = "trader"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -Body $registerData -ContentType "application/json"
$traderToken = $response.access_token
Write-Host "Token: $traderToken"
$response | ConvertTo-Json
Start-Sleep -Seconds 1

Write-Host "`n=== TEST 3: Login Admin ===" -ForegroundColor Green
$loginData = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body $loginData -ContentType "application/json"
$adminToken = $response.access_token
Write-Host "Admin Token: $adminToken"
$response | ConvertTo-Json
Start-Sleep -Seconds 1

Write-Host "`n=== TEST 4: Get Current User (Trader) ===" -ForegroundColor Green
$headers = @{
    "Authorization" = "Bearer $traderToken"
}
$response = Invoke-RestMethod -Uri "$baseUrl/me" -Method Get -Headers $headers
$response | ConvertTo-Json
Start-Sleep -Seconds 1

Write-Host "`n=== TEST 5: Get All Users (Admin) ===" -ForegroundColor Green
$headers = @{
    "Authorization" = "Bearer $adminToken"
}
$response = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $headers
$response | ConvertTo-Json
Start-Sleep -Seconds 1

Write-Host "`n=== TEST 6: Try Get All Users (Trader - Should Fail) ===" -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $traderToken"
}
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/users" -Method Get -Headers $headers
    $response | ConvertTo-Json
} catch {
    Write-Host "Error (Expected): " -NoNewline -ForegroundColor Red
    Write-Host $_.Exception.Message
}

Write-Host "`n=== TESTS TERMINÉS ===" -ForegroundColor Cyan
