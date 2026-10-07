; Forge Browser - fully branded NSIS installer UI
; Keeps electron-builder's maintained NSIS flow while applying the Forge identity
; to the welcome, directory, installation/progress and finish pages.

!macro customHeader
  ; Regenerate the Forge artwork on every build so the installer version is current.
  !system 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${BUILD_RESOURCES_DIR}\make-installer-assets.ps1"'

  ; ==============================
  ; FORGE VISUAL SYSTEM
  ; ==============================
  !ifndef MUI_BGCOLOR
    !define MUI_BGCOLOR "080D16"
  !endif
  !ifndef MUI_TEXTCOLOR
    !define MUI_TEXTCOLOR "F4F7FA"
  !endif
  !ifndef MUI_HEADERIMAGE
    !define MUI_HEADERIMAGE
  !endif
  !ifndef MUI_HEADER_TRANSPARENT_TEXT
    !define MUI_HEADER_TRANSPARENT_TEXT
  !endif
  !ifndef MUI_INSTFILESPAGE_COLORS
    !define MUI_INSTFILESPAGE_COLORS "F4F7FA 0B1220"
  !endif
  !ifndef MUI_INSTFILESPAGE_PROGRESSBAR
    !define MUI_INSTFILESPAGE_PROGRESSBAR "colored"
  !endif
  !ifndef MUI_INSTALLCOLORS
    !define MUI_INSTALLCOLORS "FF8A00 182033"
  !endif
  !ifndef MUI_DIRECTORYPAGE_BGCOLOR
    !define MUI_DIRECTORYPAGE_BGCOLOR "101827"
  !endif
  !ifndef MUI_STARTMENUPAGE_BGCOLOR
    !define MUI_STARTMENUPAGE_BGCOLOR "101827"
  !endif
  !ifndef MUI_BRANDINGTEXT
    !define MUI_BRANDINGTEXT "FORGE STUDIOS  •  FORGE BROWSER  •  Instalação oficial"
  !endif

  ; ==============================
  ; FORGE PAGE COPY
  ; ==============================
  !ifndef MUI_PAGE_HEADER_TEXT
    !define MUI_PAGE_HEADER_TEXT "FORGE BROWSER"
  !endif
  !ifndef MUI_PAGE_HEADER_SUBTEXT
    !define MUI_PAGE_HEADER_SUBTEXT "Instalação oficial • Forge Studios"
  !endif

  !ifndef MUI_WELCOMEPAGE_TITLE
    !define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao Forge Browser"
  !endif
  !ifndef MUI_WELCOMEPAGE_TEXT
    !define MUI_WELCOMEPAGE_TEXT "O navegador gamer da Forge Studios está pronto.$\r$\n$\r$\n• Experiência Forge personalizada$\r$\n• Login com sua conta Google$\r$\n• Temas e wallpapers$\r$\n• Widevine / DRM$\r$\n• Navegação rápida e privada$\r$\n$\r$\nClique em Avançar para começar a instalação."
  !endif
  !ifndef MUI_WELCOMEPAGE_TITLE_3LINES
    !define MUI_WELCOMEPAGE_TITLE_3LINES
  !endif

  !ifndef MUI_DIRECTORYPAGE_TEXT_TOP
    !define MUI_DIRECTORYPAGE_TEXT_TOP "Escolha onde o Forge Browser será instalado."
  !endif
  !ifndef MUI_DIRECTORYPAGE_TEXT_DESTINATION
    !define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Pasta de instalação do Forge Browser:"
  !endif

  !ifndef MUI_INSTFILESPAGE_FINISHHEADER_TEXT
    !define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "FORGE BROWSER PRONTO"
  !endif
  !ifndef MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT
    !define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "A experiência Forge foi instalada com sucesso."
  !endif
  !ifndef MUI_INSTFILESPAGE_ABORTHEADER_TEXT
    !define MUI_INSTFILESPAGE_ABORTHEADER_TEXT "INSTALAÇÃO INTERROMPIDA"
  !endif
  !ifndef MUI_INSTFILESPAGE_ABORTHEADER_SUBTEXT
    !define MUI_INSTFILESPAGE_ABORTHEADER_SUBTEXT "O Forge Browser não foi instalado completamente."
  !endif

  !ifndef MUI_FINISHPAGE_TITLE
    !define MUI_FINISHPAGE_TITLE "Forge Browser instalado!"
  !endif
  !ifndef MUI_FINISHPAGE_TEXT
    !define MUI_FINISHPAGE_TEXT "Tudo pronto.$\r$\n$\r$\nO Forge Browser agora faz parte do seu PC.$\r$\n$\r$\nClique em Concluir para abrir o navegador."
  !endif
  !ifndef MUI_FINISHPAGE_RUN
    !define MUI_FINISHPAGE_RUN
  !endif
  !ifndef MUI_FINISHPAGE_RUN_TEXT
    !define MUI_FINISHPAGE_RUN_TEXT "Abrir o Forge Browser agora"
  !endif

  ; More Forge-like button labels.
  !ifndef MUI_BUTTON_NEXT
    !define MUI_BUTTON_NEXT "Avançar >"
  !endif
  !ifndef MUI_BUTTON_BACK
    !define MUI_BUTTON_BACK "< Voltar"
  !endif
  !ifndef MUI_BUTTON_CANCEL
    !define MUI_BUTTON_CANCEL "Cancelar"
  !endif
  !ifndef MUI_BUTTON_FINISH
    !define MUI_BUTTON_FINISH "Concluir"
  !endif

  !ifndef MUI_ABORTWARNING
    !define MUI_ABORTWARNING
  !endif

  ; Welcome/finish pages use the Forge artwork as their left visual panel.
  !ifndef MUI_WELCOMEFINISHPAGE_BITMAP
    !define MUI_WELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installerSidebar.bmp"
  !endif
!macroend

; Electron-builder does not add the assisted welcome page by default.
; Add it so the installer starts with the Forge artwork and feature overview.
!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
!macroend
