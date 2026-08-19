(function () {
  const MIN_TEXT_SIZE = 14;
  let lastPetName = "";
  let readabilityFrame = 0;

  function selectedPetName() {
    return (
      document.querySelector("#petStatusName")?.textContent?.trim() ||
      document.querySelector("#lessonPetRewardName")?.textContent?.trim() ||
      "Milo"
    );
  }

  function childName() {
    try {
      const profile = JSON.parse(
        localStorage.getItem("milo-child-profile-v1") || "null",
      );
      return profile?.name?.trim() || "con";
    } catch {
      return "con";
    }
  }

  function petGreeting(name) {
    return `${name} là trợ lý ảo của ${childName()}. Con hãy hỏi bất cứ điều gì đang làm con khó; mình sẽ trả lời đúng câu hỏi và hướng dẫn từng bước.`;
  }

  function replaceOpeningMessage(name) {
    const messages = document.querySelector("#messages");
    if (!messages) return;
    messages.innerHTML = "";
    const bubble = document.createElement("div");
    bubble.className = "bubble pet-reply";
    bubble.dataset.tutorOpening = "true";
    bubble.textContent = petGreeting(name);
    messages.appendChild(bubble);
  }

  function syncPetIdentity(force) {
    const name = selectedPetName();
    const changed = name !== lastPetName;
    if (!changed && !force) return;
    lastPetName = name;

    const chatTitle = document.querySelector("#view-chat .section-top h2");
    const askLabel = document.querySelector('label[for="askText"]');
    const askInput = document.querySelector("#askText");
    const chatInput = document.querySelector("#chatText");
    const speechLabel = document.querySelector("#petSpeechLabel");
    const micSmall = document.querySelector("#micSmall");
    const micLarge = document.querySelector("#micLarge");
    const greetingPrompt = document.querySelector(".prompts .prompt");

    if (chatTitle) chatTitle.textContent = `Trò chuyện cùng ${name}`;
    if (askLabel)
      askLabel.textContent = `Hỏi ${name} bằng tiếng Việt hoặc tiếng Anh`;
    if (askInput)
      askInput.placeholder = `Ví dụ: ${name} ơi, con chưa hiểu câu này`;
    if (chatInput)
      chatInput.placeholder = `Hỏi ${name} bằng tiếng Việt hoặc tiếng Anh…`;
    if (speechLabel) speechLabel.textContent = `${name.toUpperCase()} SAYS`;
    if (micSmall) {
      micSmall.title = `Nói với ${name}`;
      micSmall.setAttribute("aria-label", `Nói với ${name}`);
    }
    if (micLarge) {
      micLarge.title = `Nói với ${name}`;
      micLarge.setAttribute("aria-label", `Nói với ${name}`);
    }
    if (greetingPrompt) greetingPrompt.textContent = `Hello, ${name}!`;

    replaceOpeningMessage(name);
  }

  function isTextLeaf(element) {
    if (!(element instanceof HTMLElement)) return false;
    if (
      element.matches(
        "script, style, noscript, svg, canvas, img, video, audio, progress, meter",
      )
    )
      return false;
    if (!element.textContent?.trim()) return false;
    return !Array.from(element.children).some((child) =>
      child.textContent?.trim(),
    );
  }

  function upgradeText(root) {
    const scope =
      root instanceof HTMLElement || root instanceof Document ? root : document;
    const candidates = scope.querySelectorAll(
      ".header *, .nav *, .main *, .milo.card *, .lesson-page *",
    );

    candidates.forEach((element) => {
      if (!isTextLeaf(element)) return;
      const style = getComputedStyle(element);
      const size = Number.parseFloat(style.fontSize);
      if (Number.isFinite(size) && size < MIN_TEXT_SIZE) {
        element.classList.add("readable-upgrade");
      }
    });

    requestAnimationFrame(() => {
      candidates.forEach((element) => {
        if (!isTextLeaf(element) || element.closest(".hidden")) return;
        const clippedWidth = element.scrollWidth > element.clientWidth + 2;
        const clippedHeight = element.scrollHeight > element.clientHeight + 2;
        if (clippedWidth || clippedHeight) {
          element.classList.add("text-unclipped");
        }
      });
    });
  }

  function scheduleReadability(root) {
    if (readabilityFrame) return;
    readabilityFrame = requestAnimationFrame(() => {
      readabilityFrame = 0;
      upgradeText(root);
    });
  }

  function watchPetName() {
    const status = document.querySelector("#petStatusName");
    if (!status) return;
    new MutationObserver(() => {
      syncPetIdentity(false);
      scheduleReadability(document);
    }).observe(status, {
      childList: true,
      characterData: true,
      subtree: true,
    });
  }

  function start() {
    syncPetIdentity(true);
    watchPetName();
    upgradeText(document);

    new MutationObserver((mutations) => {
      if (
        mutations.some(
          (mutation) =>
            mutation.type === "attributes" || mutation.addedNodes.length,
        )
      ) {
        scheduleReadability(document);
      }
    }).observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    document.fonts?.ready?.then(() => scheduleReadability(document));
    document.addEventListener("click", () => {
      setTimeout(() => scheduleReadability(document), 0);
    });
    window.addEventListener("resize", () => scheduleReadability(document), {
      passive: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
