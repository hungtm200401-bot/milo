// Unit Task Mapping (Responsibility-based module for 8 Major Tasks per Unit)
(function (root) {
  'use strict';

  const MAJOR_TASK_DEFINITIONS = Object.freeze([
    {
      id: 'task-1',
      number: 1,
      icon: '❓',
      title: 'Nhiệm vụ 1: Khởi động & Câu hỏi lớn',
      shortTitle: 'Khởi động & Câu hỏi lớn',
      subtitle: 'Tìm hiểu chủ đề chính và trả lời câu hỏi dẫn dắt của Unit',
      duration: '10 phút',
      stage: 'Học',
      outcome: 'Con sẽ nắm được chủ đề bài học và sẵn sàng khám phá kiến thức mới.',
      sectionIds: ['book-big-question', 'warmup'],
    },
    {
      id: 'task-2',
      number: 2,
      icon: '🔤',
      title: 'Nhiệm vụ 2: Từ vựng & Phát âm',
      shortTitle: 'Từ vựng & Phát âm',
      subtitle: 'Học từ vựng trọng tâm theo ngữ cảnh và rèn luyện âm chuẩn cùng Milo',
      duration: '15 phút',
      stage: 'Học',
      outcome: 'Con sẽ nhận biết, đọc đúng và ghi nhớ các từ vựng & ngữ âm chính.',
      sectionIds: ['book-vocabulary-1', 'book-pronunciation', 'vocabulary', 'phonics'],
    },
    {
      id: 'task-3',
      number: 3,
      icon: '📖',
      title: 'Nhiệm vụ 3: Đọc & Kỹ năng đọc',
      shortTitle: 'Đọc & Kỹ năng đọc',
      subtitle: 'Đọc bài văn ngắn, tìm ý chính và rèn luyện kỹ năng đọc hiểu',
      duration: '15 phút',
      stage: 'Học',
      outcome: 'Con sẽ đọc hiểu bài khóa và tự tin tìm thông tin chi tiết trong câu.',
      sectionIds: ['book-reading-1', 'book-vocabulary-in-reading', 'book-reading-skill', 'reading'],
    },
    {
      id: 'task-4',
      number: 4,
      icon: '🧩',
      title: 'Nhiệm vụ 4: Ngữ pháp & Luyện tập',
      shortTitle: 'Ngữ pháp & Luyện tập',
      subtitle: 'Khám phá quy tắc mẫu câu và vận dụng qua bài tập thực hành',
      duration: '15 phút',
      stage: 'Luyện',
      outcome: 'Con sẽ làm chủ mẫu câu và tự tin đặt câu đúng cấu trúc ngữ pháp.',
      sectionIds: ['book-grammar-1', 'book-grammar-practice-1', 'grammar', 'language'],
    },
    {
      id: 'task-5',
      number: 5,
      icon: '🎧',
      title: 'Nhiệm vụ 5: Nghe & Giao tiếp',
      shortTitle: 'Nghe & Giao tiếp',
      subtitle: 'Luyện nghe bắt từ khóa và thực hành đóng vai giao tiếp với Milo',
      duration: '15 phút',
      stage: 'Luyện',
      outcome: 'Con sẽ nghe hiểu thông điệp và phản xạ giao tiếp tự nhiên.',
      sectionIds: ['book-listening', 'book-speaking-communication', 'listening', 'speaking'],
    },
    {
      id: 'task-6',
      number: 6,
      icon: '🧠',
      title: 'Nhiệm vụ 6: Kiến thức phần hai',
      shortTitle: 'Kiến thức phần hai',
      subtitle: 'Mở rộng từ vựng nâng cao, luyện đọc thêm và củng cố cấu trúc',
      duration: '15 phút',
      stage: 'Luyện',
      outcome: 'Con sẽ mở rộng vốn từ và thành thạo các mẫu câu nâng cao của Unit.',
      sectionIds: ['book-vocabulary-2', 'book-reading-2', 'book-grammar-2', 'book-grammar-practice-2', 'milo-grammar-levels'],
    },
    {
      id: 'task-7',
      number: 7,
      icon: '✍️',
      title: 'Nhiệm vụ 7: Viết, Value & CLIL',
      shortTitle: 'Viết, Value & CLIL',
      subtitle: 'Luyện viết câu, gắn kết bài học cuộc sống và khám phá các môn học',
      duration: '15 phút',
      stage: 'Luyện',
      outcome: 'Con sẽ viết được đoạn văn ngắn 4–6 câu và vận dụng kiến thức thực tế.',
      sectionIds: ['book-clil-content', 'book-writing', 'book-writing-skill', 'writing'],
    },
    {
      id: 'task-8',
      number: 8,
      icon: '🏆',
      title: 'Nhiệm vụ 8: Dự án & Unit Check',
      shortTitle: 'Dự án & Unit Check',
      subtitle: 'Hoàn thành sản phẩm cá nhân và kiểm tra tổng hợp kiến thức Unit',
      duration: '15 phút',
      stage: 'Kiểm tra',
      outcome: 'Con sẽ tạo được sản phẩm học tập và đạt kết quả kiểm tra Unit xuất sắc.',
      sectionIds: ['book-project', 'book-review-unit-check', 'project', 'test'],
    },
  ]);

  const SECTION_TO_TASK_INDEX = new Map();
  MAJOR_TASK_DEFINITIONS.forEach((task, taskIndex) => {
    task.sectionIds.forEach((secId) => {
      SECTION_TO_TASK_INDEX.set(secId, taskIndex);
    });
  });

  function getTaskForSection(sectionId) {
    const index = SECTION_TO_TASK_INDEX.get(sectionId);
    if (index !== undefined) return MAJOR_TASK_DEFINITIONS[index];
    // Default fallback to task 1 or task 8 if unknown
    if (sectionId === 'test' || sectionId === 'review') return MAJOR_TASK_DEFINITIONS[7];
    return MAJOR_TASK_DEFINITIONS[0];
  }

  function getMajorTasksForUnit(sectionsList, completedSections = []) {
    const doneSet = new Set(completedSections);
    return MAJOR_TASK_DEFINITIONS.map((def) => {
      const matchingSections = (sectionsList || []).filter((sec) => {
        const secId = typeof sec === 'string' ? sec : sec.id || sec[0];
        return def.sectionIds.includes(secId);
      });

      const sectionIds = matchingSections.map((sec) => (typeof sec === 'string' ? sec : sec.id || sec[0]));
      const completedCount = sectionIds.filter((id) => doneSet.has(id)).length;
      const totalCount = Math.max(1, sectionIds.length);

      let status = 'Chưa học';
      if (completedCount === totalCount && totalCount > 0) {
        status = 'Đã hoàn thành';
      } else if (completedCount > 0) {
        status = 'Đang học';
      }

      return {
        ...def,
        sections: matchingSections,
        totalSections: totalCount,
        completedSections: completedCount,
        percent: Math.round((completedCount / totalCount) * 100),
        status,
      };
    });
  }

  root.MILO_UNIT_TASK_MAPPER = {
    MAJOR_TASK_DEFINITIONS,
    getTaskForSection,
    getMajorTasksForUnit,
  };
})(typeof window !== 'undefined' ? window : globalThis);
