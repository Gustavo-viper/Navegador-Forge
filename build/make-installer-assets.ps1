$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$outDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $outDir
$packageJsonPath = Join-Path $projectDir 'package.json'
$packageVersion = '2.2.7'
if (Test-Path $packageJsonPath) {
    $package = Get-Content $packageJsonPath -Raw | ConvertFrom-Json
    if ($package.version) { $packageVersion = [string]$package.version }
}

# Forge palette: graphite/navy base + orange energy + subtle cyan/green status accents.
$bg = [System.Drawing.Color]::FromArgb(255, 7, 11, 18)
$navy = [System.Drawing.Color]::FromArgb(255, 9, 15, 26)
$navy2 = [System.Drawing.Color]::FromArgb(255, 14, 23, 38)
$navy3 = [System.Drawing.Color]::FromArgb(255, 22, 33, 52)
$orange = [System.Drawing.Color]::FromArgb(255, 255, 138, 0)
$orange2 = [System.Drawing.Color]::FromArgb(255, 255, 184, 77)
$orangeSoft = [System.Drawing.Color]::FromArgb(255, 255, 213, 153)
$white = [System.Drawing.Color]::FromArgb(255, 244, 247, 250)
$muted = [System.Drawing.Color]::FromArgb(255, 147, 163, 183)
$green = [System.Drawing.Color]::FromArgb(255, 91, 210, 161)
$cyan = [System.Drawing.Color]::FromArgb(255, 87, 205, 255)
$line = [System.Drawing.Color]::FromArgb(120, 255, 255, 255)

function New-Font([string]$name, [float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
    return New-Object System.Drawing.Font($name, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function Save-Bmp([System.Drawing.Bitmap]$bitmap, [string]$path) {
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Bmp)
    $bitmap.Dispose()
}

function Draw-Glow([System.Drawing.Graphics]$graphics, [int]$x, [int]$y, [int]$size, [System.Drawing.Color]$color) {
    for ($i = $size; $i -gt 0; $i -= 4) {
        $alpha = [Math]::Max(8, [int](70 * ($i / $size)))
        $c = [System.Drawing.Color]::FromArgb($alpha, $color.R, $color.G, $color.B)
        $b = New-Object System.Drawing.SolidBrush($c)
        $d = $size - $i
        $graphics.FillEllipse($b, $x - $i / 2, $y - $i / 2, $i, $i)
        $b.Dispose()
    }
}

# ============================================================
# HEADER — 150x57, exactly the size expected by NSIS MUI.
# ============================================================
$header = New-Object System.Drawing.Bitmap(150, 57, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($header)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($bg)

$brushBg = New-Object System.Drawing.SolidBrush($bg)
$brushNavy = New-Object System.Drawing.SolidBrush($navy)
$brushNavy2 = New-Object System.Drawing.SolidBrush($navy2)
$brushOrange = New-Object System.Drawing.SolidBrush($orange)
$brushOrange2 = New-Object System.Drawing.SolidBrush($orange2)
$brushWhite = New-Object System.Drawing.SolidBrush($white)
$brushMuted = New-Object System.Drawing.SolidBrush($muted)
$brushGreen = New-Object System.Drawing.SolidBrush($green)
$brushCyan = New-Object System.Drawing.SolidBrush($cyan)
$penLine = New-Object System.Drawing.Pen($line, 1)
$penOrange = New-Object System.Drawing.Pen($orange, 1)

$g.FillRectangle($brushNavy, 0, 0, 150, 57)
$g.FillRectangle($brushOrange, 0, 0, 4, 57)
$g.DrawLine($penLine, 5, 55, 149, 55)

# Browser chrome motif.
$g.FillEllipse($brushGreen, 11, 9, 6, 6)
$g.FillEllipse($brushOrange, 20, 9, 6, 6)
$g.FillEllipse($brushCyan, 29, 9, 6, 6)
$g.DrawLine($penLine, 40, 12, 141, 12)

$fontF = New-Font 'Segoe UI' 24 ([System.Drawing.FontStyle]::Bold)
$fontTitle = New-Font 'Segoe UI' 9.2 ([System.Drawing.FontStyle]::Bold)
$fontSub = New-Font 'Segoe UI' 7.1 ([System.Drawing.FontStyle]::Regular)

$g.DrawString('F', $fontF, $brushOrange2, 10, 16)
$g.DrawString('FORGE BROWSER', $fontTitle, $brushWhite, 38, 19)
$g.DrawString("FORGE STUDIOS  •  v$packageVersion", $fontSub, $brushMuted, 38, 33)
$g.DrawString('INSTALAÇÃO OFICIAL', $fontSub, $brushOrangeSoft, 38, 43)

$fontF.Dispose(); $fontTitle.Dispose(); $fontSub.Dispose()
$brushBg.Dispose(); $brushNavy.Dispose(); $brushNavy2.Dispose(); $brushOrange.Dispose(); $brushOrange2.Dispose(); $brushWhite.Dispose(); $brushMuted.Dispose(); $brushGreen.Dispose(); $brushCyan.Dispose(); $penLine.Dispose(); $penOrange.Dispose(); $g.Dispose()
Save-Bmp $header (Join-Path $outDir 'installerHeader.bmp')

# ============================================================
# SIDEBAR — 164x314, the main Forge identity panel.
# ============================================================
$side = New-Object System.Drawing.Bitmap(164, 314, [System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$g = [System.Drawing.Graphics]::FromImage($side)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.Clear($bg)

$brushBg = New-Object System.Drawing.SolidBrush($bg)
$brushNavy = New-Object System.Drawing.SolidBrush($navy)
$brushNavy2 = New-Object System.Drawing.SolidBrush($navy2)
$brushNavy3 = New-Object System.Drawing.SolidBrush($navy3)
$brushOrange = New-Object System.Drawing.SolidBrush($orange)
$brushOrange2 = New-Object System.Drawing.SolidBrush($orange2)
$brushWhite = New-Object System.Drawing.SolidBrush($white)
$brushMuted = New-Object System.Drawing.SolidBrush($muted)
$brushGreen = New-Object System.Drawing.SolidBrush($green)
$brushCyan = New-Object System.Drawing.SolidBrush($cyan)
$penLine = New-Object System.Drawing.Pen($line, 1)
$penOrange = New-Object System.Drawing.Pen($orange, 1)
$penSoftOrange = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(85, 255, 138, 0), 1)

$g.FillRectangle($brushNavy, 0, 0, 164, 314)
$g.FillRectangle($brushOrange, 0, 0, 164, 6)
$g.FillRectangle($brushOrange, 0, 6, 4, 308)

# Atmospheric glow and subtle grid.
Draw-Glow $g 133 34 64 $orange
Draw-Glow $g 30 270 52 $cyan
for ($x = 10; $x -lt 164; $x += 18) { $g.DrawLine($penSoftOrange, $x, 0, $x - 45, 314) }
for ($y = 82; $y -lt 314; $y += 18) { $g.DrawLine($penLine, 4, $y, 164, $y) }

# Browser mockup.
$g.FillRectangle($brushNavy2, 17, 17, 130, 42)
$g.DrawRectangle($penLine, 17, 17, 130, 42)
$g.FillEllipse($brushGreen, 24, 25, 6, 6)
$g.FillEllipse($brushOrange, 33, 25, 6, 6)
$g.FillEllipse($brushCyan, 42, 25, 6, 6)
$g.FillRectangle($brushNavy3, 53, 23, 84, 10)
$g.DrawLine($penOrange, 58, 28, 88, 28)
$g.DrawLine($penLine, 96, 28, 128, 28)
$g.FillRectangle($brushNavy3, 24, 37, 113, 15)
$g.DrawLine($penOrange, 29, 45, 66, 45)
$g.DrawLine($penLine, 73, 45, 127, 45)

$fontLogo = New-Font 'Segoe UI' 45 ([System.Drawing.FontStyle]::Bold)
$fontTitle = New-Font 'Segoe UI' 13.2 ([System.Drawing.FontStyle]::Bold)
$fontBody = New-Font 'Segoe UI' 8.4 ([System.Drawing.FontStyle]::Regular)
$fontBadge = New-Font 'Segoe UI' 7.0 ([System.Drawing.FontStyle]::Bold)
$fontTiny = New-Font 'Segoe UI' 6.7 ([System.Drawing.FontStyle]::Regular)
$fontBottom = New-Font 'Segoe UI' 7.2 ([System.Drawing.FontStyle]::Bold)

$g.DrawString('F', $fontLogo, $brushOrange2, 20, 61)
$g.DrawString('FORGE', $fontTitle, $brushWhite, 20, 111)
$g.DrawString('BROWSER', $fontTitle, $brushOrange2, 20, 127)
$g.DrawString('NAVEGADOR GAMER', $fontBody, $brushWhite, 20, 160)
$g.DrawString('Rápido • Privado • Seu estilo', $fontBody, $brushMuted, 20, 177)

# Branded feature cards.
$cards = @(
    @{ y = 201; dot = $green; text = 'LOGIN GOOGLE' },
    @{ y = 226; dot = $orange; text = 'TEMAS + WALLPAPERS' },
    @{ y = 251; dot = $cyan; text = 'WIDEVINE / DRM' },
    @{ y = 276; dot = $orange2; text = 'EXPERIÊNCIA FORGE' }
)
foreach ($card in $cards) {
    $y = [int]$card.y
    $g.FillRectangle($brushNavy3, 18, $y, 128, 19)
    $g.DrawRectangle($penLine, 18, $y, 128, 19)
    $dotBrush = New-Object System.Drawing.SolidBrush($card.dot)
    $g.FillEllipse($dotBrush, 25, $y + 6, 6, 6)
    $dotBrush.Dispose()
    $g.DrawString($card.text, $fontBadge, $brushWhite, 38, $y + 4)
}

$g.DrawLine($penOrange, 20, 300, 144, 300)
$g.DrawString('FORGE STUDIOS', $fontBottom, $brushWhite, 20, 303)
$g.DrawString("v$packageVersion", $fontTiny, $brushOrangeSoft, 124, 304)

$fontLogo.Dispose(); $fontTitle.Dispose(); $fontBody.Dispose(); $fontBadge.Dispose(); $fontTiny.Dispose(); $fontBottom.Dispose()
$penLine.Dispose(); $penOrange.Dispose(); $penSoftOrange.Dispose(); $brushBg.Dispose(); $brushNavy.Dispose(); $brushNavy2.Dispose(); $brushNavy3.Dispose(); $brushOrange.Dispose(); $brushOrange2.Dispose(); $brushWhite.Dispose(); $brushMuted.Dispose(); $brushGreen.Dispose(); $brushCyan.Dispose(); $g.Dispose()
Save-Bmp $side (Join-Path $outDir 'installerSidebar.bmp')

Write-Host "Forge installer artwork generated successfully for v$packageVersion."
