# Women's Safety App - HTTPS Server Starter
# Run this script to start the app with HTTPS support

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "🚀 Starting Women's Safety App with HTTPS..." -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Cyan

# Set environment variables
$env:PYTHONPATH = "c:\Users\abhi1\OneDrive\Desktop\women-safety\women-safety-app"
$env:FLASK_ENV = "development"

# Get local IP address
$localIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*VirtualBox*" -and $_.InterfaceAlias -notlike "*VMware*" }).IPAddress | Select-Object -First 1

Write-Host "📱 Access URLs:" -ForegroundColor Yellow
Write-Host "   Local:  https://localhost:5000" -ForegroundColor White
if ($localIP) {
    Write-Host "   Mobile: https://$localIP`:5000" -ForegroundColor White
    Write-Host "`n💡 Use the Mobile URL on your phone (same WiFi network)" -ForegroundColor Cyan
}
Write-Host "`n⚠️  Accept the security warning when prompted" -ForegroundColor Yellow
Write-Host "============================================================`n" -ForegroundColor Cyan

# Run the HTTPS server
& "C:/Users/abhi1/OneDrive/Desktop/women-safety/.venv/Scripts/python.exe" run_https.py
