// OpenClosedRecentFile.js
// Author: Instructor
// Source: http://akelpad.sourceforge.net/forum/viewtopic.php?p=10810#10810
// Version: 1.0
// Description: reopens recently closed file.
// How to use: Call("Scripts::Main", 1, "OpenClosedRecentFile.js")

var hMainWnd=AkelPad.GetMainWnd();
var nMaxRecentFiles;
var lppStack;
var lpStack;
var lpRecentFile;
var pFile;

if (lppStack=AkelPad.MemAlloc(_X64?8:4 /*sizeof(RECENTFILESTACK **)*/))
{
  if (nMaxRecentFiles=AkelPad.SendMessage(hMainWnd, 1238 /*AKD_RECENTFILES*/, 1 /*RF_GET*/, lppStack))
  {
    lpStack=AkelPad.MemRead(lppStack, 2 /*DT_QWORD*/);
    lpRecentFile=AkelPad.MemRead(lpStack + 0 /*offsetof(RECENTFILESTACK, first)*/, 2 /*DT_QWORD*/)

    while (lpRecentFile)
    {
      pFile=AkelPad.MemRead(lpRecentFile + (_X64?16:8) /*offsetof(RECENTFILE, wszFile)*/, 1 /*DT_UNICODE*/);
      if (!AkelPad.SendMessage(hMainWnd, 1288 /*AKD_FRAMEFIND*/, 5 /*FWF_BYFILENAME*/, pFile))
      {
        AkelPad.OpenFile(pFile);
        break;
      }
      lpRecentFile=AkelPad.MemRead(lpRecentFile + 0 /*offsetof(RECENTFILE, next)*/, 2 /*DT_QWORD*/)
    }
  }
  AkelPad.MemFree(lppStack);
}