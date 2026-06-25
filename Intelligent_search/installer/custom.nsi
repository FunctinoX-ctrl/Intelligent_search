!include "LogicLib.nsh"
!include "nsDialogs.nsh"

Var SERVER_IP

!macro preInit
  StrCpy $SERVER_IP "127.0.0.1:3000"
!macroend

!ifndef BUILD_UNINSTALLER

!macro customPageAfterChangeDir
  Page custom ServerIPPageCreate ServerIPPageLeave
!macroend

Function ServerIPPageCreate
  nsDialogs::Create 1018
  Pop $0

  ${If} $0 == error
    Abort
  ${EndIf}

  ${NSD_CreateLabel} 0 0 100% 20u "Server IP:Port:"
  Pop $0

  ${NSD_CreateText} 0 25u 100% 30u "$SERVER_IP"
  Pop $SERVER_IP

  ${NSD_CreateLabel} 0 60u 100% 15u "Example: 192.168.1.100:3000"
  Pop $0

  nsDialogs::Show
FunctionEnd

Function ServerIPPageLeave
  ${NSD_GetText} $SERVER_IP $SERVER_IP
  ${If} $SERVER_IP == ""
    StrCpy $SERVER_IP "127.0.0.1:3000"
  ${EndIf}
FunctionEnd

!endif

!macro customInstall
  WriteRegStr SHELL_CONTEXT "${INSTALL_REGISTRY_KEY}" ServerIP "$SERVER_IP"

  CreateDirectory "$INSTDIR\config"

  FileOpen $1 "$INSTDIR\config\server.json" w
  FileWrite $1 '{\"serverIP\":\"http://$SERVER_IP\"}'
  FileClose $1
!macroend

!macro customUnInstall
!macroend
