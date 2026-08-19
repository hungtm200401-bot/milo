/* Milo V60.23 — free, inline vocabulary repeat practice. */
(function () {
  'use strict';

  const sessions = new WeakMap();
  const clean = (value) => String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();

  function editDistance(a, b) {
    const left = clean(a); const right = clean(b);
    const row = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let i = 1; i <= left.length; i += 1) {
      let previous = row[0]; row[0] = i;
      for (let j = 1; j <= right.length; j += 1) {
        const old = row[j];
        row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (left[i - 1] === right[j - 1] ? 0 : 1));
        previous = old;
      }
    }
    return row[right.length];
  }

  function closeEnough(heard, target) {
    const a = clean(heard); const b = clean(target);
    if (!a || !b) return false;
    if (a === b || a.includes(b) || b.includes(a)) return true;
    const max = Math.max(a.length, b.length);
    return editDistance(a, b) <= Math.max(1, Math.floor(max * 0.22));
  }

  function messageFor(error) {
    const name = String(error?.name || error?.error || '').toLowerCase();
    if (name.includes('notallowed') || name.includes('permission') || name === 'not-allowed') return 'Con chưa cấp quyền micro. Hãy cho phép micro rồi thử lại.';
    if (name.includes('notfound') || name.includes('devicesnotfound')) return 'Không tìm thấy micro trên máy.';
    if (name.includes('notreadable') || name.includes('trackstarterror') || name.includes('abort')) return 'Micro đang bận hoặc đang được ứng dụng khác sử dụng.';
    if (name.includes('network')) return 'Mất mạng nên nhận dạng giọng nói chưa hoạt động.';
    if (name.includes('no-speech')) return 'Milo chưa nghe thấy tiếng. Con nói gần micro hơn nhé.';
    return 'Milo chưa mở được micro. Con có thể nghe mẫu và thử lại.';
  }

  function panel(card, target) {
    let node = card.querySelector('[data-basic-repeat-panel]');
    if (node) return node;
    node = document.createElement('section');
    node.className = 'milo-basic-repeat';
    node.dataset.basicRepeatPanel = '1';
    node.innerHTML = `<div class="milo-basic-repeat-head"><div><small>LUYỆN ĐỌC CƠ BẢN · MIỄN PHÍ</small><strong>${escapeHtml(target)}</strong></div><button type="button" data-basic-repeat-close aria-label="Đóng luyện đọc">×</button></div>
      <p data-basic-repeat-status aria-live="polite">Bấm Nghe mẫu, rồi bấm Con đọc lại.</p>
      <div class="milo-basic-repeat-actions">
        <button type="button" data-basic-repeat-listen>🔊 Nghe mẫu</button>
        <button type="button" data-basic-repeat-start>🎤 Con đọc lại</button>
        <button type="button" data-basic-repeat-stop hidden>■ Dừng</button>
        <button type="button" data-basic-repeat-playback hidden>▶ Nghe giọng con</button>
        <button type="button" data-basic-repeat-retry hidden>↻ Thử lại</button>
      </div>
      <div class="milo-basic-repeat-result" data-basic-repeat-result hidden></div>
      <audio data-basic-repeat-audio controls hidden></audio>
      <p class="milo-basic-repeat-note">Không chấm điểm giả. Nếu máy không hỗ trợ nhận dạng, con vẫn có thể ghi âm và nghe lại để tự so sánh.</p>`;
    card.appendChild(node);
    return node;
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  }

  function setStatus(node, text, state = '') {
    const status = node.querySelector('[data-basic-repeat-status]');
    if (status) status.textContent = text;
    node.dataset.state = state;
  }

  function setButtons(node, active) {
    const start = node.querySelector('[data-basic-repeat-start]');
    const stop = node.querySelector('[data-basic-repeat-stop]');
    if (start) start.disabled = active;
    if (stop) stop.hidden = !active;
  }

  async function speakTarget(target, button = null, rate = 0.76) {
    const original = button?.textContent || '';
    if (button) { button.disabled = true; button.textContent = rate < 0.65 ? '🔊 Đang đọc chậm…' : '🔊 Đang phát…'; }
    try {
      window.MILO_CUTE_VOICE?.stop?.();
      window.speechSynthesis?.cancel?.();
      if (window.MILO_CUTE_VOICE?.speak) await window.MILO_CUTE_VOICE.speak(target, Number(rate), 'en-US', { profile: 'word' });
      else if (window.MILO_PET_VOICE?.speak) await window.MILO_PET_VOICE.speak(target, Number(rate), 'en-US', { profile: 'word' });
      else if (window.speechSynthesis && window.SpeechSynthesisUtterance) {
        const utterance = new SpeechSynthesisUtterance(target); utterance.lang = 'en-US'; utterance.rate = Number(rate);
        await new Promise((resolve, reject) => { utterance.onend = resolve; utterance.onerror = reject; window.speechSynthesis.speak(utterance); });
      } else throw new Error('speech-synthesis-unavailable');
    } finally {
      if (button) { button.disabled = false; button.textContent = original; }
    }
  }

  function stopSession(node) {
    const state = sessions.get(node);
    if (!state) return;
    try { state.recognition?.abort?.(); } catch {}
    try { if (state.recorder?.state === 'recording') state.recorder.stop(); } catch {}
    state.stream?.getTracks?.().forEach((track) => track.stop());
    window.clearTimeout(state.timer);
    sessions.delete(node);
    setButtons(node, false);
  }

  async function getMicrophone() {
    if (!navigator.mediaDevices?.getUserMedia) throw Object.assign(new Error('microphone-unavailable'), { name: 'NotSupportedError' });
    return navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
  }

  async function startRecognition(node, target) {
    stopSession(node);
    setStatus(node, 'Đang xin quyền micro…', 'requesting');
    let stream;
    try { stream = await getMicrophone(); } catch (error) { setStatus(node, messageFor(error), 'error'); throw error; }
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return startRecordingFallback(node, target, stream);

    const recognition = new Recognition();
    recognition.lang = 'en-US'; recognition.interimResults = true; recognition.continuous = false; recognition.maxAlternatives = 3;
    const state = { recognition, stream, timer: 0 }; sessions.set(node, state); setButtons(node, true);
    setStatus(node, 'Milo đang nghe…', 'listening');
    const resultNode = node.querySelector('[data-basic-repeat-result]');
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((row) => row[0]?.transcript || '').join(' ').trim();
      if (resultNode) { resultNode.hidden = false; resultNode.innerHTML = `<b>Milo nghe được:</b> ${escapeHtml(transcript || '…')}`; }
      if (event.results[event.results.length - 1]?.isFinal) {
        setStatus(node, 'Đang xử lý từ con vừa nói…', 'processing');
        const ok = closeEnough(transcript, target);
        if (resultNode) resultNode.innerHTML = `<b>Milo nghe được:</b> ${escapeHtml(transcript || '…')}<strong>${ok ? '✓ Milo nghe đúng từ rồi.' : 'Milo chưa nghe rõ, con nói lại nhé.'}</strong>`;
        setStatus(node, ok ? 'Milo nghe đúng từ rồi.' : 'Milo chưa nghe rõ, con nói lại nhé.', ok ? 'success' : 'retry');
        stopSession(node);
        node.querySelector('[data-basic-repeat-retry]')?.removeAttribute('hidden');
      }
    };
    recognition.onerror = (event) => { setStatus(node, messageFor(event), 'error'); stopSession(node); node.querySelector('[data-basic-repeat-retry]')?.removeAttribute('hidden'); };
    recognition.onend = () => { if (sessions.has(node)) stopSession(node); };
    state.timer = window.setTimeout(() => { try { recognition.stop(); } catch {}; setStatus(node, 'Hết thời gian nghe. Con thử lại nhé.', 'retry'); }, 10000);
    try { recognition.start(); } catch (error) { setStatus(node, messageFor(error), 'error'); stopSession(node); }
  }

  function startRecordingFallback(node, target, stream) {
    if (!window.MediaRecorder) {
      stream.getTracks().forEach((track) => track.stop());
      setStatus(node, 'Trình chạy không hỗ trợ nhận dạng hoặc ghi âm. Con vẫn có thể nghe mẫu và tự đọc theo.', 'error');
      return;
    }
    const chunks = [];
    const recorder = new MediaRecorder(stream);
    const state = { recorder, stream, timer: 0 }; sessions.set(node, state); setButtons(node, true);
    setStatus(node, 'Máy không hỗ trợ nhận dạng. Milo đang ghi âm để con nghe lại…', 'recording');
    recorder.ondataavailable = (event) => { if (event.data?.size) chunks.push(event.data); };
    recorder.onerror = (event) => { setStatus(node, messageFor(event.error || event), 'error'); stopSession(node); };
    recorder.onstop = () => {
      window.clearTimeout(state.timer); stream.getTracks().forEach((track) => track.stop()); sessions.delete(node); setButtons(node, false);
      if (!chunks.length) { setStatus(node, 'Không nghe thấy âm thanh. Con thử lại nhé.', 'retry'); return; }
      const blob = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
      const url = URL.createObjectURL(blob); const audio = node.querySelector('[data-basic-repeat-audio]');
      if (audio) { if (audio.dataset.objectUrl) URL.revokeObjectURL(audio.dataset.objectUrl); audio.dataset.objectUrl = url; audio.src = url; }
      node.querySelector('[data-basic-repeat-playback]')?.removeAttribute('hidden');
      node.querySelector('[data-basic-repeat-retry]')?.removeAttribute('hidden');
      const result = node.querySelector('[data-basic-repeat-result]');
      if (result) { result.hidden = false; result.innerHTML = `<strong>Đã ghi âm.</strong><span>Nghe lại giọng con và so sánh với mẫu “${escapeHtml(target)}”.</span>`; }
      setStatus(node, 'Đã ghi âm. Con bấm Nghe giọng con để tự so sánh.', 'recorded');
    };
    recorder.start(200);
    state.timer = window.setTimeout(() => { if (recorder.state === 'recording') recorder.stop(); }, 5000);
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest('button'); if (!button) return;
    if (button.matches('[data-basic-repeat]')) {
      event.preventDefault(); event.stopPropagation();
      const card = button.closest('.micro-vocab-card, [data-vocab-card]') || button.parentElement;
      const target = button.dataset.basicRepeat || button.dataset.pronunciationTarget || '';
      const node = panel(card, target); node.hidden = false; setStatus(node, 'Bấm Nghe mẫu, rồi bấm Con đọc lại.', 'ready');
      node.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' }); return;
    }
    const node = button.closest('[data-basic-repeat-panel]'); if (!node) return;
    const target = node.querySelector('.milo-basic-repeat-head strong')?.textContent || '';
    if (button.matches('[data-basic-repeat-close]')) { stopSession(node); node.hidden = true; return; }
    if (button.matches('[data-basic-repeat-listen]')) { speakTarget(target, button, 0.76).catch(() => setStatus(node, 'Máy chưa có giọng tiếng Anh. Con thử lại sau khi danh sách giọng tải xong.', 'error')); return; }
    if (button.matches('[data-basic-repeat-start], [data-basic-repeat-retry]')) { button.hidden = button.matches('[data-basic-repeat-retry]'); startRecognition(node, target).catch(() => {}); return; }
    if (button.matches('[data-basic-repeat-stop]')) { stopSession(node); setStatus(node, 'Đã dừng nghe.', 'ready'); return; }
    if (button.matches('[data-basic-repeat-playback]')) { node.querySelector('[data-basic-repeat-audio]')?.play?.(); }
  }, true);

  window.addEventListener('pagehide', () => document.querySelectorAll('[data-basic-repeat-panel]').forEach(stopSession));
  window.MILO_BASIC_REPEAT_V60_23 = { version: '60.23.0', closeEnough, speakTarget, stopAll: () => document.querySelectorAll('[data-basic-repeat-panel]').forEach(stopSession) };
})();
