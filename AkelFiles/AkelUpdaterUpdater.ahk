#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
#SingleInstance, Force
URLDownloadToFile, http://akelpad.sourceforge.net/files/tools/AkelUpdater.zip, AkelUpdater.zip
Unzip(A_WorkingDir "\AkelUpdater.zip", A_ScriptDir "\")
FileDelete, % A_WorkingDir "\AkelUpdater.zip"
ExitApp

Unzip(zipFile, unzipTo)
{
	fso := ComObjCreate("Scripting.FileSystemObject")
	If !fso.FolderExists(unzipTo)
		 fso.CreateFolder(unzipTo)
	ComObjCreate("Shell.Application").Namespace(unzipTo).CopyHere(zipFile "\*", 4|16)
}