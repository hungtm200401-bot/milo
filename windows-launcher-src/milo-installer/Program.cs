using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.IO.Compression;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace MiloInstaller;

internal static class Program
{
    [STAThread]
    private static void Main()
    {
        ApplicationConfiguration.Initialize();
        Application.Run(new InstallerForm());
    }
}

internal sealed class InstallerForm : Form
{
    private readonly ProgressBar progressBar;
    private readonly Label statusLabel;
    private readonly Label titleLabel;

    public InstallerForm()
    {
        Text = "Milo English Adventure - Trình Cài Đặt";
        Size = new Size(520, 260);
        StartPosition = FormStartPosition.CenterScreen;
        FormBorderStyle = FormBorderStyle.FixedDialog;
        MaximizeBox = false;
        MinimizeBox = false;
        BackColor = Color.FromArgb(248, 250, 252);

        titleLabel = new Label
        {
            Text = "🎉 Đang cài đặt Milo English Adventure...",
            Font = new Font("Segoe UI", 13, FontStyle.Bold),
            ForeColor = Color.FromArgb(30, 41, 59),
            Location = new Point(24, 28),
            AutoSize = true,
        };

        statusLabel = new Label
        {
            Text = "Đang chuẩn bị dữ liệu...",
            Font = new Font("Segoe UI", 10, FontStyle.Regular),
            ForeColor = Color.FromArgb(100, 116, 139),
            Location = new Point(26, 68),
            Size = new Size(450, 24),
        };

        progressBar = new ProgressBar
        {
            Location = new Point(26, 104),
            Size = new Size(450, 26),
            Style = ProgressBarStyle.Continuous,
            Value = 5,
        };

        Controls.Add(titleLabel);
        Controls.Add(statusLabel);
        Controls.Add(progressBar);

        Shown += async (_, _) => await RunInstallAsync();
    }

    private async Task RunInstallAsync()
    {
        try
        {
            var installDir = Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "MiloEnglishAdventure");

            statusLabel.Text = "Đang chuẩn bị thư mục cài đặt...";
            progressBar.Value = 10;
            await Task.Delay(150);

            // Dừng mọi tiến trình Milo cũ đang chạy ngầm để không bị lock file
            try
            {
                foreach (var p in Process.GetProcessesByName("Milo"))
                {
                    try { if (p.Id != Environment.ProcessId) p.Kill(true); } catch {}
                }
            }
            catch {}

            Directory.CreateDirectory(installDir);

            var myExe = Environment.ProcessPath ?? Process.GetCurrentProcess().MainModule!.FileName;
            
            statusLabel.Text = "Đang giải nén dữ liệu bài học và ứng dụng...";
            progressBar.Value = 25;
            await Task.Delay(150);

            using (var fs = new FileStream(myExe, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                if (fs.Length <= 16)
                {
                    throw new InvalidOperationException("File cài đặt không hợp lệ hoặc bị cắt ngắn.");
                }

                fs.Seek(-8, SeekOrigin.End);
                var lenBuf = new byte[8];
                fs.ReadExactly(lenBuf, 0, 8);
                var zipOffset = BitConverter.ToInt64(lenBuf, 0);

                if (zipOffset <= 0 || zipOffset >= fs.Length - 8)
                {
                    throw new InvalidOperationException($"Không thể định vị dữ liệu cài đặt (offset: {zipOffset}, size: {fs.Length}).");
                }

                var zipLength = fs.Length - zipOffset - 8;
                using var subStream = new OffsetStream(fs, zipOffset, zipLength);
                using var archive = new ZipArchive(subStream, ZipArchiveMode.Read);
                var totalEntries = archive.Entries.Count;
                var current = 0;

                foreach (var entry in archive.Entries)
                {
                    if (string.IsNullOrEmpty(entry.Name) && entry.FullName.EndsWith("/"))
                    {
                        var dir = Path.Combine(installDir, entry.FullName);
                        Directory.CreateDirectory(dir);
                        continue;
                    }

                    var destinationPath = Path.Combine(installDir, entry.FullName);
                    var parentDir = Path.GetDirectoryName(destinationPath);
                    if (!string.IsNullOrEmpty(parentDir)) Directory.CreateDirectory(parentDir);

                    try
                    {
                        entry.ExtractToFile(destinationPath, overwrite: true);
                    }
                    catch
                    {
                        try
                        {
                            if (File.Exists(destinationPath)) File.Delete(destinationPath);
                            entry.ExtractToFile(destinationPath, overwrite: true);
                        }
                        catch
                        {
                            // Bỏ qua nếu là file log đang bị khóa
                        }
                    }

                    current++;
                    if (current % 20 == 0 || current == totalEntries)
                    {
                        var pct = 25 + (int)((double)current / totalEntries * 60);
                        progressBar.Value = Math.Min(88, pct);
                    }
                }
            }

            progressBar.Value = 90;
            statusLabel.Text = "Đang tạo biểu tượng ngoài Desktop...";
            await Task.Delay(150);

            var exePath = Path.Combine(installDir, "bin", "Milo.exe");
            // Icon ở root thư mục cài đặt
            var iconPath = Path.Combine(installDir, "milo-student.ico");
            if (!File.Exists(iconPath))
                iconPath = Path.Combine(installDir, "windows-launcher-src", "milo-student.ico");
            var desktopPath = Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory);
            var shortcutPath = Path.Combine(desktopPath, "Milo English Adventure.lnk");

            CreateShortcut(shortcutPath, exePath, installDir, iconPath);

            progressBar.Value = 100;
            statusLabel.Text = "✅ Cài đặt thành công! Đang mở Milo English Adventure...";
            await Task.Delay(800);

            // Dọn sạch mọi tiến trình Milo cũ trước khi mở instance mới để đảm bảo instance mới luôn là primary
            try
            {
                foreach (var p in Process.GetProcessesByName("Milo"))
                {
                    try
                    {
                        if (p.Id != Environment.ProcessId)
                        {
                            p.Kill(true);
                            p.WaitForExit(1000);
                        }
                    }
                    catch {}
                }
            }
            catch {}

            if (File.Exists(exePath))
            {
                try
                {
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = exePath,
                        WorkingDirectory = installDir,
                        UseShellExecute = true,
                    });
                }
                catch
                {
                    // Fallback khởi động
                    Process.Start(new ProcessStartInfo
                    {
                        FileName = "cmd.exe",
                        Arguments = $"/c start \"\" \"{exePath}\"",
                        WorkingDirectory = installDir,
                        CreateNoWindow = true,
                        WindowStyle = ProcessWindowStyle.Hidden,
                    });
                }
            }

            await Task.Delay(1200);
            Close();
        }
        catch (Exception ex)
        {
            MessageBox.Show(
                $"Lỗi trong quá trình cài đặt: {ex.Message}",
                "Lỗi Cài Đặt Milo",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error);
            Close();
        }
    }

    private static void CreateShortcut(string shortcutPath, string targetPath, string workingDir, string iconPath)
    {
        try
        {
            var shellType = Type.GetTypeFromProgID("WScript.Shell");
            if (shellType == null) return;
            dynamic shell = Activator.CreateInstance(shellType)!;
            dynamic shortcut = shell.CreateShortcut(shortcutPath);
            shortcut.TargetPath = targetPath;
            shortcut.WorkingDirectory = workingDir;
            shortcut.Description = "Milo English Adventure";
            if (File.Exists(iconPath)) shortcut.IconLocation = iconPath + ",0";
            shortcut.Save();
        }
        catch
        {
            // Ignore shortcut error if COM is restricted
        }
    }
}

internal sealed class OffsetStream : Stream
{
    private readonly Stream _base;
    private readonly long _offset;
    private readonly long _length;

    public OffsetStream(Stream baseStream, long offset, long length)
    {
        _base = baseStream;
        _offset = offset;
        _length = length;
        _base.Seek(_offset, SeekOrigin.Begin);
    }

    public override bool CanRead => _base.CanRead;
    public override bool CanSeek => _base.CanSeek;
    public override bool CanWrite => false;
    public override long Length => _length;

    public override long Position
    {
        get => _base.Position - _offset;
        set => _base.Position = _offset + value;
    }

    public override void Flush() => _base.Flush();

    public override int Read(byte[] buffer, int offset, int count)
    {
        var remaining = _length - Position;
        if (remaining <= 0) return 0;
        var toRead = (int)Math.Min(count, remaining);
        return _base.Read(buffer, offset, toRead);
    }

    public override long Seek(long offset, SeekOrigin origin)
    {
        return origin switch
        {
            SeekOrigin.Begin => Position = offset,
            SeekOrigin.Current => Position += offset,
            SeekOrigin.End => Position = _length + offset,
            _ => throw new ArgumentOutOfRangeException(nameof(origin))
        };
    }

    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
}
