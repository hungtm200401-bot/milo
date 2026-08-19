// Milo Fast & Safe Portable Launcher (mã tương thích, không phải launcher chuẩn).
// Launcher phát hành chuẩn duy nhất là bin/Milo.exe, được build từ
// milo-webview-host/MiloDesktopHost.csproj. Mã này chỉ đồng bộ cây runtime rồi chuyển tiếp tới
// launcher chuẩn đó; chế độ quản trị luôn được truyền bằng --admin.
package main

import (
	"bufio"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

const (
	appTitle       = "Milo English Adventure"
	runtimeFolder  = "installed-portable"
	currentFolder  = "current"
	completeMarker = ".milo-install-complete"
	syncLockName   = ".milo-fast-sync.lock"
)

var (
	user32          = syscall.NewLazyDLL("user32.dll")
	messageBoxWProc = user32.NewProc("MessageBoxW")
)

func utf16Ptr(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }
func messageBox(title, message string, flags uintptr) {
	messageBoxWProc.Call(0, uintptr(unsafe.Pointer(utf16Ptr(message))), uintptr(unsafe.Pointer(utf16Ptr(title))), flags)
}
func fail(err error) { messageBox(appTitle+" · Lỗi", err.Error(), 0x10); os.Exit(1) }

func executableRoot() (string, error) {
	exe, err := os.Executable()
	if err != nil {
		return "", err
	}
	exe, err = filepath.EvalSymlinks(exe)
	if err != nil {
		return "", err
	}
	dir := filepath.Dir(exe)
	for _, candidate := range []string{dir, filepath.Dir(dir)} {
		if runtimeLooksValid(candidate) {
			return candidate, nil
		}
	}
	return "", errors.New("Không tìm thấy cây runtime chuẩn cạnh launcher (cần server/server.mjs, public/index.html và bin/Milo.exe).")
}
func localAppData() (string, error) {
	value := strings.TrimSpace(os.Getenv("LOCALAPPDATA"))
	if value == "" {
		return "", errors.New("Không tìm thấy LOCALAPPDATA của Windows.")
	}
	return value, nil
}
func installBase() (string, error) {
	lad, err := localAppData()
	if err != nil {
		return "", err
	}
	return filepath.Join(lad, "MiloEnglishAdventure", runtimeFolder), nil
}
func launcherDataDirectory() (string, error) {
	lad, err := localAppData()
	if err != nil {
		return "", err
	}
	return filepath.Join(lad, "MiloEnglishAdventure", "windows-app"), nil
}
func launcherLog(message string) {
	dir, err := launcherDataDirectory()
	if err != nil {
		return
	}
	_ = os.MkdirAll(dir, 0o755)
	path := filepath.Join(dir, "Milo-Khoi-Dong-Nhanh.log")
	if info, err := os.Stat(path); err == nil && info.Size() > 512000 {
		_ = os.WriteFile(path, nil, 0o644)
	}
	f, err := os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	defer f.Close()
	_, _ = fmt.Fprintf(f, "[%s] %s\n", time.Now().Format(time.RFC3339), message)
}

func sanitizeBuildID(value string) string {
	value = strings.TrimSpace(value)
	if value == "" {
		value = "milo-current"
	}
	var b strings.Builder
	for _, r := range value {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9', r == '-', r == '_', r == '.':
			b.WriteRune(r)
		default:
			b.WriteByte('-')
		}
	}
	return strings.Trim(b.String(), "-.")
}
func readBuildID(root string) string {
	paths := []string{
		filepath.Join("bin", "MILO_BUILD_ID.txt"),
		filepath.Join("bin", "MILO_CONTENT_BUILD_ID.txt"),
	}
	parts := make([]string, 0, len(paths))
	for _, relative := range paths {
		if data, err := os.ReadFile(filepath.Join(root, relative)); err == nil && strings.TrimSpace(string(data)) != "" {
			parts = append(parts, strings.TrimSpace(string(data)))
		}
	}
	return sanitizeBuildID(strings.Join(parts, "__"))
}
func pathWithin(path, parent string) bool {
	cleanPath, err1 := filepath.Abs(path)
	cleanParent, err2 := filepath.Abs(parent)
	if err1 != nil || err2 != nil {
		return false
	}
	cleanPath = strings.ToLower(filepath.Clean(cleanPath))
	cleanParent = strings.ToLower(filepath.Clean(cleanParent))
	rel, err := filepath.Rel(cleanParent, cleanPath)
	return err == nil && rel != ".." && !strings.HasPrefix(rel, ".."+string(os.PathSeparator))
}

func shouldSkip(relative string, entry fs.DirEntry) bool {
	relative = filepath.Clean(relative)
	base := strings.ToLower(entry.Name())
	relLower := strings.ToLower(relative)
	if entry.IsDir() {
		switch base {
		case ".git", "node_modules", "__pycache__", ".pytest_cache", ".idea", ".vscode", "release", "tests", "windows-launcher-src":
			return true
		}
	}
	if strings.HasSuffix(base, ".zip") || strings.HasSuffix(base, ".part") || strings.HasSuffix(base, ".sha256") {
		return true
	}
	if base == ".env" || base == "milo-khoi-dong.log" || base == "server-exe-error.log" || base == completeMarker || base == syncLockName {
		return true
	}
	if !strings.Contains(relative, string(os.PathSeparator)) {
		if strings.HasSuffix(base, ".bat") || strings.HasSuffix(base, ".exe") {
			return true
		}
		if strings.HasPrefix(base, "bao_cao") || strings.HasPrefix(base, "huong_dan") || strings.HasPrefix(base, "doc_truoc") {
			return true
		}
	}
	if strings.HasPrefix(relLower, "windows-launcher-src"+string(os.PathSeparator)) {
		return true
	}
	return false
}

func hashFile(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	h := sha256.New()
	if _, err := io.CopyBuffer(h, f, make([]byte, 1024*1024)); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
func filesEqual(source, destination string, sourceInfo fs.FileInfo) bool {
	destinationInfo, err := os.Stat(destination)
	if err != nil || !destinationInfo.Mode().IsRegular() || sourceInfo.Size() != destinationInfo.Size() {
		return false
	}
	if sourceInfo.ModTime().Truncate(time.Second).Equal(destinationInfo.ModTime().Truncate(time.Second)) {
		return true
	}
	sourceHash, err1 := hashFile(source)
	destinationHash, err2 := hashFile(destination)
	return err1 == nil && err2 == nil && sourceHash == destinationHash
}
func placeFileAtomic(source, destination string, info fs.FileInfo, allowHardLink bool) error {
	if err := os.MkdirAll(filepath.Dir(destination), 0o755); err != nil {
		return err
	}
	temporary := destination + ".milo-copy-" + strconv.Itoa(os.Getpid())
	_ = os.Remove(temporary)

	// Trên cùng ổ NTFS, hard-link tạo runtime gần như tức thì nhưng nguồn vẫn có thể xóa an toàn.
	// Nếu khác ổ đĩa hoặc hệ thống tệp không hỗ trợ, tự chuyển sang sao chép bình thường.
	if allowHardLink {
		if err := os.Link(source, temporary); err == nil {
			_ = os.Remove(destination)
			if err := os.Rename(temporary, destination); err == nil {
				return nil
			}
			_ = os.Remove(temporary)
		}
	}

	input, err := os.Open(source)
	if err != nil {
		return err
	}
	defer input.Close()
	output, err := os.OpenFile(temporary, os.O_CREATE|os.O_EXCL|os.O_WRONLY, info.Mode().Perm())
	if err != nil {
		return err
	}
	_, copyErr := io.CopyBuffer(output, bufio.NewReaderSize(input, 1024*1024), make([]byte, 1024*1024))
	closeErr := output.Close()
	if copyErr != nil {
		_ = os.Remove(temporary)
		return copyErr
	}
	if closeErr != nil {
		_ = os.Remove(temporary)
		return closeErr
	}
	_ = os.Chtimes(temporary, info.ModTime(), info.ModTime())
	_ = os.Remove(destination)
	if err := os.Rename(temporary, destination); err != nil {
		_ = os.Remove(temporary)
		return err
	}
	return nil
}

func syncTreeIncremental(sourceRoot, destinationRoot string) (int, int, error) {
	desired := map[string]bool{}
	copied, skipped := 0, 0
	err := filepath.WalkDir(sourceRoot, func(source string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil {
			return walkErr
		}
		relative, err := filepath.Rel(sourceRoot, source)
		if err != nil {
			return err
		}
		if relative == "." {
			return os.MkdirAll(destinationRoot, 0o755)
		}
		if shouldSkip(relative, entry) {
			if entry.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		desired[strings.ToLower(filepath.Clean(relative))] = true
		destination := filepath.Join(destinationRoot, relative)
		info, err := entry.Info()
		if err != nil {
			return err
		}
		if entry.IsDir() {
			return os.MkdirAll(destination, info.Mode().Perm())
		}
		if !info.Mode().IsRegular() {
			return nil
		}
		if filesEqual(source, destination, info) {
			skipped++
			return nil
		}
		if err := placeFileAtomic(source, destination, info, true); err != nil {
			return fmt.Errorf("không cập nhật được %s: %w", relative, err)
		}
		copied++
		return nil
	})
	if err != nil {
		return copied, skipped, err
	}

	// Xóa tệp runtime cũ không còn tồn tại trong bản nguồn. Giữ cấu hình riêng và marker.
	var stale []string
	_ = filepath.WalkDir(destinationRoot, func(path string, entry fs.DirEntry, walkErr error) error {
		if walkErr != nil || path == destinationRoot {
			return nil
		}
		rel, err := filepath.Rel(destinationRoot, path)
		if err != nil {
			return nil
		}
		base := strings.ToLower(entry.Name())
		if base == ".env" || base == completeMarker || base == syncLockName || strings.HasPrefix(base, ".milo-") {
			return nil
		}
		if !desired[strings.ToLower(filepath.Clean(rel))] {
			stale = append(stale, path)
			if entry.IsDir() {
				return filepath.SkipDir
			}
		}
		return nil
	})
	for i := len(stale) - 1; i >= 0; i-- {
		_ = os.RemoveAll(stale[i])
	}
	return copied, skipped, nil
}

func readMarker(root string) string {
	data, _ := os.ReadFile(filepath.Join(root, completeMarker))
	return strings.TrimSpace(string(data))
}
func writeMarker(root, buildID string) error {
	temporary := filepath.Join(root, completeMarker+"."+strconv.Itoa(os.Getpid())+".tmp")
	if err := os.WriteFile(temporary, []byte(buildID), 0o644); err != nil {
		return err
	}
	_ = os.Remove(filepath.Join(root, completeMarker))
	return os.Rename(temporary, filepath.Join(root, completeMarker))
}
func runtimeLooksValid(root string) bool {
	required := []string{
		filepath.Join("server", "server.mjs"),
		filepath.Join("public", "index.html"),
		filepath.Join("bin", "Milo.exe"),
		filepath.Join("desktop-runtime", "milo-window.mjs"),
	}
	for _, rel := range required {
		if _, err := os.Stat(filepath.Join(root, rel)); err != nil {
			return false
		}
	}
	return true
}

func findLatestSeed(base, current string) string {
	entries, err := os.ReadDir(base)
	if err != nil {
		return ""
	}
	var best string
	var bestTime time.Time
	for _, entry := range entries {
		if !entry.IsDir() || strings.EqualFold(entry.Name(), currentFolder) || strings.HasPrefix(entry.Name(), ".tmp-") {
			continue
		}
		candidate := filepath.Join(base, entry.Name())
		if !runtimeLooksValid(candidate) {
			continue
		}
		info, err := entry.Info()
		if err == nil && info.ModTime().After(bestTime) {
			best, bestTime = candidate, info.ModTime()
		}
	}
	return best
}

func acquireSyncLock(base, destination, buildID string) (func(), error) {
	lockPath := filepath.Join(base, syncLockName)
	deadline := time.Now().Add(35 * time.Second)
	for {
		lock, err := os.OpenFile(lockPath, os.O_CREATE|os.O_EXCL|os.O_WRONLY, 0o600)
		if err == nil {
			_, _ = fmt.Fprintf(lock, "%d\n%s\n%s", os.Getpid(), time.Now().Format(time.RFC3339), buildID)
			_ = lock.Close()
			return func() { _ = os.Remove(lockPath) }, nil
		}
		if !errors.Is(err, os.ErrExist) {
			return nil, err
		}
		if readMarker(destination) == buildID && runtimeLooksValid(destination) {
			return func() {}, nil
		}
		if info, statErr := os.Stat(lockPath); statErr == nil && time.Since(info.ModTime()) > 2*time.Minute {
			_ = os.Remove(lockPath)
			continue
		}
		if time.Now().After(deadline) {
			return nil, errors.New("Milo đang được cập nhật bởi tiến trình khác. Hãy chờ vài giây, đóng các cửa sổ Milo rồi thử lại.")
		}
		time.Sleep(300 * time.Millisecond)
	}
}

type serverState struct {
	PID int `json:"pid"`
}

func stopManagedServer() {
	dir, err := launcherDataDirectory()
	if err != nil {
		return
	}
	statePath := filepath.Join(dir, "server-exe-state.json")
	data, err := os.ReadFile(statePath)
	if err == nil {
		var state serverState
		if json.Unmarshal(data, &state) == nil && state.PID > 0 && state.PID != os.Getpid() {
			if process, err := os.FindProcess(state.PID); err == nil {
				_ = process.Kill()
				_, _ = process.Wait()
				launcherLog(fmt.Sprintf("Dừng server cũ PID %d để nâng bản", state.PID))
			}
		}
	}
	_ = os.Remove(statePath)
	_ = os.Remove(filepath.Join(dir, "server-exe-start.lock"))
}

func ensureInstalledFast(sourceRoot string) (string, bool, error) {
	base, err := installBase()
	if err != nil {
		return "", false, err
	}
	destination := filepath.Join(base, currentFolder)
	buildID := readBuildID(sourceRoot)
	if pathWithin(sourceRoot, base) && readMarker(sourceRoot) == buildID && runtimeLooksValid(sourceRoot) {
		return sourceRoot, false, nil
	}
	if readMarker(destination) == buildID && runtimeLooksValid(destination) {
		return destination, false, nil
	}
	if err := os.MkdirAll(base, 0o755); err != nil {
		return "", false, err
	}
	release, err := acquireSyncLock(base, destination, buildID)
	if err != nil {
		return "", false, err
	}
	defer release()
	if readMarker(destination) == buildID && runtimeLooksValid(destination) {
		return destination, false, nil
	}

	// Chỉ khi nâng bản mới dừng server. Mở app bình thường không bị restart nữa.
	stopManagedServer()
	time.Sleep(250 * time.Millisecond)

	if _, err := os.Stat(destination); errors.Is(err, os.ErrNotExist) {
		if seed := findLatestSeed(base, currentFolder); seed != "" {
			if renameErr := os.Rename(seed, destination); renameErr == nil {
				launcherLog("Tái sử dụng runtime cũ làm nền cập nhật: " + seed)
			}
		}
	}
	started := time.Now()
	copied, skipped, err := syncTreeIncremental(sourceRoot, destination)
	if err != nil {
		return "", false, fmt.Errorf("Không cập nhật được runtime Milo: %w", err)
	}
	if !runtimeLooksValid(destination) {
		return "", false, errors.New("Runtime Milo sau khi cập nhật chưa đầy đủ.")
	}
	if err := writeMarker(destination, buildID); err != nil {
		return "", false, err
	}
	launcherLog(fmt.Sprintf("Cập nhật runtime xong trong %s: copy=%d, giữ=%d, build=%s", time.Since(started).Round(time.Millisecond), copied, skipped, buildID))
	return destination, true, nil
}

func parseEnvValue(path, key string) string {
	data, err := os.ReadFile(path)
	if err != nil {
		return ""
	}
	prefix := key + "="
	for _, line := range strings.Split(string(data), "\n") {
		line = strings.TrimSpace(strings.TrimSuffix(line, "\r"))
		if strings.HasPrefix(line, prefix) {
			return strings.Trim(strings.TrimSpace(strings.TrimPrefix(line, prefix)), "\"'")
		}
	}
	return ""
}
func safeRelativeFile(name string) bool {
	name = filepath.Clean(strings.TrimSpace(name))
	return name != "." && !filepath.IsAbs(name) && name != ".." && !strings.HasPrefix(name, ".."+string(os.PathSeparator))
}
func syncDynamicConfiguration(sourceRoot, installedRoot string) error {
	sourceEnv := filepath.Join(sourceRoot, ".env")
	if _, err := os.Stat(sourceEnv); err != nil {
		example := filepath.Join(sourceRoot, ".env.example")
		if _, exampleErr := os.Stat(example); exampleErr == nil {
			if err := placeFileAtomic(example, sourceEnv, mustStat(example), false); err != nil {
				return fmt.Errorf("không tạo được .env: %w", err)
			}
		} else {
			return nil
		}
	}
	if !strings.EqualFold(filepath.Clean(sourceRoot), filepath.Clean(installedRoot)) {
		if err := placeFileAtomic(sourceEnv, filepath.Join(installedRoot, ".env"), mustStat(sourceEnv), false); err != nil {
			return fmt.Errorf("không đồng bộ được .env: %w", err)
		}
	}
	qr := parseEnvValue(sourceEnv, "MILO_BANK_QR_IMAGE")
	if qr != "" && safeRelativeFile(qr) && !strings.EqualFold(filepath.Clean(sourceRoot), filepath.Clean(installedRoot)) {
		sourceQR := filepath.Join(sourceRoot, qr)
		if info, err := os.Stat(sourceQR); err == nil && info.Mode().IsRegular() {
			destinationQR := filepath.Join(installedRoot, qr)
			if !filesEqual(sourceQR, destinationQR, info) {
				if err := placeFileAtomic(sourceQR, destinationQR, info, false); err != nil {
					return fmt.Errorf("không đồng bộ được ảnh QR: %w", err)
				}
			}
		}
	}
	return nil
}
func mustStat(path string) fs.FileInfo {
	info, err := os.Stat(path)
	if err != nil {
		panic(err)
	}
	return info
}

func launcherMode() string {
	for _, argument := range os.Args[1:] {
		switch strings.ToLower(strings.TrimSpace(argument)) {
		case "--uninstall":
			return "uninstall"
		case "--admin":
			return "admin"
		}
	}
	return "student"
}
func startRuntime(installedRoot, mode string) error {
	runtimeExe := filepath.Join(installedRoot, "bin", "Milo.exe")
	if _, err := os.Stat(runtimeExe); err != nil {
		return errors.New("Thiếu launcher chuẩn bin/Milo.exe trong runtime")
	}
	currentExe, currentErr := os.Executable()
	currentExe, currentEvalErr := filepath.EvalSymlinks(currentExe)
	targetExe, targetEvalErr := filepath.EvalSymlinks(runtimeExe)
	if currentErr == nil && currentEvalErr == nil && targetEvalErr == nil && strings.EqualFold(filepath.Clean(currentExe), filepath.Clean(targetExe)) {
		return errors.New("Phát hiện launcher tương thích tự gọi lại chính nó. Hãy build bin/Milo.exe từ windows-launcher-src/milo-webview-host/MiloDesktopHost.csproj")
	}
	arguments := []string{"--milo-root=" + installedRoot}
	if mode == "admin" {
		arguments = append(arguments, "--admin")
	}
	command := exec.Command(runtimeExe, arguments...)
	command.Dir = installedRoot
	command.Env = append(os.Environ(), "MILO_APP_ROOT="+installedRoot, "MILO_LAUNCHER_MODE="+mode)
	command.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x00000008 | 0x00000200}
	if err := command.Start(); err != nil {
		return err
	}
	return command.Process.Release()
}
func uninstall() error {
	stopManagedServer()
	time.Sleep(400 * time.Millisecond)
	base, err := installBase()
	if err != nil {
		return err
	}
	_ = os.RemoveAll(base)
	if dir, err := launcherDataDirectory(); err == nil {
		_ = os.RemoveAll(dir)
	}
	messageBox(appTitle, "Đã tắt Milo và xóa runtime/cache. Tài khoản, DB và tiến độ trong thư mục data vẫn được giữ nguyên.", 0x40)
	return nil
}
func main() {
	if runtime.GOOS != "windows" {
		fail(errors.New("Launcher này chỉ chạy trên Windows."))
	}
	mode := launcherMode()
	if mode == "uninstall" {
		if err := uninstall(); err != nil {
			fail(err)
		}
		return
	}
	root, err := executableRoot()
	if err != nil {
		fail(err)
	}
	launcherLog("Yêu cầu mở " + mode + " từ " + root)
	installedRoot, upgraded, err := ensureInstalledFast(root)
	if err != nil {
		fail(err)
	}
	if err := syncDynamicConfiguration(root, installedRoot); err != nil {
		fail(err)
	}
	if upgraded {
		launcherLog("Runtime vừa cập nhật; khởi động server mới")
	} else {
		launcherLog("Runtime đã sẵn sàng; mở nhanh không restart server")
	}
	if err := startRuntime(installedRoot, mode); err != nil {
		fail(fmt.Errorf("Không mở được Milo: %w", err))
	}
}
