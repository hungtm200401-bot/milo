/* Milo V60.22 — immediate click feedback, deterministic action gate and safe background queues. */
(function (root) {
  'use strict';

  const now = () => root.performance?.now?.() ?? Date.now();
  const raf = root.requestAnimationFrame || ((callback) => root.setTimeout(() => callback(now()), 0));
  const records = [];
  const activeButtons = new WeakSet();
  const deferred = [];
  let deferredTimer = 0;
  let sequence = 0;

  function percentile(values, ratio) {
    if (!values.length) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * ratio))];
  }

  function begin(action, button, source = 'click') {
    const record = {
      id: ++sequence,
      action: String(action || button?.textContent || 'action').trim(),
      source,
      pointerdown: Number(button?.dataset?.miloPointerdownAt) || null,
      click: now(),
      handlerStart: null,
      uiFeedback: null,
      assessmentDone: null,
      renderStart: null,
      renderDone: null,
      saveQueued: null,
      saveDone: null,
      finished: null,
      status: 'started',
    };
    records.push(record);
    if (records.length > 500) records.splice(0, records.length - 500);
    return record;
  }

  function mark(record, stage) {
    if (!record || !(stage in record)) return;
    record[stage] = now();
  }

  function updateButton(button, label) {
    if (!button) return;
    if (!button.dataset.miloOriginalLabel) button.dataset.miloOriginalLabel = button.textContent || '';
    button.textContent = label || 'Đang xử lý...';
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('milo-action-received', 'is-submitting');
  }

  function restoreButton(button, label) {
    if (!button?.isConnected) return;
    button.disabled = false;
    button.removeAttribute('aria-busy');
    button.classList.remove('is-submitting');
    button.textContent = label || button.dataset.miloOriginalLabel || button.textContent;
    delete button.dataset.miloOriginalLabel;
  }

  function afterPaint(callback) {
    raf(() => root.setTimeout(callback, 0));
  }

  function run(button, options, work) {
    const settings = typeof options === 'string' ? { label: options } : (options || {});
    if (!button || activeButtons.has(button)) return Promise.resolve({ skipped: true });
    activeButtons.add(button);
    const record = begin(settings.action || settings.label, button, settings.source || 'click');
    mark(record, 'handlerStart');
    updateButton(button, settings.label || 'Đang xử lý...');
    mark(record, 'uiFeedback');

    return new Promise((resolve) => {
      afterPaint(async () => {
        try {
          const value = await work({
            record,
            mark: (stage) => mark(record, stage),
            renderStart: () => mark(record, 'renderStart'),
            renderDone: () => mark(record, 'renderDone'),
            saveQueued: () => mark(record, 'saveQueued'),
          });
          record.status = 'completed';
          resolve({ value, record });
        } catch (error) {
          record.status = 'error';
          record.error = String(error?.message || error);
          settings.onError?.(error, record);
          resolve({ error, record });
        } finally {
          mark(record, 'finished');
          activeButtons.delete(button);
          if (settings.restore !== false) restoreButton(button, settings.restoreLabel);
        }
      });
    });
  }

  function createSaveQueue(storage, options = {}) {
    const pending = new Map();
    let timer = 0;
    const delay = Math.max(0, Number(options.delay) || 0);

    function flush() {
      if (timer) root.clearTimeout(timer);
      timer = 0;
      const started = now();
      for (const [key, value] of pending) storage?.setItem?.(key, value);
      const count = pending.size;
      pending.clear();
      return { count, duration: now() - started };
    }

    function schedule() {
      if (timer) return;
      timer = root.setTimeout(flush, delay);
    }

    return {
      enqueue(key, value) {
        pending.set(String(key), String(value));
        schedule();
        return pending.size;
      },
      flush,
      get size() { return pending.size; },
    };
  }

  function flushDeferred() {
    if (deferredTimer) root.clearTimeout(deferredTimer);
    deferredTimer = 0;
    while (deferred.length) {
      const item = deferred.shift();
      try { item.task(); item.record && mark(item.record, 'saveDone'); } catch (error) { item.onError?.(error); }
    }
  }

  function defer(task, options = {}) {
    deferred.push({ task, record: options.record, onError: options.onError });
    if (!deferredTimer) deferredTimer = root.setTimeout(flushDeferred, 0);
  }

  function summary() {
    const complete = records.filter((record) => record.finished != null);
    const response = complete.map((record) => (record.uiFeedback ?? record.finished) - (record.pointerdown ?? record.click));
    const handler = complete.map((record) => record.finished - record.handlerStart);
    const assessment = complete.filter((record) => record.assessmentDone != null).map((record) => record.assessmentDone - record.click);
    const render = complete.filter((record) => record.renderStart != null && record.renderDone != null).map((record) => record.renderDone - record.renderStart);
    return {
      total: complete.length,
      response: { p50: percentile(response, .5), p95: percentile(response, .95), max: Math.max(0, ...response) },
      handler: { p50: percentile(handler, .5), p95: percentile(handler, .95), max: Math.max(0, ...handler) },
      assessment: { p50: percentile(assessment, .5), p95: percentile(assessment, .95), max: Math.max(0, ...assessment) },
      render: { p50: percentile(render, .5), p95: percentile(render, .95), max: Math.max(0, ...render) },
      errors: complete.filter((record) => record.status === 'error').length,
    };
  }

  if (root.document?.addEventListener) {
    root.document.addEventListener('pointerdown', (event) => {
      const button = event.target?.closest?.('button,[role="button"]');
      if (!button) return;
      button.dataset.miloPointerdownAt = String(now());
      button.classList.add('milo-pointer-down');
    }, true);
    root.document.addEventListener('pointerup', (event) => event.target?.closest?.('button,[role="button"]')?.classList.remove('milo-pointer-down'), true);
    root.document.addEventListener('pointercancel', (event) => event.target?.closest?.('button,[role="button"]')?.classList.remove('milo-pointer-down'), true);
    const genericActionSelector = '#checkSpeaking,#checkWriting,#continueBtn,#retryQuiz,#nextUnitBtn,[data-next],[data-complete],[data-retry-quiz]';
    root.document.addEventListener('click', (event) => {
      const button = event.target?.closest?.(genericActionSelector);
      if (!button || button.matches('[data-main-action]')) return;
      button.classList.add('milo-action-received');
      root.setTimeout(() => button.isConnected && button.classList.remove('milo-action-received'), 220);
    }, true);
    root.addEventListener?.('pagehide', flushDeferred, { capture: true });
  }

  root.MILO_INTERACTION_PERF_V60_22 = {
    version: '60.22.0', begin, mark, run, afterPaint, createSaveQueue, defer, flushDeferred,
    records: () => records.map((record) => ({ ...record })), summary,
    reset() { records.length = 0; },
  };
})(typeof window !== 'undefined' ? window : globalThis);
