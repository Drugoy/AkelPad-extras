// GoWrapLineStart.js
// Author: Instructor
// Source: http://akelpad.sourceforge.net/forum/viewtopic.php?p=23541#23541
// Version: 2014.01.09 18:36
// Description: moves caret to the actual start of the line (even if "Menu>View>Wrap words" setting is enabled).
// How to use: Call("Scripts::Main", 1, "GoWrapLineStart.js")

var hWndEdit=AkelPad.GetEditWnd();
var hWndParent=AkelPad.GetMainWnd();
var lpIndex;

if (lpIndex=AkelPad.MemAlloc(_X64?24:12 /*sizeof(AECHARINDEX)*/))
{
	AkelPad.SendMessage(hWndEdit, 3130 /*AEM_GETINDEX*/, 5 /*AEGI_CARETCHAR*/, lpIndex);
	AkelPad.SendMessage(hWndEdit, 3130 /*AEM_GETINDEX*/, 18 /*AEGI_WRAPLINEEND*/, lpIndex);
	AkelPad.SendMessage(hWndEdit, 3124 /*AEM_EXSETSEL*/, lpIndex, lpIndex);
	AkelPad.MemFree(lpIndex);
}