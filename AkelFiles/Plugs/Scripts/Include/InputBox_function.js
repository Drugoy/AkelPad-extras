// InputBox_function.js - ver. 2014-06-03 (x86/x64)
//
// InputBox with multiple edit value and variable window width.
// Window width adjusts to the length of caption and labels.
//
// Usage:
// if (! AkelPad.Include("InputBox_function.js")) WScript.Quit();
// vRetVal = InputBox(hWndOwn, sCaption, vLabelT, vEdit, nFocus, oFunction, vFuncArg, nMinEditW, vLabelB, vLabelL, vLabelR);
//
// Arguments (all are optional):
// hWndOwn (number)
//   Handle to the owner window of the input box. Default is 0 - desktop window.
// sCaption (string)
//   Dialog box title. Default is "".
// vLabelT (string or array of strings)
//   Top labels of edit boxes. In string can use "\n" to create multiline label.
// vEdit (string or array of strings)
//   Edit boxes texts. Maximum length of edit text is 32767 characters. Default is "".
//   Maximum number of elements in array is 100.
// nFocus (number)
//   Index of vEdit array item, on which will set keyboard focus. First and default is 0.
// oFunction (object Function or string as function name)
//   Name of the function used to validate entered data.
//   The function is called when pressed button "OK", but before closing dialog box.
//   To the function are passed three arguments:
//     - handle to dialog box,
//     - array containing all of input strings,
//     - vFuncArg (optional).
//   If input strings are valid, the function should return -1. Otherwise, index of incorrect string in array.
// vFuncArg (any type)
//   Additional argument passed to oFunction.
// nMinEditW (number)
//   Minimum width of edit controls in pixels. Default is 20. The actual field width is adjusted to the width of dialog box.
// vLabelB (string or array of strings)
//   Bottom labels of edit boxes. In string can use "\n" to create multiline label.
// vLabelL (string or array of strings)
//   Left labels of edit boxes.
// vLabelR (string or array of strings)
//   Right labels of edit boxes.
//
// Return value:
//   undefined - if pressed Cancel button or Esc key,
//   array of strings - edit boxes texts, if vEdit is array,
//   string -  edit box text, otherwise.

function InputBox(hWndOwn, sCaption, vLabelT, vEdit, nFocus, oFunc, vFuncArg, nMinEditW, vLabelB, vLabelL, vLabelR)
{
  var oSys = AkelPad.SystemFunction();
  var vRetVal;

  try
  {
    oSys.RegisterCallback(InputBoxCallback);
  }
  catch (oError)
  {
    WScript.Echo("Unable to register callback function.");
    return vRetVal;
  }

  var hInstDLL = AkelPad.GetInstanceDll();
  var hIcon    = oSys.Call("User32::LoadImageW", hInstDLL, 101 /*lpszName*/, 1 /*uType=IMAGE_ICON*/, 0, 0, 0x40 /*fuLoad=LR_DEFAULTSIZE*/);
  var nGroups  = 1;
  var sTxtOK;
  var sTxtCancel;
  var aLabelT;
  var aLabelB;
  var aLabelL;
  var aLabelR;
  var aEdit;
  var lpTemp;
  var lpItem;
  var i;

  switch (AkelPad.GetLangId(0 /*LANGID_FULL*/))
  {
    case 1045 : //Polish
      sTxtOK     = "OK";
      sTxtCancel = "Anuluj";
      break;
    case 1049 : //Russian
      sTxtOK     = "\u041E\u041A";
      sTxtCancel = "\u041E\u0442\u043C\u0435\u043D\u0430";
      break;
    case 2052 : //Chinese-Simplified (by cnnnc)
      sTxtOK     = "\u786E\u5B9A";
      sTxtCancel = "\u53D6\u6D88";
      break;
    default :
      sTxtOK     = "OK";
      sTxtCancel = "Cancel";
  }

  if ((typeof hWndOwn != "number") || (! oSys.Call("User32::IsWindow", hWndOwn)))
    hWndOwn = oSys.Call("User32::GetDesktopWindow");

  if (typeof sCaption != "string")
    sCaption = "";

  if (typeof vEdit == "string")
    aEdit = [vEdit];
  else if ((vEdit instanceof Array) && vEdit.length)
    aEdit = vEdit.slice(0);
  else
    aEdit = [""];

  if (aEdit.length > 100)
    aEdit.length = 100;

  if (typeof vLabelT == "string")
    aLabelT = [vLabelT];
  else if ((vLabelT instanceof Array) && vLabelT.length)
    aLabelT = vLabelT.slice(0);

  if (typeof vLabelB == "string")
    aLabelB = [vLabelB];
  else if ((vLabelB instanceof Array) && vLabelB.length)
    aLabelB = vLabelB.slice(0);

  if (typeof vLabelL == "string")
    aLabelL = [vLabelL];
  else if ((vLabelL instanceof Array) && vLabelL.length)
    aLabelL = vLabelL.slice(0);

  if (typeof vLabelR == "string")
    aLabelR = [vLabelR];
  else if ((vLabelR instanceof Array) && vLabelR.length)
    aLabelR = vLabelR.slice(0);

  for (i = 0; i < aEdit.length; ++i)
  {
    if (typeof aEdit[i] != "string")
      aEdit[i] = "";

    if (aLabelT)
    {
      if (typeof aLabelT[i] == "string")
        aLabelT[i] = aLabelT[i].split("\n");
      else
        aLabelT[i] = undefined;
    }

    if (aLabelB)
    {
      if (typeof aLabelB[i] == "string")
        aLabelB[i] = aLabelB[i].split("\n");
      else
        aLabelB[i] = undefined;
    }

    if (aLabelL && (typeof aLabelL[i] != "string"))
      aLabelL[i] = undefined;

    if (aLabelR && (typeof aLabelR[i] != "string"))
      aLabelR[i] = undefined;
  }

  if ((typeof nFocus != "number") || (nFocus < 0))
    nFocus = 0;
  else if (nFocus >= aEdit.length)
    nFocus = aEdit.length - 1;

  if (typeof oFunc != "function")
  {
    if (typeof oFunc == "string")
      oFunc = eval(oFunc);

    if (typeof oFunc != "function")
      oFunc = undefined;
  }

  if ((typeof nMinEditW != "number") || (nMinEditW < 20))
    nMinEditW = 20;

  if (aLabelT) ++nGroups;
  if (aLabelB) ++nGroups;
  if (aLabelL) ++nGroups;
  if (aLabelR) ++nGroups;

  lpTemp = AkelPad.MemAlloc(24 + (2 + aEdit.length * nGroups) * 28);

  //Dialog
  AkelPad.MemCopy(lpTemp,     0x90C80000,  3 /*DT_DWORD*/); //style (WS_POPUP|WS_VISIBLE|WS_CAPTION|WS_SYSMENU)
  AkelPad.MemCopy(lpTemp + 8, 2 + aEdit.length * nGroups, 4 /*DT_WORD*/); //cdit

  //Buttons
  lpItem = lpTemp + 24;
  CopyToTemplate(0x50010001 /*WS_CHILD|WS_VISIBLE|WS_TABSTOP|BS_DEFPUSHBUTTON*/, 0, 2000, 0x80 /*Button*/);
  lpItem += 28;
  CopyToTemplate(0x50010000 /*WS_CHILD|WS_VISIBLE|WS_TABSTOP*/, 0, 2001, 0x80);

  //Edits and Labels
  for (i = 0; i < aEdit.length; ++i)
  {
    lpItem += 28;
    CopyToTemplate(0x50010080 /*WS_CHILD|WS_VISIBLE|WS_TABSTOP|ES_AUTOHSCROLL*/, 0x200 /*WS_EX_CLIENTEDGE*/, 3000 + i, 0x0081 /*Edit*/);

    if (aLabelT)
    {
      lpItem += 28;
      CopyToTemplate(0x5000008C /*WS_CHILD|WS_VISIBLE|SS_NOPREFIX|SS_LEFTNOWORDWRAP*/, 0, 3100 + i, 0x0082 /*Static*/);
    }

    if (aLabelB)
    {
      lpItem += 28;
      CopyToTemplate(0x5000008C /*WS_CHILD|WS_VISIBLE|SS_NOPREFIX|SS_LEFTNOWORDWRAP*/, 0, 3200 + i, 0x0082 /*Static*/);
    }

    if (aLabelL)
    {
      lpItem += 28;
      CopyToTemplate(0x5000008C /*WS_CHILD|WS_VISIBLE|SS_NOPREFIX|SS_LEFTNOWORDWRAP*/, 0, 3300 + i, 0x0082 /*Static*/);
    }

    if (aLabelR)
    {
      lpItem += 28;
      CopyToTemplate(0x5000008C /*WS_CHILD|WS_VISIBLE|SS_NOPREFIX|SS_LEFTNOWORDWRAP*/, 0, 3400 + i, 0x0082 /*Static*/);
    }
  }

  if (oSys.Call("User32::DialogBoxIndirectParamW", hInstDLL, lpTemp, hWndOwn, InputBoxCallback, 0) > 0)
  {
    if (vEdit instanceof Array)
      vRetVal = aEdit;
    else
      vRetVal = aEdit[0];
  }

  oSys.Call("User32::DestroyIcon", hIcon);
  oSys.UnregisterCallback(InputBoxCallback);
  AkelPad.MemFree(lpTemp);

  return vRetVal;

  function CopyToTemplate(nStyle, nExStyle, nID, nClass)
  {
    AkelPad.MemCopy(lpItem,      nStyle,   3 /*DT_DWORD*/); //style
    AkelPad.MemCopy(lpItem +  4, nExStyle, 3 /*DT_DWORD*/); //dwExtendedStyle
    AkelPad.MemCopy(lpItem + 16, nID,      4 /*DT_WORD*/);  //id
    AkelPad.MemCopy(lpItem + 18, 0xFFFF,   4 /*DT_WORD*/);  //next item is a predefined system class
    AkelPad.MemCopy(lpItem + 20, nClass,   4 /*DT_WORD*/);  //class
  }

  function InputBoxCallback(hWnd, uMsg, wParam, lParam)
  {
    switch (uMsg)
    {
      case 272 : //WM_INITDIALOG
        var Scale =
        {
          Init: function()
          {
            var hMainWnd = AkelPad.GetMainWnd();
            var hDC = oSys.Call("User32::GetDC", hMainWnd);
            this.ScaleX = oSys.Call("Gdi32::GetDeviceCaps", hDC, 88 /*LOGPIXELSX*/);
            this.ScaleY = oSys.Call("Gdi32::GetDeviceCaps", hDC, 90 /*LOGPIXELSY*/);
            oSys.Call("User32::ReleaseDC", hMainWnd, hDC);
            //Align to 16 pixel
            this.ScaleX += (16 - this.ScaleX % 16) % 16;
            this.ScaleY += (16 - this.ScaleY % 16) % 16;
          },
          X: function(n) {return oSys.Call("Kernel32::MulDiv", n, this.ScaleX, 96);},
          Y: function(n) {return oSys.Call("Kernel32::MulDiv", n, this.ScaleY, 96);}
        }
        Scale.Init();

        var lpRect   = AkelPad.MemAlloc(16); //sizeof(RECT)
        var hGuiFont = oSys.Call("Gdi32::GetStockObject", 17 /*DEFAULT_GUI_FONT*/);
        var nFX      = oSys.Call("User32::GetSystemMetrics",  7 /*SM_CXFIXEDFRAME*/);
        var nFY      = oSys.Call("User32::GetSystemMetrics",  8 /*SM_CYFIXEDFRAME*/);
        var nIX      = oSys.Call("User32::GetSystemMetrics", 49 /*SM_CXSMICON*/);
        var nSX      = oSys.Call("User32::GetSystemMetrics", 30 /*SM_CXSIZE*/);
        var nCY      = oSys.Call("User32::GetSystemMetrics",  4 /*SM_CYCAPTION*/);
        var nLabelH  = Scale.Y(13);
        var nEditH   = Scale.Y(20);
        var nButtonW = Scale.X(80);
        var nButtonH = Scale.Y(23);
        var nGapW    = Scale.X(10);
        var nGapH    = Scale.Y(10);
        var nLabelLW = GetTextMaxWidth(aLabelL, 0, hGuiFont);
        var nLabelRW = GetTextMaxWidth(aLabelR, 0, hGuiFont);
        var nClientW = Math.max(GetTextMaxWidth([sCaption]) + nIX + nSX + nGapW, Math.max(GetTextMaxWidth(aLabelT, aLabelB, hGuiFont), Scale.X(nMinEditW)) + nLabelLW + (nLabelLW ? 3 : 0) + nLabelRW + (nLabelRW ? 3 : 0) + nGapW * 2, Scale.X(80) * 2 + nGapW * 3);
        var nEditW   = nClientW - nLabelLW - (nLabelLW ? 3 : 0) - nLabelRW - (nLabelRW ? 3 : 0) - nGapW * 2;
        var nEditX   = nGapW + nLabelLW + (nLabelLW ? 3 : 0);
        var nLabelRX = nEditX + nEditW + 3;
        var nItemY;
        var nOwnX, nOwnY, nOwnW, nOwnH;
        var nDeskX1, nDeskY1, nDeskX2, nDeskY2;
        var nWndX, nWndY, nWndW, nWndH;
        var i;

        //Edits and Labels
        nItemY = nGapH;
        for (i = 0; i < aEdit.length; ++i)
        {
          if (aLabelT && aLabelT[i])
          {
            WindowMoveAndSetText(3100 + i, nEditX, nItemY, nEditW, nLabelH * aLabelT[i].length, aLabelT[i].join("\n"));
            nItemY += nLabelH * aLabelT[i].length + 3;
          }

          if (aLabelL && aLabelL[i])
            WindowMoveAndSetText(3300 + i, nGapW, nItemY + 3, nLabelLW, nLabelH, aLabelL[i]);

          if (aLabelR && aLabelR[i])
            WindowMoveAndSetText(3400 + i, nLabelRX, nItemY + 3, nLabelRW, nLabelH, aLabelR[i]);

          //Edit
          WindowMoveAndSetText(3000 + i, nEditX, nItemY, nEditW, nEditH, aEdit[i]);
          nItemY += nEditH;

          if (aLabelB && aLabelB[i])
          {
            nItemY += 3;
            WindowMoveAndSetText(3200 + i, nEditX, nItemY, nEditW, nLabelH * aLabelB[i].length, aLabelB[i].join("\n"));
            nItemY += nLabelH * aLabelB[i].length;
          }
          nItemY += nGapH;
        }

        //Buttons
        WindowMoveAndSetText(2000, (nClientW - nGapW) / 2 - nButtonW, nItemY, nButtonW, nButtonH, sTxtOK);
        WindowMoveAndSetText(2001, (nClientW + nGapW) / 2, nItemY, nButtonW, nButtonH, sTxtCancel);

        oSys.Call("User32::GetWindowRect", hWndOwn, lpRect);
        nOwnX = AkelPad.MemRead(lpRect,      3 /*DT_DWORD*/);
        nOwnY = AkelPad.MemRead(lpRect  + 4, 3 /*DT_DWORD*/);
        nOwnW = AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/) - nOwnX;
        nOwnH = AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/) - nOwnY;

        oSys.Call("User32::SystemParametersInfoW", 0x30 /*SPI_GETWORKAREA*/, 0, lpRect, 0);
        nDeskX1 = AkelPad.MemRead(lpRect     , 3 /*DT_DWORD*/);
        nDeskY1 = AkelPad.MemRead(lpRect +  4, 3 /*DT_DWORD*/);
        nDeskX2 = AkelPad.MemRead(lpRect +  8, 3 /*DT_DWORD*/);
        nDeskY2 = AkelPad.MemRead(lpRect + 12, 3 /*DT_DWORD*/);
        AkelPad.MemFree(lpRect);

        nWndW = nClientW + nFX * 2;
        nWndH = nItemY + nButtonH + nGapH + nFY * 2 + nCY;
        nWndX = nOwnX + (nOwnW - nWndW) / 2;
        nWndY = nOwnY + (nOwnH - nWndH) / 2;

        if ((nWndX + nWndW) > nDeskX2)
          nWndX = nDeskX2 - nWndW;
        if (nWndX < nDeskX1)
          nWndX = nDeskX1;
        if ((nWndY + nWndH) > nDeskY2)
          nWndY = nDeskY2 - nWndH;
        if (nWndY < nDeskY1)
          nWndY = nDeskY1;

        //Dialog
        oSys.Call("User32::SendMessageW", hWnd, 0x0080 /*WM_SETICON*/, 0 /*ICON_SMALL*/, hIcon);
        oSys.Call("User32::MoveWindow", hWnd, nWndX, nWndY, nWndW, nWndH, 0);
        oSys.Call("User32::SetWindowTextW", hWnd, sCaption);
        oSys.Call("User32::SetFocus", oSys.Call("User32::GetDlgItem", hWnd, 3000 + nFocus));
        oSys.Call("User32::SendDlgItemMessageW", hWnd, 3000 + nFocus, 177 /*EM_SETSEL*/, 0, -1);
        break;

      case 273 : //WM_COMMAND
        if (wParam == 2000)
        {
          var nEditLen = 32767;
          var lpEdit   = AkelPad.MemAlloc((nEditLen + 1) * 2);
          var nBadInd;
          var i;

          for (i = 0; i < aEdit.length; ++i)
          {
            oSys.Call("User32::GetDlgItemTextW", hWnd, 3000 + i, lpEdit, nEditLen);
            aEdit[i] = AkelPad.MemRead(lpEdit, 1 /*DT_UNICODE*/);
          }

          AkelPad.MemFree(lpEdit);

          if (oFunc)
            nBadInd = oFunc(hWnd, aEdit, vFuncArg);

          if ((typeof nBadInd == "number") && (nBadInd >= 0) && (nBadInd < aEdit.length))
          {
            oSys.Call("User32::SetFocus", oSys.Call("User32::GetDlgItem", hWnd, 3000 + nBadInd));
            oSys.Call("User32::SendDlgItemMessageW", hWnd, 3000 + nBadInd, 177 /*EM_SETSEL*/, 0, -1);
          }
          else
            oSys.Call("User32::PostMessageW", hWnd, 16 /*WM_CLOSE*/, 1, 0);
        }

        else if ((wParam == 2001) || (wParam == 2 /*IDCANCEL*/))
          oSys.Call("User32::PostMessageW", hWnd, 16 /*WM_CLOSE*/, 0, 0);
        break;

      case 16 : //WM_CLOSE
        oSys.Call("User32::DestroyIcon", oSys.Call("User32::SendMessageW", hWnd, 0x007F /*WM_GETICON*/, 0 /*ICON_SMALL*/, 0));
        oSys.Call("User32::EndDialog", hWnd, wParam);
    }

    return 0;

    function GetTextMaxWidth(aText1, aText2, hFont)
    {
      var nWidth = 0;
      var aText;
      var hDC;
      var lpSize;
      var i, n;

      if (aText1)
      {
        if (aText2)
          aText = aText1.concat(aText2);
        else
          aText = aText1;
      }
      else
        aText = aText2;

      if (aText)
      {
        hDC    = oSys.Call("User32::GetDC", hWnd);
        lpSize = AkelPad.MemAlloc(8);

        if (hFont)
          oSys.Call("Gdi32::SelectObject", hDC, hFont);

        oSys.Call("Gdi32::SetMapMode", hDC, 1 /*MM_TEXT*/);

        for (i = 0; i < aText.length; ++i)
        {
          if (aText[i])
          {
            if (aText[i] instanceof Array)
            {
              for (n = 0; n < aText[i].length; ++n)
              {
                oSys.Call("Gdi32::GetTextExtentPoint32W", hDC, aText[i][n], aText[i][n].length, lpSize);

                if (nWidth < AkelPad.MemRead(lpSize, 3 /*DT_DWORD*/))
                  nWidth = AkelPad.MemRead(lpSize, 3 /*DT_DWORD*/);
              }
            }
            else
            {
              oSys.Call("Gdi32::GetTextExtentPoint32W", hDC, aText[i], aText[i].length, lpSize);

              if (nWidth < AkelPad.MemRead(lpSize, 3 /*DT_DWORD*/))
                nWidth = AkelPad.MemRead(lpSize, 3 /*DT_DWORD*/);
            }
          }
        }

        oSys.Call("User32::ReleaseDC", hWnd, hDC); 
        AkelPad.MemFree(lpSize);
      }

      return nWidth;
    }

    function WindowMoveAndSetText(nID, nX, nY, nW, nH, sText)
    {
      oSys.Call("User32::MoveWindow", oSys.Call("User32::GetDlgItem", hWnd, nID), nX, nY, nW, nH, 0);
      oSys.Call("User32::SendDlgItemMessageW", hWnd, nID, 48 /*WM_SETFONT*/, hGuiFont, 0);
      oSys.Call("User32::SetDlgItemTextW", hWnd, nID, sText);
    }
  }
}
