// LinesSelectCopyMoveDuplicate.js - 2013-08-23 (x86/x64)
//
// Selects entire lines, copies, moves up/down or duplicates selected lines.
// If there is no selection, selects/copies/moves/duplicates current line.
// Remembers the selection and caret position relative moving text.
//
// Usage:
// Call("Scripts::Main", 1, "LinesSelectMoveDuplicate.js"[, "Action Shift"])
// Action:
// S - select entire lines
// C - copy to clipboard
// M - move
// D - duplicate
// Shift:
// -n - shift up n lines
// n  - shift down n lines
// T  - shift to top
// B  - shift to bottom
//
// Examples:
// "S 5"  - selects entire lines of 5 below
// "M -3" - moves lines of 3 above
// "D T"  - duplicates lines at top
//
// If no arguments - menu displays
// If only the first argument - input box
//
// Can assign shortcut keys, eg: Ctrl+Shift+L, Ctrl+Shift+C, Ctrl+Shift+Up, Ctrl+Shift+Down, Ctrl+Shift+Y.

var sTxtSelect    = "Select entire lines";
var sTxtCopy      = "Copy entire lines";
var sTxtMove      = "Move lines";
var sTxtDuplicate = "Duplicate lines";
var sTxtShift     = "Shift (T=top, B=bottom)";

var oSys     = AkelPad.SystemFunction();
var hEditWnd = AkelPad.GetEditWnd();
var nWordWrap;
var nBegSel;
var nEndSel;
var bCarAtEnd;
var bColSel;
var nLine1;
var nLine2;
var nLastLine;
var nOffset1;
var nOffset2;
var nOffset3;
var sAction;
var nShift;
var sArg1;
var sTxt1;
var sTxt2;

if (hEditWnd)
{
  //Get arguments
  if (WScript.Arguments.length)
    sAction = WScript.Arguments(0).toUpperCase();
  else
    sAction = GetAction();

  if ((sAction != "S") && (sAction != "C") && (sAction != "M") && (sAction != "D"))
    WScript.Quit();

  SetRedraw(hEditWnd, false);

  //Disable Word Wrap
  nWordWrap = SendMessage(hEditWnd, 3241 /*AEM_GETWORDWRAP*/, 0, 0);
  if (nWordWrap > 0)
    AkelPad.Command(4209 /*IDM_VIEW_WORDWRAP*/);

  nBegSel   = AkelPad.GetSelStart();
  nEndSel   = AkelPad.GetSelEnd();
  bCarAtEnd = (GetOffset(hEditWnd, 5 /*AEGI_CARETCHAR*/) == nEndSel);
  bColSel   = SendMessage(hEditWnd, 3127 /*AEM_GETCOLUMNSEL*/, 0, 0);
  nLine1    = SendMessage(hEditWnd, 1078 /*EM_EXLINEFROMCHAR*/, 0, nBegSel);
  nLine2    = SendMessage(hEditWnd, 1078 /*EM_EXLINEFROMCHAR*/, 0, nEndSel);
  nLastLine = SendMessage(hEditWnd, 1078 /*EM_EXLINEFROMCHAR*/, 0, -2);

  if (WScript.Arguments.length > 1)
    sArg1 = WScript.Arguments(1).toUpperCase();
  else
    sArg1 = GetShift();

  if (sArg1 == "T")
    nShift = -nLine1 - ((sAction == "D") ? 1 : 0);
  else if (sArg1 == "B")
    nShift = nLastLine - nLine2 + ((sAction == "D") ? 1 : 0);
  else
  {
    nShift = parseInt(sArg1);

    if (isFinite(nShift))
    {
      if (sAction =="D")
      {
        if ((nShift < 0) && (nShift < -nLine1 - 1))
          nShift = -nLine1 - 1;
        else if ((nShift > 0) && (nShift > nLastLine - nLine1 + 1))
          nShift = nLastLine - nLine2 + 1;
      }
      else
      {
        if ((nShift < 0) && (nShift < -nLine1))
          nShift = -nLine1;
        else if ((nShift > 0) && (nShift > nLastLine - nLine2))
          nShift = nLastLine - nLine2;
      }
    }
  }

  if (isFinite(nShift))
  {
    //Select or Copy
    if ((sAction == "S") || (sAction == "C"))
    {
      nBegSel = GetBeginLine(nLine1 + nShift);
      nEndSel = GetEndLine(nLine2 + nShift);
    }

    //Move
    else if (sAction == "M")
    {
      if (nShift && (! AkelPad.GetEditReadOnly(hEditWnd)))
      {
        if (nShift < 0)
        {
          nOffset1 = GetBeginLine(nLine1 + nShift);
          nOffset2 = GetEndLine(nLine1 - 1);
          nOffset3 = GetEndLine(nLine2);
        }
        else
        {
          nOffset1 = GetBeginLine(nLine1);
          nOffset2 = GetEndLine(nLine2);
          nOffset3 = GetEndLine(nLine2 + nShift);
        }

        sTxt1 = AkelPad.GetTextRange(nOffset1,     nOffset2);
        sTxt2 = AkelPad.GetTextRange(nOffset2 + 1, nOffset3) + "\r";
        AkelPad.SetSel(nOffset1, nOffset3);
        AkelPad.ReplaceSel(sTxt2 + sTxt1);

        if (nShift < 0)
        {
          nBegSel -= sTxt1.length + 1;
          nEndSel -= sTxt1.length + 1;
        }
        else
        {
          nBegSel += sTxt2.length;
          nEndSel += sTxt2.length;
        }
      }
    }

    //Duplicate
    else
    {
      if (nShift && (! AkelPad.GetEditReadOnly(hEditWnd)))
      {
        nOffset1 = GetBeginLine(nLine1);
        nOffset2 = GetEndLine(nLine2);
 
        if (nShift < 0)
        {
          sTxt1    = AkelPad.GetTextRange(nOffset1, nOffset2) + "\r";
          nOffset3 = GetBeginLine(nLine1 + nShift + 1);
          nBegSel += nOffset3 - nOffset1;
          nEndSel += nOffset3 - nOffset1;
        }
        else
        {
          sTxt1    = "\r" + AkelPad.GetTextRange(nOffset1, nOffset2);
          nOffset3 = GetEndLine(nLine2 + nShift - 1);
          nBegSel += nOffset3 - nOffset1 + 1;
          nEndSel += nOffset3 - nOffset1 + 1;
        }
 
        AkelPad.SetSel(nOffset3, nOffset3);
        AkelPad.ReplaceSel(sTxt1);
      }
    }

    if (sAction == "C")
      AkelPad.SetClipboardText(AkelPad.GetTextRange(nBegSel, nEndSel));
    else
    {
      if (bCarAtEnd)
        AkelPad.SetSel(nBegSel, nEndSel);
      else
        AkelPad.SetSel(nEndSel, nBegSel);

      if (sAction != "S")
        SendMessage(hEditWnd, 3128 /*AEM_UPDATESEL*/, bColSel, 0);
    }
  }

  if (nWordWrap > 0)
    AkelPad.Command(4209 /*IDM_VIEW_WORDWRAP*/);

  SetRedraw(hEditWnd, true);
}

function GetAction()
{
  var lpPoint = AkelPad.MemAlloc(8); //sizeof(POINT)
  var hMenu   = oSys.Call("User32::CreatePopupMenu");
  var hWndHid = oSys.Call("User32::CreateWindowEx" + _TCHAR, 0, "STATIC", 0, 0x50000000 /*WS_VISIBLE|WS_CHILD*/, 0, 0, 0, 0, hEditWnd, 0, AkelPad.GetInstanceDll(), 0);
  var aAction = ["", "S", "C", "M", "D"];
  var nX;
  var nY;
  var nCmd;

  SendMessage(hEditWnd, 3190 /*AEM_GETCARETPOS*/, lpPoint, 0);
  oSys.Call("User32::ClientToScreen", hEditWnd, lpPoint);

  nX = AkelPad.MemRead(lpPoint,     3 /*DT_DWORD*/);
  nY = AkelPad.MemRead(lpPoint + 4, 3 /*DT_DWORD*/) + SendMessage(hEditWnd, 3188 /*AEM_GETCHARSIZE*/, 0 /*AECS_HEIGHT*/, 0);

  oSys.Call("User32::SetFocus", hWndHid);
  oSys.Call("User32::AppendMenu" + _TCHAR, hMenu, 0 /*MF_STRING*/, 1, sTxtSelect);
  oSys.Call("User32::AppendMenu" + _TCHAR, hMenu, 0 /*MF_STRING*/, 2, sTxtCopy);
  oSys.Call("User32::AppendMenu" + _TCHAR, hMenu, 0 /*MF_STRING*/, 3, sTxtMove);
  oSys.Call("User32::AppendMenu" + _TCHAR, hMenu, 0 /*MF_STRING*/, 4, sTxtDuplicate);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0180 /*TPM_RETURNCMD|TPM_NONOTIFY*/, nX, nY, 0, hWndHid, 0);

  AkelPad.MemFree(lpPoint);
  oSys.Call("User32::DestroyMenu", hMenu);
  oSys.Call("User32::DestroyWindow", hWndHid);

  return aAction[nCmd];
}

function GetShift()
{
  var sText = "1";
  var sCaption;

  if (sAction == "S")
  {
    sCaption = sTxtSelect;
    sText    = "0";
  }
  else if (sAction == "C")
  {
    sCaption = sTxtCopy;
    sText    = "0";
  }
  else if (sAction == "M")
    sCaption = sTxtMove;
  else
    sCaption = sTxtDuplicate;

  sCaption += ": " + (nLine1 + 1) + " - " + (nLine2 + 1);

  sText = AkelPad.InputBox(hEditWnd, sCaption, sTxtShift, sText);

  if (sText)
    sText = sText.toUpperCase();

  return sText;
}

function SetRedraw(hWnd, bRedraw)
{
  SendMessage(hWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
  bRedraw && oSys.Call("User32::InvalidateRect", hWnd, 0, true);
}

function GetOffset(hWnd, nFlag)
{
  var lpIndex;
  var nOffset = -1;

  if (lpIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/))
  {
    SendMessage(hWnd, 3130 /*AEM_GETINDEX*/, nFlag, lpIndex);
    nOffset = SendMessage(hWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);
    AkelPad.MemFree(lpIndex);
  }
  return nOffset;
}

function GetBeginLine(nLine)
{
  return SendMessage(hEditWnd, 187 /*EM_LINEINDEX*/, nLine, 0);
}

function GetEndLine(nLine)
{
  return SendMessage(hEditWnd, 187 /*EM_LINEINDEX*/, nLine, 0) + SendMessage(hEditWnd, 193 /*EM_LINELENGTH*/, SendMessage(hEditWnd, 187 /*EM_LINEINDEX*/, nLine, 0), 0);
}

function SendMessage(hWnd, uMsg, wParam, lParam)
{
  return oSys.Call("User32::SendMessage" + _TCHAR, hWnd, uMsg, wParam, lParam);
}
