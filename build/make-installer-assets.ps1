$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path

$navy = [System.Drawing.Color]::FromArgb(255, 11, 18, 32)
$navy2 = [System.Drawing.Color]::FromArgb(255, 17, 24, 39)
$orange = [System.Drawing.Color]::FromArgb(255, 255, 138, 0)
$white = [System.Drawing.Color]::FromArgb(255, 248, 250, 252)
$muted = [System.Drawing.Color]::FromArgb(255, 170, 180, 195)

function New-Font([string]$name, [float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
    return New-Object System.Drawing.Font($name, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Save-Bmp([System.Drawing.Bitmap]$bitmap, [string]$path) {
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $bitmap.Dispose()
}

# 150x57 header: compact Forge branding for the installer wizard.
$header = New-Object System.Drawing.Bitmap(150, 57, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($header)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($navy)

$g.FillRectangle((New-Object System.Drawing.SolidBrush($orange)), 0, 0, 5, 57)
$g.FillRectangle((New-Object System.Drawing.SolidBrush($navy2)), 5, 0, 145, 57)

$fontF = New-Font 'Segoe UI' 24 ([System.Drawing.FontStyle]::Bold)
$fontSmall = New-Font 'Segoe UI' 10 ([System.Drawing.FontStyle]::Bold)
$fontTiny = New-Font 'Segoe UI' 7.5 ([System.Drawing.FontStyle]::Regular)

$g.DrawString('F', $fontF, (New-Object System.Drawing.SolidBrush($orange)), 14, 9)
$g.DrawString('FORGE', $fontSmall, (New-Object System.Drawing.SolidBrush($white)), 42, 8)
$g.DrawString('BROWSER', $fontSmall, (New-Object System.Drawing.SolidBrush($orange)), 42, 24)
$g.DrawString('Forge Studios  •  Gamer Browser', $fontTiny, (New-Object System.Drawing.SolidBrush($muted)), 42, 42)

$fontF.Dispose(); $fontSmall.Dispose(); $fontTiny.Dispose(); $g.Dispose()
Save-Bmp $header (Join-Path $outDir 'installerHeader.bmp')

# 164x314 sidebar: vertical Forge identity used by the assisted installer.
$side = New-Object System.Drawing.Bitmap(164, 314, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($side)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($navy)

$brushNavy2 = New-Object System.Drawing.SolidBrush($navy2)
$brushOrange = New-Object System.Drawing.SolidBrush($orange)
$brushWhite = New-Object System.Drawing.SolidBrush($white)
$brushMuted = New-Object System.Drawing.SolidBrush($muted)

# Angular Forge-style accents.
$g.FillPolygon($brushOrange, @(
    (New-Object System.Drawing.Point(0, 0)),
    (New-Object System.Drawing.Point(164, 0)),
    (New-Object System.Drawing.Point(164, 14)),
    (New-Object System.Drawing.Point(18, 52)),
    (New-Object System.Drawing.Point(0, 52))
))
$g.FillRectangle($brushNavy2, 0, 62, 164, 252)
$g.FillRectangle($brushOrange, 0, 62, 6, 252)

$fontLogo = New-Font 'Segoe UI' 52 ([System.Drawing.FontStyle]::Bold)
$fontTitle = New-Font 'Segoe UI' 15 ([System.Drawing.FontStyle]::Bold)
$fontBody = New-Font 'Segoe UI' 9 ([System.Drawing.FontStyle]::Regular)
$fontBottom = New-Font 'Segoe UI' 8 ([System.Drawing.FontStyle]::Bold)

$g.DrawString('F', $fontLogo, $brushOrange, 22, 78)
$g.DrawString('FORGE', $fontTitle, $brushWhite, 22, 138)
$g.DrawString('BROWSER', $fontTitle, $brushOrange, 22, 157)

$g.DrawString('NAVEGADOR GAMER', $fontBody, $brushWhite, 22, 196)
$g.DrawString('Rápido. Privado. Forge.', $fontBody, $brushMuted, 22, 216)
$g.DrawString('FORGE STUDIOS', $fontBottom, $brushWhite, 22, 278)
$g.DrawString('v1.2', $fontBottom, $brushOrange, 119, 278)

$fontLogo.Dispose(); $fontTitle.Dispose(); $fontBody.Dispose(); $fontBottom.Dispose()
$brushNavy2.Dispose(); $brushOrange.Dispose(); $brushWhite.Dispose(); $brushMuted.Dispose(); $g.Dispose()
Save-Bmp $side (Join-Path $outDir 'installerSidebar.bmp')

Write-Host 'Forge installer artwork generated successfully.'
