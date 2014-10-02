/*
CreateDialog_functions.js - ver. 2014-05-26 (x86/x64)

Contains:
CreateDialogWindow() function
CreateDialogBox() function
Scale object

--------------------
CreateDialogWindow()
--------------------
Create dialog box by using WinAPI function CreateWindowEx
http://msdn.microsoft.com/en-us/library/windows/desktop/ms632680%28v=vs.85%29.aspx

Usage:
  if (! AkelPad.Include("CreateDialog_functions.js")) WScript.Quit();
  nWindows = CreateDialogWindow(aDlg[, nWhat[, hDlg[, nStartID[, nEndID]]]]);

Arguments:
  aDlg - an array containing the parameters of windows to be created
    Dialog box parameters are contained in aDlg object properties:
      aDlg.ExStyle  - CreateWindowEx dwExStyle (optional)
      aDlg.Class    - CreateWindowEx lpClassName
      aDlg.Title    - CreateWindowEx lpWindowName (optional)
      aDlg.Style    - CreateWindowEx dwStyle
      aDlg.X        - CreateWindowEx x (optional);
      aDlg.Y        - CreateWindowEx y (optional)
      aDlg.W        - CreateWindowEx nWidth (optional); if aDlg.W < 0, aDlg.X is horizontal position of right edge
      aDlg.H        - CreateWindowEx nHeight (optional); if aDlg.H < 0, aDlg.Y is vertical position of bottom edge
      aDlg.Parent   - CreateWindowEx hWndParent (optional)
      aDlg.Menu     - CreateWindowEx hMenu (optional)
      aDlg.Callback - CreateWindowEx lpParam = callback function
      aDlg.Icon     - handle to the icon (optional)
      aDlg.CtlFirst - indentifier of first control (child window) in dialog window, equal to index of first item in aDlg array (optional)
      aDlg.CtlClass - default class for controls (optional)
      aDlg.CtlStyle - additional style for each controls (optional)
      aDlg.CtlFont  - handle to default font in controls, used if no aDlg[ID].Font (optional)
      aDlg.PosPar   - element of screen, in relation of which will be set position of created window (optional):
                        0 - desktop window (default)
                        1 - work area
                        2 - parent window (aDlg.Parent)
                        3 - parent window client area (aDlg.Parent)
                        4 - any window (aDlg.PosRect)
                        5 - any window client area (aDlg.PosRect)
                        6 - pointer to RECT structure (aDlg.PosRect)
                        7 - four-element array (aDlg.PosRect)
                        8 - mouse cursor
      aDlg.PosRect  - if aDlg.PosPar == 4 or 5, it should be window handle,
                      if aDlg.PosPar == 6, it should be pointer to RECT structure containing coordinates of rectangle,
                      if aDlg.PosPar == 7, it should be four-element array containing coordinates of rectangle
      aDlg.PosEdge  - two-character string indicating from which edge of the parent object (aDlg.PosPar) will be set position of dialog window (default is "LT");
                      first character indicates the horizontal position:
                        "L" - from left edge, "R" - from right edge, "C" - center
                      second character indicates the vertical position:
                        "T" - from top edge, "B" - from bottom edge, "C" - center
      aDlg.SizeClt  - if true, aDlg.W and aDlg.H are treated as client area width and height, without frames and menu (optional)
    Parameters of the control with identifier ID are contained in aDlg[ID] object properties:
      aDlg[ID].ExStyle - CreateWindowEx dwExStyle (optional)
      aDlg[ID].Class   - CreateWindowEx lpClassName (optional, default is aDlg.CtlClass or "BUTTON")
      aDlg[ID].Title   - CreateWindowEx lpWindowName (optional)
      aDlg[ID].Style   - CreateWindowEx dwStyle (WS_CHILD can be omitted, will be added automatically), style = aDlg.CtlStyle | aDlg[ID].Style
      aDlg[ID].X       - CreateWindowEx x (optional)
      aDlg[ID].Y       - CreateWindowEx y (optional)
      aDlg[ID].W       - CreateWindowEx nWidth (optional); if aDlg[ID].W < 0, aDlg[ID].X is horizontal position of right edge
      aDlg[ID].H       - CreateWindowEx nHeight (optional); if aDlg[ID].H < 0, aDlg[ID].Y is vertical position of bottom edge
      aDlg[ID].Font    - handle to font (optional)
      aDlg[ID].PosEdge - two-character string specifying control position relative to the dialog client area (optional, default is "LT");
                         first character indicates the horizontal position:
                           "L" - from left edge, "R" - from right edge, "C" - center
                         second character indicates the vertical position:
                           "T" - from top edge, "B" - from bottom edge, "C" - center
  nWhat
     0 - create dialog box and controls (default)
     1 - create dialog box only
     2 - create controls only (dialog must be created earlier)
  hDlg
    Is used if nWhat = 2 and controls are created in callback function after call with WM_CREATE message,
    hDlg should be equal to hWnd parameter from callback function
  nStartID
    First control ID to create, default is aDlg.CtlFirst or 0
  nEndID
    Last control ID to create, default is index of last item in aDlg (aDlg.length - 1)

Return value:
  count of created windows (dialog + controls)

Remarks:
  After function returning, HWND properties contains window handle:
    aDlg.HWND - dialog box handle
    aDlg[ID].HWND - handle to the control with identifier ID
  Before first function call, should be register window class: AkelPad.WindowRegisterClass(aDlg.Class).
  After first function call, should be use AkelPad.WindowGetMessage() for message loop.
  To destroy dialog box: AkelPad.SystemFunction().Call("User32::DestroyWindow", aDlg.HWND).
  To exit message loop: AkelPad.SystemFunction().Call("User32::PostQuitMessage", 0).
  If window class is no longer needed, it should be unregister: AkelPad.WindowUnregisterClass(aDlg.Class).
----------------------------------------------------------------------------------------------------------

-----------------
CreateDialogBox()
-----------------
Create dialog box by using WinAPI functions DialogBoxIndirectParam (modal) or CreateDialogIndirectParam (modeless)
http://msdn.microsoft.com/en-us/library/windows/desktop/ms645461%28v=vs.85%29.aspx
http://msdn.microsoft.com/en-us/library/windows/desktop/ms645441%28v=vs.85%29.aspx

Usage:
  if (! AkelPad.Include("CreateDialog_functions.js")) WScript.Quit();
  nResult = CreateDialogBox(aDlg[, bTemplate[, nStartID[, nEndID]]]);

Arguments:
  aDlg - an array containing the parameters of windows to be created
    Dialog box parameters are contained in aDlg object properties:
      aDlg.ExStyle   - extended windows styles (optional)
      aDlg.Title     - title of the dialog box (optional)
      aDlg.Style     - style of the dialog box (combination of window styles and dialog box styles)
      aDlg.X         - x-coordinate of the left edge of the dialog (optional);
      aDlg.Y         - y-coordinate of the top edge of the dialog (optional)
      aDlg.W         - width of the dialog clent area (optional)
      aDlg.H         - height of the dialog clent area (optional)
      aDlg.Parent    - handle to the window that owns the dialog box (optional)
      aDlg.Menu      - handle to the menu (optional)
      aDlg.Callback  - dialog box procedure
      aDlg.Icon      - handle to the icon (optional)
      aDlg.Modeless  - if true, dialog box will be modeless (optional, default is false)
      aDlg.InitParam - value to pass to the dialog box procedure as lParam parameter of the WM_INITDIALOG message (optional)
      aDlg.CtlFirst  - indentifier of first control (child window) in dialog box, equal to index of first item in aDlg array (optional)
      aDlg.CtlClass  - default class for controls (optional)
      aDlg.CtlStyle  - additional style for each controls (optional)
      aDlg.CtlFontN  - font name for each controls eg. "MS Shell Dlg" (optional)
      aDlg.CtlFontS  - font size in pixels (optional, default is 8)
      aDlg.CtlFontI  - if true, font is italic (optional)
      aDlg.PosPix    - default is false - position and size of dialog/controls are set in dialog box units (standard behavior) and PosPar, PosWnd, PosEdge properties are ignored;
                       if true:
                         - position and size are in pixels
                         - DS_ABSALIGN, DS_CENTER, DS_CENTERMOUSE styles are ignored
                         - to determine the position, will be used parameters PosPar, PosWnd, PosEdge
                         - if W < 0, X is horizontal position of right edge
                         - if H < 0, Y is vertical position of bottom edge
      aDlg.PosPar    - element of screen, in relation of which will be set position of created dialog (optional):
                         0 - desktop window (default)
                         1 - work area
                         2 - parent window (aDlg.Parent)
                         3 - parent window client area (aDlg.Parent)
                         4 - any window (aDlg.PosRect)
                         5 - any window client area (aDlg.PosRect)
                         6 - pointer to RECT structure (aDlg.PosRect)
                         7 - four-element array (aDlg.PosRect)
                         8 - mouse cursor
      aDlg.PosRect   - if aDlg.PosPar == 4 or 5, it should be window handle,
                       if aDlg.PosPar == 6, it should be pointer to RECT structure containing coordinates of rectangle,
                       if aDlg.PosPar == 7, it should be four-element array containing coordinates of rectangle
      aDlg.PosEdge   - two-character string indicating from which edge of the parent object (aDlg.PosPar) will be set position of dialog box (default is "LT");
                       first character indicates the horizontal position:
                         "L" - from left edge, "R" - from right edge, "C" - center
                       second character indicates the vertical position:
                         "T" - from top edge, "B" - from bottom edge, "C" - center
    Parameters of the control with identifier ID are contained in aDlg[ID] object properties:
      aDlg[ID].ExStyle - extended window style (optional)
      aDlg[ID].Class   - window class of the control (optional, default is aDlg.CtlClass or "BUTTON")
      aDlg[ID].Title   - text in the control (optional)
      aDlg[ID].Style   - style of the control (WS_CHILD can be omitted, will be added automatically), style = aDlg.CtlStyle | aDlg[ID].Style
      aDlg[ID].X       - x-coordinate of the left edge of the control (optional)
      aDlg[ID].Y       - y-coordinate of the top edge of the control (optional)
      aDlg[ID].W       - width of the control (optional)
      aDlg[ID].H       - height of the control (optional)
      aDlg[ID].PosEdge - two-character string specifying control position relative to the dialog client area (optional, default is "LT");
                         first character indicates the horizontal position:
                           "L" - from left edge, "R" - from right edge, "C" - center
                         second character indicates the vertical position:
                           "T" - from top edge, "B" - from bottom edge, "C" - center
  bTemplate
    If true, function does not create a dialog box, only creates DLGTEMPLATEEX structure and returns a pointer to it.
    In this case following parameters are ignored: Parent, Menu, Callback, Icon, Modeless, InitParam, PosPix, PosPar, PosRect, PosEdge.
  nStartID
    First control ID to create, default is aDlg.CtlFirst or 0
  nEndID
    Last control ID to create, default is index of last item in aDlg (aDlg.length - 1)

Return value:
  if bTemplate
    pointer to DLGTEMPLATEEX structure
  if dialog is modeless
    window handle to the dialog box or 0 if function fails
  if dialog is modal
    nResult parameter specified in the call to the EndDialog function that was used to terminate the dialog box or -1 if function fails

Remarks:
  In the callback function (aDlg.Callback), the handles to windows are available:
    aDlg.HWND - dialog box handle
    aDlg[ID].HWND - handle to the control with identifier ID
  If dialog is modal:
    To destroy dialog box: AkelPad.SystemFunction().Call("User32::EndDialog", aDlg.HWND, nResult).
  If dialog is modeless:
    After first function call, should be use AkelPad.WindowGetMessage() for message loop.
    To destroy dialog box: AkelPad.SystemFunction().Call("User32::DestroyWindow", aDlg.HWND).
    To exit message loop: AkelPad.SystemFunction().Call("User32::PostQuitMessage", 0).
--------------------------------------------------------------------------------------

------------
Scale object
------------
Contains methods:
  Scale.X(nX)  - returns the horizontal coordinate aligned according to screen DPI
  Scale.Y(nY)  - returns the vertical coordinate aligned according to screen DPI
  Scale.UX(nX) - inverse operation to Scale.X
  Scale.UY(nY) - inverse operation to Scale.Y
*/

//Window styles http://msdn.microsoft.com/en-us/library/windows/desktop/ms632600%28v=vs.85%29.aspx
WS_BORDER       = 0x00800000;
WS_CAPTION      = 0x00C00000; //WS_BORDER|WS_DLGFRAME
WS_CHILD        = 0x40000000;
WS_CHILDWINDOW  = WS_CHILD;
WS_CLIPCHILDREN = 0x02000000;
WS_CLIPSIBLINGS = 0x04000000;
WS_DISABLED     = 0x08000000;
WS_DLGFRAME     = 0x00400000;
WS_GROUP        = 0x00020000;
WS_HSCROLL      = 0x00100000;
WS_ICONIC       = 0x20000000;
WS_MAXIMIZE     = 0x01000000;
WS_MAXIMIZEBOX  = 0x00010000;
WS_MINIMIZE     = WS_ICONIC;
WS_MINIMIZEBOX  = 0x00020000;
WS_OVERLAPPED   = 0x00000000;
WS_POPUP        = 0x80000000;
WS_SIZEBOX      = 0x00040000;
WS_SYSMENU      = 0x00080000;
WS_TABSTOP      = 0x00010000;
WS_THICKFRAME   = WS_SIZEBOX;
WS_TILED        = WS_OVERLAPPED;
WS_VISIBLE      = 0x10000000;
WS_VSCROLL      = 0x00200000;

WS_OVERLAPPEDWINDOW = WS_OVERLAPPED | WS_CAPTION | WS_SYSMENU | WS_THICKFRAME | WS_MINIMIZEBOX | WS_MAXIMIZEBOX;
WS_POPUPWINDOW      = WS_POPUP | WS_BORDER | WS_SYSMENU;
WS_TILEDWINDOW      = WS_OVERLAPPEDWINDOW;

//Window extended styles http://msdn.microsoft.com/en-us/library/windows/desktop/ff700543%28v=vs.85%29.aspx
WS_EX_ACCEPTFILES      = 0x00000010;
WS_EX_APPWINDOW        = 0x00040000;
WS_EX_CLIENTEDGE       = 0x00000200;
WS_EX_COMPOSITED       = 0x02000000;
WS_EX_CONTEXTHELP      = 0x00000400;
WS_EX_CONTROLPARENT    = 0x00010000;
WS_EX_DLGMODALFRAME    = 0x00000001;
WS_EX_LAYERED          = 0x00080000;
WS_EX_LAYOUTRTL        = 0x00400000;
WS_EX_LEFT             = 0x00000000;
WS_EX_LEFTSCROLLBAR    = 0x00004000;
WS_EX_LTRREADING       = 0x00000000;
WS_EX_MDICHILD         = 0x00000040;
WS_EX_NOACTIVATE       = 0x08000000;
WS_EX_NOINHERITLAYOUT  = 0x00100000;
WS_EX_NOPARENTNOTIFY   = 0x00000004;
WS_EX_RIGHT            = 0x00001000;
WS_EX_RIGHTSCROLLBAR   = 0x00000000;
WS_EX_RTLREADING       = 0x00002000;
WS_EX_STATICEDGE       = 0x00020000;
WS_EX_TOOLWINDOW       = 0x00000080;
WS_EX_TOPMOST          = 0x00000008;
WS_EX_TRANSPARENT      = 0x00000020;
WS_EX_WINDOWEDGE       = 0x00000100;
WS_EX_OVERLAPPEDWINDOW = WS_EX_WINDOWEDGE | WS_EX_CLIENTEDGE;
WS_EX_PALETTEWINDOW    = WS_EX_WINDOWEDGE | WS_EX_TOOLWINDOW | WS_EX_TOPMOST;

//DialogBox styles http://msdn.microsoft.com/en-us/library/windows/desktop/ff729172%28v=vs.85%29.aspx
DS_3DLOOK        = 0x0004;
DS_ABSALIGN      = 0x0001;
DS_CENTER        = 0x0800;
DS_CENTERMOUSE   = 0x1000;
DS_CONTEXTHELP   = 0x2000;
DS_CONTROL       = 0x0400;
DS_FIXEDSYS      = 0x0008;
DS_LOCALEDIT     = 0x0020;
DS_MODALFRAME    = 0x0080;
DS_NOFAILCREATE  = 0x0010;
DS_NOIDLEMSG     = 0x0100;
DS_SETFONT       = 0x0040;
DS_SETFOREGROUND = 0x0200;
DS_SHELLFONT     = DS_SETFONT | DS_FIXEDSYS;
DS_SYSMODAL      = 0x0002;

//Class "BUTTON"
//Button styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb775951%28v=vs.85%29.aspx
BS_3STATE          = 0x0005;
BS_AUTO3STATE      = 0x0006;
BS_AUTOCHECKBOX    = 0x0003;
BS_AUTORADIOBUTTON = 0x0009;
BS_BITMAP          = 0x0080;
BS_BOTTOM          = 0x0800;
BS_CENTER          = 0x0300;
BS_CHECKBOX        = 0x0002;
BS_DEFPUSHBUTTON   = 0x0001;
BS_FLAT            = 0x8000;
BS_GROUPBOX        = 0x0007;
BS_ICON            = 0x0040;
BS_LEFT            = 0x0100;
BS_LEFTTEXT        = 0x0020;
BS_MULTILINE       = 0x2000;
BS_NOTIFY          = 0x4000;
BS_OWNERDRAW       = 0x000B;
BS_PUSHBUTTON      = 0x0000;
BS_PUSHLIKE        = 0x1000;
BS_RADIOBUTTON     = 0x0004;
BS_RIGHT           = 0x0200;
BS_RIGHTBUTTON     = BS_LEFTTEXT;
BS_TEXT            = 0x0000;
BS_TOP             = 0x0400;
BS_VCENTER         = 0x0C00;
//Win Vista
BS_SPLITBUTTON     = 0x000C;
BS_DEFSPLITBUTTON  = 0x000D;
BS_COMMANDLINK     = 0x000E;
BS_DEFCOMMANDLINK  = 0x000F;

//Class "COMBOBOX"
//ComboBoxEx extended styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb775742%28v=vs.85%29.aspx
//ComboBox styles            http://msdn.microsoft.com/en-us/library/windows/desktop/bb775796%28v=vs.85%29.aspx
CBS_AUTOHSCROLL       = 0x0040;
CBS_DISABLENOSCROLL   = 0x0800;
CBS_DROPDOWN          = 0x0002; //+ComboBoxEx
CBS_DROPDOWNLIST      = 0x0003; //+ComboBoxEx
CBS_HASSTRINGS        = 0x0200;
CBS_LOWERCASE         = 0x4000;
CBS_NOINTEGRALHEIGHT  = 0x0400;
CBS_OEMCONVERT        = 0x0080;
CBS_OWNERDRAWFIXED    = 0x0010;
CBS_OWNERDRAWVARIABLE = 0x0020;
CBS_SIMPLE            = 0x0001; //+ComboBoxEx
CBS_SORT              = 0x0100;
CBS_UPPERCASE         = 0x2000;

//Class "SysDateTimePick32"
//DateTimePicker control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb761728%28v=vs.85%29.aspx
DTS_APPCANPARSE            = 0x10;
DTS_LONGDATEFORMAT         = 0x04;
DTS_RIGHTALIGN             = 0x20;
DTS_SHOWNONE               = 0x02;
DTS_SHORTDATEFORMAT        = 0x00;
DTS_SHORTDATECENTURYFORMAT = 0x0C;
DTS_TIMEFORMAT             = 0x09;
DTS_UPDOWN                 = 0x01;

//Class "EDIT"
//Edit control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb775464%28v=vs.85%29.aspx
ES_AUTOHSCROLL = 0x0080; //+RichEdit
ES_AUTOVSCROLL = 0x0040; //+RichEdit
ES_CENTER      = 0x0001; //+RichEdit
ES_LEFT        = 0x0000; //+RichEdit
ES_LOWERCASE   = 0x0010;
ES_MULTILINE   = 0x0004; //+RichEdit
ES_NOHIDESEL   = 0x0100; //+RichEdit
ES_NUMBER      = 0x2000; //+RichEdit
ES_OEMCONVERT  = 0x0400;
ES_PASSWORD    = 0x0020; //+RichEdit
ES_READONLY    = 0x0800; //+RichEdit
ES_RIGHT       = 0x0002; //+RichEdit
ES_UPPERCASE   = 0x0008;
ES_WANTRETURN  = 0x1000; //+RichEdit

//Class "RichEdit50W";
//Library "Msftedit.dll";
//RichEdit control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb774367%28v=vs.85%29.aspx
ES_DISABLENOSCROLL = 0x00002000;
ES_NOIME           = 0x00080000;
ES_NOOLEDRAGDROP   = 0x00000008;
ES_SAVESEL         = 0x00008000;
ES_SELECTIONBAR    = 0x01000000;
ES_SELFIME         = 0x00040000;
ES_SUNKEN          = 0x00004000;
ES_VERTICAL        = 0x00400000;

//Class "SysHeader32"
//Header control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb775241%28v=vs.85%29.aspx
HDS_BUTTONS   = 0x0002;
HDS_DRAGDROP  = 0x0040;
HDS_FILTERBAR = 0x0100;
HDS_FLAT      = 0x0200;
HDS_FULLDRAG  = 0x0080;
HDS_HIDDEN    = 0x0008;
HDS_HORZ      = 0x0000;
HDS_HOTTRACK  = 0x0004;
//Win Vista
HDS_CHECKBOXES = 0x0400;
HDS_NOSIZING   = 0x0800;
HDS_OVERFLOW   = 0x1000;

//Class "LISTBOX"
//ListBox styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb775149%28v=vs.85%29.aspx
LBS_COMBOBOX          = 0x8000;
LBS_DISABLENOSCROLL   = 0x1000;
LBS_EXTENDEDSEL       = 0x0800;
LBS_HASSTRINGS        = 0x0040;
LBS_MULTICOLUMN       = 0x0200;
LBS_MULTIPLESEL       = 0x0008;
LBS_NODATA            = 0x2000;
LBS_NOINTEGRALHEIGHT  = 0x0100;
LBS_NOREDRAW          = 0x0004;
LBS_NOSEL             = 0x4000;
LBS_NOTIFY            = 0x0001;
LBS_OWNERDRAWFIXED    = 0x0010;
LBS_OWNERDRAWVARIABLE = 0x0020;
LBS_SORT              = 0x0002;
LBS_STANDARD          = LBS_NOTIFY | LBS_SORT | WS_VSCROLL | WS_BORDER;
LBS_USETABSTOPS       = 0x0080;
LBS_WANTKEYBOARDINPUT = 0x0400;

//Class "SysListView32"
//ListView extended styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb774732%28v=vs.85%29.aspx
//ListView styles          http://msdn.microsoft.com/en-us/library/windows/desktop/bb774739%28v=vs.85%29.aspx
LVS_ALIGNLEFT       = 0x0800;
LVS_ALIGNMASK       = 0x0C00;
LVS_ALIGNTOP        = 0x0000;
LVS_AUTOARRANGE     = 0x0100;
LVS_EDITLABELS      = 0x0200;
LVS_ICON            = 0x0000;
LVS_LIST            = 0x0003;
LVS_NOCOLUMNHEADER  = 0x4000;
LVS_NOLABELWRAP     = 0x0080;
LVS_NOSCROLL        = 0x2000;
LVS_NOSORTHEADER    = 0x8000;
LVS_OWNERDATA       = 0x1000;
LVS_OWNERDRAWFIXED  = 0x0400;
LVS_REPORT          = 0x0001;
LVS_SHAREIMAGELISTS = 0x0040;
LVS_SHOWSELALWAYS   = 0x0008;
LVS_SINGLESEL       = 0x0004;
LVS_SMALLICON       = 0x0002;
LVS_SORTASCENDING   = 0x0010;
LVS_SORTDESCENDING  = 0x0020;
LVS_TYPEMASK        = 0x0003;
LVS_TYPESTYLEMASK   = 0XFC00;

//Class "SysMonthCal32"
//MonthCalendar control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb760919%28v=vs.85%29.aspx
MCS_DAYSTATE      = 0x0001;
MCS_MULTISELECT   = 0x0002;
MCS_WEEKNUMBERS   = 0x0004;
MCS_NOTODAYCIRCLE = 0x0008;
MCS_NOTODAY       = 0x0010;
//Win Vista
MCS_NOTRAILINGDATES  = 0x0040;
MCS_SHORTDAYSOFWEEK  = 0x0080;
MCS_NOSELCHANGEONNAV = 0x0100;

//Class "msctls_progress32"
//ProgressBar control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb760820%28v=vs.85%29.aspx
PBS_MARQUEE  = 0x08;
PBS_SMOOTH   = 0x01;
PBS_VERTICAL = 0x04;
//Win Vista
PBS_SMOOTHREVERSE = 0x10;

//Class "SCROLLBAR"
//ScrollBar control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb787533%28v=vs.85%29.aspx
SBS_BOTTOMALIGN             = 0x0004;
SBS_HORZ                    = 0x0000;
SBS_LEFTALIGN               = 0x0002;
SBS_RIGHTALIGN              = 0x0004;
SBS_SIZEBOX                 = 0x0008;
SBS_SIZEBOXBOTTOMRIGHTALIGN = 0x0004;
SBS_SIZEBOXTOPLEFTALIGN     = 0x0002;
SBS_SIZEGRIP                = 0x0010;
SBS_TOPALIGN                = 0x0002;
SBS_VERT                    = 0x0001;

//Class "STATIC"
//Static control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb760773%28v=vs.85%29.aspx
SS_BITMAP         = 0x000E;
SS_BLACKFRAME     = 0x0007;
SS_BLACKRECT      = 0x0004;
SS_CENTER         = 0x0001;
SS_CENTERIMAGE    = 0x0200;
SS_EDITCONTROL    = 0x2000;
SS_ENDELLIPSIS    = 0x4000;
SS_ENHMETAFILE    = 0x000F;
SS_ETCHEDFRAME    = 0x0012;
SS_ETCHEDHORZ     = 0x0010;
SS_ETCHEDVERT     = 0x0011;
SS_GRAYFRAME      = 0x0008;
SS_GRAYRECT       = 0x0005;
SS_ICON           = 0x0003;
SS_LEFT           = 0x0000;
SS_LEFTNOWORDWRAP = 0x000C;
SS_NOPREFIX       = 0x0080;
SS_NOTIFY         = 0x0100;
SS_OWNERDRAW      = 0x000D;
SS_PATHELLIPSIS   = 0x8000;
SS_REALSIZEIMAGE  = 0x0800;
SS_RIGHT          = 0x0002;
SS_RIGHTJUST      = 0x0400;
SS_SIMPLE         = 0x000B;
SS_SUNKEN         = 0x1000;
SS_TYPEMASK       = 0x001F;
SS_WHITEFRAME     = 0x0009;
SS_WHITERECT      = 0x0006;
SS_WORDELLIPSIS   = 0xC000;

//Class "msctls_statusbar32"
//StatusBar styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb760730%28v=vs.85%29.aspx
SBARS_SIZEGRIP = 0x0100;
SBARS_TOOLTIPS = 0x0800;

//Class "SysLink"
//SysLink control styles http://msdn.microsoft.com/en-us/library/windows/desktop/cc136543%28v=vs.85%29.aspx
LWS_TRANSPARENT  = 0x0001;
LWS_IGNORERETURN = 0x0002;
//Win Vista
LWS_NOPREFIX       = 0x0004;
LWS_USEVISUALSTYLE = 0x0008;
LWS_USECUSTOMTEXT  = 0x0010;
LWS_RIGHT          = 0x0020;

//Class "SysTabControl32"
//Tab control extended styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb760546%28v=vs.85%29.aspx
//Tab control styles          http://msdn.microsoft.com/en-us/library/windows/desktop/bb760549%28v=vs.85%29.aspx
TCS_BOTTOM            = 0x0002;
TCS_BUTTONS           = 0x0100;
TCS_FIXEDWIDTH        = 0x0400;
TCS_FLATBUTTONS       = 0x0008;
TCS_FOCUSNEVER        = 0x8000;
TCS_FOCUSONBUTTONDOWN = 0x1000;
TCS_FORCEICONLEFT     = 0x0010;
TCS_FORCELABELLEFT    = 0x0020;
TCS_HOTTRACK          = 0x0040;
TCS_MULTILINE         = 0x0200;
TCS_MULTISELECT       = 0x0004;
TCS_OWNERDRAWFIXED    = 0x2000;
TCS_RAGGEDRIGHT       = 0x0800;
TCS_RIGHT             = 0x0002;
TCS_RIGHTJUSTIFY      = 0x0000;
TCS_SCROLLOPPOSITE    = 0x0001;
TCS_SINGLELINE        = 0x0000;
TCS_TABS              = 0x0000;
TCS_TOOLTIPS          = 0x4000;
TCS_VERTICAL          = 0x0080;

//Class "ToolbarWindow32"
//Toolbar control extended styles   http://msdn.microsoft.com/en-us/library/windows/desktop/bb760430%28v=vs.85%29.aspx
//Toolbar control and Button styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb760439%28v=vs.85%29.aspx
TBSTYLE_ALTDRAG      = 0x0400;
TBSTYLE_CUSTOMERASE  = 0x2000;
TBSTYLE_FLAT         = 0x0800;
TBSTYLE_LIST         = 0x1000;
TBSTYLE_REGISTERDROP = 0x4000;
TBSTYLE_TOOLTIPS     = 0x0100;
TBSTYLE_TRANSPARENT  = 0x8000;
TBSTYLE_WRAPABLE     = 0x0200;

BTNS_AUTOSIZE      = 0x0010;
BTNS_BUTTON        = 0x0000;
BTNS_CHECK         = 0x0002;
BTNS_DROPDOWN      = 0x0008;
BTNS_GROUP         = 0x0004;
BTNS_NOPREFIX      = 0x0020;
BTNS_SEP           = 0x0001;
BTNS_SHOWTEXT      = 0x0040;
BTNS_WHOLEDROPDOWN = 0x0080;
BTNS_CHECKGROUP    = BTNS_CHECK | BTNS_GROUP;

//Class "tooltips_class32"
//Tooltip styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb760248%28v=vs.85%29.aspx
TTS_ALWAYSTIP      = 0x0001;
TTS_BALLOON        = 0x0040;
TTS_CLOSE          = 0x0080;
TTS_NOANIMATE      = 0x0010;
TTS_NOFADE         = 0x0020;
TTS_NOPREFIX       = 0x0002;
TTS_USEVISUALSTYLE = 0x0100;

//Class "msctls_trackbar32"
//TrackBar control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb760147%28v=vs.85%29.aspx
TBS_AUTOTICKS      = 0x0001;
TBS_VERT           = 0x0002;
TBS_HORZ           = 0x0000;
TBS_TOP            = 0x0004;
TBS_BOTTOM         = 0x0000;
TBS_LEFT           = 0x0004;
TBS_RIGHT          = 0x0000;
TBS_BOTH           = 0x0008;
TBS_NOTICKS        = 0x0010;
TBS_ENABLESELRANGE = 0x0020;
TBS_FIXEDLENGTH    = 0x0040;
TBS_NOTHUMB        = 0x0080;
TBS_REVERSED       = 0x0200;
TBS_DOWNISLEFT     = 0x0400;
//Win Vista
TBS_NOTIFYBEFOREMOVE = 0x0800;
TBS_TRANSPARENTBKGND = 0x1000;

//Class "SysTreeView32"
//Tree-View control extended styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb759981%28v=vs.85%29.aspx
//Tree-View control styles          http://msdn.microsoft.com/en-us/library/windows/desktop/bb760013%28v=vs.85%29.aspx
TVS_CHECKBOXES      = 0x0100;
TVS_DISABLEDRAGDROP = 0x0010;
TVS_EDITLABELS      = 0x0008;
TVS_FULLROWSELECT   = 0x1000;
TVS_HASBUTTONS      = 0x0001;
TVS_HASLINES        = 0x0002;
TVS_INFOTIP         = 0x0800;
TVS_LINESATROOT     = 0x0004;
TVS_NOHSCROLL       = 0x8000;
TVS_NONEVENHEIGHT   = 0x4000;
TVS_NOSCROLL        = 0x2000;
TVS_NOTOOLTIPS      = 0x0080;
TVS_RTLREADING      = 0x0040;
TVS_SHOWSELALWAYS   = 0x0020;
TVS_SINGLEEXPAND    = 0x0400;
TVS_TRACKSELECT     = 0x0200;

//Class "msctls_updown32"
//Up-Down control styles http://msdn.microsoft.com/en-us/library/windows/desktop/bb759885%28v=vs.85%29.aspx
UDS_ALIGNLEFT   = 0x0008;
UDS_ALIGNRIGHT  = 0x0004;
UDS_ARROWKEYS   = 0x0020;
UDS_AUTOBUDDY   = 0x0010;
UDS_HORZ        = 0x0040;
UDS_HOTTRACK    = 0x0100;
UDS_NOTHOUSANDS = 0x0080;
UDS_SETBUDDYINT = 0x0002;
UDS_WRAP        = 0x0001;

(Scale =
{
  Init: function()
  {
    var hWnd = AkelPad.GetMainWnd();
    var hDC  = AkelPad.SystemFunction().Call("User32::GetDC", hWnd);
    this.ScaleX = AkelPad.SystemFunction().Call("Gdi32::GetDeviceCaps", hDC, 88 /*LOGPIXELSX*/);
    this.ScaleY = AkelPad.SystemFunction().Call("Gdi32::GetDeviceCaps", hDC, 90 /*LOGPIXELSY*/);
    AkelPad.SystemFunction().Call("User32::ReleaseDC", hWnd, hDC);
    //Align to 16 pixel
    this.ScaleX += (16 - this.ScaleX % 16) % 16;
    this.ScaleY += (16 - this.ScaleY % 16) % 16;
  },
  X:  function(n) {return AkelPad.SystemFunction().Call("Kernel32::MulDiv", n, this.ScaleX, 96);},
  Y:  function(n) {return AkelPad.SystemFunction().Call("Kernel32::MulDiv", n, this.ScaleY, 96);},
  UX: function(n) {return AkelPad.SystemFunction().Call("Kernel32::MulDiv", n, 96, this.ScaleX);},
  UY: function(n) {return AkelPad.SystemFunction().Call("Kernel32::MulDiv", n, 96, this.ScaleY);}
}).Init();

function CreateDialogWindow(aDlg, nWhat, hDlg, nStartID, nEndID)
{
  var oSys      = AkelPad.SystemFunction();
  var hInstDLL  = AkelPad.GetInstanceDll();
  var lpRect    = AkelPad.MemAlloc(16 /*sizeof(RECT)*/);
  var nWndCount = 0;
  var nFX       = 0;
  var nFY       = 0;
  var nDlgX, nDlgY, nDlgW, nDlgH;
  var nParX, nParY, nParW, nParH;
  var nCtlX, nCtlY, nCtlW, nCtlH;
  var sCtlClass;
  var i;
  
  if ((nWhat !== 1) && (nWhat !== 2)) nWhat = 0;

  //create dialog
  if ((nWhat < 2) && (! aDlg.HWND))
  {
    if (aDlg.Style & WS_CHILD) aDlg.Style ^= WS_CHILD;

    if ((aDlg.Style & WS_SIZEBOX) && ((aDlg.Style & WS_BORDER) || (aDlg.Style & WS_DLGFRAME)))
    {
      nFX = oSys.Call("User32::GetSystemMetrics", 32 /*SM_CXSIZEFRAME*/) * 2;
      nFY = oSys.Call("User32::GetSystemMetrics", 33 /*SM_CYSIZEFRAME*/) * 2;
    }
    else if ((aDlg.Style & WS_SIZEBOX) || (aDlg.Style & WS_DLGFRAME))
    {
      nFX = oSys.Call("User32::GetSystemMetrics", 7 /*SM_CXDLGFRAME*/) * 2;
      nFY = oSys.Call("User32::GetSystemMetrics", 8 /*SM_CYDLGFRAME*/) * 2;
    }
    else if (aDlg.Style & WS_BORDER)
    {
      nFX = oSys.Call("User32::GetSystemMetrics", 5 /*SM_CXBORDER*/) * 2;
      nFY = oSys.Call("User32::GetSystemMetrics", 6 /*SM_CYBORDER*/) * 2;
    }

    if (aDlg.Style & WS_VSCROLL)
      nFX += oSys.Call("User32::GetSystemMetrics", 2 /*SM_CXVSCROLL*/);
    if (aDlg.Style & WS_HSCROLL)
      nFY += oSys.Call("User32::GetSystemMetrics", 3 /*SM_CYHSCROLL*/);
    if ((aDlg.Style & WS_BORDER) && (aDlg.Style & WS_DLGFRAME))
      nFY += oSys.Call("User32::GetSystemMetrics", 4 /*SM_CYCAPTION*/);
    if (oSys.Call("User32::IsMenu", aDlg.Menu))
      nFY += oSys.Call("User32::GetSystemMetrics", 15 /*SM_CYMENU*/);

    nDlgX = Scale.X(aDlg.X || 0);
    nDlgY = Scale.Y(aDlg.Y || 0);
    nDlgW = aDlg.W || 0;
    nDlgH = aDlg.H || 0;

    if (aDlg.SizeClt)
    {
      nDlgW = Scale.X(nDlgW) + ((nDlgW < 0) ? -nFX : nFX);
      nDlgH = Scale.Y(nDlgH) + ((nDlgH < 0) ? -nFY : nFY);
    }
    else
    {
      if (nDlgW > nFX)
        nDlgW = Scale.X(nDlgW - nFX) + nFX;
      else if (nDlgW < -nFX)
        nDlgW = Scale.X(nDlgW + nFX) - nFX;

      if (nDlgH > nFY)
        nDlgH = Scale.Y(nDlgH - nFY) + nFY;
      else if (nDlgH < -nFY)
        nDlgH = Scale.Y(nDlgH + nFY) - nFY;
    }

    if (aDlg.PosPar == 1)
      oSys.Call("User32::SystemParametersInfoW", 0x30 /*SPI_GETWORKAREA*/, 0, lpRect, 0);
    else if ((aDlg.PosPar == 2) && oSys.Call("User32::IsWindow", aDlg.Parent))
      oSys.Call("User32::GetWindowRect", aDlg.Parent, lpRect);
    else if ((aDlg.PosPar == 3) && oSys.Call("User32::IsWindow", aDlg.Parent))
    {
      oSys.Call("User32::GetClientRect", aDlg.Parent, lpRect);
      oSys.Call("User32::ClientToScreen", aDlg.Parent, lpRect);
      oSys.Call("User32::ClientToScreen", aDlg.Parent, lpRect + 8);
    }
    else if ((aDlg.PosPar == 4) && oSys.Call("User32::IsWindow", aDlg.PosRect))
      oSys.Call("User32::GetWindowRect", aDlg.PosRect, lpRect);
    else if ((aDlg.PosPar == 5) && oSys.Call("User32::IsWindow", aDlg.PosRect))
    {
      oSys.Call("User32::GetClientRect", aDlg.PosRect, lpRect);
      oSys.Call("User32::ClientToScreen", aDlg.PosRect, lpRect);
      oSys.Call("User32::ClientToScreen", aDlg.PosRect, lpRect + 8);
    }
    else if ((aDlg.PosPar == 6) && aDlg.PosRect)
    {
      for (i = 0; i < 16; i += 4)
        AkelPad.MemCopy(lpRect + i, AkelPad.MemRead(aDlg.PosRect + i, 3 /*DT_DWORD*/), 3 /*DT_DWORD*/);
    }
    else if ((aDlg.PosPar == 7) && aDlg.PosRect)
    {
      for (i = 0; i < 4; ++i)
        AkelPad.MemCopy(lpRect + i * 4, aDlg.PosRect[i], 3 /*DT_DWORD*/);
    }
    else if (aDlg.PosPar == 8)
    {
      oSys.Call("User32::GetCursorPos", lpRect);
      oSys.Call("User32::GetCursorPos", lpRect + 8);
    }
    else
      oSys.Call("User32::GetWindowRect", oSys.Call("User32::GetDesktopWindow"), lpRect);

    nParX = AkelPad.MemRead(lpRect,      3 /*DT_DWORD*/);
    nParY = AkelPad.MemRead(lpRect +  4, 3 /*DT_DWORD*/);
    nParW = AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/) - nParX;
    nParH = AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/) - nParY;
    nDlgX += nParX;
    nDlgY += nParY;

    if (aDlg.PosEdge)
    {
      aDlg.PosEdge = aDlg.PosEdge.toUpperCase();

      if (aDlg.PosEdge.charAt(0) == "R")
        nDlgX += nParW;
      else if (aDlg.PosEdge.charAt(0) == "C")
        nDlgX = nParX + (nParW - nDlgW) / 2;

      if (aDlg.PosEdge.charAt(1) == "B")
        nDlgY += nParH;
      else if (aDlg.PosEdge.charAt(1) == "C")
        nDlgY = nParY + (nParH - nDlgH) / 2;
    }

    if (nDlgW < 0)
    {
      nDlgW = -nDlgW;
      nDlgX -= nDlgW;
    }
    if (nDlgH < 0)
    {
      nDlgH = -nDlgH;
      nDlgY -= nDlgH;
    }

    aDlg.HWND = oSys.Call("User32::CreateWindowExW",
      aDlg.ExStyle,  //dwExStyle
      aDlg.Class,    //lpClassName
      aDlg.Title,    //lpWindowName
      aDlg.Style,    //dwStyle
      nDlgX,         //x
      nDlgY,         //y
      nDlgW,         //nWidth
      nDlgH,         //nHeight
      aDlg.Parent,   //hWndParent
      aDlg.Menu,     //hMenu
      hInstDLL,      //hInstance
      aDlg.Callback);//lpParam

    if (aDlg.HWND)
    {
      ++nWndCount;
      if (aDlg.Icon)
      {
        AkelPad.SendMessage(aDlg.HWND, 128 /*WM_SETICON*/, 0 /*ICON_SMALL*/, aDlg.Icon);
        AkelPad.SendMessage(aDlg.HWND, 128 /*WM_SETICON*/, 1 /*ICON_BIG*/,   aDlg.Icon);
      }
    }
  }

  //create controls
  if ((nWhat == 0) || (nWhat == 2))
  {
    hDlg = hDlg || aDlg.HWND;

    if (hDlg)
    {
      oSys.Call("User32::GetClientRect", hDlg, lpRect);
      nDlgW = AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/);
      nDlgH = AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/);

      if (arguments.length < 5)
      {
        if (arguments.length < 4) nStartID = aDlg.CtlFirst || 0;
        nEndID = aDlg.length - 1;
      }
      nEndID = Math.max(nStartID, nEndID);

      for (i = nStartID; i <= nEndID; ++i)
      {
        if (aDlg[i])
        {
          sCtlClass = aDlg[i].Class || aDlg.CtlClass || "BUTTON";

          aDlg[i].Style |= aDlg.CtlStyle | WS_CHILD;
          if (aDlg[i].Style & WS_POPUP) aDlg[i].Style ^= WS_POPUP;

          nCtlX = Scale.X(aDlg[i].X || 0);
          nCtlY = Scale.Y(aDlg[i].Y || 0);
          nCtlW = Scale.X(aDlg[i].W || 0);
          nCtlH = Scale.Y(aDlg[i].H || 0);

          if (aDlg[i].PosEdge)
          {
            aDlg[i].PosEdge = aDlg[i].PosEdge.toUpperCase();

            if (aDlg[i].PosEdge.charAt(0) == "R")
              nCtlX += nDlgW;
            else if (aDlg[i].PosEdge.charAt(0) == "C")
              nCtlX = (nDlgW - nCtlW) / 2;

            if (aDlg[i].PosEdge.charAt(1) == "B")
              nCtlY += nDlgH;
            else if (aDlg[i].PosEdge.charAt(1) == "C")
              nCtlY = (nDlgH - nCtlH) / 2;
          }

          if (nCtlW < 0)
          {
            nCtlW = -nCtlW;
            nCtlX -= nCtlW;
          }
          if (nCtlH < 0)
          {
            nCtlH = -nCtlH;
            nCtlY -= nCtlH;
          }

          aDlg[i].HWND = oSys.Call("User32::CreateWindowExW",
            aDlg[i].ExStyle,//dwExStyle
            sCtlClass,      //lpClassName
            aDlg[i].Title,  //lpWindowName
            aDlg[i].Style,  //dwStyle
            nCtlX,          //x
            nCtlY,          //y
            nCtlW,          //nWidth
            nCtlH,          //nHeight
            hDlg,           //hWndParent
            i,              //ID
            hInstDLL,       //hInstance
            0);             //lpParam

          if (aDlg[i].HWND)
          {
            ++nWndCount;
            AkelPad.SendMessage(aDlg[i].HWND, 48 /*WM_SETFONT*/, aDlg[i].Font || aDlg.CtlFont, true);
          }
        }
      }
    }
  }

  AkelPad.MemFree(lpRect);
  return nWndCount;
}

function CreateDialogBox(aDlg, bTemplate, nStartID, nEndID)
{
  var oSys      = AkelPad.SystemFunction();
  var nCtlCount = 0;
  var nResult   = aDlg.Modeless ? 0 : -1;
  var sTitle    = aDlg.Title || "";
  var nCtlFontS = aDlg.CtlFontS || 8;
  var nTempLen  = 30 + (sTitle.length + 1) * 2;
  var lpTemp;
  var lpItem;
  var sCtlClass;
  var sCtlTitle;
  var i;

  if (arguments.length < 4)
  {
    if (arguments.length < 3) nStartID = aDlg.CtlFirst || 0;
    nEndID = aDlg.length - 1;
  }
  nEndID = Math.max(nStartID, nEndID);

  if (aDlg.Style & WS_CHILD) aDlg.Style ^= WS_CHILD;

  if (aDlg.CtlFontN)
  {
    aDlg.Style |= DS_SETFONT;
    nTempLen   += 6 + (aDlg.CtlFontN.length + 1) * 2;
  }
  else if (aDlg.Style & DS_SETFONT)
    aDlg.Style ^= DS_SETFONT;

  nTempLen += (4 - nTempLen % 4) % 4; //align to DWORD

  for (i = nStartID; i <= nEndID; ++i)
  {
    if (aDlg[i])
    {
      sCtlClass = aDlg[i].Class || aDlg.CtlClass || "BUTTON";
      sCtlTitle = aDlg[i].Title || "";

      aDlg[i].Style |= aDlg.CtlStyle | WS_CHILD;
      if (aDlg[i].Style & WS_POPUP) aDlg[i].Style ^= WS_POPUP;

      nTempLen += 26 + (sCtlClass.length + 1) * 2 + (sCtlTitle.length + 1) * 2;
      nTempLen += (4 - nTempLen % 4) % 4; //align to DWORD
      ++nCtlCount;
    }
  }

  lpTemp = AkelPad.MemAlloc(nTempLen);
  lpItem = lpTemp;

  //fill DLGTEMPLATEEX
  AkelPad.MemCopy(lpItem,                     1, 4 /*DT_WORD*/);   //dlgVer
  AkelPad.MemCopy(lpItem +  2,           0xFFFF, 4 /*DT_WORD*/);   //signature
  AkelPad.MemCopy(lpItem +  8,     aDlg.ExStyle, 3 /*DT_DWORD*/);  //exStyle
  AkelPad.MemCopy(lpItem + 12,       aDlg.Style, 3 /*DT_DWORD*/);  //style
  AkelPad.MemCopy(lpItem + 16,        nCtlCount, 4 /*DT_WORD*/);   //cDlgItems
  AkelPad.MemCopy(lpItem + 18,           aDlg.X, 4 /*DT_WORD*/);   //x
  AkelPad.MemCopy(lpItem + 20,           aDlg.Y, 4 /*DT_WORD*/);   //y
  AkelPad.MemCopy(lpItem + 22, Math.abs(aDlg.W), 4 /*DT_WORD*/);   //cx
  AkelPad.MemCopy(lpItem + 24, Math.abs(aDlg.H), 4 /*DT_WORD*/);   //cy
  AkelPad.MemCopy(lpItem + 30,           sTitle, 1 /*DT_UNICODE*/);//title
  lpItem += 30 + (sTitle.length + 1) * 2;
  if (aDlg.CtlFontN)
  {
    AkelPad.MemCopy(lpItem,         nCtlFontS, 4 /*DT_WORD*/);   //pointsize
    AkelPad.MemCopy(lpItem + 4, aDlg.CtlFontI, 5 /*DT_BYTE*/);   //italic
    AkelPad.MemCopy(lpItem + 5,             1, 5 /*DT_BYTE*/);   //charset=DEFAULT_CHARSET
    AkelPad.MemCopy(lpItem + 6, aDlg.CtlFontN, 1 /*DT_UNICODE*/);//typeface
    lpItem += 6 + (aDlg.CtlFontN.length + 1) * 2;
  }
  lpItem += (4 - lpItem % 4) % 4; //align to DWORD

  //fill DLGITEMTEMPLATEEX
  for (i = nStartID; i <= nEndID; ++i)
  {
    if (aDlg[i])
    {
      sCtlClass = aDlg[i].Class || aDlg.CtlClass || "BUTTON";
      sCtlTitle = aDlg[i].Title || "";
      AkelPad.MemCopy(lpItem +  4,     aDlg[i].ExStyle, 3 /*DT_DWORD*/);  //exStyle
      AkelPad.MemCopy(lpItem +  8,       aDlg[i].Style, 3 /*DT_DWORD*/);  //style
      AkelPad.MemCopy(lpItem + 12,           aDlg[i].X, 4 /*DT_WORD*/);   //x
      AkelPad.MemCopy(lpItem + 14,           aDlg[i].Y, 4 /*DT_WORD*/);   //y
      AkelPad.MemCopy(lpItem + 16, Math.abs(aDlg[i].W), 4 /*DT_WORD*/);   //cx
      AkelPad.MemCopy(lpItem + 18, Math.abs(aDlg[i].H), 4 /*DT_WORD*/);   //cy
      AkelPad.MemCopy(lpItem + 20,                   i, 3 /*DT_DWORD*/);  //id
      AkelPad.MemCopy(lpItem + 24,           sCtlClass, 1 /*DT_UNICODE*/);//windowClass
      lpItem += 24 + (sCtlClass.length + 1) * 2;
      AkelPad.MemCopy(lpItem,                sCtlTitle, 1 /*DT_UNICODE*/);//title
      lpItem += (sCtlTitle.length + 1) * 2 + 2;
      lpItem += (4 - lpItem % 4) % 4; //align to DWORD
    }
  }

  if (bTemplate) return lpTemp;

  if (RegisterCallback())
  {
    nResult = oSys.Call(aDlg.Modeless ? "User32::CreateDialogIndirectParamW" : "User32::DialogBoxIndirectParamW",
      AkelPad.GetInstanceDll(),                                     //hInstance
      lpTemp,                                                       //lpTemplate
      aDlg.Parent,                                                  //hWndParent
      CreateDialogBox.Callback[CreateDialogBox.Callback.length - 1],//lpDialogFunc
      aDlg.InitParam);                                              //lParamInit

    if (aDlg.Modeless)
    {
      if (! nResult) UnregisterCallback();
    }
    else
    {
      if ((! nResult) && aDlg.Parent && (! oSys.Call("User32::IsWindow", aDlg.Parent))) nResult = -1;
      if (nResult == -1) UnregisterCallback();
    }
  }

  AkelPad.MemFree(lpTemp);
  return nResult;

  function CreateDialogBoxCallback(hWnd, uMsg, wParam, lParam)
  {
    if (uMsg == 272 /*WM_INITDIALOG*/)
    {
      var lpRectW, lpRectC;
      var nDlgX, nDlgY, nDlgW, nDlgH;
      var nParX, nParY, nParW, nParH;
      var nCtlX, nCtlY, nCtlW, nCtlH;
      var nFX, nFY;
      var i;

      aDlg.HWND = hWnd;

      for (i = nStartID; i <= nEndID; ++i)
      {
        if (aDlg[i]) aDlg[i].HWND = oSys.Call("User32::GetDlgItem", hWnd, i);
      }

      if (oSys.Call("User32::IsMenu", aDlg.Menu)) oSys.Call("User32::SetMenu", hWnd, aDlg.Menu);

      if (aDlg.Icon)
      {
        AkelPad.SendMessage(hWnd, 128 /*WM_SETICON*/, 0 /*ICON_SMALL*/, aDlg.Icon);
        AkelPad.SendMessage(hWnd, 128 /*WM_SETICON*/, 1 /*ICON_BIG*/,   aDlg.Icon);
      }

      if (aDlg.PosPix)
      {
        lpRectW = AkelPad.MemAlloc(16 /*sizeof(RECT)*/);
        lpRectC = AkelPad.MemAlloc(16);

        oSys.Call("User32::GetWindowRect", hWnd, lpRectW);
        oSys.Call("User32::GetClientRect", hWnd, lpRectC);
        nFX = AkelPad.MemRead(lpRectW +  8, 3 /*DT_DWORD*/) - AkelPad.MemRead(lpRectW,     3 /*DT_DWORD*/) - AkelPad.MemRead(lpRectC +  8, 3 /*DT_DWORD*/);
        nFY = AkelPad.MemRead(lpRectW + 12, 3 /*DT_DWORD*/) - AkelPad.MemRead(lpRectW + 4, 3 /*DT_DWORD*/) - AkelPad.MemRead(lpRectC + 12, 3 /*DT_DWORD*/);

        nDlgX = Scale.X(aDlg.X || 0);
        nDlgY = Scale.Y(aDlg.Y || 0);
        nDlgW = Scale.X(aDlg.W || 0);
        nDlgH = Scale.Y(aDlg.H || 0);
        nDlgW += (nDlgW < 0) ? -nFX : nFX;
        nDlgH += (nDlgH < 0) ? -nFY : nFY;

        if (aDlg.PosPar == 1)
          oSys.Call("User32::SystemParametersInfoW", 0x30 /*SPI_GETWORKAREA*/, 0, lpRectW, 0);
        else if ((aDlg.PosPar == 2) && oSys.Call("User32::IsWindow", aDlg.Parent))
          oSys.Call("User32::GetWindowRect", aDlg.Parent, lpRectW);
        else if ((aDlg.PosPar == 3) && oSys.Call("User32::IsWindow", aDlg.Parent))
        {
          oSys.Call("User32::GetClientRect", aDlg.Parent, lpRectW);
          oSys.Call("User32::ClientToScreen", aDlg.Parent, lpRectW);
          oSys.Call("User32::ClientToScreen", aDlg.Parent, lpRectW + 8);
        }
        else if ((aDlg.PosPar == 4) && oSys.Call("User32::IsWindow", aDlg.PosRect))
          oSys.Call("User32::GetWindowRect", aDlg.PosRect, lpRectW);
        else if ((aDlg.PosPar == 5) && oSys.Call("User32::IsWindow", aDlg.PosRect))
        {
          oSys.Call("User32::GetClientRect", aDlg.PosRect, lpRectW);
          oSys.Call("User32::ClientToScreen", aDlg.PosRect, lpRectW);
          oSys.Call("User32::ClientToScreen", aDlg.PosRect, lpRectW + 8);
        }
        else if ((aDlg.PosPar == 6) && aDlg.PosRect)
        {
          for (i = 0; i < 16; i += 4)
            AkelPad.MemCopy(lpRectW + i, AkelPad.MemRead(aDlg.PosRect + i, 3 /*DT_DWORD*/), 3 /*DT_DWORD*/);
        }
        else if ((aDlg.PosPar == 7) && aDlg.PosRect)
        {
          for (i = 0; i < 4; ++i)
            AkelPad.MemCopy(lpRectW + i * 4, aDlg.PosRect[i], 3 /*DT_DWORD*/);
        }
        else if (aDlg.PosPar == 8)
        {
          oSys.Call("User32::GetCursorPos", lpRectW);
          oSys.Call("User32::GetCursorPos", lpRectW + 8);
        }
        else
          oSys.Call("User32::GetWindowRect", oSys.Call("User32::GetDesktopWindow"), lpRectW);

        nParX = AkelPad.MemRead(lpRectW,      3 /*DT_DWORD*/);
        nParY = AkelPad.MemRead(lpRectW +  4, 3 /*DT_DWORD*/);
        nParW = AkelPad.MemRead(lpRectW +  8, 3 /*DT_DWORD*/) - nParX;
        nParH = AkelPad.MemRead(lpRectW + 12, 3 /*DT_DWORD*/) - nParY;
        nDlgX += nParX;
        nDlgY += nParY;

        if (aDlg.PosEdge)
        {
          aDlg.PosEdge = aDlg.PosEdge.toUpperCase();
    
          if (aDlg.PosEdge.charAt(0) == "R")
            nDlgX += nParW;
          else if (aDlg.PosEdge.charAt(0) == "C")
            nDlgX = nParX + (nParW - nDlgW) / 2;
    
          if (aDlg.PosEdge.charAt(1) == "B")
            nDlgY += nParH;
          else if (aDlg.PosEdge.charAt(1) == "C")
            nDlgY = nParY + (nParH - nDlgH) / 2;
        }

        if (nDlgW < 0)
        {
          nDlgW = -nDlgW;
          nDlgX -= nDlgW;
        }
        if (nDlgH < 0)
        {
          nDlgH = -nDlgH;
          nDlgY -= nDlgH;
        }

        oSys.Call("User32::MoveWindow", hWnd, nDlgX, nDlgY, nDlgW, nDlgH, 0);
        oSys.Call("User32::GetClientRect", hWnd, lpRectC);
        nDlgW = AkelPad.MemRead(lpRectC +  8, 3 /*DT_DWORD*/);
        nDlgH = AkelPad.MemRead(lpRectC + 12, 3 /*DT_DWORD*/);

        for (i = nStartID; i <= nEndID; ++i)
        {
          nCtlX = Scale.X(aDlg[i].X || 0);
          nCtlY = Scale.Y(aDlg[i].Y || 0);
          nCtlW = Scale.X(aDlg[i].W || 0);
          nCtlH = Scale.Y(aDlg[i].H || 0);

          if (aDlg[i].PosEdge)
          {
            aDlg[i].PosEdge = aDlg[i].PosEdge.toUpperCase();

            if (aDlg[i].PosEdge.charAt(0) == "R")
              nCtlX += nDlgW;
            else if (aDlg[i].PosEdge.charAt(0) == "C")
              nCtlX = (nDlgW - nCtlW) / 2;

            if (aDlg[i].PosEdge.charAt(1) == "B")
              nCtlY += nDlgH;
            else if (aDlg[i].PosEdge.charAt(1) == "C")
              nCtlY = (nDlgH - nCtlH) / 2;
          }

          if (nCtlW < 0)
          {
            nCtlW = -nCtlW;
            nCtlX -= nCtlW;
          }
          if (nCtlH < 0)
          {
            nCtlH = -nCtlH;
            nCtlY -= nCtlH;
          }

          oSys.Call("User32::MoveWindow", aDlg[i].HWND, nCtlX, nCtlY, nCtlW, nCtlH, 0);
        }

        AkelPad.MemFree(lpRectW);
        AkelPad.MemFree(lpRectC);
      }

      aDlg.Callback(hWnd, uMsg, wParam, lParam);
      if (aDlg.Modeless) AkelPad.WindowRegisterDialog(hWnd); //Register dialog for message loop (modeless dialog created without WindowRegisterClass).

      return 0;
    }

    aDlg.Callback(hWnd, uMsg, wParam, lParam);

    if (uMsg == 2 /*WM_DESTROY*/)
    {
      if (aDlg.Modeless) AkelPad.WindowUnregisterDialog(hWnd);
      UnregisterCallback();
    }

    return 0;
  }

  function RegisterCallback()
  {
    if (! CreateDialogBox.Callback) CreateDialogBox.Callback = [];
    try
    {
      CreateDialogBox.Callback[CreateDialogBox.Callback.length] = oSys.RegisterCallback(CreateDialogBoxCallback);
      return true;
    }
    catch (oError)
    {
      WScript.Echo("Unable to register callback function.");
      return false;
    }
  }

  function UnregisterCallback()
  {
    oSys.UnregisterCallback(CreateDialogBox.Callback[CreateDialogBox.Callback.length - 1]);
    --CreateDialogBox.Callback.length;
  }
}
