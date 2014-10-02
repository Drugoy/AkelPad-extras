// TextMarker.js - ver. 2014-09-10 (x86/x64)
//
// GUI for marking specified text via Coder plugin.
//
// Usage:
//   Call("Scripts::Main", 1, "TextMarker.js")
//
// Required to include: CreateDialog_functions.js and InputBox_function.js
//
// Keyboard and mouse:
//   F1       - help for regular expressions (if "Regular expressions" is checked)
//   Ins      - new marker
//   F2       - rename
//   Del      - delete marker
//   F3       - find down
//   Shift+F3 - find up
//   Alt+,    - previous item in list
//   Alt+.    - next item in list
//   double click on list item - mark/unmark

var oSys   = AkelPad.SystemFunction();
var sClass = "AkelPad::Scripts::" + WScript.ScriptName + "::" + AkelPad.GetInstanceDll();

if (IsScriptRunning() || (! AkelPad.Include("CreateDialog_functions.js")) || (! AkelPad.Include("InputBox_function.js")) || ((! AkelPad.IsPluginRunning("Coder::HighLight")) && (AkelPad.Call("Coder::HighLight") == -1 /*UD_FAILED*/)))
  WScript.Quit();

var nDlgX = 200;
var nDlgY = 150;
var nTab  = 0;
var nMark = 0;
var aMark;

ReadIni();

var nCur = 0;
var aCur = [];
var aColor;
var hFocus;

var lpTextLV = AkelPad.MemAlloc(1024 * 2);
var lpLVITEM = AkelPad.MemAlloc(_X64 ? 72 : 60 /*sizeof(LVITEM)*/);
AkelPad.MemCopy(lpLVITEM,                      0x0001, 3 /*DT_DWORD*/); //mask=LVIF_TEXT
AkelPad.MemCopy(lpLVITEM + (_X64 ? 24 : 20), lpTextLV, 2 /*DT_QWORD*/); //pszText
AkelPad.MemCopy(lpLVITEM + (_X64 ? 32 : 24),     1024, 3 /*DT_DWORD*/); //cchTextMax

var IDTABTC     = 2000;
var IDMARKLV    = 2001;
var IDTCOLORS   = 2002;
var IDTCOLORB   = 2003;
var IDTCOLORE   = 2004;
var IDTCOLORCB  = 2005;
var IDBCOLORB   = 2006;
var IDBCOLORS   = 2007;
var IDBCOLORE   = 2008;
var IDBCOLORCB  = 2009;
var IDFONTS     = 2010;
var IDFONTCB    = 2011;
var IDTEXTS     = 2012;
var IDTEXTE     = 2013;
var IDMATCHCASE = 2014;
var IDREGEXP    = 2015;
var IDHELP      = 2016;
var IDNEW       = 2017;
var IDRENAME    = 2018;
var IDDELETE    = 2019;
var IDMARK      = 2020;
var IDUNMARK    = 2021;
var IDUNMARKALL = 2022;
var IDFINDDOWN  = 2023;
var IDFINDUP    = 2024;
var aDlg        = [];

aDlg.Class    = sClass;
aDlg.Title    = "TextMarker";
aDlg.Style    = WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_MINIMIZEBOX;
aDlg.X        = nDlgX;
aDlg.Y        = nDlgY;
aDlg.W        = 575;
aDlg.H        = 348;
aDlg.Parent   = AkelPad.GetMainWnd();
aDlg.Callback = DialogCallback;
aDlg.CtlFirst = 2000;
aDlg.CtlStyle = WS_VISIBLE;
aDlg.CtlFont  = oSys.Call("Gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
aDlg.SizeClt  = true;

aDlg[IDTABTC]     = {X:  10, Y:  10, W: 555, H:  20, Class: "SysTabControl32",                      Style: TCS_FIXEDWIDTH|TCS_FOCUSNEVER};
aDlg[IDMARKLV]    = {X:  10, Y:  30, W: 555, H: 150, Class: "SysListView32",                        Style: WS_TABSTOP|WS_BORDER|LVS_NOSORTHEADER|LVS_SHOWSELALWAYS|LVS_SINGLESEL|LVS_REPORT};
aDlg[IDTCOLORS]   = {X:  10, Y: 190, W:  90, H:  13, Class: "STATIC", Title: "Text color:"};
aDlg[IDTCOLORB]   = {X:  10, Y: 205, W:  21, H:  21, Class: "BUTTON",                               Style: WS_TABSTOP|WS_BORDER|BS_OWNERDRAW};
aDlg[IDTCOLORE]   = {X:  32, Y: 205, W:  67, H:  21, Class: "AkelEditW",                            Style: WS_TABSTOP|WS_BORDER};
aDlg[IDTCOLORCB]  = {X: 100, Y: 205, W: 130, H: 300, Class: "COMBOBOX",                             Style: WS_TABSTOP|WS_VSCROLL|CBS_DROPDOWNLIST};
aDlg[IDBCOLORS]   = {X: 245, Y: 190, W:  90, H:  13, Class: "STATIC", Title: "Background color:"};
aDlg[IDBCOLORB]   = {X: 245, Y: 205, W:  21, H:  21, Class: "BUTTON",                               Style: WS_TABSTOP|WS_BORDER|BS_OWNERDRAW};
aDlg[IDBCOLORE]   = {X: 267, Y: 205, W:  67, H:  21, Class: "AkelEditW",                            Style: WS_TABSTOP|WS_BORDER};
aDlg[IDBCOLORCB]  = {X: 335, Y: 205, W: 130, H: 300, Class: "COMBOBOX",                             Style: WS_TABSTOP|WS_VSCROLL|CBS_DROPDOWNLIST};
aDlg[IDFONTS]     = {X: 480, Y: 190, W:  85, H:  13, Class: "STATIC", Title: "Font style:"};
aDlg[IDFONTCB]    = {X: 480, Y: 205, W:  85, H: 100, Class: "COMBOBOX",                             Style: WS_TABSTOP|CBS_DROPDOWNLIST};
aDlg[IDTEXTS]     = {X:  10, Y: 235, W:  60, H:  13, Class: "STATIC", Title: "Text:"};
aDlg[IDTEXTE]     = {X:  10, Y: 250, W: 555, H:  35, Class: "AkelEditW",                            Style: WS_TABSTOP|WS_BORDER|WS_VSCROLL|ES_MULTILINE};
aDlg[IDMATCHCASE] = {X:  10, Y: 290, W:  90, H:  16, Class: "BUTTON", Title: "Case sensitive",      Style: WS_TABSTOP|BS_AUTOCHECKBOX};
aDlg[IDREGEXP]    = {X: 130, Y: 290, W: 115, H:  16, Class: "BUTTON", Title: "Regular expressions", Style: WS_TABSTOP|BS_AUTOCHECKBOX};
aDlg[IDHELP]      = {X: 245, Y: 290, W:  16, H:  16, Class: "BUTTON", Title: "?",                   Style: BS_PUSHBUTTON};
aDlg[IDNEW]       = {X:  10, Y: 315, W:  65, H:  23, Class: "BUTTON", Title: "&New",                Style: BS_PUSHBUTTON};
aDlg[IDRENAME]    = {X:  80, Y: 315, W:  65, H:  23, Class: "BUTTON", Title: "&Rename",             Style: BS_PUSHBUTTON};
aDlg[IDDELETE]    = {X: 150, Y: 315, W:  65, H:  23, Class: "BUTTON", Title: "&Delete",             Style: BS_PUSHBUTTON};
aDlg[IDMARK]      = {X: 220, Y: 315, W:  65, H:  23, Class: "BUTTON", Title: "&Mark",               Style: BS_PUSHBUTTON};
aDlg[IDUNMARK]    = {X: 290, Y: 315, W:  65, H:  23, Class: "BUTTON", Title: "&Unmark",             Style: BS_PUSHBUTTON};
aDlg[IDUNMARKALL] = {X: 360, Y: 315, W:  65, H:  23, Class: "BUTTON", Title: "Unmark &all",         Style: BS_PUSHBUTTON};
aDlg[IDFINDDOWN]  = {X: 430, Y: 315, W:  65, H:  23, Class: "BUTTON", Title: "Find down",           Style: BS_PUSHBUTTON};
aDlg[IDFINDUP]    = {X: 500, Y: 315, W:  65, H:  23, Class: "BUTTON", Title: "Find up",             Style: BS_PUSHBUTTON};

AkelPad.ScriptNoMutex();
AkelPad.WindowRegisterClass(sClass);

CreateDialogWindow(aDlg, 1);

AkelPad.WindowGetMessage();
AkelPad.WindowUnregisterClass(sClass);

AkelPad.MemFree(lpTextLV);
AkelPad.MemFree(lpLVITEM);

function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == 1 /*WM_CREATE*/)
  {
    CreateDialogWindow(aDlg, 2, hWnd);
    InitDialog();
  }

  else if ((uMsg == 6 /*WM_ACTIVATE*/) && (! wParam))
    hFocus = oSys.Call("User32::GetFocus");

  else if (uMsg == 7 /*WM_SETFOCUS*/)
  {
    oSys.Call("User32::SetFocus", hFocus);
    GetCurMarksArray();
    if (nTab == 0)
      SetCurMarksID();
    else
    {
      FillLV();
      GetCurSelLV();
    }
    EnableWindows();
  }

  else if (uMsg == 43 /*WM_DRAWITEM*/)
  {
    if ((wParam == IDTCOLORB) || (wParam == IDBCOLORB))
    {
      DrawColorButton(wParam, lParam);
      return 1;
    }
  }

  else if (uMsg == 256 /*WM_KEYDOWN*/)
  {
    hFocus = oSys.Call("User32::GetFocus");

    if ((wParam == 0x09 /*VK_TAB*/) && Ctrl())
      PostMessage(aDlg[IDTABTC].HWND, 4912 /*TCM_SETCURFOCUS*/, nTab ? 0 : 1, 0);
    else if (wParam == 0x0D /*VK_RETURN*/)
    {
      if (hFocus == aDlg[IDTCOLORB].HWND)
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDTCOLORB, aDlg[IDTCOLORB].HWND);
      else if (hFocus == aDlg[IDBCOLORB].HWND)
        PostMessage(hWnd, 273 /*WM_COMMAND*/, IDBCOLORB, aDlg[IDBCOLORB].HWND);
    }
    else if ((wParam == 0x70 /*VK_F1*/) && oSys.Call("User32::IsWindowVisible", aDlg[IDHELP].HWND))
      RegExpHelp();
    else if ((wParam == 0x71 /*VK_F2*/) && oSys.Call("User32::IsWindowEnabled", aDlg[IDRENAME].HWND))
      NewOrRenameMarker(1);
    else if ((wParam == 0x72 /*VK_F3*/) && oSys.Call("User32::IsWindowEnabled", aDlg[IDFINDDOWN].HWND))
      FindMark(Shift());
    else if ((hFocus != aDlg[IDTCOLORE].HWND) && (hFocus != aDlg[IDBCOLORE].HWND) && (hFocus != aDlg[IDTEXTE].HWND))
    {
      if ((wParam == 0x2D /*VK_INS*/) && oSys.Call("User32::IsWindowEnabled", aDlg[IDNEW].HWND))
        NewOrRenameMarker(0);
      else if ((wParam == 0x02E /*VK_DELETE*/) && oSys.Call("User32::IsWindowEnabled", aDlg[IDDELETE].HWND))
        DeleteMarker();
    }
  }

  else if (uMsg == 260 /*WM_SYSKEYDOWN*/)
  {
    if (wParam == 0xBC /*VK_OEM_COMMA*/)
    {
      if ((nTab == 0) && aMark.length && (nMark > 0))
        SetCurSelLV(--nMark);
      else if ((nTab == 1) && aCur.length && (nCur > 0))
        SetCurSelLV(--nCur);
    }
    else if (wParam == 0xBE /*VK_OEM_PERIOD*/)
    {
      if ((nTab == 0) && aMark.length && (nMark < aMark.length - 1))
        SetCurSelLV(++nMark);
      else if ((nTab == 1) && aCur.length && (nCur < aCur.length - 1))
        SetCurSelLV(++nCur);
    }
  }

  else if (uMsg == 123 /*WM_CONTEXTMENU*/)
  {
    if ((wParam == aDlg[IDTCOLORE].HWND) || (wParam == aDlg[IDBCOLORE].HWND) || (wParam == aDlg[IDTEXTE].HWND))
      EditMenu(wParam, LoWord(lParam), HiWord(lParam));
  }

  else if (uMsg == 0x004E /*WM_NOTIFY*/)
  {
    if (wParam == IDTABTC)
    {
      if (AkelPad.MemRead(lParam + (_X64 ? 16 : 8), 3 /*DT_DWORD*/) == -551 /*TCN_SELCHANGE*/)
      {
        nTab = SendMessage(aDlg[IDTABTC].HWND, 4875 /*TCM_GETCURSEL*/, 0, 0);
        oSys.Call("User32::SetFocus", aDlg[IDMARKLV].HWND);
        FillLV();
        GetCurSelLV();
        EnableWindows();
      }
    }
    else if (wParam == IDMARKLV)
    {
      switch (AkelPad.MemRead(lParam + (_X64 ? 16 : 8), 3 /*DT_DWORD*/))
      {
        case -101 : //LVN_ITEMCHANGED
          if (AkelPad.MemRead(lParam + (_X64 ? 32 : 20) /*NMLISTVIEW.uNewState*/, 3 /*DT_DWORD*/) & 0x2 /*LVIS_SELECTED*/)
          {
            GetCurSelLV();
            EnableWindows();
          }
          break;
        case -3 : //NM_DBLCLK
          if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, 3 /*DT_DWORD*/) == -1)
            SetCurSelLV(SendMessage(aDlg[IDMARKLV].HWND, 0x100C /*LVM_GETNEXTITEM*/, -1, 0x1 /*LVNI_FOCUSED*/));
          else
          {
            if (oSys.Call("User32::IsWindowEnabled", aDlg[IDMARK].HWND))
              Mark();
            else if (oSys.Call("User32::IsWindowEnabled", aDlg[IDUNMARK].HWND))
              UnMark();
          }
          break;
        case -2 : //NM_CLICK
        case -5 : //NM_RCLICK
        case -6 : //NM_RDBLCLK
          if (AkelPad.MemRead(lParam + (_X64 ? 24 : 12) /*NMITEMACTIVATE.iItem*/, 3 /*DT_DWORD*/) == -1)
            SetCurSelLV(SendMessage(aDlg[IDMARKLV].HWND, 0x100C /*LVM_GETNEXTITEM*/, -1, 0x1 /*LVNI_FOCUSED*/));
          break;
      }
    }
  }

  else if (uMsg == 273 /*WM_COMMAND*/)
  {
    var nLowParam = LoWord(wParam);
    var nHiwParam = HiWord(wParam);

    if ((nLowParam == IDTCOLORB))
      ChooseColor(aDlg[IDTCOLORE].HWND, aMark[nMark][1]);

    else if (nLowParam == IDTCOLORE)
    {
      if (nHiwParam == 0x0300 /*EN_CHANGE*/)
        SetColorbyHex(1);
    }

    else if (nLowParam == IDTCOLORCB)
    {
      if ((nHiwParam == 1 /*CBN_SELCHANGE*/) || (nHiwParam == 8 /*CBN_CLOSEUP*/))
        SetColorbyName(lParam, aDlg[IDTCOLORE].HWND);
    }

    else if (nLowParam == IDBCOLORB)
      ChooseColor(aDlg[IDBCOLORE].HWND, aMark[nMark][2]);

    else if (nLowParam == IDBCOLORE)
    {
      if (nHiwParam == 0x0300 /*EN_CHANGE*/)
        SetColorbyHex(0);
    }

    else if (nLowParam == IDBCOLORCB)
    {
      if ((nHiwParam == 1 /*CBN_SELCHANGE*/) || (nHiwParam == 8 /*CBN_CLOSEUP*/))
        SetColorbyName(lParam, aDlg[IDBCOLORE].HWND);
    }

    else if (nLowParam == IDFONTCB)
    {
      if ((nHiwParam == 1 /*CBN_SELCHANGE*/) || (nHiwParam == 8 /*CBN_CLOSEUP*/))
      {
        aMark[nMark][3] = SendMessage(aDlg[IDFONTCB].HWND, 327 /*CB_GETCURSEL*/, 0, 0);
        GetCurMarkID(nMark);
        SetItemTextLV(nMark, 3, aMark[nMark][3].toString());
        SetItemTextLV(nMark, 7, aMark[nMark][7]);
        EnableWindows();
      }
    }

    else if (nLowParam == IDTEXTE)
    {
      if ((nHiwParam == 0x0300 /*EN_CHANGE*/) && (nTab == 0) && aMark.length)
      {
        aMark[nMark][4] = GetTextAE(lParam);
        GetCurMarkID(nMark);
        SetItemTextLV(nMark, 4, aMark[nMark][4]);
        SetItemTextLV(nMark, 7, aMark[nMark][7]);
        EnableWindows();
      }
    }

    else if ((nLowParam == IDMATCHCASE) || (nLowParam == IDREGEXP))
    {
      aMark[nMark][nLowParam - IDMATCHCASE + 5] = SendMessage(aDlg[nLowParam].HWND, 240 /*BM_GETCHECK*/, 0, 0);
      GetCurMarkID(nMark);
      SetItemTextLV(nMark, nLowParam - IDMATCHCASE + 5, aMark[nMark][nLowParam - IDMATCHCASE + 5].toString());
      SetItemTextLV(nMark, 7, aMark[nMark][7]);
      EnableWindows();
    }

    else if (nLowParam == IDHELP)
      RegExpHelp();

    else if ((nLowParam == IDNEW) || (nLowParam == IDRENAME))
      NewOrRenameMarker(nLowParam == IDRENAME);

    else if (nLowParam == IDDELETE)
      DeleteMarker();

    else if (nLowParam == IDMARK)
      Mark();

    else if ((nLowParam == IDUNMARK) || (nLowParam == IDUNMARKALL))
      UnMark(nLowParam == IDUNMARKALL);

    else if ((nLowParam == IDFINDDOWN) || (nLowParam == IDFINDUP))
      FindMark(nLowParam == IDFINDUP);

    else if (nLowParam == 2 /*IDCANCEL*/)
      PostMessage(hWnd, 16 /*WM_CLOSE*/, 0, 0);
  }

  else if (uMsg == 16 /*WM_CLOSE*/)
  {
    WriteIni();
    AkelPad.WindowUnsubClass(aDlg[IDTCOLORE].HWND);
    AkelPad.WindowUnsubClass(aDlg[IDBCOLORE].HWND);
    AkelPad.WindowUnsubClass(aDlg[IDTEXTE].HWND);
    oSys.Call("User32::DestroyWindow", hWnd);
  }

  else if (uMsg == 2 /*WM_DESTROY*/)
    oSys.Call("User32::PostQuitMessage", 0);

  return 0;
}

function InitDialog()
{
  var lpRect   = AkelPad.MemAlloc(16 /*sizeof(RECT)*/);
  var lpText   = AkelPad.MemAlloc(32);
  var lpTCITEM = AkelPad.MemAlloc(_X64 ? 40 : 28 /*sizeof(TCITEM)*/);
  var i;

  //AkelEdit
  AkelPad.MemCopy(lpRect,     3, 3 /*DT_DWORD*/);
  AkelPad.MemCopy(lpRect + 4, 3, 3 /*DT_DWORD*/);

  SendMessage(aDlg[IDTCOLORE].HWND, 8 /*WM_KILLFOCUS*/, 0, 0);
  SendMessage(aDlg[IDBCOLORE].HWND, 8 /*WM_KILLFOCUS*/, 0, 0);
  SendMessage(aDlg[IDTEXTE].HWND,   8 /*WM_KILLFOCUS*/, 0, 0);

  SendMessage(aDlg[IDTCOLORE].HWND, 1093 /*EM_SETEVENTMASK*/, 0, 0x1 /*ENM_CHANGE*/);
  SendMessage(aDlg[IDBCOLORE].HWND, 1093 /*EM_SETEVENTMASK*/, 0, 0x1 /*ENM_CHANGE*/);
  SendMessage(aDlg[IDTEXTE].HWND,   1093 /*EM_SETEVENTMASK*/, 0, 0x1 /*ENM_CHANGE*/);

  SendMessage(aDlg[IDTCOLORE].HWND, 197 /*EM_SETLIMITTEXT*/, 7, 0);
  SendMessage(aDlg[IDBCOLORE].HWND, 197 /*EM_SETLIMITTEXT*/, 7, 0);
  SendMessage(aDlg[IDTEXTE].HWND,   197 /*EM_SETLIMITTEXT*/, 1023, 0);

  SendMessage(aDlg[IDTCOLORE].HWND, 3178 /*AEM_SETRECT*/, 0x03 /*AERC_MARGINS|AERC_UPDATE*/, lpRect);
  SendMessage(aDlg[IDBCOLORE].HWND, 3178 /*AEM_SETRECT*/, 0x03 /*AERC_MARGINS|AERC_UPDATE*/, lpRect);
  SendMessage(aDlg[IDTEXTE].HWND,   3178 /*AEM_SETRECT*/, 0x03 /*AERC_MARGINS|AERC_UPDATE*/, lpRect);

  SendMessage(aDlg[IDTEXTE].HWND, 3242 /*AEM_SETWORDWRAP*/, 2 /*AEWW_SYMBOL*/, 0);

  aDlg[IDTCOLORE].SubClass = AkelPad.WindowSubClass(aDlg[IDTCOLORE].HWND, EditCallback, 135 /*WM_GETDLGCODE*/, 256 /*WM_KEYDOWN*/);
  aDlg[IDBCOLORE].SubClass = AkelPad.WindowSubClass(aDlg[IDBCOLORE].HWND, EditCallback, 135 /*WM_GETDLGCODE*/, 256 /*WM_KEYDOWN*/);
  aDlg[IDTEXTE].SubClass   = AkelPad.WindowSubClass(aDlg[IDTEXTE].HWND,   EditCallback, 135 /*WM_GETDLGCODE*/, 256 /*WM_KEYDOWN*/);

  //Combobox Color
  for (i = 0; i < aColor.length; ++i)
  {
    SendMessage(aDlg[IDTCOLORCB].HWND, 323 /*CB_ADDSTRING*/, 0, aColor[i][0]);
    SendMessage(aDlg[IDBCOLORCB].HWND, 323 /*CB_ADDSTRING*/, 0, aColor[i][0]);
  }

  //Combobox Font
  SendMessage(aDlg[IDFONTCB].HWND, 323 /*CB_ADDSTRING*/, 0, "0 - ignored");
  SendMessage(aDlg[IDFONTCB].HWND, 323 /*CB_ADDSTRING*/, 0, "1 - normal");
  SendMessage(aDlg[IDFONTCB].HWND, 323 /*CB_ADDSTRING*/, 0, "2 - bold");
  SendMessage(aDlg[IDFONTCB].HWND, 323 /*CB_ADDSTRING*/, 0, "3 - italic");
  SendMessage(aDlg[IDFONTCB].HWND, 323 /*CB_ADDSTRING*/, 0, "4 - bold italic");

  //Tab
  AkelPad.MemCopy(lpTCITEM, 1 /*TCIF_TEXT*/, 3 /*DT_DWORD*/); //mask
  AkelPad.MemCopy(lpTCITEM + (_X64 ? 16 : 12), lpText, 2 /*DT_QWORD*/); //pszText

  AkelPad.MemCopy(lpText, "Markers", 1 /*DT_UNICODE*/);
  SendMessage(aDlg[IDTABTC].HWND, 4926 /*TCM_INSERTITEMW*/, 0, lpTCITEM);
  AkelPad.MemCopy(lpText, "Current marks", 1 /*DT_UNICODE*/);
  SendMessage(aDlg[IDTABTC].HWND, 4926 /*TCM_INSERTITEMW*/, 1, lpTCITEM);

  SendMessage(aDlg[IDTABTC].HWND, 4905 /*TCM_SETITEMSIZE*/, 0, MkLong(Scale.X(90), Scale.Y(20)));
  SendMessage(aDlg[IDTABTC].HWND, 4912 /*TCM_SETCURFOCUS*/, nTab, 0);

  //ListView
  SendMessage(aDlg[IDMARKLV].HWND, 0x1036 /*LVM_SETEXTENDEDLISTVIEWSTYLE*/, 0 , 0x0021 /*LVS_EX_FULLROWSELECT|LVS_EX_GRIDLINES*/);
  if (nTab == 0)
    FillLV();

  hFocus = aDlg[IDMARKLV].HWND;

  AkelPad.MemFree(lpRect);
  AkelPad.MemFree(lpText);
  AkelPad.MemFree(lpTCITEM);
}

function EditCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == 135 /*WM_GETDLGCODE*/)
    return 0x2; //DLGC_WANTTAB

  if (uMsg == 256 /*WM_KEYDOWN*/)
  {
    if (wParam == 0x09 /*VK_TAB*/)
      AkelPad.WindowNoNextProc(aDlg[oSys.Call("User32::GetDlgCtrlID", hWnd)].SubClass);
    else if ((wParam == 0x43 /*C key*/) && Ctrl() && Shift())
    {
      InsertToAP(hWnd);
      AkelPad.WindowNoNextProc(aDlg[oSys.Call("User32::GetDlgCtrlID", hWnd)].SubClass);
    }
    else if ((wParam == 0x56 /*V key*/) && Ctrl() && Shift())
    {
      PasteFromAP(hWnd);
      AkelPad.WindowNoNextProc(aDlg[oSys.Call("User32::GetDlgCtrlID", hWnd)].SubClass);
    }
  }

  return 0;
}

function LoWord(nDWORD)
{
  return nDWORD & 0xFFFF;
}

function HiWord(nDWORD)
{
  return (nDWORD >> 16) & 0xFFFF;
}

function MkLong(nLoWord, nHiWord)
{
  return (nLoWord & 0xFFFF) | (nHiWord << 16);
}

function Ctrl()
{
  return oSys.Call("User32::GetKeyState", 0x11 /*VK_CONTROL*/) & 0x8000;
}

function Shift()
{
  return oSys.Call("User32::GetKeyState", 0x10 /*VK_SHIFT*/) & 0x8000;
}

function SendMessage(hWnd, uMsg, wParam, lParam)
{
  return oSys.Call("User32::SendMessageW", hWnd, uMsg, wParam, lParam);
}

function PostMessage(hWnd, uMsg, wParam, lParam)
{
  return oSys.Call("User32::PostMessageW", hWnd, uMsg, wParam, lParam);
}

function MessageBox(hWndOwn, sText)
{
  AkelPad.MessageBox(hWndOwn, sText, aDlg.Title, 0x30 /*MB_ICONWARNING*/);
}

function EnableWindows()
{
  var hEditWnd = AkelPad.GetEditWnd();
  var i;

  oSys.Call("User32::EnableWindow", aDlg[IDTCOLORB].HWND,   (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDTCOLORE].HWND,   ((nTab == 0) && aMark.length) || ((nTab == 1) && aCur.length));
  oSys.Call("User32::EnableWindow", aDlg[IDTCOLORCB].HWND,  (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDBCOLORB].HWND,   (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDBCOLORE].HWND,   ((nTab == 0) && aMark.length) || ((nTab == 1) && aCur.length));
  oSys.Call("User32::EnableWindow", aDlg[IDBCOLORCB].HWND,  (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDFONTCB].HWND,    (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDTEXTE].HWND,     ((nTab == 0) && aMark.length) || ((nTab == 1) && aCur.length));
  oSys.Call("User32::EnableWindow", aDlg[IDMATCHCASE].HWND, (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDREGEXP].HWND,    (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDNEW].HWND,       (nTab == 0));
  oSys.Call("User32::EnableWindow", aDlg[IDRENAME].HWND,    (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDDELETE].HWND,    (nTab == 0) && aMark.length);
  oSys.Call("User32::EnableWindow", aDlg[IDMARK].HWND,      hEditWnd && (nTab == 0) && aMark.length && aMark[nMark][1].length && aMark[nMark][2].length && aMark[nMark][4].length && (! aMark[nMark][7]));
  oSys.Call("User32::EnableWindow", aDlg[IDUNMARK].HWND,    hEditWnd && (((nTab == 0) && aMark.length && aMark[nMark][7]) || ((nTab == 1) && aCur.length)));
  oSys.Call("User32::EnableWindow", aDlg[IDUNMARKALL].HWND, hEditWnd && aCur.length);
  oSys.Call("User32::EnableWindow", aDlg[IDFINDDOWN].HWND,  hEditWnd && (((nTab == 0) && aMark.length && aMark[nMark][7]) || ((nTab == 1) && aCur.length && (aCur[nCur][0] != "-2"))));
  oSys.Call("User32::EnableWindow", aDlg[IDFINDUP].HWND,    hEditWnd && (((nTab == 0) && aMark.length && aMark[nMark][7]) || ((nTab == 1) && aCur.length && (aCur[nCur][0] != "-2"))));

  oSys.Call("User32::ShowWindow", aDlg[IDHELP].HWND, (nTab == 0) && aMark.length && aMark[nMark][6]);

  SendMessage(aDlg[IDTCOLORE].HWND, 207 /*EM_SETREADONLY*/, nTab, 0);
  SendMessage(aDlg[IDBCOLORE].HWND, 207 /*EM_SETREADONLY*/, nTab, 0);
  SendMessage(aDlg[IDTEXTE].HWND,   207 /*EM_SETREADONLY*/, nTab, 0);
  SendMessage(aDlg[IDTCOLORE].HWND, 1091 /*EM_SETBKGNDCOLOR*/, ! nTab, oSys.Call("User32::GetSysColor", 15 /*COLOR_BTNFACE*/)); 
  SendMessage(aDlg[IDBCOLORE].HWND, 1091 /*EM_SETBKGNDCOLOR*/, ! nTab, oSys.Call("User32::GetSysColor", 15 /*COLOR_BTNFACE*/)); 
  SendMessage(aDlg[IDTEXTE].HWND,   1091 /*EM_SETBKGNDCOLOR*/, ! nTab, oSys.Call("User32::GetSysColor", 15 /*COLOR_BTNFACE*/)); 

  if (! oSys.Call("User32::IsWindowEnabled", oSys.Call("User32::GetFocus")))
    oSys.Call("User32::SetFocus", aDlg[IDMARKLV].HWND);

  for (i = IDHELP; i <= IDFINDUP; ++i)
  {
    if (oSys.Call("User32::GetFocus") != aDlg[i].HWND)
      SendMessage(aDlg[i].HWND, 0xF4 /*BM_SETSTYLE*/, BS_PUSHBUTTON, 1);
  }
}

function DrawColorButton(nID, lpDRAWITEMSTRUCT)
{
  var hDC    = AkelPad.MemRead(lpDRAWITEMSTRUCT + (_X64 ? 32 : 24) /*offsetof(DRAWITEMSTRUCT, hDC)*/, 2 /*DT_QWORD*/);
  var lpRect = lpDRAWITEMSTRUCT + (_X64 ? 40 : 28) /*offsetof(DRAWITEMSTRUCT, rcItem)*/;
  var sHex   = "";
  var hBrush;

  if ((nTab == 0) && aMark.length)
    sHex = (nID == IDTCOLORB) ? aMark[nMark][1] : aMark[nMark][2];
  else if ((nTab == 1) && aCur.length)
    sHex = (nID == IDTCOLORB) ? aCur[nCur][1] : aCur[nCur][2];

  hBrush = oSys.Call("Gdi32::CreateSolidBrush", HexToRGB(sHex));

  oSys.Call("User32::FillRect", hDC, lpRect, hBrush);

  if (oSys.Call("User32::GetFocus") == aDlg[nID].HWND)
    oSys.Call("User32::DrawFocusRect", hDC, lpRect);

  oSys.Call("Gdi32::DeleteObject", hBrush);
}

function GetTextAE(hWnd, bSel)
{
  AkelPad.SetEditWnd(hWnd);
  var sText = bSel ? AkelPad.GetSelText(): AkelPad.GetTextRange(0, -1);
  AkelPad.SetEditWnd(0);
  return sText;
}

function GetCurSelLV()
{
  var nItem = SendMessage(aDlg[IDMARKLV].HWND, 0x100C /*LVM_GETNEXTITEM*/, -1, 0x2 /*LVNI_SELECTED*/);

  if (nItem < 0)
  {
    oSys.Call("User32::SetWindowTextW", aDlg[IDTCOLORE].HWND, "");
    oSys.Call("User32::SetWindowTextW", aDlg[IDBCOLORE].HWND, "");
    oSys.Call("User32::SetWindowTextW", aDlg[IDTEXTE].HWND,   "");
    SendMessage(aDlg[IDMATCHCASE].HWND, 241 /*BM_SETCHECK*/, 0, 0);
    SendMessage(aDlg[IDREGEXP].HWND,    241 /*BM_SETCHECK*/, 0, 0);
    SendMessage(aDlg[IDFONTCB].HWND, 334 /*CB_SETCURSEL*/, -1, 0);
  }
  else if (nTab == 0)
  {
    nMark = nItem;
    oSys.Call("User32::SetWindowTextW", aDlg[IDTCOLORE].HWND, aMark[nMark][1]);
    oSys.Call("User32::SetWindowTextW", aDlg[IDBCOLORE].HWND, aMark[nMark][2]);
    oSys.Call("User32::SetWindowTextW", aDlg[IDTEXTE].HWND,   aMark[nMark][4]);
    SendMessage(aDlg[IDMATCHCASE].HWND, 241 /*BM_SETCHECK*/, aMark[nMark][5], 0);
    SendMessage(aDlg[IDREGEXP].HWND,    241 /*BM_SETCHECK*/, aMark[nMark][6], 0);
    SendMessage(aDlg[IDFONTCB].HWND, 334 /*CB_SETCURSEL*/, aMark[nMark][3], 0);
  }
  else
  {
    nCur = nItem;
    oSys.Call("User32::SetWindowTextW", aDlg[IDTCOLORE].HWND, aCur[nCur][1]);
    oSys.Call("User32::SetWindowTextW", aDlg[IDBCOLORE].HWND, aCur[nCur][2]);
    oSys.Call("User32::SetWindowTextW", aDlg[IDTEXTE].HWND,   aCur[nCur][4]);
    SendMessage(aDlg[IDMATCHCASE].HWND, 241 /*BM_SETCHECK*/, aCur[nCur][5], 0);
    SendMessage(aDlg[IDREGEXP].HWND,    241 /*BM_SETCHECK*/, aCur[nCur][6], 0);
    SendMessage(aDlg[IDFONTCB].HWND, 334 /*CB_SETCURSEL*/, aCur[nCur][3], 0);
  }

  SendMessage(aDlg[IDTCOLORE].HWND, 177 /*EM_SETSEL*/, 0, -1);
  SendMessage(aDlg[IDBCOLORE].HWND, 177 /*EM_SETSEL*/, 0, -1);
  SendMessage(aDlg[IDTEXTE].HWND,   177 /*EM_SETSEL*/, 0, -1);
}

function SetCurSelLV(nItem)
{
  AkelPad.MemCopy(lpLVITEM + 12, 0x3, 3 /*DT_DWORD*/); //state=LVIS_SELECTED|LVIS_FOCUSED
  AkelPad.MemCopy(lpLVITEM + 16, 0x3, 3 /*DT_DWORD*/); //stateMask
  SendMessage(aDlg[IDMARKLV].HWND, 0x102B /*LVM_SETITEMSTATE*/, nItem, lpLVITEM);
  SendMessage(aDlg[IDMARKLV].HWND, 0x1013 /*LVM_ENSUREVISIBLE*/, nItem, false);
}

function SetItemTextLV(nItem, nSubItem, sText)
{
  AkelPad.MemCopy(lpTextLV, sText + "", 1 /*DT_UNICODE*/);
  AkelPad.MemCopy(lpLVITEM + 8, nSubItem, 3 /*DT_DWORD*/); //iSubItem
  SendMessage(aDlg[IDMARKLV].HWND, 0x1074 /*LVM_SETITEMTEXTW*/, nItem, lpLVITEM);
}

function InsertItemLV(nItem, aItem)
{
  var i;

  AkelPad.MemCopy(lpTextLV, aItem[0], 1 /*DT_UNICODE*/);
  AkelPad.MemCopy(lpLVITEM + 4, nItem, 3 /*DT_DWORD*/); //iItem
  AkelPad.MemCopy(lpLVITEM + 8,     0, 3 /*DT_DWORD*/); //iSubItem

  SendMessage(aDlg[IDMARKLV].HWND, 0x104D /*LVM_INSERTITEMW*/, 0, lpLVITEM);

  for (i = 1; i < 8; ++i)
  {
    AkelPad.MemCopy(lpTextLV, aItem[i] + "", 1 /*DT_UNICODE*/);
    AkelPad.MemCopy(lpLVITEM + 8, i, 3 /*DT_DWORD*/); //iSubItem
    SendMessage(aDlg[IDMARKLV].HWND, 0x1074 /*LVM_SETITEMTEXTW*/, nItem, lpLVITEM);
  }
}

function FillLV()
{
  var lpText     = AkelPad.MemAlloc(24);
  var lpLVCOLUMN = AkelPad.MemAlloc(_X64 ? 56 : 44 /*sizeof(LVCOLUMN)*/);
  var aFmt       = [0 /*LVCFMT_LEFT*/, 0, 0, 2 /*LVCFMT_CENTER*/, 0, 2, 2, 0]; //Alignment of the column header
  var aText;
  var aWidth;
  var i, n;

  AkelPad.MemCopy(lpLVCOLUMN, 7 /*mask=LVCF_FMT|LVCF_WIDTH|LVCF_TEXT*/, 3 /*DT_DWORD*/);
  AkelPad.MemCopy(lpLVCOLUMN + (_X64 ? 16 : 12), lpText, 2 /*DT_QWORD*/);

  if (nTab == 0)
  {
    aText  = ["Name", "TextColor", "BkColor", "FontStyle", "Text", "CaseSens", "RegExp", "MarkID"];
    aWidth = [Scale.X(100), Scale.X(67), Scale.X(67), Scale.X(59), Scale.X(72), Scale.X(63), Scale.X(53), 0];
  }
  else
  {
    aText  = ["MarkID", "TextColor", "BkColor", "FontStyle", "Text", "CaseSens", "RegExp", "Marker name"];
    aWidth = [Scale.X(55), Scale.X(67), Scale.X(67), Scale.X(59), Scale.X(72), Scale.X(63), Scale.X(53), 0];
  }

  for (i = 7; i >= 0; --i)
    SendMessage(aDlg[IDMARKLV].HWND, 0x101C /*LVM_DELETECOLUMN*/, i, 0);

  for (i = 0; i < 8; ++i)
  {
    AkelPad.MemCopy(lpLVCOLUMN + 4, aFmt[i], 3 /*DT_DWORD*/);
    AkelPad.MemCopy(lpLVCOLUMN + 8, aWidth[i], 3 /*DT_DWORD*/);
    AkelPad.MemCopy(lpText, aText[i], 1 /*DT_UNICODE*/);
    SendMessage(aDlg[IDMARKLV].HWND, 0x1061 /*LVM_INSERTCOLUMNW*/, i, lpLVCOLUMN);
  }
  AkelPad.MemFree(lpText);
  AkelPad.MemFree(lpLVCOLUMN);

  SendMessage(aDlg[IDMARKLV].HWND, 0x1009 /*LVM_DELETEALLITEMS*/, 0, 0);

  if (nTab == 0)
  {
    for (i = 0; i < aMark.length; ++i)
    {
      GetCurMarkID(i);
      InsertItemLV(i, aMark[i]);
    }

    if (nMark >= aMark.length)
      nMark == aMark.length - 1;
    else if ((nMark < 0) && aMark.length)
      nMark = 0;

    SetCurSelLV(nMark);
  }
  else
  {
    for (n = 0; n < aCur.length; ++n)
    {
      aCur[n][7] = "";

      if (aCur[n][0] == "-2" /*MARKID_SELECTION.toString()*/)
        aCur[n][7] = "<selection>";
      else if (parseInt(aCur[n][0]) >= 1000001 /*MARKID_AUTOMIN*/)
      {
        for (i = 0; i < aMark.length; ++i)
        {
          if ((aMark[i][1] == aCur[n][1]) && (aMark[i][2] == aCur[n][2]) && (aMark[i][3] == aCur[n][3]) && (aMark[i][4] == aCur[n][4]) && (aMark[i][5] == aCur[n][5]) && (aMark[i][6] == aCur[n][6]))
          {
            aCur[n][7] = aMark[i][0];
            break;
          }
        }
      }

      InsertItemLV(n, aCur[n]);
    }

    if (nCur >= aCur.length)
      nCur = aCur.length - 1;
    else if ((nCur < 0) && aCur.length)
      nCur = 0;

    SetCurSelLV(nCur);
  }

  SendMessage(aDlg[IDMARKLV].HWND, 0x101E /*LVM_SETCOLUMNWIDTH*/, 7, -2 /*LVSCW_AUTOSIZE_USEHEADER*/);
}

function HexToRGB(sHex)
{
  if (/^#[\da-f]{6}$/i.test(sHex))
    return parseInt(sHex.substr(5, 2) + sHex.substr(3, 2) + sHex.substr(1, 2), 16);

  return oSys.Call("User32::GetSysColor", 15 /*COLOR_BTNFACE*/);
}

function RGBToHex(lpRGB)
{
  var sHex = "0";
  var sByte;

  if (AkelPad.MemRead(lpRGB, 3 /*DT_DWORD*/) != -1)
  {
    sHex = "#";

    for (var i = 0; i < 3; ++i)
    {
      sByte = AkelPad.MemRead(lpRGB + i, 5 /*DT_BYTE*/).toString(16).toUpperCase();
  
      if (sByte.length == 1)
        sByte = "0" + sByte;
  
      sHex += sByte;
    }
  }

  return sHex;
}

function ChooseColor(hWndHex, sHex)
{
  var nChoCoSize = _X64 ? 72 : 36 /*sizeof(CHOOSECOLOR)*/;
  var lpChoCo    = AkelPad.MemAlloc(nChoCoSize); //CHOOSECOLOR
  var lpCusCo    = AkelPad.MemAlloc(16 * 4 /*sizeof(COLORREF)*/);
  var i;

  AkelPad.MemCopy(lpChoCo,                    nChoCoSize,     3 /*DT_DWORD*/); //lStructSize
  AkelPad.MemCopy(lpChoCo + (_X64 ?  8 :  4), aDlg.HWND,      2 /*DT_QWORD*/); //hWndOwner
  AkelPad.MemCopy(lpChoCo + (_X64 ? 24 : 12), HexToRGB(sHex), 3 /*DT_DWORD*/); //rgbResult
  AkelPad.MemCopy(lpChoCo + (_X64 ? 32 : 16), lpCusCo,        2 /*DT_QWORD*/); //lpCustColors
  AkelPad.MemCopy(lpChoCo + (_X64 ? 40 : 20), 0x103,          3 /*DT_DWORD*/); //Flags - CC_ANYCOLOR|CC_FULLOPEN|CC_RGBINIT

  if (oSys.Call("Comdlg32::ChooseColorW", lpChoCo))
  {
    oSys.Call("User32::SetWindowTextW", hWndHex, RGBToHex(lpChoCo + (_X64 ? 24 : 12) /*offsetof(CHOOSECOLOR, rgbResult)*/));
    SendMessage(hWndHex, 177 /*EM_SETSEL*/, 0, -1);
  }

  AkelPad.MemFree(lpChoCo);
  AkelPad.MemFree(lpCusCo);
}

function SetColorbyHex(bTextColor)
{
  var nPos = -1;
  var sHex = "";
  var hWndColor;
  var hWndName;
  var i;

  if (bTextColor)
  {
    if ((nTab == 0) && aMark.length)
    {
      sHex = GetTextAE(aDlg[IDTCOLORE].HWND).toUpperCase();
      aMark[nMark][1] = sHex;
      GetCurMarkID(nMark);
      SetItemTextLV(nMark, 1, sHex);
      SetItemTextLV(nMark, 7, aMark[nMark][7]);
    }
    else if ((nTab == 1) && aCur.length)
      sHex = aCur[nCur][1];

    hWndColor = aDlg[IDTCOLORB].HWND;
    hWndName  = aDlg[IDTCOLORCB].HWND;
  }
  else
  {
    if ((nTab == 0) && aMark.length)
    {
      sHex = GetTextAE(aDlg[IDBCOLORE].HWND).toUpperCase();
      aMark[nMark][2] = sHex;
      GetCurMarkID(nMark);
      SetItemTextLV(nMark, 2, sHex);
      SetItemTextLV(nMark, 7, aMark[nMark][7]);
    }
    else if ((nTab == 1) && aCur.length)
      sHex = aCur[nCur][2];

    hWndColor = aDlg[IDBCOLORB].HWND;
    hWndName  = aDlg[IDBCOLORCB].HWND;
  }

  for (i = 0; i < aColor.length; ++i)
  {
    if (sHex == aColor[i][1])
    {
      nPos = i;
      break;
    }
  }

  if (oSys.Call("User32::GetFocus") != hWndName)
    SendMessage(hWndName, 334 /*CB_SETCURSEL*/, nPos, 0);

  oSys.Call("User32::InvalidateRect", hWndColor, 0, true);
  EnableWindows();
}

function SetColorbyName(hWndName, hWndHex)
{
  if (SendMessage(hWndName, 327 /*CB_GETCURSEL*/, 0, 0) > -1)
  {
    oSys.Call("User32::SetWindowTextW", hWndHex, aColor[SendMessage(hWndName, 327 /*CB_GETCURSEL*/, 0, 0)][1]);
    SendMessage(hWndHex, 177 /*EM_SETSEL*/, 0, -1);
  }
}
function CheckRegExpPat(sPat, nMatchCase)
{
  //based on Instructor's code CheckPat.js: http://akelpad.sourceforge.net/forum/viewtopic.php?p=25621&highlight=#25621
  var lpPat     = AkelPad.MemAlloc((sPat.length + 1) * 2 /*sizeof(wchat_t)*/);
  var lpPatExec = AkelPad.MemAlloc(_X64? 152 : 76 /*sizeof(PATEXEC)*/);
  var lpStr     = AkelPad.MemAlloc(2 /*sizeof(wchat_t)*/);
  var nErrOffset;

  AkelPad.MemCopy(lpPat, sPat, 1 /*DT_UNICODE*/);
  AkelPad.MemCopy(lpPatExec + (_X64 ?   8 :  4) /*offsetof(PATEXEC,wpPat)*/,     lpPat, 2 /*DT_QWORD*/);
  AkelPad.MemCopy(lpPatExec + (_X64 ?  16 :  8) /*offsetof(PATEXEC,wpMaxPat)*/,  lpPat + sPat.length * 2 /*sizeof(wchat_t)*/, 2 /*DT_QWORD*/);
  AkelPad.MemCopy(lpPatExec + (_X64 ?  24 : 12) /*offsetof(PATEXEC,wpStr)*/,     lpStr, 2 /*DT_QWORD*/);
  AkelPad.MemCopy(lpPatExec + (_X64 ?  32 : 16) /*offsetof(PATEXEC,wpMaxStr)*/,  lpStr, 2 /*DT_QWORD*/);
  AkelPad.MemCopy(lpPatExec + (_X64 ?  40 : 20) /*offsetof(PATEXEC,wpText)*/,    lpStr, 2 /*DT_QWORD*/);
  AkelPad.MemCopy(lpPatExec + (_X64 ?  48 : 24) /*offsetof(PATEXEC,wpMaxText)*/, lpStr, 2 /*DT_QWORD*/);
  AkelPad.MemCopy(lpPatExec + (_X64 ? 104 : 52) /*offsetof(PATEXEC,dwOptions)*/, nMatchCase, 3 /*DT_DWORD*/);

  SendMessage(AkelPad.GetMainWnd(), 1415 /*AKD_PATEXEC*/, 0, lpPatExec);
  nErrOffset = AkelPad.MemRead(lpPatExec + (_X64 ? 128 : 64) /*offsetof(PATEXEC,nErrorOffset)*/, 2 /*DT_QWORD*/);

  AkelPad.MemFree(lpPat);
  AkelPad.MemFree(lpPatExec);
  AkelPad.MemFree(lpStr);

  return nErrOffset;
}

function GetCurMarksArray()
{
  //based on Instructor's code GetMarks.js: http://akelpad.sourceforge.net/forum/viewtopic.php?p=25591&highlight=#25591
  var lpMarkStack = AkelPad.MemAlloc(_X64 ? 16 : 8 /*sizeof(STACKMARKTEXT)*/);
  var lpMarkText;
  var lpMarkItem;
  var nMarkID;
  var sText;
  var nFlags;
  var nMatchCase;
  var nRegExp;
  var nFontStyle;
  var sTextColor;
  var sBkColor;

  aCur.length = 0;

  AkelPad.Call("Coder::HighLight", 12 /*DLLA_HIGHLIGHT_GETMARKSTACK*/, AkelPad.GetEditWnd(), AkelPad.GetEditDoc(), lpMarkStack);

  lpMarkText = AkelPad.MemRead(lpMarkStack + 0 /*offsetof(STACKMARKTEXT,first)*/, 2 /*DT_QWORD*/);

  while (lpMarkText)
  {
    nMarkID    = AkelPad.MemRead(lpMarkText + (_X64 ? 24 : 12) /*offsetof(MARKTEXT,dwMarkID)*/, 3 /*DT_DWORD*/);
    lpMarkItem = AkelPad.MemRead(lpMarkText + (_X64 ? 16 : 8) /*offsetof(MARKTEXT,hMarkTextHandle)*/, 2 /*DT_QWORD*/);
    lpText     = AkelPad.MemRead(lpMarkItem + (_X64 ? 24 : 12) /*offsetof(AEMARKTEXTITEMW,pMarkText)*/, 2 /*DT_QWORD*/);
    sText      = AkelPad.MemRead(lpText, 1 /*DT_UNICODE*/);
    nFlags     = AkelPad.MemRead(lpMarkItem + (_X64 ? 36 : 20) /*offsetof(AEMARKTEXTITEMW,dwFlags)*/, 3 /*DT_DWORD*/);
    nMatchCase = (nFlags & 0x00000001/*AEHLF_MATCHCASE*/) ? 1 : 0;
    nRegExp    = (nFlags & 0x10000000/*AEHLF_REGEXP*/) ? 1 : 0;
    nFontStyle = AkelPad.MemRead(lpMarkItem + (_X64 ? 40 : 24) /*offsetof(AEMARKTEXTITEMW,dwFontStyle)*/, 3 /*DT_DWORD*/);
    sTextColor = RGBToHex(lpMarkItem + (_X64 ? 44 : 28) /*offsetof(AEMARKTEXTITEMW,crText)*/);
    sBkColor   = RGBToHex(lpMarkItem + (_X64 ? 48 : 32) /*offsetof(AEMARKTEXTITEMW,crBk)*/);

    aCur.push([nMarkID.toString(), sTextColor, sBkColor, nFontStyle, sText, nMatchCase, nRegExp, ""]);

    lpMarkText = AkelPad.MemRead(lpMarkText + 0 /*offsetof(MARKTEXT,next)*/, 2 /*DT_QWORD*/);
  }

  AkelPad.MemFree(lpMarkStack);

  aCur.sort(function(a, b) {
    if      (a[0] < b[0]) return -1;
    else if (a[0] > b[0]) return 1;
    return 0; });
}

function GetCurMarkID(i)
{
  var n;

  aMark[i][7] = "";

  for (n = aCur.length - 1; n >= 0; --n)
  {
    if ((parseInt(aCur[n][0]) >= 1000001 /*MARKID_AUTOMIN*/) && (aMark[i][1] == aCur[n][1]) && (aMark[i][2] == aCur[n][2]) && (aMark[i][3] == aCur[n][3]) && (aMark[i][4] == aCur[n][4]) && (aMark[i][5] == aCur[n][5]) && (aMark[i][6] == aCur[n][6]))
    {
      aMark[i][7] = aCur[n][0];
      break;
    }
  }
}

function SetCurMarksID()
{
  for (var i = 0; i < aMark.length; ++i)
  {
    GetCurMarkID(i);
    SetItemTextLV(i, 7, aMark[i][7])
  }
}

function NewOrRenameMarker(bRename)
{
  var hFocus     = oSys.Call("User32::GetFocus");
  var sName      = "";
  var sTextColor = "#A52A2A";
  var sBkColor   = "#FFFF00";
  var nFontStyle = 0;
  var sText      = "";
  var nMatchCase = 1;
  var nRegExp    = 0;
  var sCaption;
  var sLabel;

  if (aMark.length)
  {
    sName      = aMark[nMark][0];
    sTextColor = aMark[nMark][1];
    sBkColor   = aMark[nMark][2];
    nFontStyle = aMark[nMark][3];
    sText      = aMark[nMark][4];
    nMatchCase = aMark[nMark][5];
    nRegExp    = aMark[nMark][6];
  }

  if (bRename)
  {
    sCaption = "Rename marker";
    sLabel   = "New name:";
  }
  else
  {
    sCaption = "New marker";
    sLabel   = "Name:";
  }

  sName = InputBox(aDlg.HWND, sCaption, sLabel, sName, 0, CheckMarkerName, bRename);

  if (sName)
    sName = sName.replace(/\s+$/, "");

  if (sName && ((! bRename) || (sName != aMark[nMark][0])))
  {
    if (bRename)
    {
      SendMessage(aDlg[IDMARKLV].HWND, 0x1008 /*LVM_DELETEITEM*/, nMark, 0);
      aMark.splice(nMark, 1);
    }

    for (nMark = 0; nMark < aMark.length; ++nMark)
    {
      if (oSys.Call("Kernel32::lstrcmpW", sName, aMark[nMark][0]) < 0)
        break;
    }

    aMark.splice(nMark, 0, [sName, sTextColor, sBkColor, nFontStyle, sText, nMatchCase, nRegExp, ""]);
    GetCurMarkID(nMark)
    InsertItemLV(nMark, aMark[nMark]);
    SetCurSelLV(nMark);
    EnableWindows();
  }

  oSys.Call("User32::SetFocus", hFocus);
}

function CheckMarkerName(hWnd, aName, bRename)
{
  var i;

  aName[0] = aName[0].replace(/\s+$/, "");

  if (aName[0] == "<selection>")
  {
    MessageBox(hWnd, 'Name "' + aName[0] + '" is reserved for selected text marks.');
    return 0;
  }
  else
  {
    for (i = 0; i < aMark.length; ++i)
    {
      if ((aName[0] == aMark[i][0]) && ((! bRename) || (i != nMark)))
      {
        MessageBox(hWnd, 'Marker "' + aName[0] + '" already exists.');
        return 0;
      }
    }
  }

  return -1;
}

function DeleteMarker()
{
  SendMessage(aDlg[IDMARKLV].HWND, 0x1008 /*LVM_DELETEITEM*/, nMark, 0);
  aMark.splice(nMark, 1);

  if (nMark >= aMark.length)
    nMark = aMark.length - 1;

  SetCurSelLV(nMark);
  GetCurSelLV();
  EnableWindows();
}

function Mark()
{
  var nErrOffset;

  if ((aMark[nMark][1] != "0") && (! /^#[\da-f]{6}$/i.test(aMark[nMark][1])))
  {
    MessageBox(aDlg.HWND, "Incorrect text color code.");
    oSys.Call("User32::SetFocus", aDlg[IDTCOLORE].HWND);
  }
  else if ((aMark[nMark][2] != "0") && (! /^#[\da-f]{6}$/i.test(aMark[nMark][2])))
  {
    MessageBox(aDlg.HWND, "Incorrect background color code.");
    oSys.Call("User32::SetFocus", aDlg[IDBCOLORE].HWND);
  }
  else if (aMark[nMark][6] && (nErrOffset = CheckRegExpPat(aMark[nMark][4], aMark[nMark][5])))
  {
    MessageBox(aDlg.HWND, "Error in regular expression.");
    oSys.Call("User32::SetFocus", aDlg[IDTEXTE].HWND);
    SendMessage(aDlg[IDTEXTE].HWND, 177 /*EM_SETSEL*/, nErrOffset - 1, -1);
  }
  else
  {
    AkelPad.Call("Coder::HighLight", 2, aMark[nMark][1], aMark[nMark][2], aMark[nMark][5] | 2 * aMark[nMark][6], aMark[nMark][3], -1, aMark[nMark][4]);
    GetCurMarksArray();
    SetCurMarksID();
  }

  EnableWindows();
}

function UnMark(bAll)
{
  if (bAll)
    AkelPad.Call("Coder::HighLight", 3, 0);
  else
  {
    if (nTab == 0)
      AkelPad.Call("Coder::HighLight", 3, parseInt(aMark[nMark][7]));
    else
      AkelPad.Call("Coder::HighLight", 3, parseInt(aCur[nCur][0]));
  }

  GetCurMarksArray();

  if (nTab == 0)
    SetCurMarksID();
  else
  {
    FillLV();
    GetCurSelLV();
  }

  EnableWindows();
}

function FindMark(bUp)
{
  var nMarkID = parseInt((nTab == 0) ? aMark[nMark][7] : aCur[nCur][0]);

  AkelPad.Call("Coder::HighLight", 4, nMarkID, 0, 0, bUp);

  if (aCur[0][0] == "-2" /*MARKID_SELECTION.toString()*/)
  {
    GetCurMarksArray();
    if ((! aCur.length) || (aCur[0][0] != "-2" /*MARKID_SELECTION.toString()*/))
    {
      if (nCur > 0) --nCur;

      if (nTab == 1)
      {
        FillLV();
        GetCurSelLV();
        EnableWindows();
      }
    }
  }
}

function EditMenu(hWnd, nX, nY)
{
  var MF_STRING    = 0x0000;
  var MF_GRAYED    = 0x0001;
  var MF_SEPARATOR = 0x0800;
  var hEditWnd = AkelPad.GetEditWnd();
  var hMenu    = oSys.Call("User32::CreatePopupMenu");
  var lpPoint;
  var nCmd;

  if (nX == 0xFFFF) //context menu from keyboard
  {
    lpPoint = AkelPad.MemAlloc(8 /*sizeof(POINT)*/);
    oSys.Call("User32::GetCaretPos", lpPoint);
    oSys.Call("User32::ClientToScreen", hWnd, lpPoint);
    nX = AkelPad.MemRead(lpPoint,     3 /*DT_DWORD*/);
    nY = AkelPad.MemRead(lpPoint + 4, 3 /*DT_DWORD*/) + SendMessage(hWnd, 3188 /*AEM_GETCHARSIZE*/, 0 /*AECS_HEIGHT*/, 0);
    AkelPad.MemFree(lpPoint);
  }

  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd,  198 /*EM_CANUNDO*/, 0, 0) ? MF_STRING : MF_GRAYED, 1, "Undo\tCtrl+Z");
  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 1109 /*EM_CANREDO*/, 0, 0) ? MF_STRING : MF_GRAYED, 2, "Redo\tCtrl+Shift+Z");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0, 0);
  oSys.Call("User32::AppendMenuW", hMenu, (nTab == 0) && SendMessage(hWnd, 3125 /*AEM_GETSEL*/, 0, 0) ? MF_STRING : MF_GRAYED, 3, "Cut\tCtrl+X");
  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 3125 /*AEM_GETSEL*/, 0, 0) ? MF_STRING : MF_GRAYED, 4, "Copy\tCtrl+C");
  oSys.Call("User32::AppendMenuW", hMenu, SendMessage(hWnd, 1074 /*EM_CANPASTE*/, 0, 0) ? MF_STRING : MF_GRAYED, 5, "Paste\tCtrl+V");
  oSys.Call("User32::AppendMenuW", hMenu, (nTab == 0) && SendMessage(hWnd, 3125 /*AEM_GETSEL*/, 0, 0) ? MF_STRING : MF_GRAYED, 6, "Delete\tDel");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0, 0);
  oSys.Call("User32::AppendMenuW", hMenu, oSys.Call("User32::GetWindowTextLengthW", hWnd) ? MF_STRING : MF_GRAYED, 7, "Select all\tCtrl+A");
  oSys.Call("User32::AppendMenuW", hMenu, MF_SEPARATOR, 0, 0);
  oSys.Call("User32::AppendMenuW", hMenu, hEditWnd && !AkelPad.GetEditReadOnly(hEditWnd) && SendMessage(hWnd, 3125 /*AEM_GETSEL*/, 0, 0) ? MF_STRING : MF_GRAYED, 8, "Insert to AkelPad\tCtrl+Shift+C");
  oSys.Call("User32::AppendMenuW", hMenu, (nTab == 0) && hEditWnd && SendMessage(hEditWnd, 3125 /*AEM_GETSEL*/, 0, 0) ? MF_STRING : MF_GRAYED, 9, "Paste from AkelPad\tCtrl+Shift+V");

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x180 /*TPM_NONOTIFY|TPM_RETURNCMD*/, nX, nY, 0, aDlg.HWND, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd == 1)
    SendMessage(hWnd, 199 /*EM_UNDO*/, 0, 0);
  else if (nCmd == 2)
    SendMessage(hWnd, 1108 /*EM_REDO*/, 0, 0);
  else if (nCmd == 3)
    SendMessage(hWnd, 768 /*WM_CUT*/, 0, 0);
  else if (nCmd == 4)
    SendMessage(hWnd, 769 /*WM_COPY*/, 0, 0);
  else if (nCmd == 5)
    SendMessage(hWnd, 770 /*WM_PASTE*/, 0, 0);
  else if (nCmd == 6)
    SendMessage(hWnd, 771 /*WM_CLEAR*/, 0, 0);
  else if (nCmd == 7)
    SendMessage(hWnd, 177 /*EM_SETSEL*/, 0, -1);
  else if (nCmd == 8)
    InsertToAP(hWnd);
  else if (nCmd == 9)
    PasteFromAP(hWnd);
}

function InsertToAP(hWnd)
{
  var sText;

  if (AkelPad.GetEditWnd() && (sText = GetTextAE(hWnd, 1)))
    AkelPad.ReplaceSel(sText, 1);
}

function PasteFromAP(hWnd)
{
  if ((nTab == 0) && AkelPad.GetEditWnd() && (AkelPad.GetSelStart() != AkelPad.GetSelEnd()))
    SendMessage(hWnd, 194 /*EM_REPLACESEL*/, 1, AkelPad.GetSelText());
}

function RegExpHelp()
{
  var lpRect  = AkelPad.MemAlloc(16 /*sizeof(RECT)*/);
  var oFSO    = new ActiveXObject("Scripting.FileSystemObject");
  var sDir    = AkelPad.GetAkelDir(2 /*ADTYPE_DOCS*/) + "\\";
  var hMenu   = oSys.Call("User32::CreatePopupMenu");
  var nString = 0x0000; //MF_STRING
  var nGrayed = 0x0001; //MF_GRAYED
  var nBreak  = 0x0060; //MF_MENUBREAK|MF_MENUBARBREAK
  var nSepar  = 0x0800; //MF_SEPARATOR
  var nX;
  var nY;
  var aMenu;
  var sHelpFile;
  var nCmd;
  var i;

  oSys.Call("User32::GetWindowRect", aDlg[IDTEXTE].HWND, lpRect);
  nX = AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/);
  nY = AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/);
  AkelPad.MemFree(lpRect);

  aMenu = [
    [nString, ".",         'any character (dot)'],
    [nString, "\\(",       '()[]{}^$.?+*|\\ special chars'],
    [nString, "\\f",       'form feed \\x0C'],
    [nString, "\\n",       'any new line'],
    [nString, "\\r",       'any new line'],
    [nString, "\\t",       'tab \\x09'],
    [nString, "\\v",       'vertical tab \\x0B'],
    [nString, "\\d",       'digit [0-9]'],
    [nString, "\\D",       'non-digit [^0-9]'],
    [nString, "\\s",       'whitespace [ \\f\\n\\t\\v]'],
    [nString, "\\S",       'non-whitespace'],
    [nString, "\\w",       'word character (non-delimiter)'],
    [nString, "\\W",       'non-word character (delimiter)'],
    [nString, "\\x{F}",    'char - hex code, range 0-10FFFF'],
    [nString, "\\xFF",     'char - 2-digit hex code'],
    [nString, "\\uFFFF",   'char - 4-digit hex code'],
    [nSepar],
    [nString, "ab|xy",     'alternative ab or xy'],
    [nString, "[abc]",     'character set, any specified'],
    [nString, "[^abc]",    'negative character set'],
    [nString, "[a-z]",     'range of chars from a to z'],
    [nString, "[^a-z]",    'negative range of chars'],
    [nSepar],
    [nString, "^",         'beginning of line'],
    [nString, "$",         'end of line'],
    [nString, "\\A",       'beginning of text'],
    [nString, "\\Z",       'end of text'],
    [nString, "\\a",       'beginning of search range'],
    [nString, "\\z",       'end of search range'],
    [nString, "\\b",       'word boundary'],
    [nString, "\\B",       'non-word boundary'],

    [nBreak,  "?",         'zero or one time'],
    [nString, "*",         'zero or more times'],
    [nString, "+",         'one or more times'],
    [nString, "{3}",       'exactly 3 times'],
    [nString, "{3,}",      'at least 3 times'],
    [nString, "{3,7}",     'from 3 to 7 times'],
    [nGrayed, "\xA0",      '- above quantifiers are greedy'],
    [nString, "?",         'add at end for lazy quantifier'],
    [nString, "+",         'add at end for possesive quantifier'],
    [nSepar],
    [nString, "(ab)",      'matches ab, captures'],
    [nString, "(?^ab)",    'matches negative ab, captures'],
    [nString, "(?:ab)",    'matches ab, not captures'],
    [nString, "(?>bc|b)",  'atomic grouping, not captures'],
    [nString, "(?<=ab)",   'preceded by ab'],
    [nString, "(?<!ab)",   'not preceded by ab'],
    [nString, "(?=ab)",    'followed by ab'],
    [nString, "(?!ab)",    'not followed by ab'],
    [nString, "(?(1)x|y)", 'if (1) then x, else y'],
    [nString, "\\9",       'backreference, range 1-9'],
    [nString, "\\99",      'backreference, range 01-99'],
    [nSepar],
    [nString, "(?i)",      'case insensitive'],
    [nString, "(?m)",      'multiline search (default)'],
    [nString, "(?s)",      'dot matches any char (default)'],
    [nString, "(?U)",      'invert greediness'],
    [nString, "(?-i)",     'match case'],
    [nString, "(?-m)",     'turn off multiline search'],
    [nString, "(?-s)",     'dot matches any char, except \\n'],
    [nString, "(?-U)",     'turn off greediness inversion']];

  if (AkelPad.GetLangId() == 1049 /*Russian*/)
  {
    if (oFSO.FileExists(sDir + "AkelHelp-Rus.htm"))
      sHelpFile = "AkelHelp-Rus.htm";
    else if (oFSO.FileExists(sDir + "AkelHelp-Eng.htm"))
      sHelpFile = "AkelHelp-Eng.htm";
  }
  else
  {
    if (oFSO.FileExists(sDir + "AkelHelp-Eng.htm"))
      sHelpFile = "AkelHelp-Eng.htm";
    else if (oFSO.FileExists(sDir + "AkelHelp-Rus.htm"))
      sHelpFile = "AkelHelp-Rus.htm";
  }

  if (sHelpFile)
  {
    aMenu.push([nSepar]);
    aMenu.push([nString, "\xA0", "AkelHelp"]);
  }

  for (i = 0; i < aMenu.length; ++i)
    oSys.Call("User32::AppendMenuW", hMenu, aMenu[i][0], i + 1, aMenu[i][1] + "\t" + aMenu[i][2]);

  nCmd = oSys.Call("User32::TrackPopupMenu", hMenu, 0x0188 /*TPM_RETURNCMD|TPM_NONOTIFY|TPM_RIGHTALIGN*/, nX, nY, 0, aDlg.HWND, 0);

  oSys.Call("User32::DestroyMenu", hMenu);

  if (nCmd--)
  {
    oSys.Call("User32::SetFocus", aDlg[IDTEXTE].HWND);

    if (aMenu[nCmd][1] != "\xA0")
      SendMessage(aDlg[IDTEXTE].HWND, 194 /*EM_REPLACESEL*/, 1, aMenu[nCmd][1]);
    else if (aMenu[nCmd][2] == "AkelHelp")
      AkelPad.Exec('rundll32.exe shell32, ShellExec_RunDLL ' + sDir + sHelpFile);
  }
}

function IsScriptRunning()
{
  var hDlg = oSys.Call("User32::FindWindowExW", 0, 0, sClass, 0);

  if (hDlg)
  {
    if (! oSys.Call("User32::IsWindowVisible", hDlg))
      oSys.Call("User32::ShowWindow", hDlg, 8 /*SW_SHOWNA*/);
    if (oSys.Call("User32::IsIconic", hDlg))
      oSys.Call("User32::ShowWindow", hDlg, 9 /*SW_RESTORE*/);

    oSys.Call("User32::SetForegroundWindow", hDlg);
    return true;
  }

  return false;
}

function ReadIni()
{
  try
  {
    eval(AkelPad.ReadFile(WScript.ScriptFullName.replace(/\.js$/i, ".ini"), 0x10 /*OD_ADT_NOMESSAGES*/, 1200 /*UTF-16LE*/, true));
  }
  catch (oError)
  {}

  if (! aMark)
    aMark = [["Example", "#A52A2A", "#FFFF00", 0, "Text", 1, 0, ""]];
  if (nMark >= aMark.length)
    nMark = aMark.length - 1;

  aMark.sort(function(a, b) {return oSys.Call("Kernel32::lstrcmpW", a[0], b[0]);});

  //css colors: http://www.w3schools.com/cssref/css_colornames.asp
  aColor = [
    ["<ignored>",                  "0"],
    ["AliceBlue",            "#F0F8FF"],
    ["AntiqueWhite",         "#FAEBD7"],
    ["Aqua",                 "#00FFFF"],
    ["Aquamarine",           "#7FFFD4"],
    ["Azure",                "#F0FFFF"],
    ["Beige",                "#F5F5DC"],
    ["Bisque",               "#FFE4C4"],
    ["Black",                "#000000"],
    ["BlanchedAlmond",       "#FFEBCD"],
    ["Blue",                 "#0000FF"],
    ["BlueViolet",           "#8A2BE2"],
    ["Brown",                "#A52A2A"],
    ["BurlyWood",            "#DEB887"],
    ["CadetBlue",            "#5F9EA0"],
    ["Chartreuse",           "#7FFF00"],
    ["Chocolate",            "#D2691E"],
    ["Coral",                "#FF7F50"],
    ["CornflowerBlue",       "#6495ED"],
    ["Cornsilk",             "#FFF8DC"],
    ["Crimson",              "#DC143C"],
    ["Cyan",                 "#00FFFF"],
    ["DarkBlue",             "#00008B"],
    ["DarkCyan",             "#008B8B"],
    ["DarkGoldenrod",        "#B8860B"],
    ["DarkGray",             "#A9A9A9"],
    ["DarkGreen",            "#006400"],
    ["DarkKhaki",            "#BDB76B"],
    ["DarkMagenta",          "#8B008B"],
    ["DarkOliveGreen",       "#556B2F"],
    ["DarkOrange",           "#FF8C00"],
    ["DarkOrchid",           "#9932CC"],
    ["DarkRed",              "#8B0000"],
    ["DarkSalmon",           "#E9967A"],
    ["DarkSeaGreen",         "#8FBC8F"],
    ["DarkSlateBlue",        "#483D8B"],
    ["DarkSlateGray",        "#2F4F4F"],
    ["DarkTurquoise",        "#00CED1"],
    ["DarkViolet",           "#9400D3"],
    ["DeepPink",             "#FF1493"],
    ["DeepSkyBlue",          "#00BFFF"],
    ["DimGray",              "#696969"],
    ["DodgerBlue",           "#1E90FF"],
    ["FireBrick",            "#B22222"],
    ["FloralWhite",          "#FFFAF0"],
    ["ForestGreen",          "#228B22"],
    ["Fuchsia",              "#FF00FF"],
    ["Gainsboro",            "#DCDCDC"],
    ["GhostWhite",           "#F8F8FF"],
    ["Gold",                 "#FFD700"],
    ["Goldenrod",            "#DAA520"],
    ["Gray",                 "#808080"],
    ["Green",                "#008000"],
    ["GreenYellow",          "#ADFF2F"],
    ["HoneyDew",             "#F0FFF0"],
    ["HotPink",              "#FF69B4"],
    ["IndianRed",            "#CD5C5C"],
    ["Indigo",               "#4B0082"],
    ["Ivory",                "#FFFFF0"],
    ["Khaki",                "#F0E68C"],
    ["Lavender",             "#E6E6FA"],
    ["LavenderBlush",        "#FFF0F5"],
    ["LawnGreen",            "#7CFC00"],
    ["LemonChiffon",         "#FFFACD"],
    ["LightBlue",            "#ADD8E6"],
    ["LightCoral",           "#F08080"],
    ["LightCyan",            "#E0FFFF"],
    ["LightGoldenrodYellow", "#FAFAD2"],
    ["LightGray",            "#D3D3D3"],
    ["LightGreen",           "#90EE90"],
    ["LightPink",            "#FFB6C1"],
    ["LightSalmon",          "#FFA07A"],
    ["LightSeaGreen",        "#20B2AA"],
    ["LightSkyBlue",         "#87CEFA"],
    ["LightSlateGray",       "#778899"],
    ["LightSteelBlue",       "#B0C4DE"],
    ["LightYellow",          "#FFFFE0"],
    ["Lime",                 "#00FF00"],
    ["LimeGreen",            "#32CD32"],
    ["Linen",                "#FAF0E6"],
    ["Magenta",              "#FF00FF"],
    ["Maroon",               "#800000"],
    ["MediumAquaMarine",     "#66CDAA"],
    ["MediumBlue",           "#0000CD"],
    ["MediumOrchid",         "#BA55D3"],
    ["MediumPurple",         "#9370DB"],
    ["MediumSeaGreen",       "#3CB371"],
    ["MediumSlateBlue",      "#7B68EE"],
    ["MediumSpringGreen",    "#00FA9A"],
    ["MediumTurquoise",      "#48D1CC"],
    ["MediumVioletRed",      "#C71585"],
    ["MidnightBlue",         "#191970"],
    ["MintCream",            "#F5FFFA"],
    ["MistyRose",            "#FFE4E1"],
    ["Moccasin",             "#FFE4B5"],
    ["NavajoWhite",          "#FFDEAD"],
    ["Navy",                 "#000080"],
    ["OldLace",              "#FDF5E6"],
    ["Olive",                "#808000"],
    ["OliveDrab",            "#6B8E23"],
    ["Orange",               "#FFA500"],
    ["OrangeRed",            "#FF4500"],
    ["Orchid",               "#DA70D6"],
    ["PaleGoldenrod",        "#EEE8AA"],
    ["PaleGreen",            "#98FB98"],
    ["PaleTurquoise",        "#AFEEEE"],
    ["PaleVioletRed",        "#DB7093"],
    ["PapayaWhip",           "#FFEFD5"],
    ["PeachPuff",            "#FFDAB9"],
    ["Peru",                 "#CD853F"],
    ["Pink",                 "#FFC0CB"],
    ["Plum",                 "#DDA0DD"],
    ["PowderBlue",           "#B0E0E6"],
    ["Purple",               "#800080"],
    ["Red",                  "#FF0000"],
    ["RosyBrown",            "#BC8F8F"],
    ["RoyalBlue",            "#4169E1"],
    ["SaddleBrown",          "#8B4513"],
    ["Salmon",               "#FA8072"],
    ["SandyBrown",           "#F4A460"],
    ["SeaGreen",             "#2E8B57"],
    ["SeaShell",             "#FFF5EE"],
    ["Sienna",               "#A0522D"],
    ["Silver",               "#C0C0C0"],
    ["SkyBlue",              "#87CEEB"],
    ["SlateBlue",            "#6A5ACD"],
    ["SlateGray",            "#708090"],
    ["Snow",                 "#FFFAFA"],
    ["SpringGreen",          "#00FF7F"],
    ["SteelBlue",            "#4682B4"],
    ["Tan",                  "#D2B48C"],
    ["Teal",                 "#008080"],
    ["Thistle",              "#D8BFD8"],
    ["Tomato",               "#FF6347"],
    ["Turquoise",            "#40E0D0"],
    ["Violet",               "#EE82EE"],
    ["Wheat",                "#F5DEB3"],
    ["White",                "#FFFFFF"],
    ["WhiteSmoke",           "#F5F5F5"],
    ["Yellow",               "#FFFF00"],
    ["YellowGreen",          "#9ACD32"]];
}

function WriteIni()
{
  var lpRect = AkelPad.MemAlloc(16 /*sizeof(RECT)*/);
  var sIniTxt;
  var i;

  oSys.Call("User32::GetWindowRect", aDlg.HWND, lpRect);

  sIniTxt =
    'nDlgX=' + Scale.UX(AkelPad.MemRead(lpRect,     3 /*DT_DWORD*/)) + ';\r\n' +
    'nDlgY=' + Scale.UY(AkelPad.MemRead(lpRect + 4, 3 /*DT_DWORD*/)) + ';\r\n' +
    'nTab='  + nTab + ';\r\n' +
    'nMark=' + nMark + ';\r\n' +
    'aMark=[';

  for (i = 0; i < aMark.length; ++i)
    sIniTxt += '["' + EscapeStr(aMark[i][0]) + '","' + EscapeStr(aMark[i][1]) + '","' + EscapeStr(aMark[i][2]) + '",' + aMark[i][3] + ',"' + EscapeStr(aMark[i][4]) + '",' + aMark[i][5] + ',' + aMark[i][6] + ',"' + aMark[i][7] + '"],';

  if (sIniTxt.slice(-1) == ',')
    sIniTxt = sIniTxt.slice(0, -1);

  sIniTxt += '];';

  AkelPad.MemFree(lpRect);
  AkelPad.WriteFile(WScript.ScriptFullName.replace(/\.js$/i, ".ini"), sIniTxt, sIniTxt.length, 1200 /*UTF-16LE*/, true);
}

function EscapeStr(sStr)
{
  return sStr.replace(/[\\"]/g, '\\$&').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
}
