/* debugVarAHK
Version: 1.0
Script author: Drugoy, a.k.a Drugmix
Last time modified: 2015.04.30 09:00

Usage: put any variable's name on a new line, select it and call this script (I prefer Ctrl+B hotkey). The initial text
	variable
will become
	OutputDebug, % "variable: '" variable "' "
The script also supports extra variables being added to the end of that line, so you can debug multiple variables at once.

Script author: Drugoy, a.k.a. Drugmix.
Contacts: idrugoy@gmail.com, drug0y@ya.ru
Thanks to: Infocatcher (http://akelpad.sourceforge.net/forum/profile.php?mode=viewprofile&u=384 ) and Instructor (http://akelpad.sourceforge.net/forum/profile.php?mode=viewprofile&u=2 ).

https://github.com/Drugoy/Autohotkey-scripts-.ahk/tree/master/MiddleClickInstantScroll/MiddleClickInstantScroll.ahk
*/
var hMainWnd = AkelPad.GetMainWnd();	// Get active window handle.
var hWndEdit = AkelPad.GetEditWnd();	// Get active edit window handle.
var selText = AkelPad.GetSelText();		// Get selection text.
var selStart = AkelPad.GetSelStart();	// Get selection first char index.
var selEnd = AkelPad.GetSelEnd();		// Get selection last char index.

if (selStart == selEnd)					// Do nothing if nothing is selected.
	WScript.Quit();

// AkelPad.MessageBox(hMainWnd, selText + ": [" + selStart + ", " + selEnd + "]", "selText: [selStart, selEnd]", 64 /*MB_ICONINFORMATION*/);	// Debugging.
var linePos = getLineByIndex(selStart);
// AkelPad.MessageBox(hMainWnd, "selStart: '" + selStart + "'\nselEnd: '" + selEnd + "'\nlinePos: '" + linePos + "'", "Debugging", 64 /*MB_ICONINFORMATION*/);	// Debugging.
var currentLineText = AkelPad.GetTextRange(linePos[0], linePos[1]);
// AkelPad.MessageBox(hMainWnd, "currentLineText: '" + currentLineText + "'", "Debugging", 64 /*MB_ICONINFORMATION*/);	// Debugging.
var text = AkelPad.GetTextRange(0, -1);			// Get text.

if ( /^\s*(?:OutputDebug|MsgBox)\s*,?\s*%\s*/i.test(currentLineText) )			// If current line contains 'OutputDebug' or 'MsgBox'.
	AkelPad.ReplaceSel('"' + selText + ": '" + '" ' + selText + ' "' + "' " + '"');
else
	AkelPad.ReplaceSel('OutputDebug, % "' + selText + ": '" + '" ' + selText + ' "' + "' " + '"');

//{ Functions by Infocatcher from 'toggleComments.js' script.
function getLineByIndex(indx, prevLineStart, ignoreEmptyLine)
{
	// Based on Instructor's code
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11382#11382
	//return getBlockByIndex(indx, indx);
	var lineStart = getOffset(hWndEdit, 18 /*AEGI_WRAPLINEBEGIN*/, indx);
	var lineEnd = getOffset(hWndEdit, 19 /*AEGI_WRAPLINEEND*/, indx);
	return [lineStart, lineEnd];
}
function getOffset(hWndEdit, nType /*AEGI_*/, nOffset)
{
	// Based on Instructor's code
	// http://akelpad.sourceforge.net/forum/viewtopic.php?p=11382#11382
	var lpIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
	if(!lpIndex)
		return 0;
	if(nOffset != -1)
		AkelPad.SendMessage(hWndEdit, 3137 /*AEM_RICHOFFSETTOINDEX*/, nOffset, lpIndex);
	AkelPad.SendMessage(hWndEdit, 3130 /*AEM_GETINDEX*/, nType, lpIndex);
	nOffset = AkelPad.SendMessage(hWndEdit, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);
	AkelPad.MemFree(lpIndex);
	return nOffset;
}
//}