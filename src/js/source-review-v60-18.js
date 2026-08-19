(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const data = window.MILO_SOURCE_SECTIONS_V60_17;
  const exactRegistry = window.MILO_SOURCE_EXACT_TRANSCRIPTIONS;
  let password = sessionStorage.getItem("milo-admin-password-v1") || "";
  let requestedUnit = null;
  let requestedSection = "";

  const esc = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    })[char]);

  const exactEntry = (section) => exactRegistry?.entries?.find((entry) =>
    entry.grade === section?.grade && entry.unit === section?.unit && entry.sectionId === section?.id
  ) || null;

  const withExact = (section) => {
    const record = exactEntry(section);
    if (!record) return section;
    return {
      ...section,
      verificationStatus: record.coverage === "complete_visible_section" ? "verified_from_image" : section.verificationStatus,
      content: { ...(section.content || {}), ...(record.content || {}) },
      exactVerification: record,
    };
  };

  const isExact = (section) =>
    section.contentOrigin === "book_source" && section.verificationStatus === "verified_from_image";

  const isPending = (section) =>
    section.contentOrigin === "book_source" && !isExact(section);

  async function validate() {
    const response = await fetch("/api/admin/purchases", {
      headers: { "X-Milo-Admin": password },
    });
    if (!response.ok) throw new Error("Mật khẩu không đúng hoặc máy chủ chưa chạy.");
    return true;
  }

  function units() {
    return data.grades[$("#reviewGrade").value].units;
  }

  function currentUnit() {
    return units()[Number($("#reviewUnit").value) || 0];
  }

  function allSections() {
    return currentUnit().sections.map(withExact);
  }

  function filteredSections() {
    const filter = $("#reviewStatus")?.value || "all";
    const sections = allSections();
    if (filter === "pending") return sections.filter(isPending);
    if (filter === "exact") return sections.filter(isExact);
    if (filter === "ocr") return sections.filter((section) => section.verificationStatus === "ocr_extracted_needs_review");
    if (filter === "needs_review") return sections.filter((section) => section.verificationStatus === "needs_review");
    return sections;
  }

  function gradeStats() {
    const sections = units().flatMap((unit) => unit.sections.map(withExact));
    const book = sections.filter((section) => section.contentOrigin === "book_source");
    return {
      units: units().length,
      book: book.length,
      exact: book.filter(isExact).length,
      pending: book.filter(isPending).length,
      ocr: book.filter((section) => section.verificationStatus === "ocr_extracted_needs_review").length,
    };
  }

  function cleanCandidate(section) {
    const content = section.content || {};
    const entries = [];
    for (const [key, value] of Object.entries(content)) {
      if (key === "sourceText") continue;
      if (typeof value === "string" && value.trim()) {
        entries.push(`<p><b>${esc(key)}:</b> ${esc(value)}</p>`);
      } else if (Array.isArray(value) && value.length) {
        entries.push(`<p><b>${esc(key)}:</b> ${esc(value.map((item) =>
          typeof item === "string" ? item : JSON.stringify(item)
        ).join(" · "))}</p>`);
      }
    }
    return entries.join("") || "<p>Chưa có nội dung làm sạch.</p>";
  }

  function exactNotice(section) {
    if (section.exactVerification?.coverage === "visible_text_only") {
      return `<div class="exact-notice warn"><b>Đã đối chiếu phần chữ nhìn thấy.</b><span>Audio/video không có trong ảnh vẫn bị khóa; hệ thống không suy đoán lời thoại.</span></div>`;
    }
    if (isExact(section)) {
      return `<div class="exact-notice ok"><b>Đã đủ chuẩn đưa vào app học.</b><span>Nội dung được đọc trực tiếp từ ảnh và có hồ sơ trang nguồn đi kèm.</span></div>`;
    }
    return `<div class="exact-notice warn"><b>Chưa được coi là đúng từng chữ.</b><span>Phải nhìn ảnh nguồn, chép lại nội dung sạch, rồi mới mở cho học sinh.</span></div>`;
  }

  function exactTranscription(section) {
    const transcription = section.exactVerification?.content?.exactTranscription;
    if (!transcription) return "";
    return `<section class="cleaned exact-reviewed">
      <h3>Nguyên văn đã đọc trực tiếp · ${esc(transcription.title)}</h3>
      ${(transcription.blocks || []).map((block) => `<article><h4>${esc(block.heading || "")}</h4>${(block.lines || []).map((line) => `<p>${esc(line)}</p>`).join("")}</article>`).join("")}
    </section>`;
  }

  function render() {
    const unit = currentUnit();
    const sections = filteredSections();
    const section = sections[Number($("#reviewSection").value) || 0];
    const stats = gradeStats();

    $("#reviewSummary").innerHTML = `
      <b>Lớp ${esc($("#reviewGrade").value)} · ${stats.units} Unit</b>
      <span>Section sách: ${stats.book}</span>
      <span>Đã exact: ${stats.exact}</span>
      <span>Cần đối chiếu: ${stats.pending}</span>
      <span>OCR cần duyệt: ${stats.ocr}</span>
    `;

    if (!section) {
      $("#reviewContent").innerHTML = `
        <section class="empty-review">
          <h2>Không có section trong bộ lọc này</h2>
          <p>Đổi bộ lọc để xem dữ liệu Unit ${esc(unit.unit)}.</p>
        </section>
      `;
      return;
    }

    const content = section.content || {};
    const images = section.sourceAsset || [];
    const imageNames = section.sourceImage || [];
    const reviewUrl = `source-review-v60-18.html?grade=${section.grade}&unit=${section.unit}&section=${encodeURIComponent(section.id)}&filter=pending`;

    $("#reviewContent").innerHTML = `
      <span class="status status-${esc(section.verificationStatus)}">${esc(section.verificationStatus)}</span>
      <h2>${esc(section.title)}</h2>
      ${exactNotice(section)}
      <div class="meta">
        <div><small>ZIP</small><b>${esc((section.sourceZip || []).join(" · "))}</b></div>
        <div><small>ẢNH</small><b>${esc(imageNames.join(" · "))}</b></div>
        <div><small>TRANG</small><b>${esc(section.sourcePage || "")}</b></div>
      </div>
      <section class="review-ticket">
        <h3>Phiếu đối chiếu chính xác</h3>
        <p><b>Việc cần làm:</b> phóng to ảnh, chép lại đúng chữ sách, bỏ nhiễu OCR/giao diện web, không tự diễn giải.</p>
        <p><b>Đường mở nhanh:</b> <code>${esc(reviewUrl)}</code></p>
      </section>
      <section class="images">${images.slice(0, 8).map((asset, index) => `
        <figure>
          <a href="${esc(asset)}" target="_blank" rel="noopener"><img src="${esc(asset)}" alt="${esc(imageNames[index] || "Ảnh nguồn")}"></a>
          <figcaption>${esc(imageNames[index] || asset)}</figcaption>
        </figure>
      `).join("")}</section>
      <section class="cleaned">
        <h3>Nội dung cấu trúc/làm sạch hiện có</h3>
        ${cleanCandidate(section)}
      </section>
      ${exactTranscription(section)}
      <section class="ocr">
        <h3>OCR thô · chỉ khu quản trị</h3>
        ${content.sourceText ? `<pre>${esc(content.sourceText)}</pre>` : '<p class="warning">Không có OCR thô trong section này.</p>'}
      </section>
    `;
  }

  function fillSections() {
    const sections = filteredSections();
    const requestedIndex = requestedSection
      ? sections.findIndex((section) => section.id === requestedSection)
      : -1;
    $("#reviewSection").innerHTML = sections.map((section, index) => {
      const marker = isExact(section) ? "✓" : "!";
      return `<option value="${index}">${marker} ${esc(section.sectionType)} · ${esc(section.title)}</option>`;
    }).join("");
    $("#reviewSection").value = String(Math.max(0, requestedIndex));
    requestedSection = "";
    render();
  }

  function fillUnits() {
    const allUnits = units();
    $("#reviewUnit").innerHTML = allUnits.map((unit, index) =>
      `<option value="${index}">Unit ${unit.unit}: ${esc(unit.title)}</option>`
    ).join("");
    if (requestedUnit) {
      const index = allUnits.findIndex((unit) => unit.unit === requestedUnit);
      if (index >= 0) $("#reviewUnit").value = String(index);
      requestedUnit = null;
    }
    fillSections();
  }

  async function login(event) {
    event?.preventDefault();
    password = $("#reviewPassword").value || password;
    try {
      await validate();
      sessionStorage.setItem("milo-admin-password-v1", password);
      $("#reviewAuth").classList.add("hidden");
      $("#reviewApp").classList.remove("hidden");
      fillUnits();
    } catch (error) {
      $("#reviewAuthStatus").textContent = error.message;
    }
  }

  $("#reviewLogin").addEventListener("submit", login);
  $("#reviewGrade").addEventListener("change", fillUnits);
  $("#reviewUnit").addEventListener("change", fillSections);
  $("#reviewSection").addEventListener("change", render);
  $("#reviewStatus")?.addEventListener("change", fillSections);

  const query = new URLSearchParams(location.search);
  if (query.get("grade")) $("#reviewGrade").value = query.get("grade");
  if (query.get("filter") && $("#reviewStatus")) $("#reviewStatus").value = query.get("filter");
  requestedUnit = Number(query.get("unit")) || null;
  requestedSection = query.get("section") || "";

  if (password) {
    $("#reviewPassword").value = password;
    login();
  }
})();
