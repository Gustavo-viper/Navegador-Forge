; Forge Browser - custom NSIS visual identity
; Uses electron-builder's supported custom NSIS hooks.

!macro customHeader
  ; Generate the Forge-branded NSIS bitmap assets during the installer build.
  !system 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${BUILD_RESOURCES_DIR}\make-installer-assets.ps1"'

  ; Forge visual identity: deep navy + Forge orange.
  !ifndef MUI_BGCOLOR
    !define MUI_BGCOLOR "0B1220"
  !endif
  !ifndef MUI_TEXTCOLOR
    !define MUI_TEXTCOLOR "FFFFFF"
  !endif
  !ifndef MUI_INSTFILESPAGE_COLORS
    !define MUI_INSTFILESPAGE_COLORS "E5E7EB 0B1220"
  !endif
  !ifndef MUI_INSTFILESPAGE_PROGRESSBAR
    !define MUI_INSTFILESPAGE_PROGRESSBAR "colored"
  !endif
  !ifndef MUI_INSTALLCOLORS
    !define MUI_INSTALLCOLORS "FF8A00 172033"
  !endif
  !ifndef MUI_DIRECTORYPAGE_BGCOLOR
    !define MUI_DIRECTORYPAGE_BGCOLOR "F8FAFC"
  !endif
  !ifndef MUI_STARTMENUPAGE_BGCOLOR
    !define MUI_STARTMENUPAGE_BGCOLOR "F8FAFC"
  !endif

  ; Forge wording for the installation flow.
  !ifndef MUI_PAGE_HEADER_TEXT
    !define MUI_PAGE_HEADER_TEXT "Forge Browser"
  !endif
  !ifndef MUI_PAGE_HEADER_SUBTEXT
    !define MUI_PAGE_HEADER_SUBTEXT "Instalação oficial • Forge Studios"
  !endif
  !ifndef MUI_WELCOMEPAGE_TITLE
    !define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao Forge Browser"
  !endif
  !ifndef MUI_WELCOMEPAGE_TEXT
    !define MUI_WELCOMEPAGE_TEXT "Seu novo navegador gamer está pronto para entrar em ação.$\r$\n$\r$\n✓ Login com sua conta Google$\r$\n✓ Temas e wallpapers animados$\r$\n✓ Widevine / DRM para conteúdo protegido$\r$\n✓ Navegação rápida e privada$\r$\n$\r$\nClique em Avançar para escolher onde instalar o Forge Browser."
  !endif
  !ifndef MUI_WELCOMEPAGE_TITLE_3LINES
    !define MUI_WELCOMEPAGE_TITLE_3LINES
  !endif
  !ifndef MUI_FINISHPAGE_TITLE
    !define MUI_FINISHPAGE_TITLE "Forge Browser instalado!"
  !endif
  !ifndef MUI_FINISHPAGE_TEXT
    !define MUI_FINISHPAGE_TEXT "A instalação foi concluída.$\r$\n$\r$\nO Forge Browser está pronto para uso. Clique em Concluir para abrir o navegador."
  !endif
  !ifndef MUI_INSTFILESPAGE_FINISHHEADER_TEXT
    !define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Instalação concluída"
  !endif
  !ifndef MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT
    !define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "O Forge Browser está pronto para uso."
  !endif
  !ifndef MUI_INSTFILESPAGE_ABORTHEADER_TEXT
    !define MUI_INSTFILESPAGE_ABORTHEADER_TEXT "Instalação interrompida"
  !endif
  !ifndef MUI_INSTFILESPAGE_ABORTHEADER_SUBTEXT
    !define MUI_INSTFILESPAGE_ABORTHEADER_SUBTEXT "O Forge Browser não foi instalado completamente."
  !endif
!macroend

; Electron-builder does not add the assisted welcome page by default.
; Add it so the installer starts with the Forge artwork and feature overview.
!macro customWelcomePage
  !ifndef MUI_WELCOMEFINISHPAGE_BITMAP
    !define MUI_WELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installerSidebar.bmp"
  !endif
  !insertmacro MUI_PAGE_WELCOME
!macroend
