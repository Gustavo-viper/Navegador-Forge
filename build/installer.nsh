; Forge Browser - custom NSIS visual identity
; Uses electron-builder's supported customHeader hook.

!macro customHeader
  ; Generate the Forge-branded NSIS bitmap assets during the installer build.
  !system 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "${BUILD_RESOURCES_DIR}\make-installer-assets.ps1"'

  ; Forge visual identity: deep navy + Forge orange.
  !define MUI_BGCOLOR "0B1220"
  !define MUI_TEXTCOLOR "FFFFFF"
  !define MUI_INSTFILESPAGE_COLORS "E5E7EB 0B1220"
  !define MUI_INSTFILESPAGE_PROGRESSBAR "colored"
  !define MUI_INSTALLCOLORS "FF8A00 172033"
  !define MUI_DIRECTORYPAGE_BGCOLOR "F8FAFC"
  !define MUI_STARTMENUPAGE_BGCOLOR "F8FAFC"

  ; Header/sidebar assets generated above.
  !define MUI_HEADERIMAGE
  !define MUI_HEADERIMAGE_BITMAP "${BUILD_RESOURCES_DIR}\installerHeader.bmp"
  !define MUI_HEADERIMAGE_BITMAP_NOSTRETCH
  !define MUI_WELCOMEFINISHPAGE_BITMAP "${BUILD_RESOURCES_DIR}\installerSidebar.bmp"
  !define MUI_WELCOMEFINISHPAGE_BITMAP_NOSTRETCH

  ; Forge wording for the installation flow.
  !define MUI_PAGE_HEADER_TEXT "Forge Browser"
  !define MUI_PAGE_HEADER_SUBTEXT "Instalação oficial • Forge Studios"
  !define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao Forge Browser"
  !define MUI_WELCOMEPAGE_TEXT "Seu novo navegador gamer está pronto para entrar em ação."
  !define MUI_FINISHPAGE_TITLE "Forge Browser instalado!"
  !define MUI_FINISHPAGE_TEXT "A instalação foi concluída. Agora você pode navegar com a experiência Forge."
  !define MUI_INSTFILESPAGE_FINISHHEADER_TEXT "Instalação concluída"
  !define MUI_INSTFILESPAGE_FINISHHEADER_SUBTEXT "O Forge Browser está pronto para uso."
  !define MUI_INSTFILESPAGE_ABORTHEADER_TEXT "Instalação interrompida"
  !define MUI_INSTFILESPAGE_ABORTHEADER_SUBTEXT "O Forge Browser não foi instalado completamente."
!macroend
