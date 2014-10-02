// Name: deleteCurrentFile.js
// Author: Infocatcher
// Source:  https://gist.github.com/Infocatcher/6200149
// Version: 2014.07.17
// Description: deletes the file that is currently opened for editing.
// How to use: Call("Scripts::Main", 1, "deleteCurrentFile.js")

var confirm = AkelPad.GetArgValue("confirm", true);
var curFile = AkelPad.GetEditFile(0);
if(curFile) {
	var hMainWnd = AkelPad.GetMainWnd();
	var oSys = AkelPad.SystemFunction();
	if(oSys.Call("kernel32::GetFileAttributes" + _TCHAR, curFile) != -1) {
		if(
			!confirm
			|| AkelPad.MessageBox(
				hMainWnd,
				"Delete file?\n" + curFile,
				WScript.ScriptName,
				33 /*MB_OKCANCEL|MB_ICONQUESTION*/
			) == 1 /*IDOK*/
		) {
			if(oSys.Call("kernel32::DeleteFile" + _TCHAR, curFile)) {
				var lpFileTime = AkelPad.SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 133 /*FI_FILETIME*/, 0);
				AkelPad.MemCopy(lpFileTime + 0 /*offsetof(FILETIME, dwLowDateTime)*/, 0, 3 /*DT_DWORD*/);
				AkelPad.MemCopy(lpFileTime + 4 /*offsetof(FILETIME, dwHighDateTime)*/, 0, 3 /*DT_DWORD*/);
			}
		}
	}
	else {
		AkelPad.MessageBox(
			hMainWnd,
			"File already deleted:\n" + curFile,
			WScript.ScriptName,
			64 /*MB_OK|MB_ICONINFORMATION*/
		);
	}
}