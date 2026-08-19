(function () {
  const data = window.MILO_GRADE2_SOURCEBOOK_DATA;
  if (!data || !Array.isArray(data.pages)) return;

  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);

  const categoryLabel = {
    'unit': 'Trang nội dung Unit',
    'front-matter': 'Bìa, mục lục và phần đầu sách',
    'supplement-unit-7-8': 'Ảnh bổ sung/trùng Unit 7–8',
    'end-matter': 'Trang cuối và phần phụ',
    'unclassified': 'Ảnh nguồn khác'
  };

  const state = {
    unitIndex: 0,
    filter: 'unit',
    query: '',
    openId: '',
    openList: [],
    zoom: 1,
    mode: 'focus'
  };

  function unitNumber() {
    return state.unitIndex + 1;
  }

  function unitMeta() {
    return data.units[String(unitNumber())] || data.units[unitNumber()] || {};
  }

  function pageSearchText(page) {
    const unitNames = (page.unitCandidates || [])
      .map((number) => {
        const meta = data.units[String(number)] || data.units[number] || {};
        return `unit ${number} ${meta.title || ''} ${meta.bigQuestion || ''}`;
      })
      .join(' ');
    return `${page.id} ${page.originalName} ${page.sourceZip} ${page.category} ${categoryLabel[page.category] || ''} ${unitNames}`.toLowerCase();
  }

  function pagesForFilter() {
    let pages = data.pages;
    if (state.filter === 'unit') {
      const number = unitNumber();
      pages = pages.filter((page) => (page.unitCandidates || []).includes(number) && page.category !== 'front-matter');
    } else if (state.filter === 'shared') {
      pages = pages.filter((page) => page.category !== 'unit');
    }
    const query = state.query.trim().toLowerCase();
    if (query) pages = pages.filter((page) => pageSearchText(page).includes(query));
    return pages;
  }

  function readSet() {
    try {
      return new Set(JSON.parse(localStorage.getItem('milo-grade2-source-read') || '[]'));
    } catch {
      return new Set();
    }
  }

  function saveReadSet(set) {
    localStorage.setItem('milo-grade2-source-read', JSON.stringify([...set]));
  }

  function summaryHtml() {
    const meta = unitMeta();
    const unitPages = data.pages.filter((page) => (page.unitCandidates || []).includes(unitNumber()) && page.category !== 'front-matter');
    const read = readSet();
    return `
      <section class="sourcebook-hero">
        <div class="sourcebook-hero-copy">
          <span class="sourcebook-label">NGUỒN LỚP 2 ĐẦY ĐỦ · ${esc(data.version)}</span>
          <h2>Toàn bộ 181/181 ảnh từ hai ZIP đã nằm trong app</h2>
          <p>Đủ 181 trang nguồn được giữ trong app dưới dạng WebP chất lượng cao để giảm dung lượng. Không loại ảnh trùng, ảnh mờ, trang phụ hoặc ảnh giao diện.</p>
          <div class="sourcebook-unit-focus">
            <b>Unit ${unitNumber()} · ${esc(meta.title || '')}</b>
            <span>${esc(meta.bigQuestion || '')}</span>
            <small>Trang in ${esc(meta.printedPages || '')} · ${unitPages.length} ảnh liên quan</small>
          </div>
        </div>
        <div class="sourcebook-stats">
          <article><b>${data.sourceCount}</b><span>trang nguồn đầy đủ</span></article>
          <article><b>${data.bookCounts.book1}</b><span>ZIP 1</span></article>
          <article><b>${data.bookCounts.book2}</b><span>ZIP 2</span></article>
          <article><b>${data.allPagesIncluded ? '181/181' : 'Cần kiểm tra'}</b><span>trang đã tích hợp</span></article>
        </div>
      </section>
      <section class="sourcebook-proof">
        <span>🛡️</span>
        <div><b>Quy tắc chống thiếu nội dung</b><p>${esc(data.canonicalRule)} Mọi trang đều có mã nguồn, tên tệp và đường dẫn riêng để kiểm kê; ${data.allPagesIncluded ? '181/181 trang đã được tích hợp.' : 'có trang cần kiểm tra lại.'}</p></div>
      </section>`;
  }

  function toolbarHtml() {
    return `
      <section class="sourcebook-toolbar">
        <div class="sourcebook-tabs" role="tablist">
          <button type="button" data-source-filter="unit" class="${state.filter === 'unit' ? 'active' : ''}">Unit ${unitNumber()}</button>
          <button type="button" data-source-filter="all" class="${state.filter === 'all' ? 'active' : ''}">Tất cả 181 ảnh</button>
          <button type="button" data-source-filter="shared" class="${state.filter === 'shared' ? 'active' : ''}">Trang chung/phụ</button>
        </div>
        <label class="sourcebook-search"><span>🔎</span><input id="sourcebookSearch" value="${esc(state.query)}" placeholder="Tìm Unit, tên ảnh hoặc ZIP…"></label>
      </section>`;
  }

  function cardsHtml(pages) {
    const read = readSet();
    if (!pages.length) {
      return `<div class="sourcebook-empty"><span>🔎</span><b>Không tìm thấy ảnh phù hợp</b><p>Hãy xóa từ khóa hoặc chọn “Tất cả 181 ảnh”.</p></div>`;
    }
    return `<section class="sourcebook-grid">${pages.map((page, index) => {
      const unitText = page.unit ? `Unit ${page.unit}` : (page.unitCandidates || []).length ? `Liên quan Unit ${(page.unitCandidates || []).join(', ')}` : 'Tài liệu chung';
      return `<article class="sourcebook-card ${read.has(page.id) ? 'read' : ''}">
        <button type="button" class="sourcebook-thumb" data-source-open="${esc(page.id)}" aria-label="Mở ${esc(page.originalName)}">
          <img src="${esc(page.thumb)}" loading="lazy" alt="Ảnh nguồn ${esc(page.originalName)}">
          <span>${index + 1}</span>
          ${read.has(page.id) ? '<em>✓ Đã xem</em>' : ''}
        </button>
        <div class="sourcebook-card-copy">
          <small>${esc(page.sourceZip)}</small>
          <b>${esc(page.originalName)}</b>
          <p>${esc(unitText)} · ${esc(categoryLabel[page.category] || page.category)}</p>
          <button type="button" data-source-open="${esc(page.id)}">Mở và phóng to</button>
        </div>
      </article>`;
    }).join('')}</section>`;
  }

  function modalHtml() {
    return `
      <div class="sourcebook-modal hidden" id="sourcebookModal" role="dialog" aria-modal="true" aria-label="Trình xem ảnh nguồn">
        <div class="sourcebook-modal-shell">
          <header>
            <div><small id="sourcebookModalSource"></small><b id="sourcebookModalTitle"></b><span id="sourcebookModalMeta"></span></div>
            <button type="button" id="sourcebookClose" aria-label="Đóng">✕</button>
          </header>
          <div class="sourcebook-viewer" id="sourcebookViewer">
            <button type="button" class="sourcebook-nav prev" id="sourcebookPrev" aria-label="Ảnh trước">‹</button>
            <div class="sourcebook-image-stage" id="sourcebookImageStage"><img id="sourcebookImage" alt="Ảnh nguồn lớp 2"></div>
            <button type="button" class="sourcebook-nav next" id="sourcebookNext" aria-label="Ảnh tiếp">›</button>
          </div>
          <footer>
            <div class="sourcebook-mode-buttons">
              <button type="button" id="sourcebookFocusMode" class="active">Ảnh tối ưu</button>
              <button type="button" id="sourcebookOriginalMode">Ảnh đầy đủ</button>
            </div>
            <div class="sourcebook-zoom-buttons">
              <button type="button" id="sourcebookZoomOut">−</button>
              <b id="sourcebookZoomLabel">100%</b>
              <button type="button" id="sourcebookZoomIn">+</button>
              <button type="button" id="sourcebookZoomReset">Vừa khung</button>
              <button type="button" id="sourcebookFullscreen">Toàn màn hình</button>
            </div>
            <label class="sourcebook-read-check"><input type="checkbox" id="sourcebookReadCheck"><span>Đánh dấu đã xem ảnh này</span></label>
          </footer>
        </div>
      </div>`;
  }

  function render(options = {}) {
    state.unitIndex = Number(options.unitIndex || 0);
    state.filter = 'unit';
    state.query = '';
    return `
      <div class="grade2-sourcebook" id="grade2Sourcebook">
        ${summaryHtml()}
        ${toolbarHtml()}
        <div id="sourcebookResults">${cardsHtml(pagesForFilter())}</div>
        ${modalHtml()}
      </div>
      ${typeof options.footer === 'function' ? options.footer() : ''}`;
  }

  function currentPage() {
    return data.pages.find((page) => page.id === state.openId) || null;
  }

  function setZoom(value) {
    state.zoom = Math.max(0.5, Math.min(3, value));
    const image = document.querySelector('#sourcebookImage');
    const label = document.querySelector('#sourcebookZoomLabel');
    if (image) image.style.transform = `scale(${state.zoom})`;
    if (label) label.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function updateModal() {
    const page = currentPage();
    if (!page) return;
    const image = document.querySelector('#sourcebookImage');
    image.src = state.mode === 'original' ? page.original : page.focus;
    image.alt = `Ảnh nguồn ${page.originalName}`;
    document.querySelector('#sourcebookModalSource').textContent = page.sourceZip;
    document.querySelector('#sourcebookModalTitle').textContent = page.originalName;
    document.querySelector('#sourcebookModalMeta').textContent = `${page.id} · ${page.unit ? `Unit ${page.unit}` : categoryLabel[page.category] || page.category}`;
    const read = readSet();
    document.querySelector('#sourcebookReadCheck').checked = read.has(page.id);
    document.querySelector('#sourcebookFocusMode').classList.toggle('active', state.mode === 'focus');
    document.querySelector('#sourcebookOriginalMode').classList.toggle('active', state.mode === 'original');
    const index = state.openList.findIndex((item) => item.id === page.id);
    document.querySelector('#sourcebookPrev').disabled = index <= 0;
    document.querySelector('#sourcebookNext').disabled = index < 0 || index >= state.openList.length - 1;
    setZoom(state.zoom);
  }

  function openPage(id, list = pagesForFilter()) {
    state.openList = list;
    state.openId = id;
    state.zoom = 1;
    state.mode = 'focus';
    const modal = document.querySelector('#sourcebookModal');
    modal.classList.remove('hidden');
    document.body.classList.add('sourcebook-open');
    updateModal();
  }

  function openAsset(asset) {
    const page = data.pages.find((item) => item.original === asset || item.focus === asset);
    if (!page) return false;
    const visiblePages = pagesForFilter();
    openPage(page.id, visiblePages.some((item) => item.id === page.id) ? visiblePages : data.pages);
    return true;
  }

  function closeModal() {
    document.querySelector('#sourcebookModal')?.classList.add('hidden');
    document.body.classList.remove('sourcebook-open');
  }

  function move(delta) {
    const index = state.openList.findIndex((page) => page.id === state.openId);
    const next = state.openList[index + delta];
    if (!next) return;
    state.openId = next.id;
    state.zoom = 1;
    updateModal();
  }

  function rerenderResults() {
    const results = document.querySelector('#sourcebookResults');
    if (results) results.innerHTML = cardsHtml(pagesForFilter());
    document.querySelectorAll('[data-source-open]').forEach((button) => {
      button.addEventListener('click', () => openPage(button.dataset.sourceOpen));
    });
  }

  function bind(options = {}) {
    state.unitIndex = Number(options.unitIndex || 0);
    document.querySelectorAll('[data-source-filter]').forEach((button) => {
      button.addEventListener('click', () => {
        state.filter = button.dataset.sourceFilter;
        rerenderResults();
      });
    });
    document.querySelector('#sourcebookSearch')?.addEventListener('input', (event) => {
      state.query = event.target.value;
      rerenderResults();
    });
    rerenderResults();

    document.querySelector('#sourcebookClose')?.addEventListener('click', closeModal);
    document.querySelector('#sourcebookModal')?.addEventListener('click', (event) => {
      if (event.target.id === 'sourcebookModal') closeModal();
    });
    document.querySelector('#sourcebookPrev')?.addEventListener('click', () => move(-1));
    document.querySelector('#sourcebookNext')?.addEventListener('click', () => move(1));
    document.querySelector('#sourcebookFocusMode')?.addEventListener('click', () => { state.mode = 'focus'; setZoom(1); updateModal(); });
    document.querySelector('#sourcebookOriginalMode')?.addEventListener('click', () => { state.mode = 'original'; setZoom(1); updateModal(); });
    document.querySelector('#sourcebookZoomOut')?.addEventListener('click', () => setZoom(state.zoom - 0.25));
    document.querySelector('#sourcebookZoomIn')?.addEventListener('click', () => setZoom(state.zoom + 0.25));
    document.querySelector('#sourcebookZoomReset')?.addEventListener('click', () => setZoom(1));
    document.querySelector('#sourcebookFullscreen')?.addEventListener('click', () => {
      const stage = document.querySelector('#sourcebookViewer');
      if (!document.fullscreenElement) stage?.requestFullscreen?.();
      else document.exitFullscreen?.();
    });
    document.querySelector('#sourcebookReadCheck')?.addEventListener('change', (event) => {
      const page = currentPage();
      if (!page) return;
      const read = readSet();
      if (event.target.checked) read.add(page.id); else read.delete(page.id);
      saveReadSet(read);
      rerenderResults();
      if (typeof options.setMilo === 'function') {
        options.setMilo(event.target.checked ? 'Đã lưu ảnh nguồn này vào tiến độ học.' : 'Đã bỏ đánh dấu ảnh nguồn này.');
      }
    });
    if (!window.__miloGrade2SourcebookKeysBound) {
      window.__miloGrade2SourcebookKeysBound = true;
      document.addEventListener('keydown', (event) => {
        const modal = document.querySelector('#sourcebookModal');
        if (!modal || modal.classList.contains('hidden')) return;
        if (event.key === 'Escape') closeModal();
        if (event.key === 'ArrowLeft') move(-1);
        if (event.key === 'ArrowRight') move(1);
        if (event.key === '+') setZoom(state.zoom + 0.25);
        if (event.key === '-') setZoom(state.zoom - 0.25);
      });
    }
  }

  window.MILO_GRADE2_SOURCEBOOK = { render, bind, openAsset, data };
})();
