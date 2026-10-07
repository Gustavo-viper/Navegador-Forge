; Forge Browser - custom NSIS visual identity
; Uses electron-builder's supported customHeader hook.

!macro customHeader
  ; Generate the Forge-branded NSIS bitmap assets during the installer build.
  !system 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${BUILD_RESOURCES_DIR}\make-installer-assets.ps1"'

  ; Forge visual identity: deep navy + Forge orange.
  ; electron-builder may already define some MUI values, so guard every
  ; optional definition to prevent makensis duplicate-define failures.
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
    !define MUI_WELCOMEPAGE_TEXT "Seu novo navegador gamer está pronto para entrar em ação."
  !endif
  !ifndef MUI_FINISHPAGE_TITLE
    !define MUI_FINISHPAGE_TITLE "Forge Browser instalado!"
  !endif
  !ifndef MUI_FINISHPAGE_TEXT
    !define MUI_FINISHPAGE_TEXT "A instalação foi concluída. Agora você pode navegar com a experiência Forge."
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
