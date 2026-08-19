// Legacy Node entry point. The canonical desktop host is bin/Milo.exe,
// built from windows-launcher-src/milo-webview-host. It owns a native
// WinForms window and WebView2 control instead of launching a browser.

export function desktopRuntimeStatus() {
  return {
    type: "native-webview2-host",
    browserName: "",
    browserPath: "",
    nativeWebView2: true,
    error: "",
  };
}

export async function openMiloDesktopWindow() {
  throw new Error(
    "Hãy mở bin/Milo.exe. Launcher Node cũ không được phép mở Milo bằng trình duyệt.",
  );
}
