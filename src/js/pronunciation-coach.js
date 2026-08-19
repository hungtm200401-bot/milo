(function () {
  "use strict";

  const ACCESS_KEY = "milo-commerce-access-v1";
  const TOKEN_KEY = "milo-commerce-token-v1";
  const SETTINGS_KEY = "milo-pronunciation-settings-v60-15";
  const HISTORY_KEY = "milo-pronunciation-history-v60-15";
  const MASTERY_KEY = "milo-pronunciation-mastery-v60-15";
  const MAX_HISTORY = 120;

  let recognition = null;
  let mediaRecorder = null;
  let mediaStream = null;
  let audioContext = null;
  let analyser = null;
  let analyserSource = null;
  let analyserFrame = 0;
  let recordingUrl = "";
  let recordingChunks = [];
  let audioSamples = [];
  let lastAttempt = null;
  let practiceStartedAt = 0;
  let activeSession = 0;
  let deviceNoiseFloor = 0.018;
  let manualStop = false;
  let serverEntitlement = null;
  let entitlementCheckedAt = 0;
  let coachBound = false;
  let openGuardBound = false;
  let expiryTimer = 0;

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character]);
  const clamp = (value, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, Number(value) || 0));
  const round = (value) => Math.round(Number(value) || 0);
  const nowIso = () => new Date().toISOString();

  function normalizeWords(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[’‘]/g, "'")
      .match(/[a-z0-9']+/g) || [];
  }

  function readJson(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; }
    catch { return fallback; }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }

  function readAccess() { return readJson(ACCESS_KEY, null); }
  function entitlementValid(entitlement = serverEntitlement) {
    if (!entitlement?.allowed) return false;
    if (!["vip-pro-max", "vip-pro-max-trial"].includes(entitlement.accessLevel)) return false;
    return !entitlement.activeUntil || new Date(entitlement.activeUntil).getTime() > Date.now();
  }
  function hasVipAccess() { return entitlementValid(); }
  async function verifyVipEntitlement({ force = false } = {}) {
    if (!force && entitlementValid() && Date.now() - entitlementCheckedAt < 30000) return serverEntitlement;
    const token = localStorage.getItem(TOKEN_KEY) || "";
    if (!token) { serverEntitlement = { allowed: false, accessLevel: "guest", activeUntil: null }; entitlementCheckedAt = Date.now(); return serverEntitlement; }
    try {
      const response = await fetch("/api/pronunciation/entitlement", { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }, cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      serverEntitlement = response.ok && payload.allowed ? payload : { ...payload, allowed: false };
    } catch {
      serverEntitlement = { allowed: false, accessLevel: "offline", activeUntil: null, error: "Không xác minh được quyền VIP." };
    }
    entitlementCheckedAt = Date.now();
    return serverEntitlement;
  }

  function profileId() {
    const profile = readJson("milo-child-profile-v1", {});
    return String(profile?.nickname || profile?.username || "guest").toLowerCase();
  }

  function currentContext() {
    const grade = Number($("#gradeSelect")?.value || localStorage.getItem("milo-grade") || 3);
    const unitIndex = Number($("#unitSelect")?.value || localStorage.getItem(`milo-unit-${grade}`) || 0);
    const gradeData = window.MILO_CURRICULUM?.[grade];
    const unit = gradeData?.units?.[unitIndex] || gradeData?.units?.[0] || null;
    const petName = $("#petStatusName")?.textContent?.trim() || $("#coachCompanionLabel")?.textContent?.replace(" ĐỒNG HÀNH", "").trim() || "Milo";
    return { grade, unitIndex, gradeData, unit, petName };
  }

  function defaultTarget() {
    const { unit } = currentContext();
    return unit?.pattern?.[1] || unit?.words?.[0]?.[0] || "Hello, my friend.";
  }

  function readSettings() {
    return { mode: "sentence", accent: "en-US", speed: "0.68", voiceProfile: "cute-clear", countdown: true, ...readJson(SETTINGS_KEY, {}) };
  }

  function saveSettings(partial) {
    writeJson(SETTINGS_KEY, { ...readSettings(), ...partial });
  }

  function tierCopy() {
    const access = serverEntitlement;
    if (hasVipAccess() && access?.accessLevel === "vip-pro-max") return { badge: "VIP PRO MAX · PHÒNG PHÁT ÂM CHUYÊN SÂU", title: "Chấm 8 chỉ số, lưu tiến bộ và dạy lại đúng lỗi" };
    if (hasVipAccess()) return { badge: "TRẢI NGHIỆM VIP PRO MAX 24 GIỜ", title: "Toàn bộ phòng luyện phát âm nâng cao đã mở" };
    return { badge: "PHÒNG PHÁT ÂM VIP PRO MAX", title: "Cần gói VIP hoặc dùng thử 24 giờ để mở phòng chuyên sâu" };
  }

  function modeLabel(mode) {
    return ({ word: "Từ đơn", sentence: "Câu hoàn chỉnh", shadow: "Shadowing" })[mode] || "Câu hoàn chỉnh";
  }

  function accentLabel(accent) { return accent === "en-GB" ? "Anh–Anh" : "Anh–Mỹ"; }

  function chunkWord(word) {
    const clean = String(word || "").toLowerCase().replace(/[^a-z']/g, "");
    if (clean.length <= 4) return [clean];
    const groups = clean.match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy](?=[^aeiouy]*[aeiouy])|[^aeiouy]*$)?/g);
    return (groups?.filter(Boolean) || [clean]).slice(0, 5);
  }

  function suggestedChunks(target) {
    const words = normalizeWords(target);
    if (words.length === 1) return chunkWord(words[0]);
    return words.map((word, index) => index === words.length - 1 ? `${word} ↓` : word);
  }

  function soundFocusFor(word) {
    const lower = String(word || "").toLowerCase();
    const result = [];
    const add = (key, label, tip, pairs) => { if (!result.some((item) => item.key === key)) result.push({ key, label, tip, pairs }); };
    if (/th/.test(lower)) add("th", "Âm TH", "Đặt đầu lưỡi nhẹ giữa hai răng, đẩy hơi; với this/that hãy thêm rung ở cổ.", ["thin · sin", "three · tree", "then · den", "they · day"]);
    if (/sh/.test(lower)) add("sh", "Âm SH", "Môi hơi tròn, lưỡi lùi nhẹ và kéo luồng hơi /sh/ liên tục.", ["ship · sip", "she · see", "shop · chop"]);
    if (/ch|tch/.test(lower)) add("ch", "Âm CH", "Giữ hơi ngắn rồi bật nhanh; không kéo dài như SH.", ["chip · ship", "cheap · sheep", "chop · shop"]);
    if (/r/.test(lower)) add("r", "Âm R", "Môi hơi tròn, lưỡi cong nhưng không chạm vòm miệng.", ["right · light", "road · load", "rice · lice"]);
    if (/l/.test(lower)) add("l", "Âm L", "Đầu lưỡi chạm lợi sau răng trên rồi hạ xuống rõ ràng.", ["light · right", "glass · grass", "fly · fry"]);
    if (/v/.test(lower)) add("v", "Âm V", "Răng trên chạm nhẹ môi dưới, thổi hơi và giữ rung ở cổ.", ["vine · wine", "vest · west", "veal · wheel"]);
    if (/w/.test(lower)) add("w", "Âm W", "Tròn môi nhanh rồi mở ra; răng không chạm môi dưới.", ["wine · vine", "west · vest", "wet · vet"]);
    if (/s/.test(lower)) add("s", "Âm S", "Răng gần nhau, thổi hơi mảnh; không rung cổ.", ["sip · zip", "seal · zeal", "rice · rise"]);
    if (/z/.test(lower)) add("z", "Âm Z", "Giữ khẩu hình S nhưng thêm rung ở cổ.", ["zip · sip", "zeal · seal", "rise · rice"]);
    if (/p/.test(lower)) add("p", "Âm P", "Khép môi, bật hơi rõ; đặt tay trước miệng để cảm nhận luồng hơi.", ["pat · bat", "pig · big", "cap · cab"]);
    if (/b/.test(lower)) add("b", "Âm B", "Khép môi rồi bật nhẹ, có rung cổ và ít hơi hơn P.", ["bat · pat", "big · pig", "cab · cap"]);
    if (/[bdgkptszfvθðʃʒtʃdʒ]$/.test(lower) || /[bdgkptszfv]$/.test(lower)) add("ending", "Âm cuối", `Khóa rõ âm cuối “${lower.slice(-1)}”; dừng ngay, không thêm âm “ơ”.`, ["cap · cab", "rice · rise", "coat · code"]);
    if (!result.length) add("general", "Âm trọng tâm", "Nghe mẫu chậm, nói riêng từng phần rồi ghép lại; giữ rõ âm đầu và âm cuối.", ["ship · sheep", "sit · seat", "full · fool"]);
    return result.slice(0, 4);
  }

  function alignWords(targetWords, heardWords) {
    const rows = targetWords.length + 1, columns = heardWords.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(columns).fill(0));
    for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
    for (let column = 0; column < columns; column += 1) matrix[0][column] = column;
    for (let row = 1; row < rows; row += 1) {
      for (let column = 1; column < columns; column += 1) {
        const substitution = matrix[row - 1][column - 1] + (targetWords[row - 1] === heardWords[column - 1] ? 0 : 1);
        matrix[row][column] = Math.min(substitution, matrix[row - 1][column] + 1, matrix[row][column - 1] + 1);
      }
    }
    const operations = [];
    let row = targetWords.length, column = heardWords.length;
    while (row > 0 || column > 0) {
      if (row > 0 && column > 0 && targetWords[row - 1] === heardWords[column - 1] && matrix[row][column] === matrix[row - 1][column - 1]) {
        operations.unshift({ type: "match", target: targetWords[row - 1], heard: heardWords[column - 1] }); row -= 1; column -= 1;
      } else if (row > 0 && column > 0 && matrix[row][column] === matrix[row - 1][column - 1] + 1) {
        operations.unshift({ type: "substitute", target: targetWords[row - 1], heard: heardWords[column - 1] }); row -= 1; column -= 1;
      } else if (row > 0 && matrix[row][column] === matrix[row - 1][column] + 1) {
        operations.unshift({ type: "missing", target: targetWords[row - 1], heard: "" }); row -= 1;
      } else {
        operations.unshift({ type: "extra", target: "", heard: heardWords[column - 1] }); column -= 1;
      }
    }
    return { distance: matrix[targetWords.length][heardWords.length], operations };
  }

  function audioMetrics() {
    if (!audioSamples.length) return { volume: 64, stability: 65, noise: 60, clipping: 0, silence: 0.1, acousticClarity: 64 };
    const active = audioSamples.filter((sample) => sample.rms > Math.max(deviceNoiseFloor * 1.7, 0.025));
    const averageRms = active.length ? active.reduce((sum, item) => sum + item.rms, 0) / active.length : 0;
    const peaks = audioSamples.map((item) => item.peak);
    const clipping = peaks.filter((peak) => peak > 0.97).length / audioSamples.length;
    const silence = 1 - active.length / audioSamples.length;
    const variance = active.length ? active.reduce((sum, item) => sum + Math.pow(item.rms - averageRms, 2), 0) / active.length : 0;
    const volume = clamp((averageRms / 0.12) * 100);
    const stability = clamp(100 - Math.sqrt(variance) * 460 - Math.max(0, silence - 0.35) * 70);
    const noise = clamp(100 - deviceNoiseFloor * 1150);
    const acousticClarity = clamp(volume * 0.34 + stability * 0.36 + noise * 0.3 - clipping * 80);
    return { volume: round(volume), stability: round(stability), noise: round(noise), clipping, silence, acousticClarity: round(acousticClarity) };
  }

  function paceScore(wordsPerMinute, mode) {
    const ideal = mode === "word" ? 55 : mode === "shadow" ? 105 : 92;
    const tolerance = mode === "word" ? 50 : 72;
    return clamp(100 - Math.abs(wordsPerMinute - ideal) / tolerance * 100);
  }

  function assess(target, transcript, confidence, durationSeconds, mode) {
    const targetWords = normalizeWords(target), heardWords = normalizeWords(transcript);
    const alignment = alignWords(targetWords, heardWords);
    const matches = alignment.operations.filter((item) => item.type === "match").length;
    const missing = alignment.operations.filter((item) => item.type === "missing").length;
    const extras = alignment.operations.filter((item) => item.type === "extra").length;
    const substitutions = alignment.operations.filter((item) => item.type === "substitute").length;
    const accuracy = clamp((matches - extras * 0.18) / Math.max(1, targetWords.length) * 100);
    const completeness = clamp((targetWords.length - missing) / Math.max(1, targetWords.length) * 100);
    const recognitionConfidence = clamp((Number.isFinite(confidence) ? confidence : 0.68) * 100);
    const acoustic = audioMetrics();
    const clarity = clamp(recognitionConfidence * 0.62 + acoustic.acousticClarity * 0.38);
    const pace = durationSeconds > 0 ? heardWords.length / durationSeconds * 60 : 0;
    const fluency = clamp(paceScore(pace, mode) * 0.65 + (100 - acoustic.silence * 100) * 0.35);
    const lastTarget = targetWords.at(-1) || "", lastHeard = heardWords.at(-1) || "";
    const ending = lastTarget === lastHeard ? 100 : lastTarget && lastHeard && lastTarget.slice(-1) === lastHeard.slice(-1) ? 72 : 42;
    const rhythm = clamp(fluency * 0.72 + completeness * 0.28);
    const soundFocus = clamp(accuracy * 0.7 + ending * 0.3 - substitutions * 3);
    const score = clamp(accuracy * 0.4 + completeness * 0.14 + clarity * 0.14 + fluency * 0.1 + rhythm * 0.08 + ending * 0.06 + soundFocus * 0.05 + acoustic.stability * 0.03);
    const issues = alignment.operations.filter((item) => item.type !== "match").map((item) => item.type === "substitute" ? `Milo nghe “${item.heard}” thay cho “${item.target}”` : item.type === "missing" ? `Chưa nghe rõ từ “${item.target}”` : `Có thêm từ “${item.heard}”`);
    return {
      ...alignment,
      score: round(score),
      confidence: recognitionConfidence / 100,
      durationSeconds,
      issues,
      metrics: {
        accuracy: round(accuracy), completeness: round(completeness), clarity: round(clarity), fluency: round(fluency), rhythm: round(rhythm), ending: round(ending), soundFocus: round(soundFocus), stability: acoustic.stability, volume: acoustic.volume, noise: acoustic.noise, pace: round(pace), confidence: round(recognitionConfidence)
      }
    };
  }

  function verdictFor(score) {
    if (score >= 94) return { label: "Xuất sắc · gần như tự nhiên", detail: "Giữ nhịp và nói lại một lần để khóa kỹ năng.", state: "mastered" };
    if (score >= 86) return { label: "Rất tốt · chỉ còn lỗi nhỏ", detail: "Sửa từ được đánh dấu rồi luyện lại cả câu.", state: "great" };
    if (score >= 74) return { label: "Khá rõ · cần chỉnh vài âm", detail: "Nghe riêng từ sai và nói chậm hơn một nhịp.", state: "good" };
    if (score >= 58) return { label: "Đã có nền · cần luyện lại", detail: "Tách câu thành từng cụm và giữ rõ âm cuối.", state: "practice" };
    return { label: "Milo sẽ dạy lại từng bước", detail: "Nghe mẫu chậm, nói từng từ rồi mới ghép câu.", state: "retry" };
  }

  function historyScope() {
    const { grade, unitIndex } = currentContext();
    return `${profileId()}|${grade}|${unitIndex}`;
  }

  function allHistory() { return readJson(HISTORY_KEY, {}); }
  function scopedHistory() { return allHistory()[historyScope()] || []; }

  function saveAttempt(attempt) {
    const all = allHistory(), scope = historyScope();
    const list = [attempt, ...(all[scope] || [])].slice(0, MAX_HISTORY);
    all[scope] = list; writeJson(HISTORY_KEY, all);
    const mastery = readJson(MASTERY_KEY, {}), key = `${scope}|${normalizeWords(attempt.target).join("-")}`;
    mastery[key] = Math.max(Number(mastery[key] || 0), attempt.score);
    writeJson(MASTERY_KEY, mastery);
  }

  function historyStats() {
    const list = scopedHistory();
    const scores = list.map((item) => Number(item.score) || 0);
    const average = scores.length ? round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
    const best = scores.length ? Math.max(...scores) : 0;
    const recent = scores.slice(0, 5), previous = scores.slice(5, 10);
    const recentAverage = recent.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0;
    const previousAverage = previous.length ? previous.reduce((a, b) => a + b, 0) / previous.length : recentAverage;
    return { list, average, best, trend: round(recentAverage - previousAverage), attempts: scores.length };
  }

  function mountEntry() {
    const chat = $("#view-chat .chat-large");
    if (!chat) return;
    let entry = $("#pronunciationEntry");
    if (!entry) {
      chat.insertAdjacentHTML("beforebegin", `<section class="pronunciation-entry pronunciation-entry-compact" id="pronunciationEntry" data-access="checking"><div class="pronunciation-entry-icon"><span>🎯</span><i></i></div><div><small>PHÒNG PHÁT ÂM VIP PRO MAX</small><h3>Đang kiểm tra quyền truy cập…</h3><p>Phòng luyện chuyên sâu chỉ mở sau khi tài khoản được máy chủ xác minh.</p></div><div class="pronunciation-entry-actions"><button type="button" data-open-pronunciation>Kiểm tra và mở phòng</button><button type="button" data-pronunciation-trial>Dùng thử 24 giờ</button><button type="button" data-pronunciation-plans>Xem gói VIP PRO MAX</button></div></section>`);
      entry = $("#pronunciationEntry");
    }
    refreshEntry();
  }

  function refreshEntry() {
    const entry = $("#pronunciationEntry");
    if (!entry) return;
    const allowed = hasVipAccess();
    entry.dataset.access = allowed ? "allowed" : "locked";
    const title = entry.querySelector("h3"), description = entry.querySelector("p");
    const open = entry.querySelector("[data-open-pronunciation]");
    const trial = entry.querySelector("[data-pronunciation-trial]");
    const plans = entry.querySelector("[data-pronunciation-plans]");
    if (allowed) {
      title.textContent = serverEntitlement.accessLevel === "vip-pro-max-trial" ? "Dùng thử VIP PRO MAX đang hoạt động" : "Phòng luyện phát âm chuyên sâu đã mở";
      description.textContent = "Nghe mẫu → kiểm tra micro → nói → chấm 8 chỉ số → luyện lại.";
      open.textContent = "Mở phòng phát âm"; open.hidden = false; trial.hidden = true; plans.hidden = true;
    } else {
      title.textContent = "Luyện phát âm chuyên sâu cùng Milo";
      description.textContent = "Dùng thử 24 giờ hoặc mua gói để xem toàn bộ phòng VIP PRO MAX.";
      open.hidden = true; trial.hidden = false; plans.hidden = false;
    }
  }

  function showUpgrade() {
    refreshEntry();
    if (window.SubscriptionUI?.openPlans) {
      window.SubscriptionUI.openPlans({ source: "pronunciation-coach" });
    } else if (window.MILO_COMMERCE?.openVipPlans) {
      window.MILO_COMMERCE.openVipPlans({ source: "pronunciation-coach" });
    } else if (window.MILO_COMMERCE?.openAiPlans) {
      window.MILO_COMMERCE.openAiPlans({ source: "pronunciation-coach" });
    } else if (typeof showToast === "function") {
      showToast("Milo chưa mở được bảng gói. Phụ huynh vui lòng thử lại nhé.");
    }
  }

  function mountModal() {
    if ($("#pronunciationModal")) return;
    document.body.insertAdjacentHTML("beforeend", `<div class="modal hidden pronunciation-modal" id="pronunciationModal" role="dialog" aria-modal="true" aria-labelledby="pronunciationTitle">
      <section class="modal-card pronunciation-card pronunciation-vip-card">
        <button class="close pronunciation-close" id="closePronunciation" type="button" aria-label="Đóng">×</button>
        <header class="pronunciation-vip-head"><div class="pronunciation-orb"><span>🎯</span><i></i><i></i></div><div><small id="pronunciationTier">VIP PRO MAX</small><h2 id="pronunciationTitle">Phòng phát âm VIP PRO MAX</h2><p id="pronunciationTierTitle">Chấm 8 chỉ số, lưu tiến bộ và dạy lại đúng lỗi</p></div><span class="pronunciation-tier-pill" id="pronunciationAccessPill">ĐANG KIỂM TRA QUYỀN</span></header>
        <div class="pronunciation-vip-body">
          <aside class="pronunciation-control-panel">
            <section class="pronunciation-section"><header><b>1. Chọn kiểu luyện</b><small>Phù hợp từng mục tiêu</small></header><div class="pronunciation-mode-tabs" id="pronunciationModeTabs"><button data-pron-mode="word"><span>🔤</span>Từ đơn<small>Âm đầu/cuối</small></button><button data-pron-mode="sentence"><span>💬</span>Câu nói<small>Đủ từ & nhịp</small></button><button data-pron-mode="shadow"><span>🎧</span>Shadowing<small>Nghe và bắt chước</small></button></div></section>
            <section class="pronunciation-section"><header><b>2. Giọng mẫu dễ nghe cho người Việt</b><small>Giọng nữ thân thiện · ngắt rõ · không đọc quá nhanh</small></header><div class="pronunciation-settings-grid"><label>Giọng<select id="pronunciationAccent"><option value="en-US">Anh–Mỹ</option><option value="en-GB">Anh–Anh</option></select></label><label>Phong cách<select id="pronunciationVoiceProfile"><option value="cute-clear">Dễ thương · chậm rõ</option><option value="gentle-teacher">Cô giáo dịu dàng</option><option value="natural">Tự nhiên</option><option value="extra-slow">Siêu chậm cho bé mới học</option></select></label><label>Tốc độ<select id="pronunciationSpeed"><option value="0.52">Rất chậm</option><option value="0.68">Chậm rõ</option><option value="0.82">Tự nhiên</option><option value="0.95">Thử thách</option></select></label></div><div class="pronunciation-voice-quality" id="pronunciationVoiceQuality"><b>Đang tìm giọng đọc tốt nhất trên máy…</b><small>Milo ưu tiên giọng tiếng Anh rõ ràng đã có trên máy.</small></div><div class="pronunciation-model-row voice-pro"><button type="button" id="pronunciationModel">🔊 Nghe tự nhiên</button><button type="button" id="pronunciationModelSlow">🐢 Nghe chậm rõ</button><button type="button" id="pronunciationModelParts">🧩 Nghe từng từ</button><button type="button" id="pronunciationSpell">🔤 Nghe đánh vần</button></div></section>
            <section class="pronunciation-section pronunciation-target-vip"><header><b>3. Nội dung cần nói</b><small>Tối đa 240 ký tự</small></header><textarea id="pronunciationTarget" maxlength="240" rows="3"></textarea><div class="pronunciation-slow-chunks" id="pronunciationChunks"></div><div class="pronunciation-phonetic-guide" id="pronunciationPhoneticGuide"></div><div class="pronunciation-word-bank" id="pronunciationWordBank"></div></section>
            <section class="pronunciation-section"><header><b>4. Kiểm tra thiết bị</b><small>Đảm bảo chấm ổn định</small></header><button class="pronunciation-device-test" type="button" id="pronunciationDeviceTest">🎙 Kiểm tra micro và tiếng ồn</button><div class="pronunciation-device-status" id="pronunciationDeviceStatus" data-state="idle"><i></i><span>Chưa kiểm tra micro.</span></div></section>
            <button class="pronunciation-main-action" type="button" id="pronunciationStart">🎤 Bắt đầu chấm phát âm</button><button class="pronunciation-stop-action hidden" type="button" id="pronunciationStop">■ Dừng lượt nói</button>
          </aside>
          <main class="pronunciation-workspace">
            <section class="pronunciation-live-stage"><header><b id="pronunciationLiveTitle">Sẵn sàng luyện phát âm</b><span id="pronunciationLiveMode">Câu hoàn chỉnh · Anh–Mỹ</span></header><canvas id="pronunciationWaveform" width="1000" height="180"></canvas><div class="pronunciation-countdown" id="pronunciationCountdown">3</div><p class="pronunciation-live" id="pronunciationLive" data-state="ready">Nghe câu mẫu, kiểm tra micro rồi bấm bắt đầu.</p><div class="pronunciation-live-score" id="pronunciationLiveScore" data-state="ready"><strong id="pronunciationLiveScoreValue">—</strong><div><span>Điểm trực tiếp</span><small id="pronunciationLiveScoreNote">Điểm sẽ cập nhật khi Milo nghe được từng từ.</small></div><i><em id="pronunciationLiveScoreBar"></em></i></div><blockquote class="pronunciation-transcript" id="pronunciationTranscript">Lời Milo nghe được sẽ hiện ở đây…</blockquote></section>
            <section class="pronunciation-result hidden" id="pronunciationResult" aria-live="polite">
              <div class="pronunciation-summary-grid"><article class="pronunciation-score-card"><div class="pronunciation-score-ring" id="pronunciationScoreRing"><div><strong id="pronunciationScore">0</strong><span>/100</span></div></div><h3 id="pronunciationVerdict">Đang chấm</h3><p id="pronunciationVerdictDetail">Milo đang phân tích lượt nói.</p><small id="pronunciationBest">Lần tốt nhất: —</small></article><article class="pronunciation-diagnostic-card"><header><b>8 chỉ số của lượt nói</b><small id="pronunciationMetricConfidence">Độ tin cậy: —</small></header><div class="pronunciation-metric-grid" id="pronunciationMetricGrid"></div><div class="pronunciation-word-result" id="pronunciationWordResult"></div></article></div>
              <div class="pronunciation-fixes" id="pronunciationFixes"></div>
              <article class="pronunciation-coach-card"><header><div><small>GIA SƯ PHÁT ÂM AI</small><h3 id="pronunciationCoachLabel">Milo đang chuẩn bị cách sửa phù hợp…</h3></div><span>🧑‍🏫</span></header><p id="pronunciationAiFeedback">Kết quả hướng dẫn sẽ xuất hiện tại đây.</p><div class="pronunciation-coach-actions"><button type="button" id="pronunciationReadCoach">🔊 Nghe Milo hướng dẫn</button><button type="button" id="pronunciationPlayback" disabled>▶ Nghe lại giọng con</button><button type="button" class="primary" id="pronunciationRetry">↻ Luyện lại câu này</button></div></article>
              <div class="pronunciation-vip-row"><article class="pronunciation-minimal-card" id="pronunciationMinimalCard"><header><b>Cặp âm dễ nhầm</b><small>Nghe và phân biệt</small></header><div class="pronunciation-minimal-pairs" id="pronunciationMinimalPairs"></div></article><article class="pronunciation-history-card" id="pronunciationHistoryCard"><header><b>Tiến bộ trong Unit</b><small id="pronunciationHistorySummary">Chưa có lượt luyện</small></header><div class="pronunciation-history-bars" id="pronunciationHistoryBars"></div><div class="pronunciation-history-list" id="pronunciationHistoryList"></div></article></div>
              <p class="pronunciation-disclaimer">Điểm dựa trên nội dung hệ thống nhận được, độ tin cậy, độ đủ câu, nhịp nói và tín hiệu micro. Đây là công cụ luyện tập; không thay thế phòng lab đánh giá âm vị chuyên dụng.</p>
              <div class="pronunciation-bottom-actions"><button type="button" id="pronunciationNewTarget">Đổi từ/câu khác</button><button type="button" id="pronunciationSpeakWrong">Luyện riêng từ sai</button><button class="primary" type="button" id="pronunciationRetryBottom">🎤 Nói lại để tăng điểm</button></div>
            </section>
          </main>
        </div>
      </section></div>`);
  }

  function updatePhoneticGuide() {
    const target = $("#pronunciationTarget")?.value || "";
    const guide = $("#pronunciationPhoneticGuide");
    if (!guide) return;
    const entries = window.MILO_PRONUNCIATION_LEXICON?.primaryStress?.(target) || [];
    if (!entries.length) { guide.innerHTML = `<small>Nghe mẫu chậm và quan sát khẩu hình. Milo không hiển thị phiên âm phỏng đoán khi chưa đủ dữ liệu.</small>`; return; }
    const ipa = entries.slice(0, 12).map((item) => `<code>${escapeHtml(item.word)} ${escapeHtml(item.ipa)}</code>`).join("");
    const stressed = entries.filter((item) => item.pattern?.includes("1")).slice(0, 8).map((item) => `${item.word}: nhấn âm ${item.syllable}`).join(" · ");
    guide.innerHTML = `<div><b>Phiên âm chuẩn:</b>${ipa}</div><small>${escapeHtml(stressed || "Giữ âm đầu, nguyên âm chính và âm cuối rõ ràng.")}</small>`;
  }

  function updateVoiceQuality() {
    const box = $("#pronunciationVoiceQuality"); if (!box) return;
    const settings = readSettings();
    window.MILO_CUTE_VOICE?.saveSettings?.({ profile: settings.voiceProfile, accent: settings.accent });
    const detail = window.MILO_CUTE_VOICE?.describe?.(settings.accent);
    box.innerHTML = `<b>${escapeHtml(detail?.profileLabel || "Dễ thương · chậm rõ")}</b><small>${escapeHtml(detail?.voiceName || "Giọng mặc định của Windows")} · ${escapeHtml(accentLabel(settings.accent))}. Milo tự giảm tốc và tăng độ rõ để người Việt dễ bắt chước.</small>`;
  }

  function updateChunks() {
    const target = $("#pronunciationTarget")?.value || "";
    $("#pronunciationChunks").innerHTML = suggestedChunks(target).map((chunk) => `<span>${escapeHtml(chunk)}</span>`).join("");
    updatePhoneticGuide();
  }

  function updateModeUi() {
    const settings = readSettings();
    $$("[data-pron-mode]").forEach((button) => button.classList.toggle("active", button.dataset.pronMode === settings.mode));
    $("#pronunciationAccent").value = settings.accent;
    $("#pronunciationVoiceProfile").value = settings.voiceProfile || "cute-clear";
    $("#pronunciationSpeed").value = settings.speed;
    $("#pronunciationLiveMode").textContent = `${modeLabel(settings.mode)} · ${accentLabel(settings.accent)}`;
    updateVoiceQuality();
  }

  function refreshWordBank() {
    const { unit } = currentContext();
    const choices = [...(unit?.words || []).slice(0, 10).map((word) => word[0]), ...(unit?.pattern || []).slice(0, 2)].filter(Boolean);
    $("#pronunciationWordBank").innerHTML = choices.map((choice) => `<button type="button" data-pronunciation-target="${escapeHtml(choice)}">${escapeHtml(choice)}</button>`).join("");
  }

  function speak(text, rate) {
    if (!text) return Promise.resolve(false);
    const settings = readSettings();
    if (window.MILO_CUTE_VOICE?.speak) return window.MILO_CUTE_VOICE.speak(text, Number(rate || settings.speed || .68), settings.accent, { profile: settings.voiceProfile || "cute-clear" });
    return window.MILO_PET_VOICE?.speak?.(text, Number(rate || settings.speed || .68), settings.accent) || Promise.resolve(false);
  }

  function speakSlow() {
    const target = $("#pronunciationTarget").value.trim(); const settings = readSettings();
    return window.MILO_CUTE_VOICE?.teach?.(target, { accent: settings.accent, profile: settings.voiceProfile, rate: Math.min(Number(settings.speed), .64) }) || speak(target, .58);
  }

  async function speakParts() {
    const target = $("#pronunciationTarget").value.trim(); const settings = readSettings();
    if (window.MILO_CUTE_VOICE?.speakWords) return window.MILO_CUTE_VOICE.speakWords(target, { accent: settings.accent, profile: settings.voiceProfile, rate: .53, pause: 300 });
    const parts = settings.mode === "word" ? chunkWord(target) : normalizeWords(target);
    for (const part of parts) { await speak(part, .54); await new Promise((resolve) => setTimeout(resolve, 700)); }
  }

  function spellTarget() {
    const target = $("#pronunciationTarget").value.trim(); const settings = readSettings();
    return window.MILO_CUTE_VOICE?.spell?.(target, { accent: settings.accent, profile: settings.voiceProfile, rate: .56 }) || speak(target.split("").join(", "), .56);
  }

  function updateLiveScore(score = null, state = "ready", note = "") {
    const valid = Number.isFinite(Number(score)), safe = valid ? round(clamp(score)) : 0;
    $("#pronunciationLiveScore").dataset.state = state;
    $("#pronunciationLiveScoreValue").textContent = valid ? String(safe) : "—";
    $("#pronunciationLiveScoreBar").style.width = valid ? `${safe}%` : "0%";
    $("#pronunciationLiveScoreNote").textContent = note || (valid ? "Milo đang cập nhật theo phần nghe được." : "Điểm sẽ cập nhật khi Milo nghe được từng từ.");
  }

  function resetCanvas() {
    const canvas = $("#pronunciationWaveform"), context = canvas?.getContext?.("2d");
    if (!context) return;
    const gradient = context.createLinearGradient(0, 0, canvas.width, 0); gradient.addColorStop(0, "#7658e8"); gradient.addColorStop(1, "#2bc5e9");
    context.clearRect(0, 0, canvas.width, canvas.height); context.fillStyle = "#0e1937"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = gradient; context.lineWidth = 3; context.beginPath(); context.moveTo(0, canvas.height / 2); context.lineTo(canvas.width, canvas.height / 2); context.stroke();
  }

  function startAnalyser(stream) {
    stopAnalyser();
    audioSamples = [];
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = 0.72;
    analyserSource = audioContext.createMediaStreamSource(stream); analyserSource.connect(analyser);
    const data = new Uint8Array(analyser.fftSize), canvas = $("#pronunciationWaveform"), context = canvas?.getContext?.("2d");
    const draw = () => {
      if (!analyser || !context) return;
      analyser.getByteTimeDomainData(data);
      let sum = 0, peak = 0;
      for (const raw of data) { const value = (raw - 128) / 128; sum += value * value; peak = Math.max(peak, Math.abs(value)); }
      const rms = Math.sqrt(sum / data.length); audioSamples.push({ rms, peak, time: performance.now() }); if (audioSamples.length > 900) audioSamples.shift();
      context.fillStyle = "#0e1937"; context.fillRect(0, 0, canvas.width, canvas.height); context.lineWidth = 4; context.strokeStyle = peak > .97 ? "#ff5f6d" : "#55d7ff"; context.beginPath();
      const slice = canvas.width / data.length; let x = 0;
      for (let i = 0; i < data.length; i += 1) { const y = data[i] / 255 * canvas.height; if (i === 0) context.moveTo(x, y); else context.lineTo(x, y); x += slice; }
      context.stroke();
      analyserFrame = requestAnimationFrame(draw);
    };
    draw();
  }

  function stopAnalyser() {
    cancelAnimationFrame(analyserFrame); analyserFrame = 0;
    try { analyserSource?.disconnect?.(); } catch {}
    try { analyser?.disconnect?.(); } catch {}
    try { audioContext?.close?.(); } catch {}
    analyserSource = analyser = audioContext = null;
  }

  async function prepareMedia({ record = true } = {}) {
    recordingChunks = [];
    $("#pronunciationPlayback").disabled = true;
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("NO_MEDIA");
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    startAnalyser(mediaStream);
    if (record && window.MediaRecorder) {
      mediaRecorder = new MediaRecorder(mediaStream);
      mediaRecorder.ondataavailable = (event) => { if (event.data?.size) recordingChunks.push(event.data); };
      mediaRecorder.onstop = () => {
        if (!recordingChunks.length) return;
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        recordingUrl = URL.createObjectURL(new Blob(recordingChunks, { type: mediaRecorder.mimeType || "audio/webm" }));
        $("#pronunciationPlayback").disabled = false;
      };
      mediaRecorder.start();
    }
    return mediaStream;
  }

  function stopMedia() {
    try { if (mediaRecorder?.state === "recording") mediaRecorder.stop(); } catch {}
    mediaStream?.getTracks?.().forEach((track) => track.stop());
    mediaStream = mediaRecorder = null; stopAnalyser();
  }

  async function deviceTest() {
    const box = $("#pronunciationDeviceStatus"), button = $("#pronunciationDeviceTest");
    button.disabled = true; box.dataset.state = "idle"; box.querySelector("span").textContent = "Đang đo tiếng nền trong 2 giây…";
    try {
      await prepareMedia({ record: false });
      await new Promise((resolve) => setTimeout(resolve, 2200));
      const samples = audioSamples.slice(-40); deviceNoiseFloor = samples.length ? samples.reduce((sum, item) => sum + item.rms, 0) / samples.length : .018;
      const noiseScore = clamp(100 - deviceNoiseFloor * 1300);
      box.dataset.state = noiseScore >= 55 ? "ok" : "error";
      box.querySelector("span").textContent = noiseScore >= 55 ? `Micro hoạt động tốt · mức yên tĩnh ${round(noiseScore)}/100.` : `Tiếng nền khá lớn · mức yên tĩnh ${round(noiseScore)}/100. Hãy đóng quạt/TV hoặc đưa micro gần hơn.`;
    } catch (error) {
      box.dataset.state = "error"; box.querySelector("span").textContent = error?.name === "NotAllowedError" ? "Micro đang bị chặn. Hãy cho phép quyền micro." : "Không mở được micro. Kiểm tra thiết bị và thử lại.";
    } finally { stopMedia(); resetCanvas(); button.disabled = false; }
  }

  async function countdown(session) {
    if (!readSettings().countdown) return true;
    const node = $("#pronunciationCountdown");
    for (const value of [3, 2, 1]) {
      if (session !== activeSession) return false;
      node.textContent = String(value); node.classList.remove("show"); void node.offsetWidth; node.classList.add("show");
      await new Promise((resolve) => setTimeout(resolve, 650));
    }
    node.classList.remove("show"); return session === activeSession;
  }

  function chooseBestAlternative(result, target, durationSeconds, mode) {
    const candidates = [];
    for (let index = 0; index < result.length; index += 1) {
      const alternative = result[index];
      candidates.push({ alternative, assessment: assess(target, alternative.transcript, alternative.confidence, durationSeconds, mode) });
    }
    return candidates.sort((left, right) => right.assessment.score - left.assessment.score)[0];
  }

  function metricItems(metrics) {
    return [
      ["accuracy", "Chính xác từ"], ["clarity", "Độ rõ"], ["completeness", "Đủ câu"], ["fluency", "Trôi chảy"],
      ["rhythm", "Nhịp & trọng âm"], ["ending", "Âm cuối"], ["soundFocus", "Âm trọng tâm"], ["stability", "Ổn định micro"]
    ].map(([key, label]) => ({ key, label, value: round(metrics[key]) }));
  }

  function renderMetrics(assessment) {
    $("#pronunciationMetricGrid").innerHTML = metricItems(assessment.metrics).map((item) => `<article><strong>${item.value}</strong><small>${item.label.toUpperCase()}</small><i><em style="width:${item.value}%"></em></i></article>`).join("");
    $("#pronunciationMetricConfidence").textContent = `Tin cậy nhận giọng: ${assessment.metrics.confidence}% · ${assessment.metrics.pace || 0} từ/phút`;
  }

  function renderMinimalPairs(wrongTargets) {
    const focuses = wrongTargets.flatMap((item) => soundFocusFor(item.target));
    const unique = [];
    for (const focus of focuses) for (const pair of focus.pairs || []) if (!unique.includes(pair)) unique.push(pair);
    if (!unique.length) unique.push("ship · sheep", "right · light", "vine · wine");
    $("#pronunciationMinimalPairs").innerHTML = unique.slice(0, 8).map((pair) => `<button type="button" data-minimal-pair="${escapeHtml(pair)}">🔊 ${escapeHtml(pair)}</button>`).join("");
  }

  function renderHistory() {
    const stats = historyStats(), card = $("#pronunciationHistoryCard");
    card.classList.toggle("pronunciation-vip-locked", !hasVipAccess());
    $("#pronunciationHistorySummary").textContent = stats.attempts ? `${stats.attempts} lượt · TB ${stats.average} · tốt nhất ${stats.best} · xu hướng ${stats.trend >= 0 ? "+" : ""}${stats.trend}` : "Chưa có lượt luyện";
    const bars = stats.list.slice(0, 16).reverse();
    $("#pronunciationHistoryBars").innerHTML = bars.length ? bars.map((item) => `<i style="height:${Math.max(8, item.score)}%" title="${item.score}/100"></i>`).join("") : `<span>Chưa có dữ liệu.</span>`;
    $("#pronunciationHistoryList").innerHTML = stats.list.slice(0, 4).map((item) => `<div><b>${escapeHtml(item.target)}</b><span>${new Date(item.at).toLocaleDateString("vi-VN")}</span><strong>${item.score}</strong></div>`).join("");
  }

  function renderAssessment(target, transcript, assessment) {
    const verdict = verdictFor(assessment.score);
    $("#pronunciationResult").classList.remove("hidden");
    $("#pronunciationScore").textContent = String(assessment.score);
    $("#pronunciationScoreRing").style.setProperty("--score", assessment.score);
    $("#pronunciationVerdict").textContent = verdict.label;
    $("#pronunciationVerdictDetail").textContent = verdict.detail;
    $("#pronunciationTranscript").textContent = transcript ? `Milo nghe được: “${transcript}”` : "Milo chưa nhận ra được từ nào.";
    updateLiveScore(assessment.score, "final", `Điểm cuối · ${verdict.label}`);
    const historyBefore = scopedHistory().filter((item) => normalizeWords(item.target).join(" ") === normalizeWords(target).join(" "));
    const best = Math.max(assessment.score, ...historyBefore.map((item) => item.score || 0), 0);
    $("#pronunciationBest").textContent = `Lần tốt nhất: ${best}/100`;
    $("#pronunciationWordResult").innerHTML = assessment.operations.map((item) => {
      const word = item.target || item.heard, label = ({ match: "Đúng", substitute: `Nghe thành “${item.heard}”`, missing: "Chưa nghe rõ", extra: "Từ nói thêm" })[item.type];
      return `<span class="${item.type}" title="${escapeHtml(label)}" data-word-drill="${escapeHtml(item.target || item.heard)}"><b>${escapeHtml(word)}</b><small>${escapeHtml(label)}</small></span>`;
    }).join("");
    renderMetrics(assessment);
    const wrongTargets = assessment.operations.filter((item) => ["substitute", "missing"].includes(item.type));
    $("#pronunciationFixes").innerHTML = wrongTargets.length ? `<h3>Chỗ cần sửa chính xác</h3>${wrongTargets.map((item, index) => {
      const focuses = soundFocusFor(item.target);
      return `<article><span>${index + 1}</span><div><b>${escapeHtml(item.target)}</b><p>${focuses.map((focus) => `<strong>${escapeHtml(focus.label)}:</strong> ${escapeHtml(focus.tip)}`).join(" ")}</p></div><div class="fix-actions"><button type="button" data-pronunciation-word="${escapeHtml(item.target)}">🔊 Nghe từ</button><button type="button" data-drill-word="${escapeHtml(item.target)}">🎤 Luyện riêng</button></div></article>`;
    }).join("")}` : `<div class="pronunciation-perfect"><span>🏆</span><div><b>Tất cả từ đều được nhận đúng</b><p>Hãy nói lại với nhịp tự nhiên hơn để nâng điểm trôi chảy.</p></div></div>`;
    renderMinimalPairs(wrongTargets);
    lastAttempt = { target, transcript, score: assessment.score, confidence: assessment.confidence, issues: assessment.issues, metrics: assessment.metrics, durationSeconds: assessment.durationSeconds, mode: readSettings().mode, accent: readSettings().accent, at: nowIso() };
    saveAttempt(lastAttempt); renderHistory();
    window.dispatchEvent(new CustomEvent("milo:pronunciation-scored", { detail: { target, transcript, score: assessment.score, confidence: assessment.confidence, metrics: assessment.metrics } }));
    window.dispatchEvent(new CustomEvent("milo:learning-event", { detail: { type: "pronunciation", skill: "pronunciation", score: assessment.score, durationMinutes: Math.max(.5, Math.min(5, assessment.durationSeconds / 60)), target, issues: assessment.issues, metadata: assessment.metrics } }));
    requestAiCoaching(wrongTargets);
  }

  async function requestAiCoaching(wrongTargets = []) {
    if (!lastAttempt || !window.MILO_TUTOR) return;
    const feedback = $("#pronunciationAiFeedback"), label = $("#pronunciationCoachLabel"), { grade, gradeData, unit, petName } = currentContext();
    feedback.textContent = "Milo đang chọn cách đặt môi, lưỡi, âm cuối và nhịp luyện phù hợp…";
    try {
      const response = await window.MILO_TUTOR.ask({
        question: `Hãy làm gia sư phát âm Việt–Anh. Phân tích lượt nói vừa chấm, chỉ tập trung vào ${wrongTargets.map((item) => item.target).join(", ") || "nhịp nói và độ tự nhiên"}. Trả lời ngắn: 1) khen một điểm, 2) chỉ đúng khẩu hình/lưỡi/hơi, 3) cho một câu luyện lại, 4) yêu cầu bé nói lại.`,
        grade, gradeData, unit, petName, part: "VIP PRO MAX pronunciation studio", difficulty: "pronunciation", conversationMode: "voice", pronunciationAttempt: lastAttempt,
      });
      feedback.textContent = response.answer; label.textContent = `${petName} đang hướng dẫn con sửa đúng lỗi`;
      if (localStorage.getItem("milo-ai-voice-reply-v1") !== "0") speak(response.answer, .78);
    } catch {
      const word = wrongTargets[0]?.target;
      feedback.textContent = word ? `Con nghe riêng từ “${word}”, làm theo hướng dẫn khẩu hình, nói chậm hai lần rồi ghép lại vào câu. Sau đó bấm “Nói lại để tăng điểm”.` : "Con giữ nhịp đều, không nuốt âm cuối và nói lại câu thêm một lần.";
      label.textContent = "Milo đã chuẩn bị vòng luyện tiếp theo";
    }
  }

  function stopPractice() {
    manualStop = true; activeSession += 1;
    try { recognition?.stop?.(); } catch {}
    stopMedia();
    $("#pronunciationStart").disabled = false; $("#pronunciationStart").classList.remove("listening"); $("#pronunciationStart").textContent = "🎤 Bắt đầu chấm phát âm";
    $("#pronunciationStop").classList.add("hidden");
  }

  function bindOpenGuard() {
    if (openGuardBound) return;
    openGuardBound = true;
    document.addEventListener("click", async (event) => {
      const open = event.target.closest?.("[data-open-pronunciation]");
      const trial = event.target.closest?.("[data-pronunciation-trial]");
      const plans = event.target.closest?.("[data-pronunciation-plans]");
      if (!open && !trial && !plans) return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (trial) {
        if (window.MILO_COMMERCE?.startTrial) await window.MILO_COMMERCE.startTrial();
        await verifyVipEntitlement({ force: true }); refreshEntry();
        if (hasVipAccess()) await openCoach(trial.dataset.pronunciationTarget || ""); else showUpgrade();
        return;
      }
      if (plans) { showUpgrade(); return; }
      await openCoach(open.dataset.pronunciationTarget || "");
    }, true);
  }

  async function startPractice() {
    const entitlement = await verifyVipEntitlement({ force: true });
    if (!entitlementValid(entitlement)) { closeCoach(); showUpgrade(); return false; }
    const target = $("#pronunciationTarget")?.value.trim();
    if (!target) { $("#pronunciationLive").textContent = "Hãy nhập một từ hoặc câu cần luyện."; return; }
    if (!window.MILO_TUTOR?.hasActiveAiAccess?.()) { $("#pronunciationLive").textContent = "Phụ huynh hãy đăng nhập để dùng AI Plus."; window.MILO_COMMERCE?.openAiPlans?.(); return; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { $("#pronunciationLive").textContent = "Máy này chưa hỗ trợ chấm giọng trực tiếp. Con có thể nghe mẫu rồi luyện lại."; return; }
    stopPractice(); manualStop = false; const session = ++activeSession, settings = readSettings();
    window.speechSynthesis?.cancel?.(); $("#pronunciationResult").classList.add("hidden");
    $("#pronunciationLive").textContent = "Đang mở micro…"; $("#pronunciationLive").dataset.state = "starting";
    $("#pronunciationStart").disabled = true; $("#pronunciationStart").classList.add("listening"); $("#pronunciationStart").textContent = "● Đang chuẩn bị…";
    $("#pronunciationStop").classList.remove("hidden"); updateLiveScore(0, "listening", "Chuẩn bị micro và đo tiếng nền.");
    try { await prepareMedia({ record: true }); }
    catch (error) {
      $("#pronunciationLive").textContent = error?.name === "NotAllowedError" ? "Micro đang bị chặn. Hãy cho phép quyền micro." : "Không mở được micro. Kiểm tra thiết bị rồi thử lại.";
      $("#pronunciationLive").dataset.state = "error"; stopPractice(); return;
    }
    if (!(await countdown(session))) return;
    recognition = new Recognition(); recognition.lang = settings.accent; recognition.interimResults = true; recognition.continuous = false; recognition.maxAlternatives = 7;
    recognition.onstart = () => { if (session !== activeSession) return; practiceStartedAt = performance.now(); $("#pronunciationLiveTitle").textContent = `Đang nghe · ${modeLabel(settings.mode)}`; $("#pronunciationLive").textContent = `Hãy nói: “${target}”`; $("#pronunciationLive").dataset.state = "listening"; $("#pronunciationStart").textContent = "● Milo đang nghe…"; updateLiveScore(0, "listening", "Nói trọn từ/câu; không cần hét vào micro."); };
    recognition.onresult = (event) => {
      if (session !== activeSession) return;
      const latest = event.results[event.results.length - 1], interim = latest?.[0]?.transcript || "";
      $("#pronunciationTranscript").textContent = interim ? `Milo đang nghe: “${interim}”` : "Milo đang nghe…";
      if (interim) {
        const elapsed = practiceStartedAt ? Math.max(.6, (performance.now() - practiceStartedAt) / 1000) : 0;
        const preview = assess(target, interim, latest?.[0]?.confidence || .55, elapsed, settings.mode);
        updateLiveScore(preview.score, latest?.isFinal ? "final" : "listening", latest?.isFinal ? "Đã nghe đủ; Milo đang phân tích 8 chỉ số." : "Điểm tạm thời theo phần Milo đang nghe.");
      }
      if (!latest?.isFinal) return;
      const durationSeconds = practiceStartedAt ? Math.max(.6, (performance.now() - practiceStartedAt) / 1000) : 0;
      const chosen = chooseBestAlternative(latest, target, durationSeconds, settings.mode);
      renderAssessment(target, chosen.alternative.transcript, chosen.assessment);
      $("#pronunciationLive").textContent = chosen.assessment.score >= 90 ? "Tuyệt vời! Con đã phát âm rất rõ." : "Đã chấm xong. Milo đã đánh dấu đúng chỗ cần sửa.";
      $("#pronunciationLive").dataset.state = chosen.assessment.score >= 90 ? "success" : "coaching";
    };
    recognition.onerror = (event) => {
      if (session !== activeSession) return;
      const messages = { "not-allowed": "Micro đang bị chặn. Hãy cho phép quyền micro.", "no-speech": "Milo chưa nghe thấy tiếng. Đưa micro gần hơn và thử lại.", "audio-capture": "Chưa tìm thấy micro đang hoạt động.", network: "Nhận giọng cần kết nối mạng. Hãy kiểm tra Internet." };
      $("#pronunciationLive").textContent = messages[event.error] || "Milo chưa nghe rõ. Hãy nói chậm hơn và thử lại."; $("#pronunciationLive").dataset.state = "error";
    };
    recognition.onend = () => { if (session !== activeSession && !manualStop) return; stopMedia(); $("#pronunciationStart").disabled = false; $("#pronunciationStart").classList.remove("listening"); $("#pronunciationStart").textContent = "🎤 Bắt đầu chấm phát âm"; $("#pronunciationStop").classList.add("hidden"); };
    try { recognition.start(); }
    catch { $("#pronunciationLive").textContent = "Micro đang bận. Chờ một chút rồi thử lại."; $("#pronunciationLive").dataset.state = "error"; stopPractice(); }
  }

  async function openCoach(target = "") {
    const entitlement = await verifyVipEntitlement({ force: true });
    refreshEntry();
    if (!entitlementValid(entitlement)) { showUpgrade(); return false; }
    mountModal();
    if (!coachBound) { bind(); coachBound = true; }
    resetCanvas();
    const tier = tierCopy(), settings = readSettings();
    $("#pronunciationTier").textContent = tier.badge; $("#pronunciationTierTitle").textContent = tier.title;
    $("#pronunciationAccessPill").textContent = entitlement.accessLevel === "vip-pro-max-trial" ? "⏱ DÙNG THỬ CÒN HIỆU LỰC" : "👑 VIP PRO MAX ĐÃ XÁC MINH";
    $("#pronunciationTarget").value = String(target || "").trim() || defaultTarget();
    refreshWordBank(); updateChunks(); updateModeUi(); renderHistory(); resetCanvas();
    $("#pronunciationResult").classList.add("hidden"); $("#pronunciationTranscript").textContent = "Lời Milo nghe được sẽ hiện ở đây…";
    $("#pronunciationLive").textContent = "Nghe câu mẫu, kiểm tra micro rồi bấm bắt đầu."; updateLiveScore(null, "ready");
    $("#pronunciationModal").classList.remove("hidden");
    return true;
  }

  function closeCoach() {
    stopPractice(); window.speechSynthesis?.cancel?.();
    $("#pronunciationModal")?.classList.add("hidden");
  }

  function bind() {
    document.addEventListener("click", (event) => {
      const openButton = event.target.closest?.("[data-open-pronunciation]");
      if (openButton) return;
      const targetButton = event.target.closest?.("[data-pronunciation-target]");
      if (targetButton) { $("#pronunciationTarget").value = targetButton.dataset.pronunciationTarget; updateChunks(); }
      const wordButton = event.target.closest?.("[data-pronunciation-word]"); if (wordButton) speak(wordButton.dataset.pronunciationWord, .55);
      const drillButton = event.target.closest?.("[data-drill-word]"); if (drillButton) { saveSettings({ mode: "word" }); $("#pronunciationTarget").value = drillButton.dataset.drillWord; updateChunks(); updateModeUi(); startPractice(); }
      const pairButton = event.target.closest?.("[data-minimal-pair]"); if (pairButton) speak(pairButton.dataset.minimalPair.replace("·", ", "), .58);
      const wordChip = event.target.closest?.("[data-word-drill]"); if (wordChip?.dataset.wordDrill) { $("#pronunciationTarget").value = wordChip.dataset.wordDrill; saveSettings({ mode: "word" }); updateChunks(); updateModeUi(); }
    });
    $("#closePronunciation").onclick = closeCoach; $("#pronunciationModal")?.addEventListener("click", (event) => { if (event.target.id === "pronunciationModal") closeCoach(); });
    $$("[data-pron-mode]").forEach((button) => button.onclick = () => { saveSettings({ mode: button.dataset.pronMode }); updateModeUi(); });
    $("#pronunciationAccent").onchange = (event) => { saveSettings({ accent: event.target.value }); updateModeUi(); };
    $("#pronunciationVoiceProfile").onchange = (event) => { saveSettings({ voiceProfile: event.target.value }); updateModeUi(); };
    $("#pronunciationSpeed").onchange = (event) => saveSettings({ speed: event.target.value });
    $("#pronunciationTarget").addEventListener("input", updateChunks);
    $("#pronunciationModel").onclick = () => speak($("#pronunciationTarget").value.trim());
    $("#pronunciationModelSlow").onclick = speakSlow;
    $("#pronunciationModelParts").onclick = speakParts;
    $("#pronunciationSpell").onclick = spellTarget;
    $("#pronunciationDeviceTest").onclick = deviceTest;
    $("#pronunciationStart").onclick = startPractice; $("#pronunciationStop").onclick = stopPractice;
    $("#pronunciationRetry").onclick = startPractice; $("#pronunciationRetryBottom").onclick = startPractice;
    $("#pronunciationPlayback").onclick = () => { if (recordingUrl) new Audio(recordingUrl).play(); };
    $("#pronunciationReadCoach").onclick = () => speak($("#pronunciationAiFeedback").textContent, .78);
    $("#pronunciationNewTarget").onclick = () => { $("#pronunciationResult").classList.add("hidden"); $("#pronunciationTarget").focus(); };
    $("#pronunciationSpeakWrong").onclick = () => { const wrong = lastAttempt?.issues?.[0]?.match(/“([^”]+)”/)?.[1]; if (wrong) { $("#pronunciationTarget").value = wrong; saveSettings({ mode: "word" }); updateChunks(); updateModeUi(); startPractice(); } else startPractice(); };
    window.addEventListener("milo:access-updated", async () => { await verifyVipEntitlement({ force: true }); refreshEntry(); const tier = tierCopy(); if ($("#pronunciationTier")) $("#pronunciationTier").textContent = tier.badge; if ($("#pronunciationTierTitle")) $("#pronunciationTierTitle").textContent = tier.title; if ($("#pronunciationHistory")) renderHistory(); });
  }

  function start() {
    mountEntry(); bindOpenGuard();
    verifyVipEntitlement({ force: true }).then(() => refreshEntry());
    clearInterval(expiryTimer);
    expiryTimer = window.setInterval(async () => {
      if (!serverEntitlement) return;
      const wasAllowed = hasVipAccess();
      const entitlement = await verifyVipEntitlement({ force: true });
      refreshEntry();
      if (wasAllowed && !entitlementValid(entitlement)) {
        closeCoach(); $("#pronunciationModal")?.remove(); coachBound = false; showUpgrade();
      }
    }, 30000);
    window.MILO_PRONUNCIATION_COACH = {
      open: (target = "") => openCoach(target),
      close: closeCoach,
      start: async () => { const access = await verifyVipEntitlement({ force: true }); if (!entitlementValid(access)) { showUpgrade(); return false; } mountModal(); if (!coachBound) { bind(); coachBound = true; } resetCanvas(); return startPractice(); },
      deviceTest: async () => { const access = await verifyVipEntitlement({ force: true }); if (!entitlementValid(access)) { showUpgrade(); return false; } mountModal(); if (!coachBound) { bind(); coachBound = true; } return deviceTest(); },
      verifyAccess: () => verifyVipEntitlement({ force: true }),
      version: "60.21.0",
    };
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true }); else start();
})();
