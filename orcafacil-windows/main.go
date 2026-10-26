package main

import (
    _ "embed"
    "fmt"
    "os"
    "os/exec"
    "path/filepath"
    "strings"
    "syscall"
    "unsafe"
)

const appURL = "https://orcafacil-web-production.up.railway.app"

//go:embed OrcaFacil.ico
var iconData []byte

var (
    user32 = syscall.NewLazyDLL("user32.dll")
    shell32 = syscall.NewLazyDLL("shell32.dll")
    messageBox = user32.NewProc("MessageBoxW")
    shellExecute = shell32.NewProc("ShellExecuteW")
)

func msg(title, text string) { a, _ := syscall.UTF16PtrFromString(text); b, _ := syscall.UTF16PtrFromString(title); messageBox.Call(0, uintptr(unsafe.Pointer(a)), uintptr(unsafe.Pointer(b)), 0x40) }
func q(s string) string { return strings.ReplaceAll(s, "'", "''") }
func shortcut(target, link, icon string) error { sc := fmt.Sprintf(`$w=New-Object -ComObject WScript.Shell;$s=$w.CreateShortcut('%s');$s.TargetPath='%s';$s.Arguments='--installed';$s.WorkingDirectory='%s';$s.IconLocation='%s,0';$s.Description='OrçaFácil - Gestão para Assistências Técnicas';$s.Save()`, q(link), q(target), q(filepath.Dir(target)), q(icon)); return exec.Command("powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", sc).Run() }
func launch() { candidates:=[]string{filepath.Join(os.Getenv("PROGRAMFILES(X86)"),"Microsoft","Edge","Application","msedge.exe"),filepath.Join(os.Getenv("PROGRAMFILES"),"Microsoft","Edge","Application","msedge.exe"),filepath.Join(os.Getenv("LOCALAPPDATA"),"Microsoft","Edge","Application","msedge.exe")}; for _,e:=range candidates { if e!="" { if _,err:=os.Stat(e); err==nil { p:=filepath.Join(os.Getenv("LOCALAPPDATA"),"OrcaFacil","BrowserData"); _=exec.Command(e,"--app="+appURL,"--start-maximized","--user-data-dir="+p).Start(); return } } }; u,_:=syscall.UTF16PtrFromString(appURL); v,_:=syscall.UTF16PtrFromString("open"); shellExecute.Call(0,uintptr(unsafe.Pointer(v)),uintptr(unsafe.Pointer(u)),0,0,1) }
func main() { d:=filepath.Join(os.Getenv("LOCALAPPDATA"),"OrcaFacil"); dst:=filepath.Join(d,"OrcaFacil.exe"); if len(os.Args)>1&&os.Args[1]=="--installed" { launch(); return }; self,err:=os.Executable(); if err!=nil { msg("OrçaFácil","Não foi possível localizar o instalador."); return }; if filepath.Clean(self)!=filepath.Clean(dst) { _=os.MkdirAll(d,0755); b,err:=os.ReadFile(self); if err!=nil { msg("OrçaFácil","Não foi possível ler o instalador."); return }; if err=os.WriteFile(dst,b,0755); err!=nil { msg("OrçaFácil","Falha ao instalar o OrçaFácil.\n\n"+err.Error()); return }; ip:=filepath.Join(d,"OrcaFacil.ico"); _=os.WriteFile(ip,iconData,0644); _=shortcut(dst,filepath.Join(os.Getenv("USERPROFILE"),"Desktop","OrçaFácil.lnk"),ip); _=shortcut(dst,filepath.Join(os.Getenv("APPDATA"),"Microsoft","Windows","Start Menu","Programs","OrçaFácil.lnk"),ip); msg("OrçaFácil","OrçaFácil foi instalado com sucesso!\n\nUm atalho foi criado na Área de Trabalho e no Menu Iniciar.") }; launch() }
