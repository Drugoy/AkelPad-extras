/* AkelUpdater wrapper
Version: 1.0
Last time modified: 2015.04.12 18:41

Description: a wrapper for AkelUpdater.exe that will checks for new versions of the original AkelUpdater.exe and update it (as AkelUpdater.original.exe) if needed.

Script author: Drugoy a.k.a. Drugmix
Contacts: idrugoy@gmail.com, drug0y@ya.ru
https://github.com/Drugoy/AkelPad-extras/blob/master/AkelFiles/AkelUpdater.ahk
*/

#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
SetWorkingDir, %A_ScriptDir%  ; Ensures a consistent starting directory.
#SingleInstance, Force
ListLines, On
; #NoTrayIcon

isAUOutdated := checkAUFreshness()
If (isAUOutdated)	; There is either an update or file 'AkelUpdater.original.exe' doesn't yet exist.
{
	TrayTip, AkelUpdater, New version detected!`nUpdating it., 3
	WinClose, ahk_exe AkelUpdater.original.exe
	getNewAU()
	Run, AkelUpdater.original.exe
}


getNewAU()
{
	IfNotExist, AkelUpdater
		FileCreateDir, AkelUpdater
	URLDownloadToFile, % "http://akelpad.sourceforge.net/files/tools/AkelUpdater.zip", AkelUpdater\AkelUpdater.zip
	ComObjCreate("Shell.Application").Namespace(A_ScriptDir "\AkelUpdater\").CopyHere(A_ScriptDir "\AkelUpdater\AkelUpdater.zip\*", 4|16)
	FileMove, AkelUpdater\AkelUpdater.exe, AkelUpdater.original.exe, 1
	FileRemoveDir, AkelUpdater, 1
}

checkAUFreshness()
{
	IfExist, AkelUpdater.original.exe
	{
		Run, AkelUpdater.original.exe
		WinWait, ahk_exe AkelUpdater.original.exe
		While (titleAU == "AkelUpdater - Соединение" || !titleAU)
			WinGetTitle, titleAU, ahk_exe AkelUpdater.original.exe
		If InStr(titleAU, "доступна версия")
			Return, 1
	}
}