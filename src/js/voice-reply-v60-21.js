/* Milo V60.21 — one safe voice-reply controller for chat and lesson activities. */
(function () {
  'use strict';

  const SELECTOR = '#micLarge,#micSmall,#lessonSpeakingMic,[data-voice-reply]';
  let active = null;
  const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();

  function scopeFor(button) {
    const card = button.closest('.micro-exercise,.practice-card,.chat-large,.ask-row,form') || document;
    let input = card.querySelector('[data-voice-input],.micro-speak-transcript,input:not([type="checkbox"]),textarea');
    let form = button.closest('form');
    if (button.id === 'micLarge') { input = document.querySelector('#chatText'); form = document.querySelector('#chatForm'); }
    if (button.id === 'micSmall') { input = document.querySelector('#askText'); form = document.querySelector('#askForm'); }
    if (button.id === 'lessonSpeakingMic') { input = document.querySelector('#lessonSpeakingAnswer'); form = null; }
    const status = card.querySelector('[data-voice-status]') || ensureStatus(button, card);
    const stop = card.querySelector('[data-voice-stop]');
    return { button, card, input, form, status, stop };
  }

  function ensureStatus(button, card) {
    const node = document.createElement('span');
    node.className = 'milo-voice-status';
    node.dataset.voiceStatus = '1';
    node.setAttribute('aria-live', 'polite');
    node.textContent = 'Sẵn sàng nghe con nói';
    button.insertAdjacentElement('afterend', node);
    return node;
  }

  function setState(session, text, state = '') {
    if (!session) return;
    session.status.textContent = text;
    session.status.dataset.state = state;
    session.button.dataset.voiceState = state;
    session.button.setAttribute('aria-label', text);
    if (session.stop) session.stop.hidden = !['requesting', 'listening', 'processing'].includes(state);
  }

  function focusFallback(session, message) {
    setState(session, message || 'Không nghe rõ, con thử lại nhé', 'fallback');
    if (session.input) {
      const target = clean(session.button.dataset.voiceTarget || '');
      if (target && !session.input.placeholder?.includes(target)) session.input.placeholder = `Con có thể gõ: ${target}`;
      session.input.removeAttribute('disabled');
      session.input.focus({ preventScroll: true });
    }
  }

  function stopTracks(session) {
    try { session?.stream?.getTracks?.().forEach((track) => track.stop()); } catch {}
    session.stream = null;
  }

  function finish(session, keepMessage = false) {
    if (!session) return;
    clearTimeout(session.timer);
    try { session.recognition?.stop?.(); } catch {}
    stopTracks(session);
    if (!keepMessage && session.status.dataset.state !== 'fallback') setState(session, 'Sẵn sàng nghe con nói', 'idle');
    session.button.disabled = false;
    if (active === session) active = null;
  }

  function errorText(code) {
    const errors = {
      'not-allowed': 'Quyền micro đang bị từ chối. Con hãy cho phép hoặc gõ câu trả lời.',
      'service-not-allowed': 'Trình chạy đang chặn nhận giọng nói. Con hãy gõ câu trả lời.',
      'audio-capture': 'Không tìm thấy micro hoặc micro đang được ứng dụng khác sử dụng.',
      'no-speech': 'Không nghe rõ, con thử lại nhé.',
      network: 'Mất mạng khi nhận giọng nói. Con hãy gõ câu trả lời.',
      aborted: 'Đã dừng nghe. Con có thể nói lại hoặc gõ câu trả lời.',
      busy: 'Micro đang được dùng. Milo đã dừng phiên cũ để nghe lại.',
    };
    return errors[code] || 'Nhận dạng giọng nói bị lỗi. Con hãy thử lại hoặc gõ câu trả lời.';
  }

  function submitTranscript(session, transcript) {
    const value = clean(transcript);
    if (!value) { focusFallback(session, errorText('no-speech')); return; }
    setState(session, 'Đang xử lý câu nói', 'processing');
    if (session.input) {
      session.input.value = value;
      session.input.dispatchEvent(new Event('input', { bubbles: true }));
      session.input.dispatchEvent(new Event('change', { bubbles: true }));
    }
    window.setTimeout(() => {
      setState(session, `Milo nghe được: “${value}”`, 'done');
      if (session.form?.requestSubmit && (session.button.id === 'micLarge' || session.button.id === 'micSmall')) {
        session.form.requestSubmit();
      }
      if (session.button.id === 'lessonSpeakingMic') document.querySelector('#checkSpeaking')?.focus({ preventScroll: true });
      finish(session, true);
    }, 120);
  }

  async function start(button) {
    if (active) {
      const previous = active;
      finish(previous, true);
      focusFallback(previous, errorText('busy'));
    }
    const session = scopeFor(button);
    active = session;
    button.disabled = false;
    setState(session, 'Đang xin quyền micro', 'requesting');

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      focusFallback(session, 'Trình chạy không hỗ trợ nhận giọng nói. Con hãy gõ câu trả lời.');
      active = null;
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      focusFallback(session, 'Không tìm thấy chức năng micro. Con hãy gõ câu trả lời.');
      active = null;
      return;
    }

    try {
      session.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (active !== session) { stopTracks(session); return; }
      const recognition = new Recognition();
      session.recognition = recognition;
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;
      let finalText = '';
      recognition.onstart = () => { stopTracks(session); setState(session, 'Milo đang nghe', 'listening'); };
      recognition.onresult = (event) => {
        let interim = '';
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const text = event.results[index][0]?.transcript || '';
          if (event.results[index].isFinal) finalText += ` ${text}`;
          else interim += ` ${text}`;
        }
        const visible = clean(finalText || interim);
        if (visible && session.input) session.input.value = visible;
        if (finalText) submitTranscript(session, finalText);
      };
      recognition.onerror = (event) => {
        if (active !== session) return;
        focusFallback(session, errorText(event.error));
        finish(session, true);
      };
      recognition.onend = () => {
        if (active !== session) return;
        if (!clean(finalText)) focusFallback(session, errorText('no-speech'));
        finish(session, true);
      };
      session.timer = window.setTimeout(() => {
        if (active !== session) return;
        try { recognition.stop(); } catch {}
        focusFallback(session, 'Milo đã dừng sau 12 giây. Con hãy nói lại hoặc gõ câu trả lời.');
        finish(session, true);
      }, 12000);
      recognition.start();
    } catch (error) {
      const code = error?.name === 'NotAllowedError' || error?.name === 'SecurityError' ? 'not-allowed'
        : error?.name === 'NotFoundError' ? 'audio-capture'
          : error?.name === 'NotReadableError' || error?.name === 'AbortError' ? 'audio-capture' : 'unknown';
      focusFallback(session, errorText(code));
      finish(session, true);
    }
  }

  document.addEventListener('click', (event) => {
    const button = event.target.closest(SELECTOR);
    if (!button) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    start(button);
  }, true);

  document.addEventListener('click', (event) => {
    const stop = event.target.closest('[data-voice-stop]');
    if (!stop) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!active) return;
    const session = active;
    focusFallback(session, 'Đã dừng nghe. Con có thể nói lại hoặc gõ câu trả lời.');
    finish(session, true);
  }, true);

  window.MILO_VOICE_REPLY_V60_21 = {
    version: '60.21.0',
    start,
    stop() { if (active) finish(active); },
    get active() { return Boolean(active); },
  };
})();
