/* Milo V60.19.0 — real seven-step micro lessons for Grades 2–3. */
(function () {
  'use strict';

  const STEP_LABELS = [
    'Milo giảng',
    'Học cách làm',
    'Làm cùng Milo',
    'Con tự làm',
    'Milo chữa bài',
    'Kiểm tra nhanh',
    'Hoàn thành',
  ];
  const TECH_PARTS = new Set(['sourcebook', 'test', 'milo-grammar-levels', 'vipmax', 'games']);
  const progression = window.MILO_UNIT_PROGRESSION;
  const interactionPerf = window.MILO_INTERACTION_PERF_V60_22 || null;
  const bookExercises = window.MILO_BOOK_EXERCISES_V60_23 || null;
  const sessionFlow = window.MILO_LEARNING_SESSION_FLOW || null;
  const taskCache = new Map();
  const progressSaveQueue = interactionPerf?.createSaveQueue?.(window.localStorage, { delay: 0 }) || null;
  const backgroundXpKeys = new Set();

  function awardXp(ctx, type, itemId, score = null, weakArea = '') {
    if (!progression) return null;
    const key = `${ctx.grade}:${ctx.unitIndex + 1}:${ctx.part}:${type}:${itemId}`;
    if (backgroundXpKeys.has(key)) return { queued: true, duplicate: true };
    backgroundXpKeys.add(key);
    const task = () => {
      try {
        return progression.awardActivity({ grade: ctx.grade, unitNumber: ctx.unitIndex + 1, sectionId: ctx.part, type, itemId, score, weakArea });
      } finally {
        backgroundXpKeys.delete(key);
      }
    };
    if (interactionPerf?.defer) interactionPerf.defer(task);
    else window.setTimeout(task, 0);
    return { queued: true };
  }

  function flushBackgroundWrites() {
    progressSaveQueue?.flush?.();
    interactionPerf?.flushDeferred?.();
  }
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
  const clean = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
  function shuffledArrangeTokens(answer, seed = '') {
    const original = clean(answer).split(' ').filter(Boolean);
    if (original.length < 2) return original;
    let mixed = seededShuffle(original, `arrange|${seed}|${original.join(' ')}`);
    if (mixed.join(' ') === original.join(' ')) mixed = rotate(mixed, 1);
    return mixed;
  }
  const unique = (items) => [...new Set(items.filter(Boolean).map(clean))];
  const chunk = (items, size) => Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

  const PATTERN_VI = {
    '2-1': ['Con làm gì vào những ngày đi học?', 'Con học và luyện nhạc vào những ngày đi học.'],
    '2-2': ['Cá sấu sống ở đâu?', 'Nó sống gần những con sông.'],
    '2-3': ['Thời tiết như thế nào?', 'Trời có gió và con đang quàng khăn.'],
    '2-4': ['Thư viện ở đâu?', 'Nó ở đối diện ngân hàng.'],
    '2-5': ['Con có muốn một ít salad hoa quả không?', 'Có ạ. Con cảm ơn.'],
    '2-6': ['Con muốn làm nghề gì?', 'Con muốn làm bác sĩ thú y vì con thích giúp động vật.'],
    '2-7': ['Con có chơi cầu lông giỏi không?', 'Có, con có thể đánh quả cầu.'],
    '2-8': ['Con nên làm gì để răng khỏe?', 'Con nên đánh răng và súc miệng hằng ngày.'],
    '2-9': ['Mùa hè trời mưa thường xuyên thế nào?', 'Mùa hè trời thường mưa.'],
    '2-10': ['Bạn của con là người thế nào?', 'Bạn ấy tốt bụng, sáng tạo và hay giúp đỡ.'],
    '2-11': ['Con có thể giúp chúng ta giải bài toán không?', 'Có. Hãy đọc manh mối và tìm đáp án.'],
    '2-12': ['Con đã làm gì ngoài trời?', 'Con đi bộ bên hồ và quan sát động vật hoang dã.'],
    '3-1': ['Tôi đi đến bảo tàng bằng đường nào?', 'Băng qua quảng trường, rồi rẽ trái ở cây cầu.'],
    '3-2': ['Nhà khảo cổ đã tìm thấy gì?', 'Cô ấy tìm thấy vàng và xương trong lăng mộ.'],
    '3-3': ['Con đã làm gì trong kỳ nghỉ?', 'Con đi cắm trại và học cách dùng la bàn.'],
    '3-4': ['Ai là người hùng trong câu chuyện?', 'Công chúa là người hùng vì cô ấy cứu ngôi làng.'],
    '3-5': ['Chúng ta có thể bảo vệ môi trường thế nào?', 'Chúng ta có thể trồng cây, tiết kiệm điện và xả ít rác hơn.'],
    '3-6': ['Gói bánh quy này giá bao nhiêu?', 'Nó có giá hai mươi nghìn đồng.'],
    '3-7': ['Con làm gì để giải trí?', 'Con nghe ban nhạc và chơi cờ với bạn.'],
    '3-8': ['Các nhà khoa học làm gì trên trạm vũ trụ?', 'Họ làm thí nghiệm và quan sát hành tinh của chúng ta.'],
    '3-9': ['Ngôi nhà này có gì đặc biệt?', 'Đây là nhà thuyền nên nó nổi trên kênh.'],
    '3-10': ['Chúng ta ngăn vi trùng lây lan thế nào?', 'Chúng ta nên rửa tay và che miệng khi ho.'],
    '3-11': ['Động vật sống sót ở Nam Cực thế nào?', 'Chúng thích nghi bằng lông dày, mỡ và sống theo nhóm.'],
    '3-12': ['Tại sao mọi người tổ chức lễ hội này?', 'Họ tổ chức để nhớ truyền thống và gắn kết cộng đồng.'],
  };

  function exactRecord(grade, unitIndex, part) {
    return window.MILO_SOURCE_EXACT_TRANSCRIPTIONS?.entries?.find((entry) => (
      Number(entry.grade) === Number(grade)
      && Number(entry.unit) === Number(unitIndex) + 1
      && entry.sectionId === part
    )) || null;
  }

  function sectionWithExact(section, grade, unitIndex, part) {
    if (!section) return null;
    const exactVerification = exactRecord(grade, unitIndex, part);
    const { sourceText: _blockedMachineText, ...safeContent } = section.content || {};
    return {
      ...section,
      content: exactVerification ? { ...safeContent, ...(exactVerification.content || {}) } : safeContent,
      exactVerification,
    };
  }

  function pageState() {
    const params = new URLSearchParams(location.search);
    const grade = Number(params.get('grade') || $('#gradeSelect')?.value || 3);
    const unitIndex = Number(params.get('unit') || $('#unitSelect')?.value || 0);
    const part = location.hash.slice(1) || localStorage.getItem(`milo-last-part-${grade}-${unitIndex}`) || '';
    const unit = window.MILO_CURRICULUM?.[grade]?.units?.[unitIndex];
    const spec = window.MILO_SOURCE_SECTIONS_V60_17?.grades?.[String(grade)]?.units?.[unitIndex];
    const baseSection = spec?.sections?.find((item) => item.id === part);
    const section = sectionWithExact(baseSection, grade, unitIndex, part);
    return { grade, unitIndex, unit, spec, section, part };
  }

  function progressKey(ctx) {
    return `milo-micro-v60-19-${ctx.grade}-${ctx.unitIndex}-${ctx.part}`;
  }
  function loadProgress(ctx) {
    try {
      const saved = JSON.parse(localStorage.getItem(progressKey(ctx)) || '{}');
      return {
        step: Math.min(7, Math.max(1, Number(saved.step) || 1)),
        listened: Boolean(saved.listened),
        examplesSeen: Boolean(saved.examplesSeen),
        modelSeen: Boolean(saved.modelSeen),
        guidedDone: Boolean(saved.guidedDone),
        independentDone: Boolean(saved.independentDone),
        correctionSeen: Boolean(saved.correctionSeen),
        quickPassed: Boolean(saved.quickPassed),
        quickScore: Number(saved.quickScore) || 0,
        attempts: saved.attempts || {},
        weak: Array.isArray(saved.weak) ? saved.weak : [],
        guided: localStorage.getItem('milo-handhold-v60-19') !== '0',
        variant: Math.abs(Number(saved.variant) || 0) % 3,
        correctItems: Array.isArray(saved.correctItems) ? saved.correctItems : [],
        independentIndex: Math.max(0, Number(saved.independentIndex) || 0),
        quickIndex: Math.max(0, Number(saved.quickIndex) || 0),
        quickCorrect: Math.max(0, Number(saved.quickCorrect) || 0),
        quickFinished: Boolean(saved.quickFinished),
        bestScore: Math.max(0, Number(saved.bestScore) || 0),
        totalAttempts: Math.max(0, Number(saved.totalAttempts) || 0),
        revealed: saved.revealed && typeof saved.revealed === 'object' ? saved.revealed : {},
        helpMode: saved.helpMode && typeof saved.helpMode === 'object' ? saved.helpMode : {},
      };
    } catch {
      return { step: 1, attempts: {}, weak: [], guided: true, variant: 0, correctItems: [], revealed: {}, helpMode: {} };
    }
  }
  function saveProgress(ctx, progress, { immediate = false } = {}) {
    const progressValue = JSON.stringify(progress);
    const guideValue = progress.guided ? '1' : '0';
    if (progressSaveQueue && !immediate) {
      progressSaveQueue.enqueue(progressKey(ctx), progressValue);
      progressSaveQueue.enqueue('milo-handhold-v60-19', guideValue);
      return;
    }
    localStorage.setItem(progressKey(ctx), progressValue);
    localStorage.setItem('milo-handhold-v60-19', guideValue);
  }
  window.addEventListener?.('pagehide', flushBackgroundWrites, { capture: true });

  function languageFor(text, forced = '') {
    if (forced) return forced;
    return /[à-ỹđ]/i.test(String(text || '')) ? 'vi-VN' : 'en-US';
  }

  async function speak(text, rate = 0.82, forcedLanguage = '') {
    const value = clean(text);
    if (!value) return;
    const numericRate = Number.isFinite(Number(rate)) ? Number(rate) : 0.82;
    const language = languageFor(value, forcedLanguage);
    window.MILO_CUTE_VOICE?.stop?.();
    window.speechSynthesis?.cancel?.();
    if (window.MILO_CUTE_VOICE?.speak) {
      await window.MILO_CUTE_VOICE.speak(value, numericRate, language, { profile: numericRate < 0.65 ? 'slow-word' : 'lesson' });
      return;
    }
    if (window.MILO_PET_VOICE?.speak) {
      await window.MILO_PET_VOICE.speak(value, numericRate, language, { profile: numericRate < 0.65 ? 'slow-word' : 'lesson' });
      return;
    }
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) throw new Error('speech-synthesis-unavailable');
    const utterance = new SpeechSynthesisUtterance(value);
    utterance.lang = language;
    utterance.rate = numericRate;
    await new Promise((resolve, reject) => {
      utterance.onend = resolve;
      utterance.onerror = reject;
      window.speechSynthesis.speak(utterance);
    });
  }

  async function speakWithButton(button, text, rate = 0.82, language = '') {
    const original = button?.textContent || '';
    if (button) {
      button.disabled = true;
      button.dataset.speaking = '1';
      button.textContent = Number(rate) < 0.65 ? '🔊 Đang đọc chậm…' : '🔊 Đang phát…';
    }
    try {
      await speak(text, rate, language);
    } catch {
      const feedback = button?.closest('.micro-lesson-shell')?.querySelector('[data-voice-read-status]');
      if (feedback) feedback.textContent = 'Máy chưa tải được giọng tiếng Anh. Con thử lại sau một chút.';
      throw new Error('Không thể phát giọng đọc trên trình chạy này.');
    } finally {
      if (button) {
        button.disabled = false;
        delete button.dataset.speaking;
        button.textContent = original;
      }
    }
  }

  function pronunciation(term) {
    const entries = window.MILO_PRONUNCIATION_LEXICON?.lookup?.(term) || [];
    const ipa = entries.filter((item) => item.ipa).map((item) => item.ipa).join(' · ') || 'Nghe mẫu để học âm đúng';
    const phones = entries.map((item) => item.phones || '').join(' ');
    const stressRows = window.MILO_PRONUNCIATION_LEXICON?.primaryStress?.(term) || [];
    const stress = stressRows.find((item) => item.pattern?.includes('1'));
    const tips = [];
    if (/\bTH\b/.test(phones)) tips.push('Đặt đầu lưỡi nhẹ giữa hai răng.');
    if (/\bDH\b/.test(phones)) tips.push('Giữ lưỡi như âm TH và rung cổ.');
    if (/\bR\b/.test(phones)) tips.push('Không rung đầu lưỡi như âm r tiếng Việt.');
    if (/\bL\b/.test(phones)) tips.push('Chạm đầu lưỡi vào lợi trên.');
    if (/\bV\b/.test(phones)) tips.push('Răng trên chạm nhẹ môi dưới.');
    if (/\bW\b/.test(phones)) tips.push('Chu môi rồi mở nhanh.');
    if (/\bSH\b/.test(phones)) tips.push('Môi hơi tròn, đẩy hơi giữa lưỡi.');
    if (/\bCH\b/.test(phones)) tips.push('Bật âm ngắn, không thêm âm ơ.');
    return { ipa, stress: stress ? `Nhấn âm ${stress.syllable}` : 'Nghe để nhận trọng âm', tip: tips[0] || 'Nghe chậm, nhìn khẩu hình và nói theo.' };
  }

  function wordsFor(ctx) {
    const items = ctx.section?.content?.items;
    if (Array.isArray(items) && items.length) return items.map((item) => ({ ...item, example: item.example || `${item.term}.` }));
    return (ctx.unit?.words || []).map((word) => ({ term: word[0], meaning: word[1], icon: word[2], example: `I can use the word ${word[0]}.` }));
  }

  function patterns(ctx) {
    const source = ctx.section?.content?.pattern || ctx.unit?.pattern || [];
    const vi = PATTERN_VI[`${ctx.grade}-${ctx.unitIndex + 1}`] || [
      `Câu hỏi về chủ đề: ${ctx.unit?.vi || ''}.`,
      `Câu trả lời mẫu về chủ đề: ${ctx.unit?.vi || ''}.`,
    ];
    return { question: source[0] || '', answer: source[1] || '', questionVi: vi[0], answerVi: vi[1] };
  }

  function stableHash(value) {
    let hash = 2166136261;
    for (const character of String(value || '')) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededShuffle(items, seed) {
    const result = [...items];
    let state = stableHash(seed) || 1;
    for (let index = result.length - 1; index > 0; index -= 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const target = state % (index + 1);
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }

  function rotate(items, offset = 0) {
    const values = [...items];
    if (!values.length) return values;
    const start = ((Number(offset) || 0) % values.length + values.length) % values.length;
    return [...values.slice(start), ...values.slice(0, start)];
  }

  function sameAnswerType(left, right) {
    const a = clean(left), b = clean(right);
    if (!a || !b) return false;
    const ipa = (value) => /^\/.+\/$/.test(value) || /[əɜɪʊæʌθðʃʒŋ]/.test(value);
    const vietnamese = (value) => /[à-ỹđ]/i.test(value);
    const number = (value) => /^\d+(?:[.,]\d+)?$/.test(value);
    const sentence = (value) => value.split(/\s+/).length > 3;
    return ipa(a) === ipa(b) && vietnamese(a) === vietnamese(b) && number(a) === number(b) && sentence(a) === sentence(b);
  }

  function globalDistractors(correct) {
    const values = [];
    Object.values(window.MILO_CURRICULUM || {}).forEach((grade) => (grade?.units || []).forEach((unit) => {
      (unit.words || []).forEach((word) => { values.push(word[0], word[1]); });
      (unit.pattern || []).forEach((pattern) => values.push(pattern));
      if (unit.title) values.push(unit.title);
      if (unit.sample) splitSentences(unit.sample).forEach((sentence) => values.push(sentence));
    }));
    if (/^\/.+\/$/.test(clean(correct)) || /[əɜɪʊæʌθðʃʒŋ]/.test(clean(correct))) {
      Object.values(window.MILO_CURRICULUM || {}).forEach((grade) => (grade?.units || []).forEach((unit) => (unit.words || []).slice(0, 4).forEach((word) => values.push(pronunciation(word[0]).ipa))));
    }
    return unique(values).filter((value) => clean(value) !== clean(correct) && sameAnswerType(value, correct));
  }

  function options(correct, pool = [], count = 4, seed = '') {
    const candidates = unique([...(pool || []), ...globalDistractors(correct)])
      .filter((item) => clean(item).toLowerCase() !== clean(correct).toLowerCase());
    const selected = seededShuffle(candidates, `${seed}|distractors`).slice(0, Math.max(1, count - 1));
    return seededShuffle(unique([correct, ...selected]), `${seed}|options`);
  }

  function cloneTask(task) {
    return { ...task, options: Array.isArray(task.options) ? [...task.options] : [] };
  }

  function taskBanks(guidedTasks, independentTasks, quickCheckTasks, extras = {}) {
    const guided = guidedTasks.map(cloneTask);
    const independent = independentTasks.map(cloneTask);
    const quick = quickCheckTasks.map(cloneTask);
    return {
      ...extras,
      guidedTasks: guided,
      independentTasks: independent,
      quickCheckTasks: quick,
      guided: cloneTask(guided[0]),
      independent,
      quick,
    };
  }

  function taskSignature(task) {
    return [task.kind, task.prompt, task.answer, task.example, task.target]
      .map((value) => clean(value).toLowerCase().replace(/[^a-z0-9à-ỹđ/]+/gi, ' '))
      .join('|');
  }



  function passageFor(ctx) {
    const sample = clean(ctx.unit?.sample || '');
    if (sample) return sample;
    const w = wordsFor(ctx).slice(0, 4);
    const p = patterns(ctx);
    return `${p.answer} ${w.map((item) => `The word ${item.term} means ${item.meaning}.`).join(' ')}`;
  }

  function splitSentences(text) {
    return clean(text).match(/[^.!?]+[.!?]?/g)?.map(clean).filter(Boolean) || [];
  }

  function objective(ctx) {
    const type = ctx.section.sectionType;
    if (type.startsWith('Vocabulary')) return 'Con hiểu, nghe và nói được các từ mới.';
    if (type === 'Pronunciation') return 'Con nghe đúng âm, nhìn khẩu hình và nói lại.';
    if (type.startsWith('Grammar')) return 'Con hiểu mẫu câu và dùng đúng trong bài tập.';
    if (type.startsWith('Reading')) return 'Con đọc từng đoạn và tìm câu làm bằng chứng.';
    if (type === 'Listening') return 'Con nghe ý chính rồi nghe chi tiết.';
    if (type === 'Speaking/Communication') return 'Con nghe mẫu, thay từ và tự trả lời.';
    if (type.startsWith('Writing')) return 'Con ghép ý, hoàn thành câu rồi tự viết.';
    if (type === 'Project') return 'Con làm sản phẩm nhỏ bằng kiến thức Unit.';
    if (type === 'Big Question') return 'Con hiểu câu hỏi lớn và nói một câu trả lời.';
    return `Con hiểu và thực hành phần ${type}.`;
  }

  function teacherCopy(ctx) {
    const type = ctx.section.sectionType;
    const p = patterns(ctx);
    const focus = ctx.section.content?.focus || ctx.unit?.grammarFocus || [];
    if (type.startsWith('Vocabulary')) {
      const sampleTerms = wordsFor(ctx).slice(0, 3).map((item) => item.term).join(', ');
      return { quick: `Con học từ mới bằng hình, âm thanh và ngữ cảnh. Nhóm hôm nay có: ${sampleTerms}.`, deep: 'Mỗi từ đi qua các thao tác: nhìn hình, nghe, nghe chậm, xem IPA, hiểu trong ngữ cảnh, nói lại và dùng trong câu mới.' };
    }
    if (type === 'Pronunciation') return { quick: `Âm trọng tâm là ${ctx.section.content?.focus || ctx.unit?.phonics || 'âm của Unit'}. Con nhìn môi rồi nghe chậm.`, deep: 'Con không đọc theo mặt chữ tiếng Việt. Hãy nghe âm riêng, nói từ mẫu, rồi đưa âm vào cả câu.' };
    if (type.startsWith('Grammar')) return { quick: `Con tìm chủ ngữ, từ chỉ thời gian và phần động từ cần thay đổi trước khi chọn.`, deep: `Trọng tâm: ${Array.isArray(focus) ? focus.join(' · ') : focus}. Milo dùng câu mẫu khác; câu đang làm vẫn được giữ kín.` };
    if (type === 'Listening') return { quick: 'Lượt một nghe ý chính. Lượt hai nghe từ khóa và chi tiết.', deep: 'Trước khi nghe, con xem bối cảnh và từ khóa. Sau khi trả lời, transcript và bản dịch mới được mở.' };
    if (type.startsWith('Reading')) return { quick: 'Con đọc từng đoạn ngắn và tìm một câu làm bằng chứng.', deep: 'Con dự đoán trước, bấm từ khó khi cần, rồi trả lời bằng thông tin có trong đoạn.' };
    if (type === 'Speaking/Communication') return { quick: 'Con nghe mẫu khác, thay thông tin rồi tự trả lời bằng điều thật về con.', deep: 'Vòng một nói theo mẫu khác. Vòng hai thay một thông tin. Vòng ba tự trả lời; Milo không đọc trước câu của bài đang làm.' };
    if (type.startsWith('Writing')) return { quick: 'Con chưa cần viết cả đoạn. Hãy chọn ý rồi hoàn thành từng câu.', deep: 'Con đi từ từ gợi ý đến câu khung, ghép câu thành đoạn và kiểm tra chữ hoa, dấu câu, cấu trúc.' };
    return { quick: objective(ctx), deep: 'Milo làm mẫu trước. Sau đó con làm có gợi ý, tự làm và kiểm tra nhanh.' };
  }

  function deepTeachingPlan(ctx) {
    const type = ctx.section.sectionType;
    const focus = ctx.section.content?.focus || ctx.unit?.grammarFocus || ctx.unit?.phonics || [];
    const focusText = clean(Array.isArray(focus) ? focus.join(' · ') : focus) || 'Kiến thức trọng tâm của phần này';
    const firstWord = wordsFor(ctx)[0] || { term: 'English', meaning: 'tiếng Anh' };
    const sound = pronunciation(firstWord.term);
    if (type.startsWith('Vocabulary')) return [
      { icon: '💡', title: 'Hiểu nghĩa trong ngữ cảnh', text: `Không chỉ học thuộc “${firstWord.term}”. Con nối từ với nghĩa “${firstWord.meaning}”, hình ảnh và tình huống thật.` },
      { icon: '🔊', title: 'Nghe và phát âm', text: `${firstWord.term} · ${sound.ipa}. ${sound.stress}. ${sound.tip}` },
      { icon: '🧩', title: 'Dùng được trong câu', text: 'Nhìn từ đứng cạnh nó, nhận ra loại từ rồi đặt một câu mới của chính con.' },
      { icon: '⚠️', title: 'Lỗi hay gặp', text: 'Chỉ nhớ nghĩa tiếng Việt nhưng không nghe, không nói và không biết đặt từ vào câu.' },
    ];
    if (type === 'Pronunciation') return [
      { icon: '👄', title: 'Khẩu hình và luồng hơi', text: focusText },
      { icon: '🐢', title: 'Từ âm đến từ', text: 'Nghe âm riêng thật chậm, nói từ mẫu, rồi mới đưa âm vào cả câu.' },
      { icon: '👂', title: 'Phân biệt bằng tai', text: 'Nghe hai âm gần nhau và nhận ra âm đúng trước khi nói lại.' },
      { icon: '⚠️', title: 'Lỗi hay gặp', text: 'Đọc theo mặt chữ tiếng Việt hoặc thêm âm “ơ” ở cuối từ.' },
    ];
    if (type.startsWith('Grammar')) return [
      { icon: '💬', title: 'Ý nghĩa', text: 'Mẫu câu giúp con diễn đạt đúng một ý trong tình huống của Unit, không phải một công thức để đọc thuộc.' },
      { icon: '🧱', title: 'Cấu trúc', text: focusText },
      { icon: '🎯', title: 'Cách dùng', text: 'Tìm chủ ngữ, dấu hiệu thời gian và ý muốn nói; sau đó mới chọn dạng động từ hoặc từ để hỏi.' },
      { icon: '⚠️', title: 'Lỗi hay gặp', text: 'Chọn theo một từ quen mắt mà không kiểm tra chủ ngữ, thời gian và nghĩa của cả câu.' },
    ];
    if (type.startsWith('Reading')) return [
      { icon: '🔭', title: 'Dự đoán trước khi đọc', text: 'Nhìn tiêu đề và tranh để đoán chủ đề; dự đoán chỉ là giả thuyết, phải kiểm tra lại trong bài.' },
      { icon: '🧩', title: 'Đọc theo cụm ý', text: 'Đọc từng đoạn ngắn, khoanh người, nơi chốn, hành động và từ nối thay vì dịch từng từ.' },
      { icon: '🔎', title: 'Tìm bằng chứng', text: 'Mỗi câu trả lời phải chỉ được câu hoặc cụm từ trong bài giúp con kết luận.' },
      { icon: '⚠️', title: 'Lỗi hay gặp', text: 'Chọn đáp án theo trí nhớ hoặc theo một từ giống câu hỏi nhưng không đúng ý của đoạn.' },
    ];
    if (type === 'Listening') return [
      { icon: '🖼️', title: 'Đoán bối cảnh', text: 'Xem tranh, người nói và các lựa chọn để biết mình sắp nghe về điều gì.' },
      { icon: '1️⃣', title: 'Lượt 1 · Ý chính', text: 'Nghe toàn lượt, chưa dừng ở từng từ. Xác định ai đang nói và chuyện gì đang xảy ra.' },
      { icon: '2️⃣', title: 'Lượt 2 · Chi tiết', text: 'Nghe từ khóa về thời gian, nơi chốn, số lượng hoặc hành động để trả lời.' },
      { icon: '⚠️', title: 'Lỗi hay gặp', text: 'Cố hiểu mọi từ ngay lượt đầu rồi bỏ lỡ phần còn lại của câu.' },
    ];
    if (type === 'Speaking/Communication') return [
      { icon: '👂', title: 'Nghe mẫu', text: 'Nhận ra nhịp câu, từ để hỏi và phần thông tin sẽ được thay đổi.' },
      { icon: '🔁', title: 'Nói theo rồi thay từ', text: 'Nói lại một câu mẫu khác, thay một thông tin, sau đó tự trả lời bằng điều thật về con.' },
      { icon: '🎤', title: 'Nói trọn ý', text: 'Ưu tiên câu rõ nghĩa và đủ ý trước; tốc độ và độ tự nhiên sẽ tăng dần khi luyện.' },
      { icon: '⚠️', title: 'Lỗi hay gặp', text: 'Chỉ nói một từ rời hoặc đọc lại câu hỏi mà chưa đưa thông tin trả lời.' },
    ];
    if (type.startsWith('Writing')) return [
      { icon: '🗂️', title: 'Phân tích mẫu', text: 'Xem bài mẫu được mở đầu, sắp ý và kết thúc như thế nào.' },
      { icon: '📝', title: 'Lập ý trước khi viết', text: 'Chọn từ khóa và viết từng câu ngắn; chưa cần viết cả đoạn ngay lập tức.' },
      { icon: '🔍', title: 'Tự kiểm tra', text: 'Đọc lại chữ hoa, dấu câu, mẫu câu, từ vựng và xem bài đã đúng chủ đề chưa.' },
      { icon: '⚠️', title: 'Lỗi hay gặp', text: 'Chép nguyên bài mẫu hoặc viết liền một lượt mà không đọc và sửa lại.' },
    ];
    if (type === 'Project') return [
      { icon: '🎯', title: 'Sản phẩm cần làm', text: clean(ctx.section.content?.task || ctx.unit?.project || objective(ctx)) },
      { icon: '🪜', title: 'Làm từng bước', text: 'Chuẩn bị ý và từ → tạo sản phẩm → luyện trình bày → tự kiểm tra theo checklist.' },
      { icon: '🗣️', title: 'Trình bày', text: 'Dùng từ và mẫu câu của Unit để nói về sản phẩm, không chỉ trang trí.' },
      { icon: '✅', title: 'Tự đánh giá', text: 'Kiểm tra đủ ý, đúng tiếng Anh, rõ tiếng và hoàn thành đúng yêu cầu.' },
    ];
    return [
      { icon: '🎯', title: 'Mục tiêu', text: objective(ctx) },
      { icon: '🧠', title: 'Hiểu kiến thức', text: teacherCopy(ctx).deep },
      { icon: '🪜', title: 'Cách làm', text: 'Milo làm mẫu khác, con làm cùng Milo, rồi con tự làm.' },
      { icon: '✅', title: 'Kiểm tra đã hiểu', text: 'Con phải áp dụng được trong câu mới và đạt ít nhất 80%.' },
    ];
  }

  function exactSourceHtml(ctx) {
    const exact = ctx.section.exactVerification;
    const transcription = exact?.content?.exactTranscription;
    const blocks = Array.isArray(transcription?.blocks) ? transcription.blocks : [];
    if (!exact || !blocks.length) {
      return `<section class="micro-source-status pending"><span>📘</span><div><small>TRANG SÁCH ĐANG ĐƯỢC ĐỐI CHIẾU</small><b>Milo chưa hiển thị chữ máy đọc chưa được kiểm duyệt.</b><p>Phần giải thích bên dưới là bài giảng của Milo theo đúng kỹ năng của Unit; không được gắn nhãn nguyên văn sách.</p></div></section>`;
    }
    const complete = exact.coverage === 'complete_visible_section';
    const firstBlock = blocks[0];
    const fullBlocks = blocks.map((block) => `<article><h4>${esc(block.heading || '')}</h4>${(block.lines || []).map((line) => `<p>${esc(line)}</p>`).join('')}</article>`).join('');
    const asset = exact.sourceAssets?.[0] || '';
    return `<section class="micro-exact-source">
      <header><span>📖</span><div><small>CHỮ TRONG SÁCH ĐÃ ĐỐI CHIẾU TRỰC TIẾP</small><h3>${esc(transcription.title || ctx.section.title)}</h3><p>${complete ? 'Đã đối chiếu đầy đủ phần chữ nhìn thấy của mục này.' : 'Đã đối chiếu phần chữ nhìn thấy; phần nghe hoặc video gốc chưa có trong ảnh.'}</p></div></header>
      <div class="micro-source-current"><small>ĐOẠN ĐANG HỌC</small><b>${esc(firstBlock.heading || transcription.title || '')}</b>${(firstBlock.lines || []).slice(0, 5).map((line) => `<p>${esc(line)}</p>`).join('')}</div>
      <details><summary>Xem toàn bộ phần chữ đã đối chiếu</summary><div class="micro-source-full">${fullBlocks}</div></details>
      ${asset ? `<button type="button" class="micro-secondary-action" data-open-book-page="${esc(asset)}">🖼️ Xem trang sách gốc</button>` : ''}
    </section>`;
  }

  function deepTeachingHtml(ctx, tasks) {
    const copy = teacherCopy(ctx);
    const cards = deepTeachingPlan(ctx).map((item) => `<article><span>${item.icon}</span><div><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div></article>`).join('');
    return `<div class="micro-deep-teaching">
      ${exactSourceHtml(ctx)}
      <section class="micro-teacher">
        <div class="micro-teacher-head"><span>🦊</span><div><small>MILO GIẢNG CHUYÊN SÂU</small><h2>${esc(objective(ctx))}</h2><p>${esc(copy.quick)}</p></div></div>
        <div class="micro-deep-grid">${cards}</div>
        <div class="micro-deep-rule"><b>Vì sao cần học phần này?</b><p>${esc(copy.deep)}</p></div>
        ${teachingExampleHtml(tasks.guided, ctx)}
        <button type="button" class="micro-secondary-action" data-teacher-speak>🔊 Nghe Milo tóm tắt phần giảng</button>
      </section>
    </div>`;
  }

  function teacherNarration(ctx) {
    const copy = teacherCopy(ctx);
    return [copy.quick, copy.deep, ...deepTeachingPlan(ctx).map((item) => `${item.title}. ${item.text}`)].join(' ');
  }

  function exercise(id, kind, prompt, answer, config = {}) {
    return {
      id, kind, prompt, answer,
      origin: config.origin || 'miloPractice',
      source: config.source || null,
      instruction: config.instruction || 'Con đọc câu rồi chọn một đáp án.',
      example: '', // Legacy examples are never stored on executable tasks; use answer-safe teachingExample instead.
      teachingExample: config.teachingExample || null,
      options: config.options || [],
      explanation: config.explanation || 'Milo kiểm tra theo kiến thức của Unit.',
      hint: config.hint || 'Con tìm từ khóa trong đề bài trước.',
      hintLevels: Array.isArray(config.hintLevels) ? config.hintLevels : [config.hint || 'Con tìm từ khóa trong đề bài trước.', 'Nhắc lại quy tắc rồi thử lại bằng một cách khác.'],
      evidence: config.evidence || '',
      minWords: config.minWords || 0,
      target: config.target || '',
    };
  }

  function makeTasks(ctx, attempt = 0) {
    const type = ctx.section.sectionType;
    const sourceWords = wordsFor(ctx);
    const fallback = { term: 'English', meaning: 'tiếng Anh', example: 'I learn English with Milo.', icon: '🔤' };
    const variant = Math.abs(Number(attempt) || 0) % 3;
    const words = rotate(sourceWords.length ? sourceWords : [fallback], stableHash(`${ctx.grade}|${ctx.unitIndex}|${ctx.part}|${variant}`) % Math.max(1, sourceWords.length || 1));
    const word = (index) => words[index % words.length] || fallback;
    const p = patterns(ctx);
    const otherMeanings = words.map((item) => item.meaning);
    const otherTerms = words.map((item) => item.term);
    const allGradeUnits = window.MILO_CURRICULUM?.[ctx.grade]?.units || [];
    const unitTitles = allGradeUnits.map((item) => item.title);
    const grammarFocus = ctx.section.content?.focus || ctx.unit?.grammarFocus || ['Mẫu câu của Unit'];
    const focusText = Array.isArray(grammarFocus) ? grammarFocus[variant % grammarFocus.length] || grammarFocus[0] : grammarFocus;
    const first = word(0), second = word(1), third = word(2), fourth = word(3), fifth = word(4), sixth = word(5), seventh = word(6);
    const seed = `${ctx.grade}-${ctx.unitIndex + 1}-${ctx.part}-v${variant}`;
    const ex = (item) => clean(item?.example || `I use ${item?.term || 'English'} in this lesson.`);
    const blank = (item) => ex(item).replace(new RegExp(String(item.term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), '_____');
    const newSentence = (item, prefix = 'Today') => `${prefix}, I use “${item.term}” when I talk about ${ctx.unit.title}.`;
    const choice = (id, prompt, answer, pool, config = {}) => exercise(`${id}-v${variant}`, 'choice', prompt, answer, { ...config, options: options(answer, pool, config.count || 4, `${seed}|${id}`) });

    if (type.startsWith('Vocabulary')) {
      const guided = [choice('v-g', `Từ nào điền đúng vào câu: ${blank(first)}`, first.term, otherTerms, {
        instruction: 'Con nhìn hình hoặc ngữ cảnh rồi chọn từ phù hợp; Milo không cho sẵn nghĩa của câu này.', example: blank(second), explanation: `Từ “${first.term}” làm câu đúng nghĩa trong ngữ cảnh của Unit.`, hint: 'Nhìn các từ xung quanh chỗ trống và nhớ hình minh họa của từ.',
      })];
      const independent = [
        choice('v-i1', `Chọn từ tiếng Anh phù hợp với nghĩa “${second.meaning}”.`, second.term, otherTerms, { instruction: 'Con đọc nghĩa rồi chọn từ.', example: `${second.meaning} → ${second.term}`, explanation: `Từ phù hợp là “${second.term}”.` }),
        choice('v-i2', `Hoàn thành câu trong ngữ cảnh: ${blank(third)}`, third.term, otherTerms, { instruction: 'Đọc cả câu trước khi chọn.', example: ex(third), explanation: `Câu hoàn chỉnh là: ${ex(third)}` }),
        choice('v-i3', `Từ nào cùng thuộc chủ đề “${ctx.unit.title}” với “${fourth.term}”?`, fifth.term, [first.term, second.term, third.term, sixth.term, seventh.term], { instruction: 'Chọn một từ khác trong cùng Unit.', example: `${fourth.term} · ${fifth.term}`, explanation: `“${fifth.term}” cũng thuộc chủ đề của Unit.` }),
        exercise(`v-i4-v${variant}`, 'arrange', 'Sắp xếp các từ thành câu dùng từ mới.', ex(fourth).replace(/[.!?]$/g, ''), { instruction: 'Bấm các từ theo đúng thứ tự.', example: ex(fourth), explanation: `Câu đúng là: ${ex(fourth)}` }),
        exercise(`v-i5-v${variant}`, 'write', `Viết một câu mới có từ “${sixth.term}”.`, '', { instruction: 'Con viết ít nhất bốn từ và đúng chủ đề.', example: ex(sixth), explanation: `Câu cần dùng đúng từ “${sixth.term}”.`, minWords: 4, target: sixth.term }),
      ];
      const quick = [
        choice('v-q1', `Trong tình huống mới “${newSentence(fifth, 'At school')}”, từ trọng tâm là từ nào?`, fifth.term, otherTerms, { instruction: 'Chọn từ phù hợp với tình huống mới.', example: newSentence(fifth, 'At school'), explanation: `Tình huống mới dùng từ “${fifth.term}”.` }),
        choice('v-q2', `Trong câu mới “${blank(sixth)}”, từ nào phù hợp nhất?`, sixth.term, otherTerms, { instruction: 'Con dùng từ trong ngữ cảnh mới, không chọn lại nghĩa vừa xem.', example: blank(first), explanation: `Từ “${sixth.term}” phù hợp với ngữ cảnh mới.` }),
        choice('v-q3', `Từ nào điền hợp lý vào câu mới: “We talk about _____ in this Unit.”`, seventh.term, otherTerms, { instruction: 'Chọn từ cùng chủ đề và đúng loại từ.', example: `We talk about ${seventh.term} in this Unit.`, explanation: `Từ “${seventh.term}” phù hợp với chủ đề.` }),
        exercise(`v-q4-v${variant}`, 'arrange', 'Tạo một câu mới từ các từ cho sẵn.', newSentence(second, 'Now').replace(/[.!?]$/g, ''), { instruction: 'Sắp xếp thành câu hoàn chỉnh.', example: newSentence(second, 'Now'), explanation: `Câu ứng dụng là: ${newSentence(second, 'Now')}` }),
        exercise(`v-q5-v${variant}`, 'write', `Viết câu trả lời ngắn có từ “${third.term}” trong một tình huống của con.`, '', { instruction: 'Viết ít nhất bốn từ; không chép lại câu mẫu.', example: newSentence(third, 'For me'), explanation: 'Câu đúng chủ đề và dùng từ trong ngữ cảnh mới.', minWords: 4, target: third.term }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type === 'Pronunciation') {
      const focus = clean(ctx.section.content?.focus || ctx.unit?.phonics || 'âm trọng tâm');
      const guidedWord = first, independentWords = [second, third, fourth], quickWords = [fifth, sixth, seventh];
      const guidedMeta = pronunciation(guidedWord.term);
      const guided = [exercise(`p-g-v${variant}`, 'speak', `Nghe và nói chậm từ “${guidedWord.term}”.`, guidedWord.term, { instruction: 'Bấm nghe mẫu, nói lại rồi xem câu Milo nhận được.', example: `${guidedWord.term} · ${guidedMeta.ipa}`, explanation: guidedMeta.tip, target: guidedWord.term })];
      const independent = [
        choice('p-i1', 'Milo đọc một từ. Con chọn đúng từ vừa nghe.', independentWords[0].term, otherTerms, { instruction: 'Chú ý âm đầu và âm cuối.', example: independentWords[0].term, explanation: `Từ Milo đọc là “${independentWords[0].term}”.`, target: independentWords[0].term }),
        choice('p-i2', `IPA nào phù hợp với từ “${independentWords[1].term}”?`, pronunciation(independentWords[1].term).ipa, words.map((item) => pronunciation(item.term).ipa), { instruction: 'So sánh âm và chọn IPA đúng.', example: `${independentWords[1].term} · ${pronunciation(independentWords[1].term).ipa}`, explanation: `IPA đúng là ${pronunciation(independentWords[1].term).ipa}.` }),
        exercise(`p-i3-v${variant}`, 'speak', `Nói câu có từ “${independentWords[2].term}”: ${ex(independentWords[2])}`, ex(independentWords[2]), { instruction: 'Nói trọn câu, giữ nhịp đều và không nuốt âm cuối.', example: ex(independentWords[2]), explanation: pronunciation(independentWords[2].term).tip, target: ex(independentWords[2]) }),
      ];
      const quick = [
        choice('p-q1', `Từ nào có âm trọng tâm gần với “${quickWords[0].term}”?`, quickWords[1].term, [first.term, second.term, third.term, fourth.term, quickWords[2].term], { instruction: `Nghe và so sánh ${focus}.`, example: `${quickWords[0].term} · ${quickWords[1].term}`, explanation: 'Hai từ được chọn dùng âm trọng tâm của Unit.' }),
        choice('p-q2', `Âm trọng tâm trong từ “${quickWords[2].term}” cần được nghe ở đâu?`, 'Trong toàn bộ từ', ['Ở đầu từ', 'Ở giữa từ', 'Ở cuối từ', 'Trong toàn bộ từ'], { instruction: 'Nghe mẫu rồi xác định vị trí âm.', example: quickWords[2].term, explanation: 'Con cần nghe âm trong cả từ trước khi tách vị trí.' }),
        exercise(`p-q3-v${variant}`, 'speak', `Nói từ mới “${quickWords[0].term}” mà con chưa luyện ở vòng trước.`, quickWords[0].term, { instruction: 'Nghe một lần rồi tự nói.', example: `${quickWords[0].term} · ${pronunciation(quickWords[0].term).ipa}`, explanation: pronunciation(quickWords[0].term).tip, target: quickWords[0].term }),
        exercise(`p-q4-v${variant}`, 'speak', `Nói câu mới: ${newSentence(quickWords[1], 'Today')}`, newSentence(quickWords[1], 'Today'), { instruction: 'Nói rõ từ trọng tâm trong câu mới.', example: newSentence(quickWords[1], 'Today'), explanation: 'Giữ rõ âm trọng tâm và âm cuối.', target: newSentence(quickWords[1], 'Today') }),
        choice('p-q5', 'Cách luyện nào giúp con sửa phát âm an toàn và hiệu quả?', 'Nghe chậm, nhìn khẩu hình, nói lại và đối chiếu', ['Nghe chậm, nhìn khẩu hình, nói lại và đối chiếu', 'Đọc theo mặt chữ tiếng Việt', 'Bỏ âm cuối để nói nhanh', 'Nói thật to mà không nghe mẫu'], { instruction: 'Chọn quy trình luyện đúng.', example: 'Nghe → nhìn → nói → đối chiếu.', explanation: 'Quy trình này giúp con tự nhận ra lỗi và sửa đúng.' }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type.startsWith('Grammar')) {
      if (/Practice/i.test(type)) {
        const model = clean(p.answer || ex(first));
        const wordsInModel = model.replace(/[.!?]/g, '').split(/\s+/).filter(Boolean);
        const swapped = wordsInModel.length > 2 ? [wordsInModel[1], wordsInModel[0], ...wordsInModel.slice(2)].join(' ') : `${model} not`;
        const guided = [choice('gp-g', `Bài luyện ứng dụng: câu nào sửa đúng lỗi trong “${swapped}”?`, model, [swapped, p.question, ex(first), ex(second)], { instruction: 'Tìm lỗi trước, rồi chọn câu đã sửa.', example: `Sai: ${swapped} → Đúng: ${model}`, explanation: `Câu đã sửa đúng là: ${model}` })];
        const independent = [
          choice('gp-i1', `Chọn phản hồi phù hợp để hoàn thành hội thoại: “${p.question}”`, newSentence(second, 'In practice'), [p.answer, ex(first), ex(third), ex(fourth)], { instruction: 'Áp dụng mẫu câu vào phản hồi mới.', example: `${p.question} — ${newSentence(second, 'In practice')}`, explanation: 'Phản hồi mới vẫn giữ đúng cấu trúc.' }),
          choice('gp-i2', `Câu nào có lỗi cần sửa về “${focusText}”?`, swapped, [model, ex(second), ex(third), newSentence(fourth, 'Now')], { instruction: 'Tìm câu sai, không chọn câu đúng.', example: swapped, explanation: 'Trật tự trong câu này chưa đúng.' }),
          exercise(`gp-i3-v${variant}`, 'arrange', 'Sắp xếp một câu thực hành mới.', newSentence(fifth, 'During practice').replace(/[.!?]$/g, ''), { instruction: 'Dùng cấu trúc đã học trong tình huống mới.', example: newSentence(fifth, 'During practice'), explanation: `Câu đúng là: ${newSentence(fifth, 'During practice')}` }),
          exercise(`gp-i4-v${variant}`, 'write', `Viết câu trả lời mới có từ “${sixth.term}”.`, '', { instruction: 'Viết ít nhất bốn từ và giữ đúng mẫu.', example: newSentence(sixth, 'My practice answer'), explanation: 'Câu mới cần đúng mẫu và có nội dung riêng.', minWords: 4, target: sixth.term }),
        ];
        const quick = [
          choice('gp-q1', 'Trong tình huống mới, câu nào vừa đúng nghĩa vừa đúng cấu trúc?', newSentence(seventh, 'For this situation'), [swapped, p.question, ex(first), ex(second)], { instruction: 'Chọn câu ứng dụng hoàn chỉnh.', example: newSentence(seventh, 'For this situation'), explanation: 'Câu này đúng cấu trúc và phù hợp tình huống.' }),
          choice('gp-q2', `Cách sửa tốt nhất cho “${swapped}” là gì?`, model, [p.question, ex(third), newSentence(first, 'Maybe'), swapped], { instruction: 'Chọn bản sửa hoàn chỉnh.', example: model, explanation: `Bản sửa đúng là: ${model}` }),
          choice('gp-q3', 'Khi luyện áp dụng, con nên thay đổi phần nào?', 'Thông tin trong câu nhưng giữ cấu trúc trọng tâm', ['Thông tin trong câu nhưng giữ cấu trúc trọng tâm', 'Toàn bộ cấu trúc thành câu khác', 'Chỉ đổi dấu câu', 'Bỏ chủ ngữ và động từ'], { instruction: 'Chọn nguyên tắc tạo câu biến thể.', example: 'Giữ mẫu · đổi thông tin.', explanation: 'Cách này tạo câu mới mà vẫn luyện đúng ngữ pháp.' }),
          exercise(`gp-q4-v${variant}`, 'arrange', 'Tạo câu kiểm tra mới từ các từ cho sẵn.', newSentence(third, 'In the final check').replace(/[.!?]$/g, ''), { instruction: 'Không sắp xếp lại câu đã làm trước.', example: newSentence(third, 'In the final check'), explanation: `Câu đúng là: ${newSentence(third, 'In the final check')}` }),
          exercise(`gp-q5-v${variant}`, 'write', `Hoàn thành một lượt hội thoại mới có từ “${fourth.term}”.`, '', { instruction: 'Viết ít nhất bốn từ, đúng tình huống.', example: `${p.question} ${newSentence(fourth, 'My reply')}`, explanation: 'Câu trả lời cần đúng cấu trúc và tiếp nối hội thoại.', minWords: 4, target: fourth.term }),
        ];
        return taskBanks(guided, independent, quick);
      }
      const answerTokens = clean(p.answer).replace(/[.!?]/g, '').split(' ');
      const blankWord = answerTokens.find((token) => token.length > 2) || answerTokens[0] || first.term;
      const blankSentence = p.answer.replace(blankWord, '_____');
      const wrongOrder = answerTokens.length > 2 ? [answerTokens[1], answerTokens[0], ...answerTokens.slice(2)].join(' ') : `${p.answer} not`;
      const alternate = ex(second);
      const guided = [choice('g-g', p.question, p.answer, [p.question, ex(first), ex(second), alternate], { instruction: 'Con đọc câu hỏi và chọn câu trả lời mẫu.', example: `${p.question} — ${p.answer}`, explanation: `${p.answerVi} Đây là phản hồi phù hợp.` })];
      const independent = [
        choice('g-i1', blankSentence, blankWord, [...otherTerms, ...answerTokens], { instruction: 'Chọn từ hoàn thành đúng cấu trúc.', example: p.answer, explanation: `Câu hoàn chỉnh là: ${p.answer}` }),
        exercise(`g-i2-v${variant}`, 'arrange', 'Sắp xếp thành câu hỏi đúng.', p.question.replace(/[.!?]$/g, ''), { instruction: 'Bấm các từ theo đúng trật tự câu hỏi.', example: p.question, explanation: `Câu hỏi đúng là: ${p.question}` }),
        choice('g-i3', `Câu nào dùng đúng trọng tâm “${focusText}”?`, alternate, [p.question, p.answer, ex(first), wrongOrder], { instruction: 'So sánh cấu trúc của từng câu.', example: alternate, explanation: `Câu “${alternate}” có cấu trúc phù hợp với bài.` }),
        exercise(`g-i4-v${variant}`, 'write', `Đổi thông tin trong mẫu và viết câu mới với từ “${third.term}”.`, '', { instruction: 'Viết ít nhất bốn từ, dùng đúng mẫu câu.', example: `${p.answer} → ${newSentence(third, 'For me')}`, explanation: 'Câu mới phải thay thông tin nhưng giữ đúng cấu trúc.', minWords: 4, target: third.term }),
      ];
      const quick = [
        choice('g-q1', `Tìm câu đã sửa đúng lỗi trật tự trong “${wrongOrder}”.`, p.answer, [wrongOrder, p.question, ex(fourth), ex(fifth)], { instruction: 'Xác định phần bị đảo rồi chọn câu đúng.', example: `Sai: ${wrongOrder}`, explanation: `Câu đúng là: ${p.answer}` }),
        choice('g-q2', `Hoàn thành hội thoại mới: “${p.question}”`, newSentence(fourth, 'In my answer'), [p.answer, ex(first), ex(second), newSentence(fifth, 'In my answer')], { instruction: 'Chọn câu trả lời mới đúng chủ đề và đủ cấu trúc.', example: `${p.question} — ${newSentence(fourth, 'In my answer')}`, explanation: 'Đây là câu ứng dụng mới của mẫu câu.' }),
        choice('g-q3', 'Khi đổi chủ ngữ hoặc thông tin, phần nào cần giữ đúng?', focusText, [ctx.unit.title, first.meaning, second.meaning, ...(ctx.unit.grammarFocus || [])], { instruction: 'Chọn quy tắc ngữ pháp cần giữ.', example: focusText, explanation: `Cần giữ đúng: ${focusText}.` }),
        exercise(`g-q4-v${variant}`, 'arrange', 'Sắp xếp thành câu ứng dụng mới.', newSentence(sixth, 'Now').replace(/[.!?]$/g, ''), { instruction: 'Tạo câu mới, không sắp xếp lại câu mẫu cũ.', example: newSentence(sixth, 'Now'), explanation: `Câu đúng là: ${newSentence(sixth, 'Now')}` }),
        exercise(`g-q5-v${variant}`, 'write', `Trả lời tình huống mới bằng câu có từ “${seventh.term}”.`, '', { instruction: 'Viết ít nhất bốn từ và đúng cấu trúc.', example: newSentence(seventh, 'My answer'), explanation: 'Câu trả lời cần đúng tình huống và mẫu ngữ pháp.', minWords: 4, target: seventh.term }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type === 'Listening') {
      const transcriptA = passageFor(ctx);
      const transcriptB = `${p.question} ${newSentence(fourth, 'In a new situation')} ${ex(fifth)}`;
      const sentencesA = splitSentences(transcriptA);
      const mentioned = words.find((item) => transcriptA.toLowerCase().includes(item.term.toLowerCase())) || first;
      const guided = [choice('l-g', 'Sau lượt nghe thứ nhất, ý chính của đoạn là gì?', ctx.unit.title, unitTitles, { instruction: 'Nghe toàn đoạn và chọn chủ đề chính.', example: `Từ khóa: ${first.term}, ${second.term}, ${third.term}`, explanation: `Đoạn nghe thuộc chủ đề “${ctx.unit.title}”.`, target: transcriptA })];
      const independent = [
        choice('l-i1', 'Chi tiết nào xuất hiện trong đoạn nghe thứ nhất?', mentioned.term, otherTerms, { instruction: 'Nghe lại và tìm đúng từ khóa.', example: mentioned.term, explanation: `Đoạn nghe có từ “${mentioned.term}”.`, evidence: mentioned.term, target: transcriptA }),
        choice('l-i2', 'Câu nào xuất hiện sớm nhất trong đoạn nghe?', sentencesA[0] || transcriptA, sentencesA.slice(1), { instruction: 'Chú ý thứ tự thông tin.', example: sentencesA[0] || transcriptA, explanation: 'Đây là thông tin xuất hiện đầu tiên.', evidence: sentencesA[0] || transcriptA, target: transcriptA }),
        choice('l-i3', `Người nghe cần trả lời câu hỏi nào?`, p.question, [p.answer, ex(first), ex(second), ex(third)], { instruction: 'Nghe câu hỏi và chọn đúng nội dung.', example: p.question, explanation: p.questionVi, target: p.question }),
      ];
      const quick = [
        choice('l-q1', 'Đoạn nghe biến thể nói về tình huống nào?', `Tình huống mới của Unit ${ctx.unitIndex + 1}`, unitTitles.map((title, index) => `Tình huống của ${title || `Unit ${index + 1}`}`), { instruction: 'Nghe đoạn thứ hai và chọn bối cảnh phù hợp.', example: transcriptB, explanation: `Đây là tình huống mới của Unit ${ctx.unitIndex + 1}.`, target: transcriptB }),
        choice('l-q2', 'Từ nào chỉ xuất hiện trong đoạn nghe biến thể?', fourth.term, [first.term, second.term, third.term, fifth.term, sixth.term], { instruction: 'So sánh hai lượt nghe.', example: fourth.term, explanation: `Từ mới trong đoạn biến thể là “${fourth.term}”.`, target: transcriptB }),
        choice('l-q3', 'Sau câu hỏi trong đoạn biến thể, thông tin nào được nêu tiếp?', newSentence(fourth, 'In a new situation'), [p.answer, ex(first), ex(second), ex(third)], { instruction: 'Nghe và xác định thứ tự.', example: transcriptB, explanation: 'Thông tin này đứng ngay sau câu hỏi.', target: transcriptB }),
        choice('l-q4', `“${fifth.term}” trong đoạn nghe có nghĩa là gì?`, fifth.meaning, otherMeanings, { instruction: 'Dựa vào ngữ cảnh để chọn nghĩa.', example: ex(fifth), explanation: `“${fifth.term}” nghĩa là “${fifth.meaning}”.`, target: transcriptB }),
        choice('l-q5', 'Mục tiêu của lượt nghe kiểm tra là gì?', 'Áp dụng kỹ năng nghe vào đoạn biến thể', ['Áp dụng kỹ năng nghe vào đoạn biến thể', 'Nghe lại nguyên câu hỏi cũ', 'Đoán mà không nghe', 'Chỉ nhìn transcript'], { instruction: 'Chọn mục tiêu học đúng.', example: 'Nghe đoạn mới → tìm ý chính và chi tiết.', explanation: 'Quick Check dùng đoạn biến thể để kiểm tra khả năng áp dụng.' }),
      ];
      return taskBanks(guided, independent, quick, { transcript: `${transcriptA}\n\nĐoạn kiểm tra biến thể: ${transcriptB}` });
    }

    if (type === 'Reading 1' || type === 'Reading 2' || type === 'Reading Skill') {
      const passage = passageFor(ctx);
      const sentences = splitSentences(passage);
      const firstSentence = sentences[0] || passage;
      const lastSentence = sentences.at(-1) || passage;
      const evidenceSentence = sentences.find((sentence) => sentence.toLowerCase().includes(first.term.toLowerCase())) || firstSentence;
      const focusLabel = type === 'Reading Skill' ? 'chiến lược đọc' : type === 'Reading 2' ? 'bài đọc thứ hai' : 'bài đọc thứ nhất';
      const guided = [choice('r-g', `Trước khi đọc ${focusLabel}, dự đoán chủ đề phù hợp nhất.`, ctx.unit.title, unitTitles, { instruction: 'Dựa vào tiêu đề, tranh và câu đầu.', example: firstSentence, explanation: `Dự đoán phù hợp là “${ctx.unit.title}”.`, evidence: firstSentence })];
      const independent = [
        choice('r-i1', `Chi tiết nào được nêu trong ${focusLabel}?`, evidenceSentence, sentences.filter((item) => item !== evidenceSentence), { instruction: 'Đọc và chọn thông tin có thật trong bài.', example: evidenceSentence, explanation: 'Đây là chi tiết có trong bài.', evidence: evidenceSentence }),
        choice('r-i2', `Từ “${first.term}” trong ngữ cảnh gần nhất với nghĩa nào?`, first.meaning, otherMeanings, { instruction: 'Đọc câu chứa từ rồi chọn nghĩa.', example: evidenceSentence, explanation: `Trong bài, “${first.term}” nghĩa là “${first.meaning}”.`, evidence: evidenceSentence }),
        choice('r-i3', 'Thông tin nào xuất hiện cuối bài?', lastSentence, sentences.slice(0, -1), { instruction: 'Xác định thứ tự sự kiện hoặc ý.', example: lastSentence, explanation: 'Đây là thông tin ở cuối bài.', evidence: lastSentence }),
      ];
      const quick = [
        choice('r-q1', 'Câu nào tóm tắt bài đọc tốt nhất bằng một ý mới?', `Bài đọc giải thích chủ đề ${ctx.unit.title}.`, [firstSentence, lastSentence, p.question, p.answer], { instruction: 'Chọn câu bao quát, không chọn một chi tiết nhỏ.', example: passage, explanation: 'Câu này nêu ý chính của toàn bài.' }),
        choice('r-q2', `Từ chi tiết “${second.term}”, con có thể suy ra điều gì phù hợp?`, `Chi tiết này liên quan đến ${ctx.unit.vi}.`, [second.meaning, p.questionVi, p.answerVi, third.meaning], { instruction: 'Suy luận vừa đủ dựa trên nội dung.', example: ex(second), explanation: 'Suy luận phải bám vào chủ đề và chi tiết trong bài.' }),
        choice('r-q3', 'Câu nào là bằng chứng tốt nhất cho ý chính?', firstSentence, sentences.slice(1), { instruction: 'Chọn câu hỗ trợ trực tiếp cho ý chính.', example: firstSentence, explanation: 'Câu đầu giới thiệu nội dung trọng tâm.', evidence: firstSentence }),
        choice('r-q4', `Nếu đổi tình huống sang “${newSentence(third, 'After reading')}”, từ nào vẫn phù hợp?`, third.term, otherTerms, { instruction: 'Áp dụng từ trong ngữ cảnh mới sau khi đọc.', example: newSentence(third, 'After reading'), explanation: `Từ phù hợp là “${third.term}”.` }),
        choice('r-q5', 'Khi trả lời câu suy luận, con cần làm gì?', 'Nêu đáp án và chỉ ra chi tiết hỗ trợ', ['Nêu đáp án và chỉ ra chi tiết hỗ trợ', 'Đoán không cần đọc', 'Chép toàn bộ bài', 'Chỉ dịch từng từ'], { instruction: 'Chọn chiến lược đọc đúng.', example: 'Suy luận + bằng chứng.', explanation: 'Chi tiết hỗ trợ giúp suy luận có căn cứ.' }),
      ];
      return taskBanks(guided, independent, quick, { passage });
    }

    if (type === 'Speaking/Communication') {
      const replaced = p.answer.includes(first.term) ? p.answer.replace(first.term, second.term) : newSentence(second, 'My answer');
      const newReply = p.answer.includes(first.term) ? p.answer.replace(first.term, fourth.term) : newSentence(fourth, 'In the new dialogue');
      const guided = [exercise(`s-g-v${variant}`, 'speak', `Vòng mẫu · Nghe và nói theo: ${p.answer}`, p.answer, { instruction: 'Nghe câu mẫu rồi nói lại một lần.', example: `${p.answer} — ${p.answerVi}`, explanation: 'Giữ đúng trật tự câu và nhịp nói.', target: p.answer })];
      const independent = [
        exercise(`s-i1-v${variant}`, 'speak', `Vòng thay thông tin · Dùng “${second.term}”: ${replaced}`, replaced, { instruction: 'Thay một thông tin nhưng giữ mẫu câu.', example: replaced, explanation: 'Con đã biết biến đổi câu mẫu.', target: replaced }),
        exercise(`s-i2-v${variant}`, 'write', `Vòng cá nhân · Trả lời câu hỏi “${p.question}” bằng thông tin của con.`, '', { instruction: 'Viết hoặc nói ít nhất bốn từ.', example: newSentence(third, 'For me'), explanation: 'Câu trả lời cần đúng chủ đề và là ý của con.', minWords: 4, target: third.term }),
        exercise(`s-i3-v${variant}`, 'arrange', 'Sắp xếp thành câu hỏi để hỏi lại bạn.', p.question.replace(/[.!?]$/g, ''), { instruction: 'Tạo đúng trật tự câu hỏi.', example: p.question, explanation: `Câu hỏi đúng là: ${p.question}` }),
      ];
      const quick = [
        choice('s-q1', `Trong hội thoại mới, câu trả lời nào phù hợp với “${p.question}”?`, newReply, [p.answer, ex(first), ex(second), ex(third)], { instruction: 'Chọn câu mới phù hợp, không chọn lại câu đã luyện.', example: `${p.question} — ${newReply}`, explanation: 'Câu này phù hợp với tình huống mới.' }),
        choice('s-q2', `Câu hỏi tiếp theo nào hợp lý sau câu “${newReply}”?`, `Can you tell me more about ${fourth.term}?`, [p.question, p.answer, ex(fifth), ex(sixth)], { instruction: 'Chọn câu giúp hội thoại tiếp tục tự nhiên.', example: `${newReply} Can you tell me more about ${fourth.term}?`, explanation: 'Câu hỏi tiếp nối đúng chủ đề.' }),
        exercise(`s-q3-v${variant}`, 'speak', `Đóng vai tình huống mới và nói: ${newSentence(fifth, 'In this role-play')}`, newSentence(fifth, 'In this role-play'), { instruction: 'Nói trọn câu, rõ từ trọng tâm.', example: newSentence(fifth, 'In this role-play'), explanation: 'Đây là lượt nói mới trong hội thoại.', target: newSentence(fifth, 'In this role-play') }),
        exercise(`s-q4-v${variant}`, 'write', `Viết một câu trả lời cá nhân có từ “${sixth.term}”.`, '', { instruction: 'Viết ít nhất bốn từ và không chép câu mẫu.', example: newSentence(sixth, 'Personally'), explanation: 'Câu cần là thông tin của con.', minWords: 4, target: sixth.term }),
        choice('s-q5', 'Một lượt hội thoại tốt cần điều gì?', 'Nghe câu trước, trả lời đúng ý và hỏi tiếp khi phù hợp', ['Nghe câu trước, trả lời đúng ý và hỏi tiếp khi phù hợp', 'Chỉ lặp nguyên câu mẫu', 'Đổi sang chủ đề không liên quan', 'Nói thật nhanh để kết thúc'], { instruction: 'Chọn cách giao tiếp tự nhiên.', example: 'Nghe → trả lời → hỏi tiếp.', explanation: 'Ba bước này giúp hội thoại có ý nghĩa.' }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type === 'Writing' || type === 'Writing Skill') {
      if (type === 'Writing Skill') {
        const skillModel = clean(ex(first));
        const noCapital = skillModel ? skillModel.charAt(0).toLowerCase() + skillModel.slice(1).replace(/[.!?]$/g, '') : 'i write a sentence';
        const guided = [choice('ws-g', `Kỹ năng viết: câu nào sửa đúng chữ hoa và dấu câu cho “${noCapital}”?`, skillModel, [noCapital, ex(second).toLowerCase(), ex(third).replace(/[.!?]$/g, ''), ex(fourth)], { instruction: 'Kiểm tra đầu câu và cuối câu.', example: `Sai: ${noCapital} → Đúng: ${skillModel}`, explanation: 'Câu đúng bắt đầu bằng chữ hoa và có dấu câu.' })];
        const independent = [
          choice('ws-i1', 'Từ nối nào giúp thêm một ý cùng chủ đề?', 'Also', ['Also', 'Yesterday?', 'Because?', 'Stop'], { instruction: 'Chọn từ nối phù hợp để mở rộng bài.', example: `Also, ${newSentence(second, 'I')}`, explanation: '“Also” giúp thêm một ý liên quan.' }),
          choice('ws-i2', `Câu nào là câu mở đầu rõ cho chủ đề “${ctx.unit.title}”?`, newSentence(third, 'My topic is'), [p.question, ex(first), ex(second), noCapital], { instruction: 'Chọn câu giới thiệu đúng chủ đề.', example: newSentence(third, 'My topic is'), explanation: 'Câu này giới thiệu chủ đề trước khi nêu chi tiết.' }),
          exercise(`ws-i3-v${variant}`, 'arrange', 'Sắp xếp ba phần thành câu có mở đầu, ý và dấu câu.', newSentence(fourth, 'First').replace(/[.!?]$/g, ''), { instruction: 'Đặt từ mở đầu trước, rồi đến nội dung.', example: newSentence(fourth, 'First'), explanation: `Trật tự đúng là: ${newSentence(fourth, 'First')}` }),
          exercise(`ws-i4-v${variant}`, 'write', `Mở rộng câu bằng một chi tiết có từ “${fifth.term}”.`, '', { instruction: 'Viết ít nhất bốn từ và thêm một ý mới.', example: `${skillModel} ${newSentence(fifth, 'Also')}`, explanation: 'Câu mở rộng cần cùng chủ đề và không lặp nguyên câu trước.', minWords: 4, target: fifth.term }),
        ];
        const quick = [
          choice('ws-q1', 'Câu nào cần sửa vì thiếu dấu câu?', ex(sixth).replace(/[.!?]$/g, ''), [skillModel, ex(second), ex(third), ex(sixth).replace(/[.!?]$/g, '')], { instruction: 'Tìm câu chưa hoàn chỉnh về hình thức.', example: `${ex(sixth).replace(/[.!?]$/g, '')}.`, explanation: 'Câu này chưa có dấu câu ở cuối.' }),
          choice('ws-q2', `Câu nào nối tự nhiên sau “${skillModel}”?`, newSentence(seventh, 'Next'), [p.question, noCapital, ex(second), ex(third)], { instruction: 'Chọn câu tiếp theo cùng chủ đề.', example: `${skillModel} ${newSentence(seventh, 'Next')}`, explanation: 'Câu mới tiếp tục cùng chủ đề và có từ nối.' }),
          choice('ws-q3', 'Thứ tự kiểm tra bài viết nào hợp lý?', 'Chủ đề → ý rõ → chữ hoa → dấu câu', ['Chủ đề → ý rõ → chữ hoa → dấu câu', 'Màu nền → nút bấm → tên file', 'Dấu câu → bỏ hết ý → nộp', 'Viết thật dài → không đọc lại'], { instruction: 'Chọn quy trình tự kiểm tra.', example: 'Đọc ý trước, rồi kiểm tra hình thức.', explanation: 'Quy trình này giúp bài vừa đúng ý vừa đúng hình thức.' }),
          exercise(`ws-q4-v${variant}`, 'arrange', 'Sắp xếp câu kết mới cho đoạn viết.', newSentence(second, 'Finally').replace(/[.!?]$/g, ''), { instruction: 'Tạo câu kết, không lặp câu mở đầu.', example: newSentence(second, 'Finally'), explanation: `Câu kết đúng là: ${newSentence(second, 'Finally')}` }),
          exercise(`ws-q5-v${variant}`, 'write', `Sửa và viết lại một câu hoàn chỉnh có từ “${third.term}”.`, '', { instruction: 'Viết ít nhất bốn từ, có chữ hoa và dấu câu.', example: newSentence(third, 'My corrected sentence'), explanation: 'Câu cần đúng cả nội dung và hình thức.', minWords: 4, target: third.term }),
        ];
        return taskBanks(guided, independent, quick);
      }
      const minWords = ctx.grade === 2 ? 4 : 8;
      const model = clean(p.answer || ex(first));
      const tokens = model.replace(/[.!?]/g, '').split(' ');
      const blankWord = tokens.find((token) => token.length > 3) || tokens[0] || first.term;
      const wrongPunctuation = `${model.replace(/[.!?]+$/g, '')}`;
      const guided = [choice('w-g', model.replace(blankWord, '_____'), blankWord, [...otherTerms, ...tokens], { instruction: 'Chọn từ hoàn thành câu mẫu.', example: model, explanation: `Câu hoàn chỉnh là: ${model}` })];
      const independent = [
        choice('w-i1', `Chọn ý phù hợp để viết về “${ctx.unit.vi}”.`, second.term, otherTerms, { instruction: 'Chọn một ý chính trước khi viết.', example: `${second.term} = ${second.meaning}`, explanation: `“${second.term}” là ý phù hợp với Unit.` }),
        exercise(`w-i2-v${variant}`, 'arrange', 'Sắp xếp thành một câu hoàn chỉnh khác câu điền từ.', ex(third).replace(/[.!?]$/g, ''), { instruction: 'Bấm từ theo thứ tự.', example: ex(third), explanation: `Câu đúng là: ${ex(third)}` }),
        choice('w-i3', `Câu nào mở rộng ý “${fourth.term}” rõ hơn?`, newSentence(fourth, 'I also think'), [model, ex(first), ex(second), ex(fifth)], { instruction: 'Chọn câu có thêm thông tin phù hợp.', example: newSentence(fourth, 'I also think'), explanation: 'Câu này mở rộng ý thay vì lặp lại.' }),
        exercise(`w-i4-v${variant}`, 'write', ctx.grade === 2 ? 'Viết từ một đến ba câu của con.' : 'Viết một đoạn ngắn có mở đầu và chi tiết.', '', { instruction: `Dùng ít nhất ${minWords} từ và một từ của Unit.`, example: `${model} ${newSentence(fifth, 'I also')}`, explanation: 'Bài cần đúng chủ đề, có chữ hoa và dấu câu.', minWords, target: fifth.term }),
      ];
      const quick = [
        choice('w-q1', `Câu “${wrongPunctuation}” cần thêm gì để hoàn chỉnh?`, 'Dấu câu ở cuối', ['Dấu câu ở cuối', 'Một tiêu đề khác', 'Tên file', 'Một quảng cáo'], { instruction: 'Kiểm tra dấu câu của câu.', example: `${wrongPunctuation}.`, explanation: 'Câu hoàn chỉnh cần dấu câu ở cuối.' }),
        choice('w-q2', `Câu nào dùng chữ hoa và dấu câu đúng?`, newSentence(sixth, 'My new idea'), [newSentence(sixth, 'my new idea').toLowerCase(), wrongPunctuation, ex(first).toLowerCase(), ex(second).replace(/[.!?]$/g, '')], { instruction: 'Chọn câu có hình thức viết đúng.', example: newSentence(sixth, 'My new idea'), explanation: 'Câu bắt đầu bằng chữ hoa và kết thúc bằng dấu câu.' }),
        choice('w-q3', `Câu nào nối hợp lý sau ý “${model}”?`, newSentence(seventh, 'Next'), [p.question, ex(first), ex(second), newSentence(third, 'Before')], { instruction: 'Chọn câu tiếp theo cùng chủ đề.', example: `${model} ${newSentence(seventh, 'Next')}`, explanation: 'Câu này tiếp tục cùng chủ đề.' }),
        exercise(`w-q4-v${variant}`, 'arrange', 'Sắp xếp câu kiểm tra mới theo đúng thứ tự.', newSentence(second, 'Finally').replace(/[.!?]$/g, ''), { instruction: 'Tạo câu mới có trật tự đúng.', example: newSentence(second, 'Finally'), explanation: `Câu đúng là: ${newSentence(second, 'Finally')}` }),
        choice('w-q5', 'Checklist nào cần dùng trước khi nộp bài?', 'Đúng chủ đề · chữ hoa · dấu câu · câu có nghĩa', ['Đúng chủ đề · chữ hoa · dấu câu · câu có nghĩa', 'Màu nền · kích thước cửa sổ', 'Tên ZIP · mã phiên bản', 'Số quảng cáo trên trang'], { instruction: 'Chọn checklist viết đúng.', example: 'Chủ đề ✓ Chữ hoa ✓ Dấu câu ✓ Ý rõ ✓', explanation: 'Checklist này kiểm tra nội dung và hình thức của bài.' }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type === 'Big Question') {
      const big = clean(ctx.section.content?.bigQuestion || ctx.unit.title || p.question);
      const guided = [choice('bq-g', `Câu hỏi lớn “${big}” đang yêu cầu con suy nghĩ về điều gì?`, ctx.unit.vi, [first.meaning, second.meaning, third.meaning, p.answerVi], { instruction: 'Chọn ý bao quát của câu hỏi lớn.', example: big, explanation: `Câu hỏi lớn gắn với chủ đề “${ctx.unit.vi}”.` })];
      const independent = [
        choice('bq-i1', `Trong tình huống thứ nhất, lựa chọn nào liên quan đến “${first.term}”?`, ex(first), [ex(second), ex(third), ex(fourth), p.answer], { instruction: 'Chọn góc nhìn thứ nhất.', example: ex(first), explanation: 'Tình huống này dùng kiến thức của Unit.' }),
        choice('bq-i2', `Trong tình huống thứ hai, lựa chọn nào cho thấy góc nhìn khác với “${first.term}”?`, ex(second), [ex(first), ex(third), ex(fourth), p.question], { instruction: 'So sánh hai tình huống.', example: `${ex(first)} / ${ex(second)}`, explanation: 'Đây là một tình huống khác trong cùng chủ đề.' }),
        exercise(`bq-i3-v${variant}`, 'write', `Con chọn một góc nhìn và giải thích vì sao, dùng từ “${third.term}”.`, '', { instruction: 'Viết ít nhất bốn từ.', example: newSentence(third, 'I choose this idea because'), explanation: 'Câu cần nêu lựa chọn và lý do.', minWords: 4, target: third.term }),
      ];
      const quick = [
        choice('bq-q1', `Ý nào trả lời trực tiếp câu hỏi lớn “${big}”?`, newSentence(fourth, 'My answer'), [p.question, ex(first), ex(second), ex(third)], { instruction: 'Chọn câu trả lời cá nhân, không chọn một từ rời.', example: newSentence(fourth, 'My answer'), explanation: 'Câu này trả lời trực tiếp và có ý rõ.' }),
        choice('bq-q2', 'Một câu trả lời tốt cho Big Question cần có gì?', 'Ý kiến cá nhân và một lý do liên quan', ['Ý kiến cá nhân và một lý do liên quan', 'Chỉ một từ không giải thích', 'Thông tin ngoài Unit', 'Một câu không liên quan'], { instruction: 'Chọn cấu trúc câu trả lời phù hợp.', example: 'I think… because…', explanation: 'Ý kiến và lý do giúp câu trả lời đầy đủ.' }),
        exercise(`bq-q3-v${variant}`, 'write', `Viết câu trả lời cuối cùng của con cho “${big}”.`, '', { instruction: 'Viết ít nhất bốn từ và dùng một từ của Unit.', example: newSentence(fifth, 'My final answer'), explanation: 'Đây là câu trả lời cá nhân cuối bài.', minWords: 4, target: fifth.term }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type === 'Value') {
      const guided = [choice('val-g', `Trong tình huống có “${first.term}”, hành động nào phù hợp?`, `Lắng nghe và hành động có trách nhiệm với ${first.term}`, [ex(first), ex(second), ex(third), p.answer], { instruction: 'Chọn hành động tốt trong tình huống gần gũi.', example: newSentence(first, 'At home'), explanation: 'Hành động phù hợp cần tôn trọng người khác và đúng chủ đề.' })];
      const independent = [
        choice('val-i1', 'Hành động nào là điều nên làm?', `Chia sẻ và giúp đỡ khi dùng ${second.term}`, [`Tranh giành ${second.term}`, `Bỏ qua mọi người`, `Làm hỏng ${third.term}`, ex(fourth)], { instruction: 'Phân biệt nên và không nên.', example: `Nên: chia sẻ ${second.term}.`, explanation: 'Chia sẻ và giúp đỡ là hành động tích cực.' }),
        choice('val-i2', 'Hành động nào là điều không nên làm?', `Làm tổn thương người khác vì ${third.term}`, [`Hỏi ý kiến trước`, `Giữ lời hứa`, `Cùng nhau thực hiện`, `Làm tổn thương người khác vì ${third.term}`], { instruction: 'Chọn hành động cần tránh.', example: 'Không nên làm người khác buồn.', explanation: 'Hành động này không tôn trọng người khác.' }),
        exercise(`val-i3-v${variant}`, 'write', `Nêu một việc con có thể làm hôm nay với “${fourth.term}”.`, '', { instruction: 'Viết một hành động cụ thể, ít nhất bốn từ.', example: newSentence(fourth, 'Today I will'), explanation: 'Hành động cần thực tế và có thể thực hiện.', minWords: 4, target: fourth.term }),
      ];
      const quick = [
        choice('val-q1', `Trong tình huống mới có “${fifth.term}”, lựa chọn nào thể hiện trách nhiệm?`, `Hoàn thành việc của mình và hỗ trợ bạn với ${fifth.term}`, [`Bỏ việc giữa chừng`, `Đổ lỗi cho người khác`, `Giấu thông tin`, `Hoàn thành việc của mình và hỗ trợ bạn với ${fifth.term}`], { instruction: 'Áp dụng Value vào tình huống mới.', example: newSentence(fifth, 'In our team'), explanation: 'Trách nhiệm gồm hoàn thành phần việc và hỗ trợ khi cần.' }),
        choice('val-q2', 'Khi chưa chắc hành động có phù hợp, con nên làm gì?', 'Dừng lại, nghĩ đến hậu quả và hỏi người lớn', ['Dừng lại, nghĩ đến hậu quả và hỏi người lớn', 'Làm ngay không suy nghĩ', 'Bắt chước người khác', 'Bỏ qua quy tắc'], { instruction: 'Chọn cách ra quyết định an toàn.', example: 'Dừng → nghĩ → hỏi.', explanation: 'Cách này giúp con chọn hành động phù hợp.' }),
        exercise(`val-q3-v${variant}`, 'write', `Viết một cam kết nhỏ liên quan đến “${sixth.term}”.`, '', { instruction: 'Viết ít nhất bốn từ và có hành động cụ thể.', example: newSentence(sixth, 'I promise to'), explanation: 'Cam kết cần rõ việc con sẽ làm.', minWords: 4, target: sixth.term }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type === 'Project') {
      const product = clean(ctx.unit.project || `Tạo một sản phẩm nhỏ về ${ctx.unit.title}`);
      const guided = [choice('pr-g', 'Sản phẩm cụ thể của Project là gì?', product, [p.question, p.answer, ex(first), ex(second)], { instruction: 'Đọc yêu cầu và chọn sản phẩm cần hoàn thành.', example: product, explanation: `Sản phẩm cần làm là: ${product}` })];
      const independent = [
        choice('pr-i1', 'Thông tin nào cần chuẩn bị trước?', `${first.term}, ${second.term} và ý tưởng về ${ctx.unit.title}`, [p.question, p.answer, ex(third), ex(fourth)], { instruction: 'Chọn vật liệu hoặc thông tin phù hợp.', example: `${first.term} · ${second.term}`, explanation: 'Các thông tin này giúp bắt đầu Project.' }),
        choice('pr-i2', 'Bước nào nên thực hiện đầu tiên?', `Lập ý và chọn nội dung về ${first.term}`, [`Trang trí trước khi có nội dung`, `Nộp sản phẩm chưa kiểm tra`, `Bỏ qua hướng dẫn`, `Lập ý và chọn nội dung về ${first.term}`], { instruction: 'Chọn đúng thứ tự thực hiện.', example: 'Bước 1: chọn ý.', explanation: 'Cần có ý và nội dung trước khi hoàn thiện sản phẩm.' }),
        exercise(`pr-i3-v${variant}`, 'write', `Viết nội dung chính sẽ đưa vào sản phẩm, có từ “${third.term}”.`, '', { instruction: 'Viết ít nhất bốn từ.', example: newSentence(third, 'My project shows'), explanation: 'Nội dung cần đúng Unit và dùng từ đã học.', minWords: 4, target: third.term }),
      ];
      const quick = [
        choice('pr-q1', 'Checklist nào dùng để tự đánh giá Project?', 'Đủ nội dung · đúng Unit · trình bày rõ · con có thể giới thiệu', ['Đủ nội dung · đúng Unit · trình bày rõ · con có thể giới thiệu', 'Chỉ cần nhiều màu', 'Chỉ cần làm thật nhanh', 'Không cần kiểm tra'], { instruction: 'Chọn checklist đầy đủ.', example: 'Nội dung ✓ Ngôn ngữ ✓ Trình bày ✓ Giới thiệu ✓', explanation: 'Checklist kiểm tra cả sản phẩm và khả năng trình bày.' }),
        choice('pr-q2', `Khi giới thiệu sản phẩm, câu nào phù hợp với “${fourth.term}”?`, newSentence(fourth, 'This project includes'), [p.question, p.answer, ex(first), ex(second)], { instruction: 'Chọn câu giới thiệu sản phẩm.', example: newSentence(fourth, 'This project includes'), explanation: 'Câu này giới thiệu rõ một phần của Project.' }),
        exercise(`pr-q3-v${variant}`, 'write', 'Viết một câu tự đánh giá sản phẩm của con.', '', { instruction: 'Nêu một điểm đã làm tốt hoặc cần sửa.', example: newSentence(fifth, 'I did well because'), explanation: 'Tự đánh giá cần cụ thể và liên quan đến sản phẩm.', minWords: 4, target: fifth.term }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type === 'CLIL/Content') {
      const guided = [choice('clil-g', `Quan sát “${first.term}” và “${second.term}”. Điểm giống nhau là gì?`, `Cả hai đều liên quan đến ${ctx.unit.title}`, [first.meaning, second.meaning, p.question, p.answer], { instruction: 'Quan sát và tìm một điểm chung.', example: `${first.term} · ${second.term}`, explanation: 'Hai đối tượng cùng thuộc nội dung tích hợp của Unit.' })];
      const independent = [
        choice('clil-i1', `Phân loại “${third.term}” vào nhóm phù hợp.`, ctx.unit.title, unitTitles, { instruction: 'Dựa vào đặc điểm và chủ đề để phân loại.', example: `${third.term} → ${ctx.unit.title}`, explanation: `“${third.term}” thuộc nhóm của Unit này.` }),
        choice('clil-i2', `So sánh “${fourth.term}” và “${fifth.term}”. Câu nào hợp lý?`, `${fourth.term} và ${fifth.term} có vai trò khác nhau trong cùng chủ đề`, [ex(first), ex(second), p.question, p.answer], { instruction: 'Chọn câu so sánh có ý nghĩa.', example: `${fourth.term} ↔ ${fifth.term}`, explanation: 'Câu trả lời nêu được cả điểm liên hệ và sự khác nhau.' }),
        exercise(`clil-i3-v${variant}`, 'write', `Giải thích một nguyên nhân liên quan đến “${sixth.term}”.`, '', { instruction: 'Viết ít nhất bốn từ và dùng “because” nếu phù hợp.', example: `I think about ${sixth.term} because it is important.`, explanation: 'Câu cần nêu nguyên nhân, không chỉ gọi tên từ.', minWords: 4, target: sixth.term }),
      ];
      const quick = [
        choice('clil-q1', `Trong tình huống mới, “${seventh.term}” nên được xếp cùng nhóm nào?`, ctx.unit.title, unitTitles, { instruction: 'Áp dụng tiêu chí phân loại vào đối tượng mới.', example: `${seventh.term} → ${ctx.unit.title}`, explanation: 'Đối tượng mới vẫn theo tiêu chí của Unit.' }),
        choice('clil-q2', 'Câu giải thích nguyên nhân cần có gì?', 'Một kết quả và lý do hợp lý', ['Một kết quả và lý do hợp lý', 'Chỉ một từ vựng', 'Một câu không liên quan', 'Tên của bài học'], { instruction: 'Chọn cấu trúc giải thích đúng.', example: 'Kết quả because lý do.', explanation: 'Giải thích nguyên nhân cần liên kết kết quả với lý do.' }),
        exercise(`clil-q3-v${variant}`, 'write', `Viết một câu so sánh mới giữa “${first.term}” và “${third.term}”.`, '', { instruction: 'Nêu ít nhất một điểm giống hoặc khác.', example: `${first.term} and ${third.term} are different because…`, explanation: 'Câu so sánh phải có tiêu chí rõ.', minWords: 4, target: third.term }),
      ];
      return taskBanks(guided, independent, quick);
    }

    if (type === 'Review/Unit Check' || type.startsWith('Grammar Review')) {
      const passage = passageFor(ctx);
      const guided = [choice('rev-g', `Ôn từ vựng: “${first.term}” có nghĩa là gì?`, first.meaning, otherMeanings, { instruction: 'Chọn nghĩa đúng.', example: `${first.term} = ${first.meaning}`, explanation: `Nghĩa đúng là “${first.meaning}”.` })];
      const independent = [
        choice('rev-i1', `Ôn ngữ pháp: câu nào trả lời đúng “${p.question}”?`, p.answer, [p.question, ex(first), ex(second), ex(third)], { instruction: 'Chọn câu đúng mẫu.', example: `${p.question} — ${p.answer}`, explanation: p.answerVi }),
        choice('rev-i2', 'Ôn đọc: câu nào chứa thông tin của Unit?', splitSentences(passage)[0] || passage, splitSentences(passage).slice(1), { instruction: 'Đọc và chọn câu đúng.', example: passage, explanation: 'Câu này thuộc nội dung Unit.', evidence: splitSentences(passage)[0] || passage }),
        choice('rev-i3', 'Ôn nghe: từ nào Milo vừa đọc?', second.term, otherTerms, { instruction: 'Nghe và chọn từ.', example: second.term, explanation: `Milo đọc “${second.term}”.`, target: second.term }),
      ];
      const quick = [
        choice('rev-q1', `Ứng dụng từ vựng trong câu mới: ${blank(third)}`, third.term, otherTerms, { instruction: 'Chọn từ theo ngữ cảnh mới.', example: ex(third), explanation: `Câu đúng là: ${ex(third)}` }),
        choice('rev-q2', `Tình huống mới nào phù hợp với mẫu câu của Unit?`, newSentence(fourth, 'In a new review'), [p.question, p.answer, ex(first), ex(second)], { instruction: 'Áp dụng mẫu câu vào tình huống mới.', example: newSentence(fourth, 'In a new review'), explanation: 'Câu này dùng kiến thức của Unit trong ngữ cảnh mới.' }),
        exercise(`rev-q3-v${variant}`, 'write', `Viết một câu tổng hợp có từ “${fifth.term}”.`, '', { instruction: 'Viết ít nhất bốn từ và đúng chủ đề.', example: newSentence(fifth, 'My review sentence'), explanation: 'Câu tổng hợp cần dùng đúng từ và cấu trúc.', minWords: 4, target: fifth.term }),
        choice('rev-q4', 'Khi làm Unit Check, con nên làm gì trước?', 'Đọc hoặc nghe kỹ yêu cầu của từng câu', ['Đọc hoặc nghe kỹ yêu cầu của từng câu', 'Chọn thật nhanh', 'Bỏ qua câu khó ngay', 'Xem đáp án trước'], { instruction: 'Chọn chiến lược làm bài đúng.', example: 'Đọc/nghe → làm → kiểm tra.', explanation: 'Hiểu yêu cầu giúp con chọn đúng kỹ năng cần dùng.' }),
        choice('rev-q5', 'Nếu làm sai một câu, con nên làm gì?', 'Xem lời chữa, hiểu lỗi rồi thử câu biến thể', ['Xem lời chữa, hiểu lỗi rồi thử câu biến thể', 'Làm lại nguyên câu không đọc chữa', 'Bỏ luôn kỹ năng đó', 'Đánh dấu hoàn thành'], { instruction: 'Chọn cách ôn hiệu quả.', example: 'Lỗi → chữa → câu mới.', explanation: 'Câu biến thể kiểm tra con đã hiểu chứ không chỉ nhớ đáp án.' }),
      ];
      return taskBanks(guided, independent, quick, { passage });
    }

    const guided = [choice('x-g', `Phần “${type}” đang giúp con học điều gì?`, objective(ctx), [ctx.unit.vi, first.meaning, p.questionVi, p.answerVi], { instruction: 'Đọc mục tiêu và chọn đúng kỹ năng.', example: objective(ctx), explanation: objective(ctx) })];
    const independent = [
      choice('x-i1', `Chọn từ phù hợp với nội dung “${type}”.`, first.term, otherTerms, { instruction: 'Chọn một từ thuộc Unit.', example: `${first.term} = ${first.meaning}`, explanation: `“${first.term}” thuộc Unit này.` }),
      exercise(`x-i2-v${variant}`, 'write', `Viết một câu có từ “${second.term}”.`, '', { instruction: 'Viết ít nhất bốn từ.', example: ex(second), explanation: 'Câu cần đúng chủ đề và có dấu câu.', minWords: 4, target: second.term }),
    ];
    const quick = [
      choice('x-q1', `Trong tình huống mới, câu nào dùng đúng từ “${third.term}”?`, newSentence(third, 'In this situation'), [p.question, p.answer, ex(first), ex(second)], { instruction: 'Chọn câu ứng dụng mới.', example: newSentence(third, 'In this situation'), explanation: 'Câu này dùng từ đúng ngữ cảnh.' }),
      choice('x-q2', 'Khi chưa hiểu bài, con nên làm gì?', 'Nghe Milo giảng lại và làm một câu mới', ['Nghe Milo giảng lại và làm một câu mới', 'Đánh dấu hoàn thành', 'Bỏ qua bài', 'Nhớ đáp án mà không hiểu'], { instruction: 'Chọn cách học phù hợp.', example: 'Giảng lại → ví dụ khác → tự làm.', explanation: 'Ví dụ khác giúp con hiểu cách áp dụng.' }),
      exercise(`x-q3-v${variant}`, 'write', `Viết một câu ứng dụng cuối bài với “${fourth.term}”.`, '', { instruction: 'Viết ít nhất bốn từ.', example: newSentence(fourth, 'My final example'), explanation: 'Câu cuối cần khác câu đã luyện.', minWords: 4, target: fourth.term }),
    ];
    return taskBanks(guided, independent, quick);
  }


  function vocabExamples(ctx) {
    const items = wordsFor(ctx);
    const groups = chunk(items, 5);
    return `<div class="micro-vocab-groups" data-vocab-deck>
      <div class="micro-group-tabs">${groups.map((_, i) => `<button type="button" data-vocab-group="${i}" class="${i === 0 ? 'active' : ''}">Nhóm ${i + 1}</button>`).join('')}</div>
      ${groups.map((group, gi) => `<div class="micro-vocab-group ${gi === 0 ? 'active' : ''}" data-vocab-panel="${gi}">${group.map((item) => {
        const meta = pronunciation(item.term);
        return `<article class="micro-vocab-card" data-vocab-card data-vocab-term="${esc(item.term)}"><span class="micro-vocab-picture">${esc(item.icon || '🔤')}</span><div><small>TỪ MỚI</small><h3>${esc(item.term)}</h3><code>${esc(meta.ipa)}</code><b>${esc(item.meaning)}</b><p>${esc(item.example)}</p><em>${esc(meta.stress)} · ${esc(meta.tip)}</em><div class="micro-inline-actions"><button type="button" data-vocab-listen="${esc(item.term)}">🔊 Nghe</button><button type="button" data-vocab-slow="${esc(item.term)}">🐢 Đọc chậm</button><button type="button" data-basic-repeat="${esc(item.term)}">🎤 Con đọc lại</button><button type="button" class="micro-vip-coach-link" data-open-pronunciation data-pronunciation-target="${esc(item.term)}">⭐ Chấm chuyên sâu với VIP PRO MAX</button></div><span class="micro-read-status" data-voice-read-status aria-live="polite"></span></div></article>`;
      }).join('')}<div class="micro-group-review"><b>Ôn nhanh nhóm ${gi + 1}</b><p>Con nghe lại từng từ rồi nói một từ con nhớ nhất.</p></div></div>`).join('')}
    </div>`;
  }

  function normalizedForLeak(value) {
    return clean(value).toLowerCase().replace(/[^a-z0-9à-ỹđ]+/gi, ' ').trim();
  }

  function teachingExampleIsSafe(task, example) {
    if (!example) return false;
    const prompt = normalizedForLeak(task?.prompt);
    const answer = normalizedForLeak(task?.answer);
    const samplePrompt = normalizedForLeak(example.prompt);
    const sampleAnswer = normalizedForLeak(example.answer);
    if (!samplePrompt || !sampleAnswer) return false;
    if (samplePrompt === prompt || sampleAnswer === answer) return false;
    if (answer && (samplePrompt.includes(answer) || sampleAnswer.includes(answer))) return false;
    return true;
  }

  function safeTeachingExample(task, ctx) {
    if (teachingExampleIsSafe(task, task?.teachingExample)) return task.teachingExample;
    const type = ctx.section.sectionType;
    const candidates = wordsFor(ctx).filter((item) => !normalizedForLeak(task?.prompt).includes(normalizedForLeak(item.term)) && normalizedForLeak(item.term) !== normalizedForLeak(task?.answer));
    const first = candidates[0] || { term: 'school', meaning: 'trường học' };
    const second = candidates[1] || { term: 'book', meaning: 'quyển sách' };
    if (type.startsWith('Vocabulary')) return {
      prompt: `Milo nghe câu “I see a ${first.term}.” Từ trọng tâm là gì?`,
      answer: first.term,
      steps: ['Đọc cả câu mẫu khác.', 'Tìm từ thuộc chủ đề Unit.', 'Loại từ không xuất hiện trong câu.', `Kết luận mẫu: ${first.term}.`],
    };
    if (type.startsWith('Grammar')) return {
      prompt: 'Lina likes science. Choose the correct negative sentence about music.',
      answer: "She doesn’t like music.",
      steps: ['Xác định chủ ngữ Lina = she.', 'Câu phủ định dùng doesn’t.', 'Sau doesn’t dùng động từ nguyên mẫu like.', 'Ghép thành một câu mới, không phải câu đang làm.'],
    };
    if (type.startsWith('Reading')) return {
      prompt: 'Mini text: Ben walks to the library after lunch. Where does Ben go?',
      answer: 'the library',
      steps: ['Đọc câu hỏi trước.', 'Tìm từ chỉ nơi chốn trong đoạn mẫu.', 'Đối chiếu đúng người Ben.', 'Trả lời bằng cụm từ trong đoạn.'],
    };
    if (type === 'Listening') return {
      prompt: 'Audio mẫu khác: “Mai visits a park on Sunday.” Where does Mai go?',
      answer: 'a park',
      steps: ['Nghe ý chính.', 'Ghi nhớ người và nơi chốn.', 'Loại chi tiết về thời gian nếu câu hỏi hỏi nơi.', 'Chọn a park.'],
    };
    if (type === 'Speaking/Communication') return {
      prompt: 'Milo asks a different question: What do you do after school?',
      answer: 'I read a book after school.',
      steps: ['Nghe câu hỏi.', 'Chọn thông tin của câu mẫu khác.', 'Dùng chủ ngữ I.', 'Nói thành câu đầy đủ.'],
    };
    if (type.startsWith('Writing')) return {
      prompt: `Write a different sentence with “${second.term}”.`,
      answer: `I use my ${second.term} at school.`,
      steps: ['Chọn một ý khác bài đang làm.', 'Viết chủ ngữ I.', 'Thêm động từ và từ mới.', 'Kiểm tra chữ hoa và dấu chấm.'],
    };
    return {
      prompt: 'Milo làm một tình huống khác trước.',
      answer: `I can use ${first.term} in a new sentence.`,
      steps: ['Đọc đề mẫu khác.', 'Tìm từ khóa.', 'Loại lựa chọn sai.', 'Kết luận câu mẫu.'],
    };
  }

  function teachingExampleHtml(task, ctx) {
    const example = safeTeachingExample(task, ctx);
    return `<div class="micro-safe-example"><small>HỌC CÁCH LÀM · VÍ DỤ KHÁC</small><h3>${esc(example.prompt)}</h3><ol>${example.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol><div class="micro-safe-example-answer"><b>Kết luận của ví dụ mẫu</b><p>${esc(example.answer)}</p></div></div>`;
  }

  function exampleScreen(ctx, tasks) {
    const type = ctx.section.sectionType;
    if (type.startsWith('Vocabulary')) return vocabExamples(ctx);
    if (type === 'Pronunciation') {
      const first = wordsFor(ctx)[0] || { term: 'English', example: 'I learn English.' };
      const meta = pronunciation(first.term);
      return `<div class="micro-pronunciation-ladder"><article><span>1</span><b>Nhìn khẩu hình</b><p>${esc(meta.tip)}</p></article><article><span>2</span><b>Nghe âm riêng</b><button type="button" data-vocab-slow="${esc(first.term)}">🔊 Nghe chậm</button></article><article><span>3</span><b>Nghe từ mẫu</b><p>${esc(first.term)} · ${esc(meta.ipa)}</p></article><article><span>4</span><b>Luyện đọc cơ bản miễn phí</b><button type="button" data-basic-repeat="${esc(first.term)}">🎤 Con đọc lại</button></article><article><span>5</span><b>Chấm chuyên sâu</b><button type="button" data-open-pronunciation data-pronunciation-target="${esc(first.term)}">⭐ VIP PRO MAX</button></article></div>`;
    }
    if (type === 'Listening') {
      const transcript = tasks.transcript || passageFor(ctx);
      return `<div class="micro-listening-context"><div class="micro-scene">🎧<span>${esc(ctx.unit.vi)}</span></div><p><b>Từ khóa:</b> ${wordsFor(ctx).slice(0, 4).map((item) => `<button type="button" data-vocab-listen="${esc(item.term)}">${esc(item.term)}</button>`).join(' ')}</p><div class="micro-inline-actions"><button type="button" data-micro-say="${esc(transcript)}">▶ Nghe lần 1</button><button type="button" data-micro-say="${esc(transcript)}" data-rate=".62">🐢 Nghe lần 2</button></div><div class="micro-transcript-locked">🔒 Transcript chỉ mở sau khi con đã trả lời.</div></div>`;
    }
    if (type.startsWith('Reading')) {
      const sentences = splitSentences(tasks.passage || passageFor(ctx));
      return `<div class="micro-reading"><div class="micro-predict"><b>Trước khi đọc</b><p>Con đọc tiêu đề, dự đoán nội dung và tìm bằng chứng trong bài.</p></div>${chunk(sentences, 3).map((group, index) => `<article data-reading-paragraph="${index}"><div><small>ĐOẠN ${index + 1}</small><button type="button" data-micro-say="${esc(group.join(' '))}">🔊 Nghe đoạn</button></div><p>${group.map((sentence) => `<span>${esc(sentence)}</span>`).join(' ')}</p><small>Câu trả lời không nằm trong phần tóm tắt; con cần tìm câu làm bằng chứng.</small></article>`).join('')}</div>`;
    }
    return teachingExampleHtml(tasks.guided, ctx);
  }
  function exerciseHtml(task, number, total, mode = 'independent') {
    let input = '';
    if (task.kind === 'choice') {
      input = `<div class="micro-answer-grid">${task.options.map((option) => `<button type="button" data-answer="${esc(option)}">${esc(option)}</button>`).join('')}</div>`;
    } else if (task.kind === 'arrange') {
      const tokens = shuffledArrangeTokens(task.answer, task.id);
      input = `<div class="micro-built" data-built><em>Câu của con hiện ở đây…</em></div><div class="micro-token-bank">${tokens.map((token, i) => `<button type="button" data-token="${esc(token)}" data-token-id="${i}">${esc(token)}</button>`).join('')}</div><button type="button" class="micro-small-button" data-reset-arrange>↻ Làm lại thứ tự</button>`;
    } else if (task.kind === 'write') {
      input = `<textarea class="micro-write-answer" placeholder="Con viết ở đây…" rows="4"></textarea><small>Yêu cầu: ít nhất ${task.minWords || 4} từ.</small>`;
    } else if (task.kind === 'speak') {
      input = `<div class="micro-speak-actions"><button type="button" data-micro-say="${esc(task.target || task.answer)}" data-rate=".76">🔊 Nghe mẫu</button><button type="button" class="micro-voice-answer" data-voice-reply data-voice-target="${esc(task.target || task.answer)}">🎤 Nói / trả lời lại</button><button type="button" class="micro-voice-stop" data-voice-stop hidden>■ Dừng nghe</button><span class="micro-voice-status" data-voice-status aria-live="polite">Sẵn sàng nghe con nói</span><label class="micro-voice-fallback"><span>Câu Milo nghe được hoặc con tự gõ</span><input type="text" class="micro-speak-transcript" data-voice-input autocomplete="off" placeholder="Nói hoặc gõ câu trả lời ở đây"></label><button type="button" class="micro-vip-coach-link" data-open-pronunciation data-pronunciation-target="${esc(task.target || task.answer)}">⭐ Chấm chuyên sâu với VIP PRO MAX</button></div>`;
    }
    const sourceBadge = task.origin === 'bookExercise' && task.source
      ? `<div class="micro-book-source"><span>📘 Bài từ ảnh sách đã đối chiếu</span><small>Lớp ${task.source.grade} · Unit ${task.source.unit} · ${esc(task.source.sectionType)} · Bài ${esc(task.source.exerciseNumber)}</small></div>`
      : '<div class="micro-milo-practice"><span>🦊 Milo Practice</span><small>Bài luyện mới cùng kỹ năng, không sao chép nguyên câu sách.</small></div>';
    const safePreview = task.origin === 'bookExercise' && task.kind === 'speak' && task.source?.preview
      ? `<figure class="micro-book-preview"><img src="${esc(task.source.preview)}" alt="Vùng từ vựng đã cắt từ ảnh nguồn"><figcaption>Vùng ảnh nguồn dùng cho hoạt động nghe và nhắc lại.</figcaption></figure>` : '';
    return `<section class="micro-exercise" data-task-id="${esc(task.id)}" data-kind="${esc(task.kind)}" data-task-origin="${esc(task.origin || 'miloPractice')}" data-min-words="${task.minWords || 0}">
      <div class="micro-task-count">${mode === 'guided' ? 'LÀM CÙNG MILO' : `BÀI ${number}/${total}`}</div>
      ${sourceBadge}
      ${safePreview}
      <div class="micro-instruction-block"><small>ĐỀ BÀI</small><h3>${esc(task.prompt)}</h3><b>Con cần làm gì</b><p>${esc(task.instruction)}</p></div>
      <div class="micro-child-work"><b>Bài của con</b>${task.target && task.kind === 'choice' ? `<button type="button" class="micro-listen-question" data-micro-say="${esc(task.target)}">🔊 Nghe nội dung câu hỏi</button>` : ''}${input}${task.id === 's-3' ? '<button type="button" class="micro-ai-practice" data-open-journey-ai>💬 Tự trả lời với Milo AI</button>' : ''}${task.kind === 'write' ? '<button type="button" class="micro-ai-practice" data-open-journey-ai>🦊 Nhờ Milo chữa bài bằng tiếng Việt</button>' : ''}</div>
      <div class="micro-support-actions"><button type="button" class="micro-hint-button" data-hint>💡 Cho con một gợi ý</button><button type="button" class="micro-understand-button" data-help-toggle>🧭 Con chưa hiểu</button></div>
      <div class="micro-help-menu" data-help-menu hidden><b>Con đang vướng ở đâu?</b><div><button type="button" data-help-choice="instruction">Giải thích đề bài</button><button type="button" data-help-choice="knowledge">Nhắc lại kiến thức</button><button type="button" data-help-choice="hint">Cho con một gợi ý</button><button type="button" data-help-choice="example">Làm một ví dụ khác</button><button type="button" data-help-choice="solution">Con vẫn chưa hiểu</button></div></div>
      <div class="micro-feedback" data-feedback hidden></div>
    </section>`;
  }
  function correctionSummary(progress) {
    const weak = unique(progress.weak);
    if (!weak.length) return `<div class="micro-correction-good"><span>🌟</span><h3>Con đã làm tốt!</h3><p>Milo không thấy lỗi nào cần học lại.</p></div>`;
    return `<div class="micro-correction-list"><span>🧭</span><h3>Phần con cần chú ý</h3>${weak.map((item) => `<p>• ${esc(item)}</p>`).join('')}<button type="button" data-review-weak>↻ Học lại đúng phần này</button></div>`;
  }

  function sourceParentPanel(ctx) {
    return `<aside class="micro-parent-source"><small>🔐 Đối chiếu nguồn được lưu trong khu Quản trị của Milo.</small></aside>`;
  }

  function currentInstruction(step, ctx) {
    const type = ctx.section.sectionType;
    return [
      `Bấm nghe để Milo giải thích mục tiêu ${type}.`,
      'Học cách làm bằng một ví dụ khác bài sắp làm.',
      'Xem Milo giải từng bước bằng câu mẫu khác.',
      'Tự làm các câu từ dễ đến khó.',
      'Đọc phần Milo chữa và học lại lỗi sai.',
      'Làm năm câu và đạt ít nhất 80%.',
      'Bấm hoàn thành để lưu kết quả.',
    ][step - 1];
  }

  function tasksFor(ctx, variant = 0) {
    const normalizedVariant = Math.abs(Number(variant) || 0) % 3;
    const key = `${ctx.grade}:${ctx.unitIndex}:${ctx.part}:${normalizedVariant}`;
    if (!taskCache.has(key)) {
      const tasks = makeTasks(ctx, normalizedVariant);
      const sourceTasks = bookExercises?.find?.(ctx.grade, ctx.unitIndex + 1, ctx.part) || [];
      if (sourceTasks.length) {
        const raw = sourceTasks[normalizedVariant % sourceTasks.length];
        const bookTask = {
          ...raw,
          id: `${raw.id}-v${normalizedVariant}`,
          options: Array.isArray(raw.options) ? [...raw.options] : [],
          hintLevels: Array.isArray(raw.hintLevels) ? [...raw.hintLevels] : [],
          source: raw.source ? { ...raw.source } : null,
          teachingExample: raw.teachingExample ? { ...raw.teachingExample, steps: [...(raw.teachingExample.steps || [])] } : null,
          hint: raw.hintLevels?.[0] || raw.hint || 'Con tìm từ khóa trong đề.',
        };
        const occupied = new Set([...tasks.guidedTasks, ...tasks.quickCheckTasks].map(taskSignature));
        const independent = [bookTask, ...tasks.independent.filter((item) => taskSignature(item) !== taskSignature(bookTask) && !occupied.has(taskSignature(item)))];
        tasks.independent = independent;
        tasks.independentTasks = independent.map(cloneTask);
        tasks.bookExerciseCount = sourceTasks.length;
      } else tasks.bookExerciseCount = 0;
      taskCache.set(key, tasks);
    }
    return taskCache.get(key);
  }
  function mainActionLabel(step, progress) {
    if (step === 1) return progress.listened ? 'Tiếp tục học cách làm' : 'Nghe Milo giảng chuyên sâu';
    if (step === 2) return 'Con đã học cách làm';
    if (step === 3) return progress.modelSeen ? 'Kiểm tra đáp án' : 'Xem Milo làm ví dụ khác';
    if (step === 4) return 'Kiểm tra đáp án';
    if (step === 5) return 'Sang kiểm tra nhanh';
    if (step === 6) return progress.quickFinished ? (progress.quickPassed ? 'Sang bước hoàn thành' : 'Làm lại') : 'Kiểm tra đáp án';
    return 'Hoàn thành và sang bài tiếp theo';
  }

  function phaseNavigation(step) {
    const phases = sessionFlow?.phases || [
      { label: 'Học chuyên sâu', detail: 'Milo giảng và làm mẫu', start: 1, end: 2 },
      { label: 'Luyện có hướng dẫn', detail: 'Làm cùng Milo rồi tự làm', start: 3, end: 5 },
      { label: 'Vận dụng và kiểm tra', detail: 'Kiểm tra nhanh và hoàn thành', start: 6, end: 7 },
    ];
    return phases.map((phase, index) => {
      const active = step >= phase.start && step <= phase.end;
      const done = step > phase.end;
      const locked = step < phase.start;
      const status = active ? 'active' : done ? 'done' : 'locked';
      return `<button type="button" class="${status}" data-step-jump="${phase.start}" ${locked ? 'disabled' : ''}><span>${done ? '✓' : index + 1}</span><b>${esc(phase.label)}</b><small>${esc(phase.detail)}</small></button>`;
    }).join('');
  }

  function sessionHeader(ctx) {
    const flow = sessionFlow?.describe?.({ part: ctx.part, spec: ctx.spec }) || {
      number: 1, icon: '🌱', title: 'Bài học của con', itemNumber: 1, itemCount: 1,
    };
    return `<div class="micro-session-context"><span>${flow.icon}</span><div><small>UNIT ${ctx.unitIndex + 1} · BUỔI ${flow.number}/6 · PHẦN ${flow.itemNumber}/${flow.itemCount}</small><b>${esc(flow.title)}</b></div><em>Khoảng 10–15 phút</em></div>`;
  }

  function render(ctx, progress, trace = null) {
    const root = $('#lessonContent');
    if (!root) return;
    interactionPerf?.mark?.(trace, 'renderStart');
    const tasks = tasksFor(ctx, progress.variant || 0);
    const step = progress.step;
    const nav = phaseNavigation(step);
    let body = '';
    if (step === 1) {
      body = deepTeachingHtml(ctx, tasks);
    } else if (step === 2) {
      body = exampleScreen(ctx, tasks);
    } else if (step === 3) {
      body = `<div class="micro-guided-workspace ${progress.modelSeen ? 'is-ready' : 'is-waiting'}"><section class="micro-guided-model"><div class="micro-model"><div class="micro-model-avatar">🦊</div><div><small>CẤP 1 · MILO LÀM VÍ DỤ KHÁC</small>${progress.modelSeen ? teachingExampleHtml(tasks.guided, ctx) : '<p class="micro-model-ready">Bấm nút chính để Milo giải một ví dụ khác bài con sắp làm.</p>'}</div></div></section>${progress.modelSeen ? `<section class="micro-guided-practice"><div class="micro-level-banner"><span>CẤP 2</span><b>Con làm cùng Milo</b><p>Đây là câu mới. Đáp án của câu này chưa được hiển thị.</p></div>${exerciseHtml(tasks.guided, 1, 1, 'guided')}</section>` : ''}</div>`;
    } else if (step === 4) {
      const index = Math.min(Number(progress.independentIndex) || 0, Math.max(0, tasks.independent.length - 1));
      progress.independentIndex = index;
      body = `<div class="micro-level-banner"><span>CẤP 3</span><b>Con tự làm</b><p>Đáp án không hiện trước. Con có thể thử lại hai lần.</p></div>${exerciseHtml(tasks.independent[index], index + 1, tasks.independent.length)}`;
    } else if (step === 5) {
      const listeningReview = ctx.section.sectionType === 'Listening' ? `<details class="micro-transcript" open><summary>Transcript và giải thích sau khi trả lời</summary><p>${esc(tasks.transcript || passageFor(ctx))}</p><p><b>Tiếng Việt:</b> Milo giải thích ý chính và từ khóa theo chủ đề “${esc(ctx.unit.vi)}”.</p><small>Audio luyện tập do Milo tạo.</small></details>` : '';
      body = correctionSummary(progress) + listeningReview;
    } else if (step === 6) {
      const quiz = tasks.quick.slice(0, 5);
      const required = Math.max(1, Math.ceil(quiz.length * 0.8));
      const index = Math.min(Number(progress.quickIndex) || 0, Math.max(0, quiz.length - 1));
      progress.quickIndex = index;
      body = progress.quickFinished ? `<div class="micro-quiz-result ${progress.quickPassed ? 'pass' : 'retry'}"><span>${progress.quickPassed ? '🏆' : '🧭'}</span><h2>${progress.quickScore}/100</h2><p>${progress.quickPassed ? 'Con đã đạt yêu cầu. Bài học được mở khóa hoàn thành.' : 'Con cần đạt 80%. Milo đưa con về đúng phần còn yếu.'}</p>${progress.quickPassed ? '' : '<button type="button" data-retry-quiz>Làm lại kiểm tra</button>'}</div>` : `<div class="micro-level-banner"><span>KIỂM TRA NHANH</span><b>Câu ${index + 1}/${quiz.length}</b><p>Con cần đúng ít nhất ${required}/${quiz.length} câu.</p></div>${exerciseHtml(quiz[index], index + 1, quiz.length)}`;
    } else {
      body = `<div class="micro-complete"><span>🏆</span><h2>Con đã hoàn thành phần này!</h2><p>Điểm gần nhất: ${progress.quickScore}/100</p><p>Điểm cao nhất: ${Math.max(progress.quickScore, Number(progress.bestScore) || 0)}/100</p><p>Số lần thử: ${Number(progress.totalAttempts) || 0}</p><button type="button" class="micro-secondary-action" data-review-lesson>↻ Học lại phần yếu</button></div>`;
    }

    const canContinue = step === 1 ? progress.listened : step === 2 ? progress.examplesSeen : step === 3 ? progress.guidedDone : step === 4 ? progress.independentDone : step === 5 ? progress.correctionSeen : step === 6 ? progress.quickPassed : true;
    const mainLabel = mainActionLabel(step, progress);
    const signature = `${ctx.grade}-${ctx.unitIndex}-${ctx.part}`;
    const mounted = root.dataset.microReady === signature && root.querySelector('[data-micro-mounted]');
    if (!mounted) {
      root.innerHTML = `<section class="micro-lesson-shell" data-micro-mounted="1">
        <div class="micro-top-summary">${sessionHeader(ctx)}
          <header class="micro-lesson-header"><div><small>LỚP ${ctx.grade} · UNIT ${ctx.unitIndex + 1}</small><h1>${esc(ctx.section.title)}</h1><p>${esc(objective(ctx))}</p></div><label class="micro-guide-toggle"><input type="checkbox" data-guide-toggle ${progress.guided ? 'checked' : ''}><span>Milo hướng dẫn từng bước</span></label></header>
        </div>
        <nav class="micro-step-nav micro-phase-nav" aria-label="Ba giai đoạn của bài học">${nav}</nav>
        <div class="micro-action-context"><div class="micro-step-position" data-step-position><span>BƯỚC ${step}/7</span><b>${esc(STEP_LABELS[step - 1])}</b></div>
          <div class="micro-now"><span>👉</span><div><small>VIỆC CON CẦN LÀM BÂY GIỜ</small><b>${esc(currentInstruction(step, ctx))}</b></div></div>
        </div>
        <main class="micro-screen milo-screen-enter" data-step="${step}">${body}</main>
        <footer class="micro-primary-footer"><button type="button" data-main-action class="micro-main-action ${canContinue ? '' : 'needs-action'}">${esc(mainLabel)}</button><small data-lock-message>${canContinue ? 'Con đã sẵn sàng sang bước tiếp theo.' : 'Hãy hoàn thành nhiệm vụ trên trước.'}</small></footer>
        ${sourceParentPanel(ctx)}
      </section>`;
    } else {
      const shell = root.querySelector('[data-micro-mounted]');
      const navNode = $('.micro-step-nav', shell);
      const stepPosition = $('[data-step-position]', shell);
      const nowNode = $('.micro-now b', shell);
      const screen = $('.micro-screen', shell);
      const mainButton = $('[data-main-action]', shell);
      const lockMessage = $('[data-lock-message]', shell);
      if (navNode) navNode.innerHTML = nav;
      if (stepPosition) stepPosition.innerHTML = `<span>BƯỚC ${step}/7</span><b>${esc(STEP_LABELS[step - 1])}</b>`;
      if (nowNode) nowNode.textContent = currentInstruction(step, ctx);
      if (screen) {
        screen.dataset.step = String(step);
        screen.innerHTML = body;
        screen.classList.remove('milo-screen-enter');
        window.requestAnimationFrame?.(() => screen.classList.add('milo-screen-enter'));
      }
      if (mainButton) {
        const nextButton = document.createElement('button');
        nextButton.type = 'button';
        nextButton.dataset.mainAction = '1';
        nextButton.className = `micro-main-action ${canContinue ? '' : 'needs-action'}`;
        nextButton.textContent = mainLabel;
        mainButton.replaceWith(nextButton);
      }
      if (lockMessage) lockMessage.textContent = canContinue ? 'Con đã sẵn sàng sang bước tiếp theo.' : 'Hãy hoàn thành nhiệm vụ trên trước.';
      const guide = $('[data-guide-toggle]', shell);
      if (guide) guide.checked = Boolean(progress.guided);
    }
    root.dataset.microReady = signature;
    const coachMessage = $('#miloMessage');
    if (coachMessage) coachMessage.textContent = currentInstruction(step, ctx);
    const runtime = root.__miloMicroRuntime || { isSubmitting: false, lastInstructionKey: '' };
    runtime.ctx = ctx;
    runtime.progress = progress;
    runtime.tasks = tasks;
    root.__miloMicroRuntime = runtime;
    bind(root);
    const instructionKey = `${signature}:${step}`;
    if (progress.guided && runtime.lastInstructionKey !== instructionKey) {
      runtime.lastInstructionKey = instructionKey;
      window.setTimeout(() => speak(currentInstruction(step, ctx), 0.88), 60);
    }
    interactionPerf?.mark?.(trace, 'renderDone');
  }

  function visibleTaskFor(progress, tasks) {
    if (progress.step === 3) return tasks.guided;
    if (progress.step === 4) return tasks.independent[progress.independentIndex || 0];
    if (progress.step === 6) return tasks.quick[progress.quickIndex || 0];
    return tasks.guided;
  }

  function taskById(tasks, id) {
    return [tasks.guided, ...(tasks.independent || []), ...(tasks.quick || [])].find((task) => task?.id === id) || null;
  }

  function answerFromCard(card, task) {
    if (!card || !task) return '';
    if (task.kind === 'choice') return card.dataset.chosen || '';
    if (task.kind === 'arrange') return $$('.micro-built span', card).map((item) => item.textContent).join(' ');
    if (task.kind === 'write') return $('.micro-write-answer', card)?.value.trim() || '';
    if (task.kind === 'speak') return $('.micro-speak-transcript', card)?.value.trim() || '';
    return '';
  }

  function adaptiveHelpHtml(task, type, ctx) {
    const example = safeTeachingExample(task, ctx);
    if (type === 'instruction') return `<div class="micro-targeted-help"><strong>Giải thích đề bài</strong><p>${esc(task.instruction)}</p><small>Milo chỉ giải thích việc cần làm, chưa mở đáp án.</small></div>`;
    if (type === 'knowledge') return `<div class="micro-targeted-help"><strong>Nhắc lại kiến thức</strong><p>${esc(teacherCopy(ctx).quick)}</p><small>Con quay lại câu hiện tại sau khi đọc xong.</small></div>`;
    if (type === 'hint') return `<div class="micro-targeted-help"><strong>Gợi ý nhỏ</strong><p>${esc(task.hintLevels?.[0] || task.hint || 'Tìm từ khóa trong đề bài.')}</p><small>Gợi ý đầu tiên không chứa đáp án.</small></div>`;
    if (type === 'example') return `<div class="micro-targeted-help"><strong>Làm một ví dụ khác</strong><h4>${esc(example.prompt)}</h4><ol>${example.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol><p><b>Kết luận của ví dụ khác:</b> ${esc(example.answer)}</p></div>`;
    return `<div class="micro-targeted-help micro-final-help"><strong>Con vẫn chưa hiểu</strong><p>Milo sẽ chia câu này thành từng bước. Con đã chủ động chọn xem cách làm nên đáp án chỉ được mở ở bước cuối.</p><button type="button" data-reveal-solution>Xem cách làm từng bước</button></div>`;
  }

  function feedbackHtml(task, chosen, correct, attempts, reveal = false, ctx = pageState()) {
    if (correct) {
      return `<div class="good"><strong>✓ Con làm đúng!</strong><dl><div><dt>Câu của con</dt><dd>${esc(chosen || task.answer || 'Câu trả lời hợp lệ')}</dd></div><div><dt>Vì sao đúng</dt><dd>${esc(task.explanation)}</dd></div><div><dt>Câu tiếp theo</dt><dd>Con đã hiểu. Hãy sang câu tiếp theo.</dd></div></dl>${task.evidence ? `<p class="micro-evidence"><b>Bằng chứng:</b> ${esc(task.evidence)}</p>` : ''}</div>`;
    }
    const firstHint = task.hintLevels?.[0] || task.hint || 'Con tìm từ khóa trong đề bài.';
    const secondHint = task.hintLevels?.[1] || 'Nhắc lại kiến thức rồi thử lại.';
    if (attempts <= 1) {
      return `<div class="bad"><strong>Chưa đúng, nhưng Milo chưa mở đáp án</strong><dl><div><dt>Câu của con</dt><dd>${esc(chosen || 'Chưa có câu trả lời')}</dd></div><div><dt>Phần cần xem lại</dt><dd>${esc(firstHint)}</dd></div><div><dt>Con thử lại</dt><dd>Đọc gợi ý nhỏ rồi làm lại câu này.</dd></div></dl></div>`;
    }
    if (!reveal) {
      const example = safeTeachingExample(task, ctx);
      return `<div class="bad"><strong>Milo giảng lại bằng một ví dụ khác</strong><p>${esc(secondHint)}</p><div class="micro-reteach"><h4>${esc(example.prompt)}</h4><ol>${example.steps.map((step) => `<li>${esc(step)}</li>`).join('')}</ol><p><b>Kết luận ví dụ khác:</b> ${esc(example.answer)}</p></div><p>Đáp án của câu hiện tại vẫn đang được giữ kín.</p>${attempts >= 3 ? '<button type="button" data-reveal-solution>Xem cách làm từng bước</button>' : ''}</div>`;
    }
    const example = safeTeachingExample(task, ctx);
    return `<div class="bad revealed"><strong>Cách làm từng bước</strong><ol><li>Đọc lại đề: ${esc(task.prompt)}</li><li>Nhắc lại kiến thức: ${esc(secondHint)}</li><li>So sánh với ví dụ khác: ${esc(example.prompt)}</li><li>Đáp án đúng: <b>${esc(task.answer || 'Câu trả lời đạt yêu cầu')}</b></li></ol><p><b>Vì sao:</b> ${esc(task.explanation)}</p></div>`;
  }
  function evaluateTask(card, task, progress, ctx) {
    const kind = task.kind;
    let chosen = '';
    let correct = false;
    let displayTask = task;
    if (kind === 'choice') {
      chosen = card?.dataset.chosen || '';
      correct = clean(chosen).toLowerCase() === clean(task.answer).toLowerCase();
    } else if (kind === 'arrange') {
      chosen = $$('.micro-built span', card).map((item) => item.textContent).join(' ');
      correct = clean(chosen).toLowerCase() === clean(task.answer).toLowerCase();
    } else if (kind === 'write') {
      chosen = $('.micro-write-answer', card)?.value.trim() || '';
      const count = chosen.split(/\s+/).filter(Boolean).length;
      const targetWords = unique([task.target, ...wordsFor(pageState()).map((item) => item.term)]).filter(Boolean);
      const hasUnitWord = !targetWords.length || targetWords.some((item) => chosen.toLowerCase().includes(String(item).toLowerCase()));
      correct = count >= (task.minWords || 4) && hasUnitWord;
      displayTask = { ...task, answer: `Ít nhất ${task.minWords || 4} từ, đúng yêu cầu và có từ của Unit`, explanation: correct ? 'Bài có đủ độ dài và đúng yêu cầu.' : 'Con cần viết đủ số từ, dùng câu hoàn chỉnh và bám đúng đề.' };
    } else if (kind === 'speak') {
      chosen = $('.micro-speak-transcript', card)?.value.trim() || '';
      const expected = clean(task.target || task.answer).toLowerCase().replace(/[^a-z0-9à-ỹđ ]/gi, ' ');
      const heard = clean(chosen).toLowerCase().replace(/[^a-z0-9à-ỹđ ]/gi, ' ');
      const expectedWords = expected.split(/\s+/).filter((word) => word.length > 1);
      const heardWords = new Set(heard.split(/\s+/).filter((word) => word.length > 1));
      const overlap = expectedWords.filter((word) => heardWords.has(word)).length;
      correct = Boolean(heard) && (overlap >= Math.max(1, Math.ceil(expectedWords.length * 0.45)) || heard.includes(expected) || expected.includes(heard));
      displayTask = { ...task, answer: task.target || task.answer, explanation: correct ? 'Milo đã nhận được câu nói gần đúng mẫu giao tiếp.' : 'Con hãy nghe lại và nói hoặc gõ một câu đầy đủ. Không có điểm phát âm giả.' };
    }
    progress.attempts[task.id] = (progress.attempts[task.id] || 0) + 1;
    progress.totalAttempts = (progress.totalAttempts || 0) + 1;
    progress.revealed ||= {};
    const feedback = $('[data-feedback]', card);
    if (feedback) {
      feedback.hidden = false;
      feedback.innerHTML = feedbackHtml(displayTask, chosen, correct, progress.attempts[task.id], Boolean(progress.revealed[task.id]), pageState());
    }
    if (!correct) {
      progress.weak.push(task.prompt);
      card?.classList.add('has-error');
      const message = progress.attempts[task.id] === 1
        ? 'Chưa đúng. Milo chỉ cho con một gợi ý nhỏ.'
        : 'Chưa đúng. Milo sẽ giảng lại bằng một ví dụ khác.';
      speak(message, 0.86).catch(() => {});
    } else {
      card?.classList.remove('has-error');
      card?.classList.add('is-correct');
      progress.correctItems = unique([...(progress.correctItems || []), taskSignature(task)]);
      speak('Đúng rồi! Con làm rất tốt.', 0.88).catch(() => {});
    }
    window.MILO_LEARNING_REVIEW?.recordTask?.({
      grade: ctx?.grade,
      unitIndex: ctx?.unitIndex,
      part: ctx?.part,
      prompt: task.prompt,
      correct,
    });
    return correct;
  }
  function updateCompletionNav(ctx) {
    const key = `milo-lesson-parts-${ctx.grade}-${ctx.unitIndex}`;
    let done = [];
    try { done = JSON.parse(localStorage.getItem(key) || '[]'); } catch { done = []; }
    if (!done.includes(ctx.part)) done.push(ctx.part);
    localStorage.setItem(key, JSON.stringify(done));
    const button = document.querySelector(`[data-part="${CSS.escape(ctx.part)}"]`);
    button?.classList.add('done');
    if (button && !button.querySelector('em')) button.insertAdjacentHTML('beforeend', '<em>✓</em>');
  }

  function nextPart(ctx) {
    const sections = ctx.spec.sections.filter((item) => !['sourcebook', 'milo-grammar-levels'].includes(item.id));
    const index = sections.findIndex((item) => item.id === ctx.part);
    return sections[index + 1]?.id || 'test';
  }

  function actionError(root, error) {
    const footer = $('.micro-primary-footer', root);
    let node = $('.micro-action-error', footer || root);
    if (!node && footer) {
      node = document.createElement('p');
      node.className = 'micro-action-error';
      footer.appendChild(node);
    }
    if (node) node.textContent = `Milo chưa xử lý được: ${error?.message || 'Con hãy thử lại.'}`;
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function runFastAction(root, button, label, work) {
    const runtime = root.__miloMicroRuntime;
    if (!runtime || runtime.isSubmitting) return;
    runtime.isSubmitting = true;
    const runner = interactionPerf?.run
      ? interactionPerf.run(button, { action: button.textContent, label, onError: (error) => actionError(root, error) }, work)
      : Promise.resolve().then(() => work({ record: null, mark() {}, renderStart() {}, renderDone() {}, saveQueued() {} }));
    Promise.resolve(runner).finally(() => { runtime.isSubmitting = false; });
  }

  function processMainAction(root, button) {
    const runtime = root.__miloMicroRuntime;
    if (!runtime) return;
    const { ctx, progress, tasks } = runtime;
    const checking = ['3', '4', '6'].includes(String(progress.step)) && (progress.step !== 3 || progress.modelSeen) && !(progress.step === 6 && progress.quickFinished);
    const label = checking ? 'Đang kiểm tra...' : progress.step === 7 ? 'Đang hoàn thành...' : 'Đang chuyển bước...';
    runFastAction(root, button, label, async (control) => {
      const step = progress.step;
      let assessmentCorrect = null;
      let transitionDelay = 0;
      if (step === 1) {
        if (!progress.listened) {
          progress.listened = true;
          awardXp(ctx, 'lesson', 'teacher-listened');
          saveProgress(ctx, progress);
          control.saveQueued();
          speak(teacherNarration(ctx), 0.84);
          render(ctx, progress, control.record);
          return;
        }
        progress.step = 2;
      } else if (step === 2) {
        progress.examplesSeen = true;
        progress.step = 3;
      } else if (step === 3) {
        if (!progress.modelSeen) {
          progress.modelSeen = true;
          saveProgress(ctx, progress);
          control.saveQueued();
          render(ctx, progress, control.record);
          const demo = safeTeachingExample(tasks.guided, ctx);
          speak(`${demo.prompt} ${demo.answer}`, 0.82).catch(() => {});
          return;
        }
        const card = $('.micro-exercise', root);
        assessmentCorrect = evaluateTask(card, tasks.guided, progress, ctx);
        control.mark('assessmentDone');
        if (!assessmentCorrect) {
          saveProgress(ctx, progress);
          control.saveQueued();
          return;
        }
        awardXp(ctx, tasks.guided.kind === 'speak' ? 'pronunciation' : 'exercise', `guided:${tasks.guided.id}`, 100);
        progress.guidedDone = true;
        progress.step = 4;
        progress.independentIndex = 0;
        transitionDelay = 140;
      } else if (step === 4) {
        const index = progress.independentIndex || 0;
        const task = tasks.independent[index];
        const card = $('.micro-exercise', root);
        assessmentCorrect = evaluateTask(card, task, progress, ctx);
        control.mark('assessmentDone');
        if (!assessmentCorrect) {
          saveProgress(ctx, progress);
          control.saveQueued();
          return;
        }
        awardXp(ctx, task.kind === 'speak' ? 'pronunciation' : 'exercise', `independent:${task.id}`, 100);
        if (index < tasks.independent.length - 1) progress.independentIndex = index + 1;
        else { progress.independentDone = true; progress.step = 5; }
        transitionDelay = 140;
      } else if (step === 5) {
        progress.correctionSeen = true;
        progress.step = 6;
        progress.quickIndex = 0;
        progress.quickCorrect = 0;
        progress.quickFinished = false;
      } else if (step === 6) {
        if (progress.quickFinished) {
          if (progress.quickPassed) progress.step = 7;
          else {
            progress.quickFinished = false;
            progress.quickIndex = 0;
            progress.quickCorrect = 0;
            progress.variant = ((progress.variant || 0) + 1) % 3;
          }
        } else {
          const quiz = tasks.quick.slice(0, 5);
          const index = progress.quickIndex || 0;
          const task = quiz[index];
          const card = $('.micro-exercise', root);
          assessmentCorrect = evaluateTask(card, task, progress, ctx);
          control.mark('assessmentDone');
          if (assessmentCorrect) {
            progress.quickCorrect = (progress.quickCorrect || 0) + 1;
            awardXp(ctx, 'quick', `quick:${task.id}`, 100);
          }
          if (!assessmentCorrect && (progress.attempts[task.id] || 0) < 2) {
            saveProgress(ctx, progress);
            control.saveQueued();
            return;
          }
          if (index < quiz.length - 1) progress.quickIndex = index + 1;
          else {
            progress.quickFinished = true;
            progress.quickScore = Math.round((progress.quickCorrect || 0) / quiz.length * 100);
            progress.bestScore = Math.max(Number(progress.bestScore) || 0, progress.quickScore);
            progress.quickPassed = progress.quickScore >= 80;
          }
          transitionDelay = 140;
        }
      } else {
        if (!progress.quickPassed) {
          progress.step = 6;
          saveProgress(ctx, progress);
          control.saveQueued();
          render(ctx, progress, control.record);
          return;
        }
        flushBackgroundWrites();
        progression?.completeSection({
          grade: ctx.grade, unitNumber: ctx.unitIndex + 1, sectionId: ctx.part,
          score: progress.quickScore, attempts: progress.totalAttempts || 1,
          wrongItems: progress.weak || [], weakAreas: progress.weak || [],
        });
        updateCompletionNav(ctx);
        const next = nextPart(ctx);
        saveProgress(ctx, progress, { immediate: true });
        location.hash = next;
        location.reload();
        return;
      }
      saveProgress(ctx, progress);
      control.saveQueued();
      if (transitionDelay) await wait(transitionDelay);
      render(ctx, progress, control.record);
    });
  }

  function bind(root = $('#lessonContent')) {
    if (!root || root.dataset.microDelegated === '1') return;
    root.dataset.microDelegated = '1';
    root.addEventListener('change', (event) => {
      const runtime = root.__miloMicroRuntime;
      if (!runtime) return;
      if (event.target.matches('[data-guide-toggle]')) {
        runtime.progress.guided = event.target.checked;
        saveProgress(runtime.ctx, runtime.progress);
        if (runtime.progress.guided) speak(currentInstruction(runtime.progress.step, runtime.ctx), 0.88);
      }
    });
    root.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button || !root.contains(button)) return;
      const runtime = root.__miloMicroRuntime;
      if (!runtime) return;
      const { ctx, progress, tasks } = runtime;
      if (button.matches('[data-main-action]')) {
        event.preventDefault();
        processMainAction(root, button);
        return;
      }
      if (button.matches('[data-micro-say]')) { speakWithButton(button, button.dataset.microSay, Number(button.dataset.rate || 0.82), 'en-US'); return; }
      if (button.matches('[data-vocab-listen]')) { speakWithButton(button, button.dataset.vocabListen, 0.76, 'en-US'); return; }
      if (button.matches('[data-vocab-slow]')) { speakWithButton(button, button.dataset.vocabSlow, 0.55, 'en-US'); return; }
      if (button.matches('[data-vocab-group]')) {
        $$('[data-vocab-group]', root).forEach((item) => item.classList.toggle('active', item === button));
        $$('[data-vocab-panel]', root).forEach((panel) => panel.classList.toggle('active', panel.dataset.vocabPanel === button.dataset.vocabGroup));
        return;
      }
      if (button.matches('[data-copy-mode]')) {
        $$('[data-copy-mode]', root).forEach((item) => item.classList.toggle('active', item === button));
        $$('[data-copy]', root).forEach((copy) => { copy.hidden = copy.dataset.copy !== button.dataset.copyMode; });
        return;
      }
      if (button.matches('[data-step-jump]')) {
        const target = Number(button.dataset.stepJump);
        if (target <= progress.step) { progress.step = target; saveProgress(ctx, progress); render(ctx, progress); }
        return;
      }
      if (button.matches('[data-teacher-speak]')) {
        progress.listened = true;
        awardXp(ctx, 'lesson', 'teacher-listened');
        saveProgress(ctx, progress);
        render(ctx, progress);
        speak(teacherNarration(ctx), 0.84);
        return;
      }
      if (button.matches('[data-open-book-page]')) {
        const asset = button.dataset.openBookPage || '';
        if (asset) sessionStorage.setItem('milo-source-open-asset', asset);
        localStorage.setItem(`milo-last-part-${ctx.grade}-${ctx.unitIndex}`, 'sourcebook');
        location.hash = 'sourcebook';
        location.reload();
        return;
      }
      if (button.matches('[data-show-model]')) {
        progress.modelSeen = true;
        saveProgress(ctx, progress);
        render(ctx, progress);
        const demo = safeTeachingExample(tasks.guided, ctx);
        speak(`${demo.prompt} ${demo.answer}`, 0.82).catch(() => {});
        return;
      }
      if (button.matches('[data-hint]')) {
        const stepTask = visibleTaskFor(progress, tasks);
        const feedback = $('[data-feedback]', root);
        if (feedback) {
          feedback.hidden = false;
          const hint = stepTask.hintLevels?.[0] || stepTask.hint || 'Con tìm từ khóa trong đề bài trước.';
          feedback.innerHTML = `<div class="hint"><strong>💡 Gợi ý nhỏ</strong><p>${esc(hint)}</p><small>Gợi ý này chưa mở đáp án.</small></div>`;
        }
        speak(stepTask.hintLevels?.[0] || stepTask.hint || 'Con tìm từ khóa trong đề bài trước.', 0.88);
        return;
      }
      if (button.matches('[data-help-toggle]')) {
        const menu = $('[data-help-menu]', button.closest('.micro-exercise'));
        if (menu) menu.hidden = !menu.hidden;
        return;
      }
      if (button.matches('[data-help-choice]')) {
        const card = button.closest('.micro-exercise');
        const task = taskById(tasks, card?.dataset.taskId) || visibleTaskFor(progress, tasks);
        const feedback = $('[data-feedback]', root);
        if (feedback && task) {
          progress.helpMode = button.dataset.helpChoice;
          feedback.hidden = false;
          feedback.innerHTML = adaptiveHelpHtml(task, button.dataset.helpChoice, ctx);
          saveProgress(ctx, progress);
        }
        return;
      }
      if (button.matches('[data-reveal-solution]')) {
        const card = button.closest('.micro-exercise') || $('.micro-exercise', root);
        const task = taskById(tasks, card?.dataset.taskId) || visibleTaskFor(progress, tasks);
        const feedback = $('[data-feedback]', root);
        if (feedback && task) {
          const key = task.id;
          progress.revealed = { ...(progress.revealed || {}), [key]: true };
          const chosen = answerFromCard(card, task);
          const attempts = Number(progress.attempts?.[key] || 3);
          feedback.hidden = false;
          feedback.innerHTML = feedbackHtml(task, chosen, false, Math.max(3, attempts), true, ctx);
          saveProgress(ctx, progress);
        }
        return;
      }
      if (button.matches('[data-answer]')) {
        $$('[data-answer]', button.closest('.micro-exercise')).forEach((item) => item.classList.toggle('selected', item === button));
        button.closest('.micro-exercise').dataset.chosen = button.dataset.answer;
        return;
      }
      if (button.matches('[data-token]')) {
        button.disabled = true;
        const built = $('[data-built]', button.closest('.micro-exercise'));
        if (built?.querySelector('em')) built.innerHTML = '';
        built?.insertAdjacentHTML('beforeend', `<span>${esc(button.dataset.token)}</span>`);
        return;
      }
      if (button.matches('[data-reset-arrange]')) { render(ctx, progress); return; }
      if (button.matches('[data-review-weak]')) { progress.step = 2; progress.independentDone = false; progress.independentIndex = 0; saveProgress(ctx, progress); render(ctx, progress); return; }
      if (button.matches('[data-review-lesson]')) { progress.step = progress.weak.length ? 2 : 1; saveProgress(ctx, progress); render(ctx, progress); return; }
      if (button.matches('[data-retry-quiz]')) { progress.quickFinished = false; progress.quickPassed = false; progress.quickIndex = 0; progress.quickCorrect = 0; progress.variant = ((progress.variant || 0) + 1) % 3; saveProgress(ctx, progress); render(ctx, progress); }
    });
  }

  window.MILO_MICRO_LESSON_V60_19 = {
    version: '60.23.0',
    buildForTest(grade, unitIndex, part, attempt = 0) {
      const unit = window.MILO_CURRICULUM?.[grade]?.units?.[unitIndex];
      const spec = window.MILO_SOURCE_SECTIONS_V60_17?.grades?.[String(grade)]?.units?.[unitIndex];
      const baseSection = spec?.sections?.find((item) => item.id === part);
      const section = sectionWithExact(baseSection, grade, unitIndex, part);
      if (!unit || !spec || !section || TECH_PARTS.has(part)) return null;
      const ctx = { grade, unitIndex, unit, spec, section, part };
      const tasks = tasksFor(ctx, attempt);
      return {
        grade,
        unit: unitIndex + 1,
        part,
        sectionType: section.sectionType,
        objective: objective(ctx),
        guided: tasks.guided,
        independent: tasks.independent,
        quick: tasks.quick.slice(0, 5),
        guidedTasks: tasks.guidedTasks,
        independentTasks: tasks.independentTasks,
        quickCheckTasks: tasks.quickCheckTasks,
        signatures: { guided: tasks.guidedTasks.map(taskSignature), independent: tasks.independentTasks.map(taskSignature), quick: tasks.quickCheckTasks.map(taskSignature) },
        hasPassage: Boolean(tasks.passage),
        hasTranscript: Boolean(tasks.transcript),
        bookExerciseCount: Number(tasks.bookExerciseCount || 0),
        exactCoverage: section.exactVerification?.coverage || 'pending',
        learningSession: sessionFlow?.describe?.({ part, spec }) || null,
        learningPhase: sessionFlow?.phaseForStep?.(1) || null,
        origins: [...tasks.guidedTasks, ...tasks.independentTasks, ...tasks.quickCheckTasks].map((task) => task.origin || 'miloPractice'),
      };
    },
    canHandle(grade, unitIndex, part) {
      const spec = window.MILO_SOURCE_SECTIONS_V60_17?.grades?.[String(grade)]?.units?.[unitIndex];
      return [2, 3].includes(Number(grade)) && Boolean(spec?.sections?.some((section) => section.id === part)) && !TECH_PARTS.has(part);
    },
    mountCurrent() { return mount(); },
    leaveFocus() { document.body?.classList?.remove('micro-focus-mode'); },
  };

  let mounting = false;
  function mount() {
    if (mounting) return false;
    const ctx = pageState();
    const root = $('#lessonContent');
    if (!root || !ctx.unit || !ctx.section || ![2, 3].includes(ctx.grade) || TECH_PARTS.has(ctx.part)) {
      document.body?.classList?.remove('micro-focus-mode');
      return false;
    }
    document.body?.classList?.add('micro-focus-mode');
    const signature = `${ctx.grade}-${ctx.unitIndex}-${ctx.part}`;
    if (root.dataset.microReady === signature && root.querySelector('[data-micro-mounted]')) return true;
    mounting = true;
    try { render(ctx, loadProgress(ctx)); } finally { mounting = false; }
    return true;
  }

  const start = () => {
    const root = $('#lessonContent');
    if (!root) return;
    mount();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
