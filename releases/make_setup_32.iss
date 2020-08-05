; Script generated by the Inno Setup Script Wizard.
; SEE THE DOCUMENTATION FOR DETAILS ON CREATING INNO SETUP SCRIPT FILES!

#define MyAppName "����������"
#define MyAppVersion "3.4.2"
#define MyAppExeName "photo-album.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
; Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{C898EE3F-37F7-4249-8FC0-60EBF71F487B}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
DefaultDirName={pf}\PhotoAlbum
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
OutputBaseFilename=Album setup
Compression=lzma
SolidCompression=yes

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\photo-album.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\set_ass.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\chrome_100_percent.pak"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\chrome_200_percent.pak"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\d3dcompiler_47.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\ffmpeg.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\icudtl.dat"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\libEGL.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\libGLESv2.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\LICENSES.chromium.html"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\natives_blob.bin"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\osmesa.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\resources.pak"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\snapshot_blob.bin"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\v8_context_snapshot.bin"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\version"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\VkICD_mock_icd.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\VkLayer_core_validation.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\VkLayer_object_tracker.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\VkLayer_parameter_validation.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\VkLayer_threading.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\VkLayer_unique_objects.dll"; DestDir: "{app}"; Flags: ignoreversion
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\locales\*"; DestDir: "{app}\locales"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\resources\*"; DestDir: "{app}\resources"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "C:\Users\User\Dropbox\node\photo_album\releases\photo-album-win32-ia32\swiftshader\*"; DestDir: "{app}\swiftshader"; Flags: ignoreversion recursesubdirs createallsubdirs
; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{commondesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]

procedure CurStepChanged(CurStep: TSetupStep);
var
  ErrorCode: Integer;
begin
  if curstep = ssPostInstall then
  begin
    SaveStringToFile(ExpandConstant('{app}\set_ass.bat'), '@echo off' + #13#10, True);
    SaveStringToFile(ExpandConstant('{app}\set_ass.bat'), 'ASSOC .utya=AlbumFile' + #13#10, True);
    SaveStringToFile(ExpandConstant('{app}\set_ass.bat'), ExpandConstant('FTYPE AlbumFile="{app}\photo-album.exe" "%%1"') + #13#10, True);
    SaveStringToFile(ExpandConstant('{app}\set_ass.bat'), ExpandConstant('reg add "HKCR\AlbumFile\DefaultIcon" /ve /d "{app}\resources\app\file_icon.ico"') + #13#10, True);

    if not ShellExec('', ExpandConstant('{app}\set_ass.bat'), '', '', SW_SHOW, ewWaitUntilTerminated, ErrorCode) then
    begin
      MsgBox('Failed to set associations. Reason: ' + IntToStr(ErrorCode), mbError, MB_OK);
    end;

    if not ShellExec('', ExpandConstant('{app}\resources\app\notify_icon_update.exe'), '', '', SW_SHOW, ewWaitUntilTerminated, ErrorCode) then
    begin
      MsgBox('Failed to set associations. Reason: ' + IntToStr(ErrorCode), mbError, MB_OK);
    end;
  end;
end;

