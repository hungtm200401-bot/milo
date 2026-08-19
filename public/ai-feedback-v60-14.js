(function () {
  "use strict";

  const escapeHtml = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[char]);

  const statusMeta = {
    correct: { icon: "✓", label: "Đúng và đủ", tone: "correct" },
    partly_correct: { icon: "△", label: "Đúng một phần", tone: "partial" },
    incorrect: { icon: "×", label: "Cần sửa lại", tone: "incorrect" },
    unclear: { icon: "?", label: "Chưa nghe/hiểu rõ", tone: "unclear" },
    not_an_answer: { icon: "↩", label: "Chưa trả lời câu hỏi", tone: "unclear" },
  };

  function safeEvaluation(response) {
    const value = response?.evaluation;
    if (!value || value.status === "not_applicable") return null;
    return {
      ...value,
      score: Number.isFinite(Number(value.score)) ? Math.max(0, Math.min(100, Math.round(Number(value.score)))) : 0,
    };
  }

  function cardHtml(response, compact = false) {
    const evaluation = safeEvaluation(response);
    const nextQuestion = String(response?.next?.question || "").trim();
    if (!evaluation && !nextQuestion) return "";
    const meta = evaluation ? statusMeta[evaluation.status] || statusMeta.unclear : null;
    const details = evaluation ? `
      <div class="milo-eval-head">
        <span class="milo-eval-score" style="--score:${evaluation.score}"><b>${evaluation.score}</b><small>/100</small></span>
        <div><small>KẾT QUẢ LƯỢT VỪA RỒI</small><h4>${meta.icon} ${meta.label}</h4>${evaluation.strength ? `<p>${escapeHtml(evaluation.strength)}</p>` : ""}</div>
      </div>
      <div class="milo-eval-grid">
        ${evaluation.childAnswer ? `<article><small>CÂU CỦA CON</small><p>${escapeHtml(evaluation.childAnswer)}</p></article>` : ""}
        ${evaluation.betterAnswer ? `<article class="better"><small>CÂU ĐÚNG / TỰ NHIÊN HƠN</small><p>${escapeHtml(evaluation.betterAnswer)}</p></article>` : ""}
      </div>
      ${evaluation.reason ? `<p class="milo-eval-reason"><b>Milo sửa đúng chỗ:</b> ${escapeHtml(evaluation.reason)}</p>` : ""}
    ` : "";
    const retryPrompt = String(evaluation?.retryPrompt || nextQuestion || "").trim();
    return `<section class="milo-evaluation-card ${meta?.tone || "next"} ${compact ? "compact" : ""}" data-milo-evaluation>
      ${details}
      ${nextQuestion ? `<div class="milo-next-turn"><small>CON THỬ LƯỢT TIẾP</small><b>${escapeHtml(nextQuestion)}</b></div>` : ""}
      <footer>
        ${evaluation?.betterAnswer ? `<button type="button" data-ai-speak="${escapeHtml(evaluation.betterAnswer)}">🔊 Nghe câu đúng</button>` : ""}
        ${retryPrompt ? `<button class="primary" type="button" data-ai-retry="${escapeHtml(retryPrompt)}">🎤 Nói / trả lời lại</button>` : ""}
      </footer>
    </section>`;
  }

  function bind(card, options = {}) {
    if (!card) return;
    card.querySelectorAll("[data-ai-speak]").forEach((button) => {
      button.onclick = () => window.MILO_PET_VOICE?.speak?.([
        { lang: "en-US", text: button.dataset.aiSpeak },
      ], 0.72);
    });
    card.querySelectorAll("[data-ai-retry]").forEach((button) => {
      button.onclick = () => {
        const prompt = button.dataset.aiRetry || "";
        if (typeof options.onRetry === "function") options.onRetry(prompt);
        else window.dispatchEvent(new CustomEvent("milo:ai-retry-request", { detail: { prompt } }));
      };
    });
  }

  function renderAfter(anchor, response, options = {}) {
    if (!anchor) return null;
    anchor.parentElement?.querySelectorAll(`[data-evaluation-for="${anchor.dataset.evalId || ""}"]`).forEach((node) => node.remove());
    const html = cardHtml(response, Boolean(options.compact));
    if (!html) return null;
    const id = anchor.dataset.evalId || `eval-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    anchor.dataset.evalId = id;
    const wrapper = document.createElement("div");
    wrapper.dataset.evaluationFor = id;
    wrapper.innerHTML = html;
    const card = wrapper.firstElementChild;
    anchor.insertAdjacentElement("afterend", card);
    bind(card, options);
    return card;
  }

  function renderInside(container, response, options = {}) {
    if (!container) return null;
    const html = cardHtml(response, Boolean(options.compact));
    if (!html) return null;
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    const card = wrapper.firstElementChild;
    container.appendChild(card);
    bind(card, options);
    return card;
  }

  window.MILO_AI_FEEDBACK = { renderAfter, renderInside, safeEvaluation };
})();
