# ============================================================================
# start-api-service.ps1 — Start the Products API Server as a Windows Service
# ============================================================================

# This script starts the Products API server permanently in the background

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$serverScript = Join-Path $projectRoot "server\products-api.mjs"

# Navigate to project root
Set-Location $projectRoot

# Start Node process for API server in a detached manner
Write-Host "🚀 Starting Cooper Dismedic Products API Service..."

# Create a VBScript wrapper to run in background (invisible)
$vbsScript = @"
Set objShell = CreateObject("WScript.Shell")
objShell.Run "node $serverScript", 0, False
"@

$vbsPath = Join-Path $env:TEMP "start-api-server.vbs"
$vbsScript | Out-File -FilePath $vbsPath -Encoding ASCII

# Execute the VBS script (runs Node server invisibly in background)
& cscript.exe $vbsPath

Write-Host "✅ Products API Service started successfully"
Write-Host "ℹ️  Server logs will be available when you run: npm run api"
Write-Host "ℹ️  Daily synchronization scheduled for 03:00 AM"
