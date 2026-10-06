$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/generate-icon.cjs
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o icone.' }

$vite = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c', 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort' -PassThru -WindowStyle Hidden
try {
  $ready = $false
  for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Milliseconds 500
    try { Invoke-WebRequest -Uri 'http://127.0.0.1:5173' -UseBasicParsing -TimeoutSec 1 | Out-Null; $ready = $true; break } catch { }
  }
  if (-not $ready) { throw 'Vite nao iniciou na porta 5173.' }
  $env:FORGE_DEV_URL = 'http://127.0.0.1:5173'
  npx electron electron/main.cjs
} finally {
  taskkill /PID $vite.Id /T /F 2>$null | Out-Null
}