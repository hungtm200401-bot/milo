(function () {
  'use strict';

  const PHASES = Object.freeze([
    Object.freeze({ id: 'learn', label: 'Học chuyên sâu', shortLabel: 'Học', detail: 'Milo giảng và làm mẫu', start: 1, end: 2 }),
    Object.freeze({ id: 'practice', label: 'Luyện có hướng dẫn', shortLabel: 'Luyện', detail: 'Làm cùng Milo rồi tự làm', start: 3, end: 5 }),
    Object.freeze({ id: 'check', label: 'Vận dụng và kiểm tra', shortLabel: 'Kiểm tra', detail: 'Kiểm tra nhanh và hoàn thành', start: 6, end: 7 }),
  ]);

  const SESSIONS = Object.freeze([
    Object.freeze({ number: 1, icon: '🌱', title: 'Khởi động và từ mới', detail: 'Câu hỏi lớn · từ vựng · âm đầu tiên' }),
    Object.freeze({ number: 2, icon: '📖', title: 'Đọc hiểu và mẫu câu 1', detail: 'Đọc 1 · chiến lược đọc · ngữ pháp 1' }),
    Object.freeze({ number: 3, icon: '🎧', title: 'Nghe, nói và mở rộng', detail: 'Nghe · giao tiếp · từ vựng 2 · đọc 2' }),
    Object.freeze({ number: 4, icon: '🧠', title: 'Mẫu câu 2', detail: 'Ngữ pháp 2 · luyện có hướng dẫn' }),
    Object.freeze({ number: 5, icon: '✍️', title: 'Viết và vận dụng', detail: 'Viết · giá trị · dự án' }),
    Object.freeze({ number: 6, icon: '🏆', title: 'Ôn tập và kiểm tra', detail: 'Ôn đúng phần yếu · Unit Check' }),
  ]);

  const SESSION_BY_TYPE = Object.freeze({
    'Big Question': 0,
    'CLIL/Content': 0,
    'Vocabulary 1': 0,
    'Reading 1': 1,
    'Reading Skill': 1,
    'Vocabulary in Reading': 1,
    'Grammar 1': 1,
    'Grammar Practice 1': 1,
    Listening: 2,
    'Speaking/Communication': 2,
    'Vocabulary 2': 2,
    'Reading 2': 2,
    'Grammar 2': 3,
    'Grammar Practice 2': 3,
    Writing: 4,
    'Writing Skill': 4,
    Value: 4,
    Culture: 4,
    Project: 4,
    'Review/Unit Check': 5,
    'Grammar Review': 5,
  });

  const LEARNING_EXCLUSIONS = new Set(['sourcebook', 'milo-grammar-levels', 'vipmax', 'games']);

  function learningSections(spec) {
    return (spec?.sections || []).filter((section) => !LEARNING_EXCLUSIONS.has(section.id));
  }

  function sessionIndexForSection(section, spec) {
    if (!section) return 0;
    if (section.id === 'test') return 5;
    if (section.sectionType === 'Pronunciation') {
      const sections = learningSections(spec);
      const pronunciationIndex = sections.findIndex((item) => item.id === section.id);
      const firstReadingIndex = sections.findIndex((item) => item.sectionType === 'Reading 1');
      return pronunciationIndex >= 0 && firstReadingIndex >= 0 && pronunciationIndex < firstReadingIndex ? 0 : 2;
    }
    return SESSION_BY_TYPE[section.sectionType] ?? 0;
  }

  function sectionFromPart(part, spec) {
    if (part === 'test') return { id: 'test', sectionType: 'Review/Unit Check', title: 'Kiểm tra cuối Unit' };
    return (spec?.sections || []).find((section) => section.id === part) || null;
  }

  function describe({ part, spec } = {}) {
    const section = sectionFromPart(part, spec);
    const sessionIndex = sessionIndexForSection(section, spec);
    const session = SESSIONS[sessionIndex];
    const members = learningSections(spec).filter((item) => sessionIndexForSection(item, spec) === sessionIndex);
    const itemIndex = Math.max(0, members.findIndex((item) => item.id === part));
    return {
      ...session,
      index: sessionIndex,
      itemIndex,
      itemNumber: itemIndex + 1,
      itemCount: Math.max(1, members.length),
      section,
    };
  }

  function describePart(part) {
    const syntheticTypes = {
      'book-big-question': 'Big Question', 'book-clil-content': 'CLIL/Content',
      'book-vocabulary-1': 'Vocabulary 1', 'book-reading-1': 'Reading 1',
      'book-reading-skill': 'Reading Skill', 'book-vocabulary-in-reading': 'Vocabulary in Reading',
      'book-grammar-1': 'Grammar 1', 'book-grammar-practice-1': 'Grammar Practice 1',
      'book-listening': 'Listening', 'book-speaking-communication': 'Speaking/Communication',
      'book-vocabulary-2': 'Vocabulary 2', 'book-reading-2': 'Reading 2',
      'book-pronunciation': 'Pronunciation', 'book-grammar-2': 'Grammar 2',
      'book-grammar-practice-2': 'Grammar Practice 2', 'book-writing': 'Writing',
      'book-writing-skill': 'Writing Skill', 'book-value': 'Value', 'book-project': 'Project',
      'book-review-unit-check': 'Review/Unit Check', test: 'Review/Unit Check',
    };
    const sectionType = syntheticTypes[part] || 'Big Question';
    const sessionIndex = part === 'test' ? 5 : (sectionType === 'Pronunciation' ? 2 : SESSION_BY_TYPE[sectionType] ?? 0);
    return { ...SESSIONS[sessionIndex], index: sessionIndex };
  }

  function phaseForStep(step) {
    const normalized = Math.min(7, Math.max(1, Number(step) || 1));
    return PHASES.find((phase) => normalized >= phase.start && normalized <= phase.end) || PHASES[0];
  }

  function recommendedPart(storage, grade, unitIndex) {
    const saved = storage?.getItem?.(`milo-last-part-${grade}-${unitIndex}`) || '';
    if ((saved.startsWith('book-') && saved !== 'book-sourcebook') || saved === 'test') return saved;
    return [2, 3].includes(Number(grade)) ? 'book-big-question' : 'warmup';
  }

  window.MILO_LEARNING_SESSION_FLOW = Object.freeze({
    version: '1.0.0',
    phases: PHASES,
    sessions: SESSIONS,
    learningSections,
    sessionIndexForSection,
    describe,
    describePart,
    phaseForStep,
    recommendedPart,
  });
})();
