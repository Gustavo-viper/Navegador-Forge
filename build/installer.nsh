!include "nsDialogs.nsh"
!include "LogicLib.nsh"

Var ForgeShortcutCheckbox
Var ForgeShortcutChecked

!macro customWelcomePage
  !insertmacro MUI_PAGE_WELCOME
  Page custom ForgeShortcutPage ForgeShortcutPageLeave
!macroend

Function ForgeShortcutPage
  nsDialogs::Create 1018
  Pop $0
  ${If} $0 == error
    Abort
  ${EndIf}
  ${NSD_CreateLabel} 0 4u 100% 28u "Escolha se deseja um atalho do Forge Browser na area de trabalho. O atalho do menu Iniciar sera criado automaticamente."
  Pop $0
  ${NSD_CreateCheckbox} 0 40u 100% 16u "Criar atalho na area de trabalho"
  Pop $ForgeShortcutCheckbox
  ${NSD_Check} $ForgeShortcutCheckbox
  nsDialogs::Show
FunctionEnd

Function ForgeShortcutPageLeave
  ${NSD_GetState} $ForgeShortcutCheckbox $ForgeShortcutChecked
FunctionEnd

!macro customInstall
  ${If} $ForgeShortcutChecked == ${BST_CHECKED}
    CreateShortcut "$DESKTOP\Forge Browser.lnk" "$INSTDIR\Forge Browser.exe" "" "$INSTDIR\Forge Browser.exe" 0
  ${EndIf}
!macroend

!macro customUnInstall
  Delete "$DESKTOP\Forge Browser.lnk"
!macroend