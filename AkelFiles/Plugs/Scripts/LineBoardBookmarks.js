/*
LineBoardBookmarks.js - ver. 2014-01-05 (x86/x64)

A few operations on the bookmarks.

Usage:
  Call("Scripts::Main", 1, "LineBoardBookmarks.js", "Argument")
  Call("Scripts::Main", 1, "LineBoardBookmarks.js") - without argument - show menu on caret position

"Argument" can be (not case sensitive):
  "XB"  - cut all bookmarked lines
  "XU"  - cut all unmarked lines
  "XBS" - cut bookmarked lines in selection
  "XUS" - cut unmarked lines in selection
  "CB"  - copy all bookmarked lines
  "CU"  - copy all unmarked lines
  "CBS" - copy bookmarked lines in selection
  "CUS" - copy unmarked lines in selection
  "OB"  - open in new tab all bookmarked lines
  "OU"  - open in new tab all unmarked lines
  "OBS" - open in new tab bookmarked lines in selection
  "OUS" - open in new tab unmarked lines in selection
  "VB"  - paste to all bookmarked lines
  "VU"  - paste to all unmarked lines
  "VBS" - paste to bookmarked lines in selection
  "VUS" - paste to unmarked lines in selection
  "RB"  - replace all bookmarked lines
  "RU"  - replace all unmarked lines
  "RBS" - replace bookmarked lines in selection
  "RUS" - replace unmarked lines in selection
  "DB"  - delete all bookmarked lines
  "DU"  - delete all unmarked lines
  "DBS" - delete bookmarked lines in selection
  "DUS" - delete unmarked lines in selection
  "S+"  - expand selection to nearest bookmarks
  "S-"  - reduce selection to nearest bookmarks
  "S+T" - expand top of selection to previous bookmark
  "S-T" - reduce top of selection to next bookmark
  "S+B" - expand bottom of selection to next bookmark
  "S-B" - reduce bottom of selection to previous bookmark
  "B"   - bookmark all lines
  "BS"  - bookmark selected lines
  "U"   - unmark all lines
  "US"  - unmark selected lines
  "I"   - inverse all bookmarks
  "IS"  - inverse bookmarks for selected lines
  "MC"  - show menu on caret position (also can be "" or "M")
  "MM"  - show menu on mouse cursor position

Remarks:
  The script performs operations on entire unwrapped lines. "Word wrap" setting is ignored.
  The script should be saved in Unicode format.
*/

var hMainWnd = AkelPad.GetMainWnd();
var hEditWnd = AkelPad.GetEditWnd();

if (! (hEditWnd && AkelPad.IsPluginRunning("LineBoard::Main")))
  WScript.Quit();

var oSys    = AkelPad.SystemFunction();
var sAction = "";
var sArg1, sArg2;

if (WScript.Arguments.length)
  sAction = WScript.Arguments(0).toUpperCase().replace(/\s+/g, "");

GetLangStrings();

if ((! sAction) || (sAction.charAt(0) == "M"))
  sAction = Menu(sAction.charAt(1) == "M");

sArg1 = sAction.charAt(1);
sArg2 = sAction.charAt(2);

switch (sAction.charAt(0))
{
  case "":
    break;
  case "X":
    CopyOpenDeleteLines(sArg1 == "U", sArg2 == "S", true, false, true);
    break;
  case "C":
    CopyOpenDeleteLines(sArg1 == "U", sArg2 == "S", true, false, false);
    break;
  case "O":
    CopyOpenDeleteLines(sArg1 == "U", sArg2 == "S", false, true, false);
    break;
  case "V":
    PasteReplaceLines(sArg1 == "U", sArg2 == "S", true);
    break;
  case "R":
    PasteReplaceLines(sArg1 == "U", sArg2 == "S", false);
    break;
  case "D":
    CopyOpenDeleteLines(sArg1 == "U", sArg2 == "S", false, false, true);
    break;
  case "S":
    SetSelection(sArg1 == "+", sArg2);
    break;
  case "B":
    BookmarkLines(sArg1 == "S");
    break;
  case "U":
    UnmarkLines(sArg1 == "S");
    break;
  case "I":
    InverseBookmarks(sArg1 == "S");
    break;
  case "L":
    AkelPad.Call("LineBoard::Settings");
    break;
  default:
    WScript.Echo(sTxtInvalidArg + sAction);
}

function CopyOpenDeleteLines(bUnmarked, bSelection, bCopy, bOpen, bDelete)
{
  if (bOpen && (! AkelPad.IsMDI())) return;

  var aLine   = GetLines(bUnmarked, bSelection);
  var lpIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  var sText   = "";
  var nOffset1, nOffset2;
  var i;

  if (bDelete)
  {
    SetRedraw(false);
    BeginUndoAction();
  }

  for (i = aLine.length - 1; i >= 0; --i)
  {
    if (i in aLine)
    {
      AkelPad.SendMessage(hEditWnd, 3131 /*AEM_GETLINEINDEX*/, AkelPad.SendMessage(hEditWnd, 3142 /*AEM_GETWRAPLINE*/, i, 0), lpIndex);
      nOffset1 = AkelPad.SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);

      AkelPad.SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, 19 /*AEGI_WRAPLINEEND*/, lpIndex);
      nOffset2 = AkelPad.SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex) + 1;

      if (bCopy || bOpen)
        sText = AkelPad.GetTextRange(nOffset1, nOffset2, 0 /*new line as is*/) + sText;

      if (bDelete)
      {
        AkelPad.SetSel(nOffset1, nOffset2);
        AkelPad.Command(4156 /*IDM_EDIT_CLEAR*/);
      }
    }
  }

  AkelPad.MemFree(lpIndex);

  if (bCopy)
    AkelPad.SetClipboardText(sText);

  if (bDelete)
  {
    SetRedraw(true);
    StopUndoAction();
  }

  if (bOpen && sText)
  {
    AkelPad.Command(4101 /*IDM_FILE_NEW*/, 1 /*to eliminate conflict with Templates plugin: lParam=true*/);
    AkelPad.ReplaceSel(sText);
  }
}

function PasteReplaceLines(bUnmarked, bSelection, bPaste)
{
  var sText;

  if (bPaste)
    sText = AkelPad.GetClipboardText();
  else
    sText = GetReplaceText(bUnmarked, bSelection);

  if (sText)
  {
    var aLine   = GetLines(bUnmarked, bSelection);
    var lpIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
    var nOffset1, nOffset2;
    var i;

    SetRedraw(false);
    BeginUndoAction();

    for (i = aLine.length - 1; i >= 0; --i)
    {
      if (i in aLine)
      {
        AkelPad.SendMessage(hEditWnd, 3131 /*AEM_GETLINEINDEX*/, AkelPad.SendMessage(hEditWnd, 3142 /*AEM_GETWRAPLINE*/, i, 0), lpIndex);
        nOffset1 = AkelPad.SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);

        AkelPad.SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, 19 /*AEGI_WRAPLINEEND*/, lpIndex);
        nOffset2 = AkelPad.SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);

        AkelPad.SetSel(nOffset1, nOffset2);
        AkelPad.ReplaceSel(sText);
      }
    }

    AkelPad.MemFree(lpIndex);
    SetRedraw(true);
    StopUndoAction();
  }
}

function GetReplaceText(bUnmarked, bSelection)
{
  var sCaption;
  var sText;

  if (bUnmarked)
  {
    if (bSelection)
      sCaption = sTxtUnLinesSel;
    else
      sCaption = sTxtUnLinesAll;
  }
  else
  {
    if (bSelection)
      sCaption = sTxtBookLinesSel;
    else
      sCaption = sTxtBookLinesAll;
  }

  if (! bSelection)
    sText = AkelPad.GetSelText(0);

  sText = AkelPad.InputBox(hMainWnd, sCaption, sTxtReplaceWith, sText);

  return sText;
}

function SetSelection(bExpand, sTopBottom)
{
  var aNearBook = GetNearBookmarks(bExpand, sTopBottom);
  var nSelStart = AkelPad.GetSelStart();
  var nSelEnd   = AkelPad.GetSelEnd();
  var lpIndex   = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);

  if (sTopBottom != "B")
  {
    if (aNearBook[0] >= 0)
    {
      AkelPad.SendMessage(hEditWnd, 3131 /*AEM_GETLINEINDEX*/, AkelPad.SendMessage(hEditWnd, 3142 /*AEM_GETWRAPLINE*/, aNearBook[0], 0), lpIndex);
      nSelStart = AkelPad.SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);
    }
  }

  if (sTopBottom != "T")
  {
    if (aNearBook[1] >= 0)
    {
      AkelPad.SendMessage(hEditWnd, 3131 /*AEM_GETLINEINDEX*/, AkelPad.SendMessage(hEditWnd, 3142 /*AEM_GETWRAPLINE*/, aNearBook[1], 0), lpIndex);
      AkelPad.SendMessage(hEditWnd, 3130 /*AEM_GETINDEX*/, 19 /*AEGI_WRAPLINEEND*/, lpIndex);
      nSelEnd = AkelPad.SendMessage(hEditWnd, 3136 /*AEM_INDEXTORICHOFFSET*/, 0, lpIndex);
    }
  }

  AkelPad.MemFree(lpIndex);

  if ((nSelStart != AkelPad.GetSelStart()) || (nSelEnd != AkelPad.GetSelEnd()))
    AkelPad.SetSel(nSelStart, nSelEnd);
}

function BookmarkLines(bSelection)
{
  var nLines = GetLinesCount();
  var sBooks = "";
  var aBook;
  var aSelLine;
  var i;

  if (bSelection)
  {
    aBook    = GetBookmarksArray();
    aSelLine = GetSelLines();

    for (i = 0; i < nLines; ++i)
    {
      if ((i >= aSelLine[0]) && (i <= aSelLine[1]))
        sBooks += i + ",";
      else
      {
        if (i in aBook)
          sBooks += i + ",";
      }
    }
  }
  else
  {
    for (i = 0; i < nLines; ++i)
      sBooks += i + ",";
  }

  SetBookmarks(sBooks);
}

function UnmarkLines(bSelection)
{
  var sBooks = "";

  if (bSelection)
  {
    var aBook    = GetBookmarksArray();
    var nLines   = GetLinesCount();
    var aSelLine = GetSelLines();
    var i;

    for (i = 0; i < nLines; ++i)
    {
      if ((i < aSelLine[0]) || (i > aSelLine[1]))
      {
        if (i in aBook)
          sBooks += i + ",";
      }
    }
  }

  SetBookmarks(sBooks);
}

function InverseBookmarks(bSelection)
{
  var nLines = GetLinesCount();
  var sBooks = "";
  var aBook  = GetBookmarksArray();
  var aSelLine;
  var i;

  if (bSelection)
  {
    aSelLine = GetSelLines();

    for (i = 0; i < nLines; ++i)
    {
      if ((i >= aSelLine[0]) && (i <= aSelLine[1]))
      {
        if (! (i in aBook))
          sBooks += i + ",";
      }
      else
      {
        if (i in aBook)
          sBooks += i + ",";
      }
    }
  }
  else
  {
    for (i = 0; i < nLines; ++i)
    {
      if (! (i in aBook))
        sBooks += i + ",";
    }
  }

  SetBookmarks(sBooks);
}

function GetLines(bUnmarked, bSelection)
{
  var aBook = GetBookmarksArray();
  var aLine = [];
  var aSelLine;
  var nLines;
  var i;

  if (bSelection)
  {
    aSelLine = GetSelLines();

    if (bUnmarked)
    {
      for (i = aSelLine[0]; i <= aSelLine[1]; ++i)
      {
        if (! (i in aBook))
          aLine[i] = 0;
      }
    }
    else
    {
      for (i = aSelLine[0]; i <= aSelLine[1]; ++i)
      {
        if (i in aBook)
          aLine[i] = 0;
      }
    }
  }
  else
  {
    if (bUnmarked)
    {
      nLines = GetLinesCount();

      for (i = 0; i < nLines; ++i)
      {
        if (! (i in aBook))
          aLine[i] = 0;
      }
    }
    else
      aLine = aBook;
  }

  return aLine;
}

function GetLinesCount()
{
  return AkelPad.SendMessage(hEditWnd, 3129 /*AEM_GETLINENUMBER*/, 11 /*AEGL_LINEUNWRAPCOUNT*/, 0);
}

function GetSelLines()
{
  return [AkelPad.SendMessage(hEditWnd, 3143 /*AEM_GETUNWRAPLINE*/, AkelPad.SendMessage(hEditWnd, 3129 /*AEM_GETLINENUMBER*/, 1 /*AEGL_FIRSTSELLINE*/, 0), 0),
          AkelPad.SendMessage(hEditWnd, 3143 /*AEM_GETUNWRAPLINE*/, AkelPad.SendMessage(hEditWnd, 3129 /*AEM_GETLINENUMBER*/, 2 /*AEGL_LASTSELLINE*/, 0), 0)];
}

function GetNearBookmarks(bExpand, sTopBottom)
{
  var aBook1   = GetBookmarksArray();
  var aBook2   = [-1, -1];
  var aSelLine = GetSelLines();
  var nLines   = GetLinesCount();
  var i;

  if (bExpand)
  {
    if (sTopBottom != "B")
    {
      for (i = aSelLine[0] - 1; i >= 0; --i)
      {
        if (i in aBook1)
        {
          aBook2[0] = i;
          break;
        }
      }
    }
    if (sTopBottom != "T")
    {
      for (i = aSelLine[1] + 1; i < nLines; ++i)
      {
        if (i in aBook1)
        {
          aBook2[1] = i;
          break;
        }
      }
    }
  }
  else
  {
    if (sTopBottom != "B")
    {
      for (i = aSelLine[0] + 1; i <= aSelLine[1]; ++i)
      {
        if (i in aBook1)
        {
          aBook2[0] = i;
          break;
        }
      }
    }
    if (sTopBottom != "T")
    {
      for (i = aSelLine[1] - 1; i >= aSelLine[0]; --i)
      {
        if (i in aBook1)
        {
          aBook2[1] = i;
          break;
        }
      }
    }
  }

  if ((aBook2[1] >= 0) && (aBook2[0] > aBook2[1]))
    aBook2 = [-1, -1];

  return aBook2;
}

function GetBookmarksArray()
{
  //returns sparse array
  var aBook1    = [];
  var aBook2    = [];
  var lpBookLen = AkelPad.MemAlloc(4 /*sizeof(int)*/);
  var lpBookStr;
  var sBooks;
  var i;

  AkelPad.CallW("LineBoard::Main", 12, hEditWnd, 0, 0, lpBookLen);
  lpBookStr = AkelPad.MemAlloc(AkelPad.MemRead(lpBookLen, 3 /*DT_DWORD*/) * 2 /*sizeof(wchar_t)*/);

  AkelPad.CallW("LineBoard::Main", 12, hEditWnd, 0, lpBookStr, 0);
  sBooks = AkelPad.MemRead(lpBookStr, 1 /*DT_UNICODE*/);

  AkelPad.MemFree(lpBookLen);
  AkelPad.MemFree(lpBookStr);

  if (sBooks)
  {
    aBook1 = sBooks.split(",");

    for (i = 0; i < aBook1.length; ++i)
      aBook2[aBook1[i]] = 0;
  }

  return aBook2;
}

function SetBookmarks(sBooks)
{
  //delete all bookmarks
  AkelPad.CallW("LineBoard::Main", 14, hEditWnd, 0);
  //set new bookmarks (works very slow, if amount > 10000)
  AkelPad.CallW("LineBoard::Main", 13, hEditWnd, 0, sBooks);
}

function SetRedraw(bRedraw)
{
   AkelPad.SendMessage(hMainWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
   AkelPad.SendMessage(hEditWnd, 11 /*WM_SETREDRAW*/, bRedraw, 0);
   if (bRedraw)
  {
    oSys.Call("User32::InvalidateRect", hMainWnd, 0, true);
     oSys.Call("User32::InvalidateRect", hEditWnd, 0, true);
  }
}

function BeginUndoAction()
{
  AkelPad.SendMessage(hEditWnd, 3080 /*AEM_STOPGROUPTYPING*/, 0, 0);
  AkelPad.SendMessage(hEditWnd, 3081 /*AEM_BEGINUNDOACTION*/, 0, 0);
}

function StopUndoAction()
{
  AkelPad.SendMessage(hEditWnd, 3082 /*AEM_ENDUNDOACTION*/, 0, 0);
  AkelPad.SendMessage(hEditWnd, 3080 /*AEM_STOPGROUPTYPING*/, 0, 0);
}

function Menu(bOnCursor)
{
  var aMenu1 = [[sTxtBookLinesAll, "B" ],
                [sTxtUnLinesAll,   "U" ],
                [""],
                [sTxtBookLinesSel, "BS"],
                [sTxtUnLinesSel,   "US"]];

  var aMenu2 = [[sTxtExpand,       "+" ],
                [sTxtExpandTop,    "+T"],
                [sTxtExpandBottom, "+B"],
                [""],
                [sTxtReduce,       "-" ],
                [sTxtReduceTop,    "-T"],
                [sTxtReduceBottom, "-B"]];

  var aMenu3 = [[sTxtAll,   "" ],
                [sTxtInSel, "S"]];

  var aMenu = [[sTxtCut,           "X", aMenu1],
               [sTxtCopy,          "C", aMenu1],
               [sTxtOpenInNT,      "O", aMenu1, IsMDI],
               [sTxtPasteTo,       "V", aMenu1, CanPaste],
               [sTxtReplace,       "R", aMenu1],
               [sTxtDelete,        "D", aMenu1],
               [""],
               [sTxtSelection,     "S", aMenu2],
               [""],
               [sTxtBookmarkLines, "B", aMenu3],
               [sTxtUnmarkLines,   "U", aMenu3],
               [sTxtInverseBooks,  "I", aMenu3],
               [""],
               [sTxtLBSettings,    "L"]];

  var sReturn = "";
  var hMenu;
  var nFlag;
  var nMenuID;
  var lpPoint;
  var nX, nY;
  var hWndHid;
  var nCmd, nCmd1, nCmd2;
  var i, n;

  for (i = 0; i < aMenu.length; ++i)
  {
    if (aMenu[i][0] && aMenu[i][2])
    {
      aMenu[i].Handle = oSys.Call("User32::CreatePopupMenu");
      for (n = 0; n < aMenu[i][2].length; ++n)
        oSys.Call("User32::AppendMenuW", aMenu[i].Handle, aMenu[i][2][n][0] ? 0 /*MF_STRING*/ : 0x0800 /*MF_SEPARATOR*/, ((i + 1) << 4) | n, aMenu[i][2][n][0]);
    }
  }

  hMenu = oSys.Call("User32::CreatePopupMenu");
  for (i = 0; i < aMenu.length; ++i)
  {
    if (aMenu[i].Handle)
    {
      nFlag = 0x10 /*MF_POPUP*/;
      if (aMenu[i][3] && (! aMenu[i][3]()))
        nFlag |= 0x01 /*MF_GRAYED*/;
      nMenuID = aMenu[i].Handle;
    }
    else if (aMenu[i][0])
    {
      nFlag   = 0 /*MF_STRING*/;
      nMenuID = (i + 1) << 4;
    }
    else
      nFlag = 0x0800 /*MF_SEPARATOR*/;

    oSys.Call("User32::AppendMenuW", hMenu, nFlag, nMenuID, aMenu[i][0]);
  }

  lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);

  if (bOnCursor)
  {
    oSys.Call("User32::GetCursorPos", lpPoint);
    nX = AkelPad.MemRead(lpPoint,     3 /*DT_DWORD*/);
    nY = AkelPad.MemRead(lpPoint + 4, 3 /*DT_DWORD*/);
  }
  else
  {
    AkelPad.SendMessage(hEditWnd, 3190 /*AEM_GETCARETPOS*/, lpPoint, 0);
    oSys.Call("User32::ClientToScreen", hEditWnd, lpPoint);
    nX = AkelPad.MemRead(lpPoint,     3 /*DT_DWORD*/);
    nY = AkelPad.MemRead(lpPoint + 4, 3 /*DT_DWORD*/) + AkelPad.SendMessage(hEditWnd, 3188 /*AEM_GETCHARSIZE*/, 0 /*AECS_HEIGHT*/, 0);
  }

  AkelPad.MemFree(lpPoint);

  hWndHid = oSys.Call("User32::CreateWindowExW", 0, "STATIC", 0, 0x50000000 /*WS_VISIBLE|WS_CHILD*/, 0, 0, 0, 0, hEditWnd, 0, AkelPad.GetInstanceDll(), 0);
  oSys.Call("User32::SetFocus", hWndHid);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0180 /*TPM_RETURNCMD|TPM_NONOTIFY*/, nX, nY, 0, hWndHid, 0);

  for (i = 0; i < aMenu.length; ++i)
    oSys.Call("User32::DestroyMenu", aMenu[i].Handle);
  oSys.Call("User32::DestroyMenu", hMenu);
  oSys.Call("User32::DestroyWindow", hWndHid);

  if (nCmd)
  {
    nCmd1   = ((nCmd >> 4) & 0xF) - 1;
    nCmd2   = nCmd & 0xF;
    sReturn = aMenu[nCmd1][1];

    if (aMenu[nCmd1][2])
      sReturn += aMenu[nCmd1][2][nCmd2][1];
  }

  return sReturn;
}

function IsMDI()
{
  if (AkelPad.IsMDI())
    return true;

  return false;
}

function CanPaste()
{
  if (AkelPad.GetClipboardText())
    return true;

  return false;
}

function GetLangStrings()
{
  if (AkelPad.GetLangId(0 /*LANGID_FULL*/) == 1045 /*Polish*/)
  {
    sTxtInvalidArg    = "Błędny argument: ";
    sTxtCut           = "Wytnij";
    sTxtCopy          = "Kopiuj";
    sTxtOpenInNT      = "Otwórz na nowej karcie";
    sTxtPasteTo       = "Wklej do";
    sTxtReplace       = "Zamień";
    sTxtDelete        = "Usuń";
    sTxtSelection     = "Zaznaczenie";
    sTxtBookmarkLines = "Wstaw zakładki";
    sTxtUnmarkLines   = "Wyczyść zakładki";
    sTxtInverseBooks  = "Odwróć zakładki";
    sTxtLBSettings    = "Ustawienia LineBoard";
    sTxtBookLinesAll  = "Wszystkie wiersze z zakładkami";
    sTxtUnLinesAll    = "Wszystkie wiersze bez zakładek";
    sTxtBookLinesSel  = "Wiersze z zakładkami w zaznaczeniu";
    sTxtUnLinesSel    = "Wiersze bez zakładek w zaznaczeniu";
    sTxtExpand        = "Rozszerz do najbliższych zakładek";
    sTxtExpandTop     = "Rozszerz na górze do poprzedniej zakładki";
    sTxtExpandBottom  = "Rozszerz na dole do następnej zakładki";
    sTxtReduce        = "Zmniejsz do najbliższych zakładek";
    sTxtReduceTop     = "Zmniejsz na górze do następnej zakładki";
    sTxtReduceBottom  = "Zmniejsz na dole do poprzedniej zakładki";
    sTxtAll           = "We wszystkich wierszach";
    sTxtInSel         = "W zaznaczeniu";
    sTxtReplaceWith   = "zamień na:";
  }
  else if (AkelPad.GetLangId(0 /*LANGID_FULL*/) == 1049 /*Russian*/)
  {
    sTxtInvalidArg    = "Invalid argument: ";
    sTxtCut           = "Cut";
    sTxtCopy          = "Copy";
    sTxtOpenInNT      = "Open in new tab";
    sTxtPasteTo       = "Paste to";
    sTxtReplace       = "Replace";
    sTxtDelete        = "Delete";
    sTxtSelection     = "Selection";
    sTxtBookmarkLines = "Bookmark lines";
    sTxtUnmarkLines   = "Unmark lines";
    sTxtInverseBooks  = "Inverse bookmarks";
    sTxtLBSettings    = "LineBoard settings";
    sTxtBookLinesAll  = "All bookmarked lines";
    sTxtUnLinesAll    = "All unmarked lines";
    sTxtBookLinesSel  = "Bookmarked lines in selection";
    sTxtUnLinesSel    = "Unmarked lines in selection";
    sTxtExpand        = "Expand to nearest bookmarks";
    sTxtExpandTop     = "Expand top to previous bookmark";
    sTxtExpandBottom  = "Expand bottom to next bookmark";
    sTxtReduce        = "Reduce to nearest bookmarks";
    sTxtReduceTop     = "Reduce top to next bookmark";
    sTxtReduceBottom  = "Reduce bottom to previous bookmark";
    sTxtAll           = "All";
    sTxtInSel         = "In selection";
    sTxtReplaceWith   = "replace with:";
  }
  else
  {
    sTxtInvalidArg    = "Invalid argument: ";
    sTxtCut           = "Cut";
    sTxtCopy          = "Copy";
    sTxtOpenInNT      = "Open in new tab";
    sTxtPasteTo       = "Paste to";
    sTxtReplace       = "Replace";
    sTxtDelete        = "Delete";
    sTxtSelection     = "Selection";
    sTxtBookmarkLines = "Bookmark lines";
    sTxtUnmarkLines   = "Unmark lines";
    sTxtInverseBooks  = "Inverse bookmarks";
    sTxtLBSettings    = "LineBoard settings";
    sTxtBookLinesAll  = "All bookmarked lines";
    sTxtUnLinesAll    = "All unmarked lines";
    sTxtBookLinesSel  = "Bookmarked lines in selection";
    sTxtUnLinesSel    = "Unmarked lines in selection";
    sTxtExpand        = "Expand to nearest bookmarks";
    sTxtExpandTop     = "Expand top to previous bookmark";
    sTxtExpandBottom  = "Expand bottom to next bookmark";
    sTxtReduce        = "Reduce to nearest bookmarks";
    sTxtReduceTop     = "Reduce top to next bookmark";
    sTxtReduceBottom  = "Reduce bottom to previous bookmark";
    sTxtAll           = "All";
    sTxtInSel         = "In selection";
    sTxtReplaceWith   = "replace with:";
  }
}