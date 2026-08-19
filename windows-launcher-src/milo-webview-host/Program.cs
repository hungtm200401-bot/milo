using System.Diagnostics;
using System.Net.Http;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace MiloDesktopHost;

internal static class Program
{
    private const string SingleInstanceMutexName = @"Local\MiloEnglishAdventure.NativeApp";

    [STAThread]
    private static void Main(string[] args)
    {
        ApplicationConfiguration.Initialize();

        // Ghi log khởi động
        MiloLogger.Log("=== Milo English Adventure Host Starting ===");

        Application.SetUnhandledExceptionMode(UnhandledExceptionMode.CatchException);
        AppDomain.CurrentDomain.UnhandledException += (_, e) =>
        {
            var msg = e.ExceptionObject is Exception ex ? ex.ToString() : "Lỗi không xác định";
            MiloLogger.Log("UnhandledException: " + msg);
            MessageBox.Show(
                "Milo English Adventure gặp sự cố:\n\n" + (e.ExceptionObject is Exception exx ? exx.Message : msg) +
                "\n\nChi tiết xem tại file log: %LocalAppData%\\MiloEnglishAdventure\\milo-runtime.log",
                "Milo English Adventure",
                MessageBoxButtons.OK,
                MessageBoxIcon.Warning);
        };

        var isAdmin = args.Any(argument => string.Equals(argument, "--admin", StringComparison.OrdinalIgnoreCase));
        var mutexName = isAdmin ? @"Local\MiloEnglishAdventure.AdminApp" : SingleInstanceMutexName;
        using var singleInstance = new Mutex(true, mutexName, out var isFirstInstance);
        if (!isFirstInstance) return;

        try
        {
            Application.Run(new MiloDesktopForm(isAdmin));
        }
        catch (Exception error)
        {
            MiloLogger.Log("Application.Run Fatal Error: " + error);
            MessageBox.Show(
                "Không thể khởi động Milo English Adventure:\n\n" + error.Message +
                "\n\n💡 Gợi ý: Hãy chạy file Milo_Setup.exe để cài đặt đầy đủ trọn gói.",
                "Milo English Adventure",
                MessageBoxButtons.OK,
                MessageBoxIcon.Information);
        }
        GC.KeepAlive(singleInstance);
    }
}

internal static class MiloLogger
{
    private static readonly string LogFile = Path.Combine(
        Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
        "MiloEnglishAdventure",
        "milo-runtime.log");

    public static void Log(string message)
    {
        try
        {
            var dir = Path.GetDirectoryName(LogFile);
            if (!string.IsNullOrEmpty(dir) && !Directory.Exists(dir)) Directory.CreateDirectory(dir);
            var line = $"[{DateTime.Now:yyyy-MM-dd HH:mm:ss.fff}] {message}{Environment.NewLine}";
            File.AppendAllText(LogFile, line);
        }
        catch {}
    }
}

internal sealed class MiloDesktopForm : Form
{
    private const string BaseUrl = "http://127.0.0.1:8787";
    private const string ContentVersion = "60.25.7-fix-launch";
    private readonly WebView2 webView = new() { Dock = DockStyle.Fill };
    private readonly string appRoot;
    private Process? managedServer;
    private bool openAdmin;

    internal MiloDesktopForm(bool startInAdmin)
    {
        appRoot = ResolveAppRoot();
        openAdmin = startInAdmin;
        MiloLogger.Log($"MiloDesktopForm initialized. appRoot={appRoot}, openAdmin={openAdmin}");

        Text = "Milo English Adventure";
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(1024, 700);
        WindowState = FormWindowState.Maximized;
        Icon = SystemIcons.Application;

        Controls.Add(webView);
        Shown += async (_, _) =>
        {
            try
            {
                WindowState = FormWindowState.Normal;
                WindowState = FormWindowState.Maximized;
                BringToFront();
                Activate();
                Focus();
            }
            catch {}
            await StartAsync();
        };
        FormClosed += (_, _) => StopManagedServer();
    }

    private async Task StartAsync()
    {
        try
        {
            MiloLogger.Log("StartAsync started.");
            if (!await RuntimeIsReadyAsync())
            {
                SetStatus("Đang khởi động dịch vụ Milo…");
                StartServer();
                await WaitForRuntimeAsync();
            }

            SetStatus("Đang mở cửa sổ ứng dụng…");
            var webDataDirectory = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MiloEnglishAdventure",
                "webview2");
            Directory.CreateDirectory(webDataDirectory);

            MiloLogger.Log("Creating CoreWebView2Environment with options...");
            var options = new CoreWebView2EnvironmentOptions
            {
                AdditionalBrowserArguments = "--no-sandbox --disable-features=RendererCodeIntegrity --allow-running-insecure-content --disable-gpu-sandbox",
            };
            var environment = await CoreWebView2Environment.CreateAsync(null, webDataDirectory, options);
            await webView.EnsureCoreWebView2Async(environment);
            MiloLogger.Log("WebView2 Core initialized successfully.");

            try
            {
                await webView.CoreWebView2.Profile.ClearBrowsingDataAsync(
                    CoreWebView2BrowsingDataKinds.DiskCache |
                    CoreWebView2BrowsingDataKinds.CacheStorage |
                    CoreWebView2BrowsingDataKinds.ServiceWorkers);
            }
            catch {}

            webView.CoreWebView2.Settings.AreDevToolsEnabled = false;
            webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = false;
            webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
            webView.CoreWebView2.Settings.IsZoomControlEnabled = false;
            webView.CoreWebView2.Settings.AreBrowserAcceleratorKeysEnabled = false;
            webView.ZoomFactor = 1.0;

            webView.CoreWebView2.NewWindowRequested += (_, eventArgs) =>
            {
                eventArgs.Handled = true;
                if (Uri.TryCreate(eventArgs.Uri, UriKind.Absolute, out var target) &&
                    target.IsLoopback &&
                    string.Equals(target.Scheme, Uri.UriSchemeHttp, StringComparison.OrdinalIgnoreCase))
                {
                    webView.CoreWebView2.Navigate(target.AbsoluteUri);
                    return;
                }

                SetStatus("Liên kết này chỉ mở trong ứng dụng Milo.");
            };

            webView.CoreWebView2.NavigationCompleted += (_, eventArgs) =>
            {
                webView.ZoomFactor = 1.0;
                MiloLogger.Log($"NavigationCompleted. IsSuccess={eventArgs.IsSuccess}");
                SetStatus(eventArgs.IsSuccess ? "Milo đã sẵn sàng" : "Milo chưa thể tải trang. Hãy thử mở lại app.");
                if (eventArgs.IsSuccess)
                {
                    try
                    {
                        BringToFront();
                        Activate();
                    }
                    catch {}
                }
            };

            NavigateTo(openAdmin);
        }
        catch (Exception error)
        {
            MiloLogger.Log("Error in StartAsync: " + error);
            SetStatus("Milo chưa thể khởi động");
            var route = openAdmin ? "/admin.html" : "/";
            var browserTarget = $"{BaseUrl}{route}?appBuild={ContentVersion}";

            // Tự động mở ngay trên trình duyệt mặc định và ẩn form trống để học sinh luôn vào học được 100%
            try
            {
                MiloLogger.Log("Fallback: Starting browser with target: " + browserTarget);
                Process.Start(new ProcessStartInfo
                {
                    FileName = browserTarget,
                    UseShellExecute = true,
                });
                try { Hide(); } catch {}
            }
            catch (Exception browserError)
            {
                MiloLogger.Log("Browser fallback failed: " + browserError);
            }
        }
    }

    private void NavigateTo(bool admin)
    {
        openAdmin = admin;
        if (webView.CoreWebView2 is null) return;
        SetStatus(admin ? "Đang mở quản trị…" : "Đang mở khu học viên…");
        var route = admin ? "/admin.html" : "/";
        var navUrl = $"{BaseUrl}{route}?appBuild={ContentVersion}";
        MiloLogger.Log("Navigating to: " + navUrl);
        webView.CoreWebView2.Navigate(navUrl);
    }

    private static string ResolveAppRoot()
    {
        var executableDirectory = AppContext.BaseDirectory;
        var installedDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "MiloEnglishAdventure");

        var candidates = new string?[]
        {
            executableDirectory,
            Directory.GetParent(executableDirectory)?.FullName,
            Directory.GetParent(executableDirectory)?.Parent?.FullName,
            Environment.CurrentDirectory,
            installedDir,
        };

        foreach (var candidate in candidates)
        {
            if (string.IsNullOrWhiteSpace(candidate)) continue;
            if (File.Exists(Path.Combine(candidate, "server", "server.mjs")) &&
                File.Exists(Path.Combine(candidate, "public", "index.html")))
            {
                return candidate;
            }
        }

        throw new InvalidOperationException(
            "Bạn đang mở riêng lẻ file Milo.exe mà thiếu toàn bộ thư mục dữ liệu bài học đi kèm.\n\n" +
            "💡 CÁCH SỬ DỤNG ĐÚNG:\n" +
            "1. Nếu bạn có file cài đặt 'Milo_Setup.exe', hãy chạy file 'Milo_Setup.exe' để cài đặt 1-click vào máy.\n" +
            "2. Hoặc giải nén trọn vẹn cả thư mục MILO và mở Milo.exe bên trong thư mục đó.");
    }

    /// <summary>
    /// Tìm node.exe — ƯU TIÊN TUYỆT ĐỐI runtime nội bộ RUNTIME_NOI_BO đi kèm app.
    /// Không tìm PATH trước vì PATH có thể trỏ sai version hoặc gây lỗi trên máy phụ huynh.
    /// </summary>
    private static string FindNode(string root)
    {
        // ƯU TIÊN 1: Runtime nội bộ trong thư mục app hiện tại
        var internalRuntime = Path.Combine(root, "RUNTIME_NOI_BO", "node.exe");
        if (File.Exists(internalRuntime))
        {
            MiloLogger.Log($"FindNode: [RUNTIME_NOI_BO] {internalRuntime}");
            return internalRuntime;
        }

        var internalRuntimeAlt = Path.Combine(root, "runtime", "node.exe");
        if (File.Exists(internalRuntimeAlt))
        {
            MiloLogger.Log($"FindNode: [runtime alt] {internalRuntimeAlt}");
            return internalRuntimeAlt;
        }

        // ƯU TIÊN 2: Runtime nội bộ trong thư mục cài đặt LocalAppData
        var installedDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            "MiloEnglishAdventure");
        var installedRuntime = Path.Combine(installedDir, "RUNTIME_NOI_BO", "node.exe");
        if (File.Exists(installedRuntime))
        {
            MiloLogger.Log($"FindNode: [installed RUNTIME_NOI_BO] {installedRuntime}");
            return installedRuntime;
        }

        // FALLBACK: Tìm system Node.js (chỉ khi không có runtime nội bộ nào)
        MiloLogger.Log("FindNode: không có RUNTIME_NOI_BO, tìm system Node.js...");
        var systemCandidates = new List<string>();

        var programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        if (!string.IsNullOrWhiteSpace(programFiles))
            systemCandidates.Add(Path.Combine(programFiles, "nodejs", "node.exe"));

        var programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        if (!string.IsNullOrWhiteSpace(programFilesX86))
            systemCandidates.Add(Path.Combine(programFilesX86, "nodejs", "node.exe"));

        var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        if (!string.IsNullOrWhiteSpace(appData))
            systemCandidates.Add(Path.Combine(appData, "nvm", "nodejs", "node.exe"));

        var localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);
        if (!string.IsNullOrWhiteSpace(localAppData))
            systemCandidates.Add(Path.Combine(localAppData, "Programs", "node", "node.exe"));

        // PATH candidates — thêm vào cuối, không return sớm
        var pathEnv = Environment.GetEnvironmentVariable("PATH") ?? "";
        foreach (var p in pathEnv.Split(';', StringSplitOptions.RemoveEmptyEntries))
        {
            var c = Path.Combine(p.Trim(), "node.exe");
            if (!systemCandidates.Contains(c)) systemCandidates.Add(c);
        }

        var found = systemCandidates.FirstOrDefault(File.Exists) ?? "node.exe";
        MiloLogger.Log($"FindNode: [system fallback] {found}");
        return found;
    }

    private void StartServer()
    {
        var script = Path.Combine(appRoot, "server", "server.mjs");
        if (!File.Exists(script))
        {
            var msg = $"Thiếu server/server.mjs trong thư mục '{appRoot}'.";
            MiloLogger.Log(msg);
            throw new FileNotFoundException(msg);
        }

        var node = FindNode(appRoot);
        MiloLogger.Log($"StartServer: starting node '{node}' with script '{script}' in '{appRoot}'");
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = node,
                Arguments = $"\"{script}\"",
                WorkingDirectory = appRoot,
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden,
                RedirectStandardOutput = true,
                RedirectStandardError = true,
                Environment = { ["MILO_APP_ROOT"] = appRoot },
            };
            managedServer = new Process { StartInfo = psi, EnableRaisingEvents = true };
            managedServer.OutputDataReceived += (_, e) => { if (!string.IsNullOrEmpty(e.Data)) MiloLogger.Log("[Node Out] " + e.Data); };
            managedServer.ErrorDataReceived += (_, e) => { if (!string.IsNullOrEmpty(e.Data)) MiloLogger.Log("[Node Err] " + e.Data); };
            managedServer.Exited += (_, _) => { MiloLogger.Log($"managedServer exited with code: {managedServer?.ExitCode}"); };
            managedServer.Start();
            managedServer.BeginOutputReadLine();
            managedServer.BeginErrorReadLine();
            MiloLogger.Log($"StartServer: server process started with PID: {managedServer.Id}");
        }
        catch (Exception error)
        {
            MiloLogger.Log("StartServer failed: " + error);
            throw new InvalidOperationException(
                "Không tìm thấy Node.js để khởi động dịch vụ Milo. Hãy cài Node.js hoặc dùng bản cài đặt Milo_Setup.exe đã tích hợp sẵn runtime.",
                error);
        }
    }

    private static async Task<bool> RuntimeIsReadyAsync()
    {
        try
        {
            using var client = new HttpClient { Timeout = TimeSpan.FromMilliseconds(900) };
            using var response = await client.GetAsync(BaseUrl + "/api/runtime");
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private static async Task WaitForRuntimeAsync()
    {
        MiloLogger.Log("WaitForRuntimeAsync: waiting for http://127.0.0.1:8787/api/runtime...");
        // 35 giây: đủ cho máy cũ/yếu khởi động node server
        var deadline = DateTime.UtcNow.AddSeconds(35);
        while (DateTime.UtcNow < deadline)
        {
            if (await RuntimeIsReadyAsync())
            {
                MiloLogger.Log("WaitForRuntimeAsync: Runtime is ready!");
                return;
            }
            await Task.Delay(400);
        }
        MiloLogger.Log("WaitForRuntimeAsync: timed out after 35 seconds.");
        throw new InvalidOperationException("Dịch vụ Milo không khởi động được sau 35 giây. Hãy thử mở lại app.");
    }

    private void StopManagedServer()
    {
        try
        {
            if (managedServer is { HasExited: false }) managedServer.Kill(true);
        }
        catch
        {
            // App đang đóng; lỗi dừng tiến trình không cần cản trở người dùng.
        }
        finally
        {
            managedServer?.Dispose();
            managedServer = null;
        }
    }

    private static void SetStatus(string text)
    {
        // The native shell stays visually clean; learner/admin UI owns all status feedback.
    }
}
