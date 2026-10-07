$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $outDir
$packageJsonPath = Join-Path $projectDir 'package.json'
$packageVersion = '2.2.4'
if (Test-Path $packageJsonPath) {
    $package = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    if ($package.version) { $packageVersion = [string]$package.version }
}

$navy = [System.Drawing.Color]::FromArgb(255, 8, 13, 22)
$navy2 = [System.Drawing.Color]::FromArgb(255, 15, 22, 34)
$navy3 = [System.Drawing.Color]::FromArgb(255, 24, 33, 48)
$orange = [System.Drawing.Color]::FromArgb(255, 246, 166, 95)
$orange2 = [System.Drawing.Color]::FromArgb(255, 255, 194, 133)
$white = [System.Drawing.Color]::FromArgb(255, 244, 247, 250)
$muted = [System.Drawing.Color]::FromArgb(255, 150, 164, 180)
$green = [System.Drawing.Color]::FromArgb(255, 91, 210, 161)

function New-Font([string]$name, [float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
    return New-Object System.Drawing.Font($name, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Save-Bmp([System.Drawing.Bitmap]$bitmap, [string]$path) {
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $bitmap.Dispose()
}

# Header: browser-style Forge identity used throughout the NSIS wizard.
$header = New-Object System.Drawing.Bitmap(150, 57, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($header)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($navy)
$brushOrange = New-Object System.Drawing.SolidBrush($orange)
$brushOrange2 = New-Object System.Drawing.SolidBrush($orange2)
$brushWhite = New-Object System.Drawing.SolidBrush($white)
$brushMuted = New-Object System.Drawing.SolidBrush($muted)
$brushNavy2 = New-Object System.Drawing.SolidBrush($navy2)
$brushNavy3 = New-Object System.Drawing.SolidBrush($navy3)
$brushGreen = New-Object System.Drawing.SolidBrush($green)

$g.FillRectangle($brushOrange, 0, 0, 5, 57)
$g.FillRectangle($brushNavy2, 5, 0, 145, 57)
$g.FillEllipse($brushGreen, 12, 8, 7, 7)
$g.FillEllipse($brushOrange, 22, 8, 7, 7)
$g.FillEllipse($brushNavy3, 32, 8, 7, 7)

$fontF = New-Font 'Segoe UI' 24 ([System.Drawing.FontStyle]::Bold)
$fontSmall = New-Font 'Segoe UI' 10 ([System.Drawing.FontStyle]::Bold)
$fontTiny = New-Font 'Segoe UI' 7.2 ([System.Drawing.FontStyle]::Regular)

$g.DrawString('F', $fontF, $brushOrange2, 14, 17)
$g.DrawString('FORGE', $fontSmall, $brushWhite, 42, 8)
$g.DrawString('BROWSER', $fontSmall, $brushOrange2, 42, 24)
$g.DrawString("Forge Studios  •  Gamer Browser  •  v$packageVersion", $fontTiny, $brushMuted, 42, 42)

$fontF.Dispose(); $fontSmall.Dispose(); $fontTiny.Dispose(); $brushOrange.Dispose(); $brushOrange2.Dispose(); $brushWhite.Dispose(); $brushMuted.Dispose(); $brushNavy2.Dispose(); $brushNavy3.Dispose(); $brushGreen.Dispose(); $g.Dispose()
Save-Bmp $header (Join-Path $outDir 'installerHeader.bmp')

# Sidebar: richer browser artwork, feature badges and progress-style accents.
$side = New-Object System.Drawing.Bitmap(164, 314, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($side)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($navy)

$brushNavy2 = New-Object System.Drawing.SolidBrush($navy2)
$brushOrange = New-Object System.Drawing.SolidBrush($orange)
$brushOrange2 = New-Object System.Drawing.SolidBrush($orange2)
$brushWhite = New-Object System.Drawing.SolidBrush($white)
$brushMuted = New-Object System.Drawing.SolidBrush($muted)
$brushNavy3 = New-Object System.Drawing.SolidBrush($navy3)
$brushGreen = New-Object System.Drawing.SolidBrush($green)
$penOrange = New-Object System.Drawing.Pen($orange, 1)
$penSoft = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(90, 255, 255, 255), 1)

$g.FillRectangle($brushNavy2, 0, 0, 164, 314)
$g.FillRectangle($brushOrange, 0, 0, 164, 7)
$g.FillRectangle($brushOrange, 0, 62, 5, 252)

# Abstract Forge Browser window.
$g.FillRectangle($brushNavy3, 18, 17, 128, 35)
$g.DrawRectangle($penSoft, 18, 17, 128, 35)
$g.FillEllipse($brushGreen, 25, 25, 5, 5)
$g.FillEllipse($brushOrange, 33, 25, 5, 5)
$g.FillEllipse($brushMuted, 41, 25, 5, 5)
$g.FillRectangle($brushNavy2, 25, 37, 96, 8)
$g.DrawLine($penOrange, 29, 41, 73, 41)
$g.DrawLine($penSoft, 80, 41, 111, 41)

$fontLogo = New-Font 'Segoe UI' 47 ([System.Drawing.FontStyle]::Bold)
$fontTitle = New-Font 'Segoe UI' 14 ([System.Drawing.FontStyle]::Bold)
$fontBody = New-Font 'Segoe UI' 8.5 ([System.Drawing.FontStyle]::Regular)
$fontBadge = New-Font 'Segoe UI' 7.2 ([System.Drawing.FontStyle]::Bold)
$fontBottom = New-Font 'Segoe UI' 7.5 ([System.Drawing.FontStyle]::Bold)

$g.DrawString('F', $fontLogo, $brushOrange2, 22, 61)
$g.DrawString('FORGE', $fontTitle, $brushWhite, 22, 113)
$g.DrawString('BROWSER', $fontTitle, $brushOrange2, 22, 130)
$g.DrawString('NAVEGADOR GAMER', $fontBody, $brushWhite, 22, 166)
$g.DrawString('Rápido. Privado. Personalizável.', $fontBody, $brushMuted, 22, 183)

# Feature badges.
$g.FillRectangle($brushNavy3, 20, 205, 124, 21)
$g.DrawRectangle($penSoft, 20, 205, 124, 21)
$g.FillEllipse($brushGreen, 27, 212, 6, 6)
$g.DrawString('LOGIN GOOGLE', $fontBadge, $brushWhite, 39, 209)
$g.FillRectangle($brushNavy3, 20, 231, 124, 21)
$g.DrawRectangle($penSoft, 20, 231, 124, 21)
$g.FillEllipse($brushOrange, 27, 238, 6, 6)
$g.DrawString('TEMAS + WALLPAPERS', $fontBadge, $brushWhite, 39, 235)
$g.FillRectangle($brushNavy3, 20, 257, 124, 21)
$g.DrawRectangle($penSoft, 20, 257, 124, 21)
$g.FillEllipse($brushOrange2, 27, 264, 6, 6)
$g.DrawString('WIDEVINE / DRM', $fontBadge, $brushWhite, 39, 261)

$g.DrawString('FORGE STUDIOS', $fontBottom, $brushWhite, 22, 290)
$g.DrawString("v$packageVersion", $fontBottom, $brushOrange2, 116, 290)

$fontLogo.Dispose(); $fontTitle.Dispose(); $fontBody.Dispose(); $fontBadge.Dispose(); $fontBottom.Dispose()
$penOrange.Dispose(); $penSoft.Dispose(); $brushNavy2.Dispose(); $brushOrange.Dispose(); $brushOrange2.Dispose(); $brushWhite.Dispose(); $brushMuted.Dispose(); $brushNavy3.Dispose(); $brushGreen.Dispose(); $g.Dispose()
Save-Bmp $side (Join-Path $outDir 'installerSidebar.bmp')

Write-Host "Forge installer artwork generated successfully for v$packageVersion."