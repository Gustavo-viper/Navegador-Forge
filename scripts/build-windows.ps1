$ErrorActionPreference = 'Stop'
Set-Location (Split-Path $PSScriptRoot -Parent)
node scripts/generate-icon.cjs
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o icone.' }
npm run build
if ($LASTEXITCODE -ne 0) { throw 'Falha no build da interface.' }
node scripts/prepare-desktop.cjs
if ($LASTEXITCODE -ne 0) { throw 'Falha ao preparar o pacote desktop.' }
npx electron-builder --projectDir build/desktop-stage --win nsis --x64 --publish never
if ($LASTEXITCODE -ne 0) { throw 'Falha ao gerar o instalador.' }
Write-Host 'Instalador: release/Forge Browser Setup.exe'