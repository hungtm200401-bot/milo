(function () {
  const ENDPOINT = "/api/tutor";
  window.MILO_AI_ENDPOINT = ENDPOINT;

  function petName() {
    return (
      document.querySelector("#petStatusName")?.textContent?.trim() ||
      document.querySelector("#lessonPetRewardName")?.textContent?.trim() ||
      "Milo"
    );
  }

  function setMode(mode, accessLevel = "") {
    if (!accessLevel) {
      try {
        accessLevel = JSON.parse(
          localStorage.getItem("milo-commerce-access-v1") || "null",
        )?.accessLevel;
      } catch {
        accessLevel = "";
      }
    }
    const onlineLabel = {
      plus: "● Milo đã sẵn sàng",
      "vip-pro-max-trial": "● Milo đã sẵn sàng · VIP PRO MAX",
      "vip-pro-max": "● Milo đã sẵn sàng · VIP PRO MAX",
    }[accessLevel];
    const labels = {
      checking: "● Milo đang kết nối…",
      online: onlineLabel || "● Milo đã sẵn sàng",
      offline: "● Milo chưa thể kết nối. Con hãy thử lại nhé",
      locked: "● Cần đăng nhập tài khoản",
    };
    document
      .querySelectorAll("#tutorMode, [data-assistant-mode]")
      .forEach((element) => {
        element.textContent = labels[mode] || labels.offline;
        element.dataset.mode = mode;
      });
  }

  function addSafetyNotice() {
    const intro = document.querySelector(".tutor-intro");
    if (intro && !document.querySelector(".assistant-safety")) {
      intro.insertAdjacentHTML(
        "afterend",
        `<div class="assistant-safety">
          <span aria-hidden="true">🛡️</span>
          <div>
            <b>Hỏi thoải mái, nhưng nhớ giữ an toàn</b>
            <small>Trợ lý AI có thể nhầm. Con không gửi họ tên đầy đủ, địa chỉ, số điện thoại, trường cụ thể, mật khẩu hoặc ảnh riêng tư. Việc quan trọng hãy kiểm tra cùng bố mẹ hoặc thầy cô.</small>
          </div>
        </div>`,
      );
    }
  }

  function upgradeChatInput() {
    const input = document.querySelector("#chatText");
    if (!input || input.tagName === "TEXTAREA") return;
    const textarea = document.createElement("textarea");
    Array.from(input.attributes).forEach((attribute) => {
      textarea.setAttribute(attribute.name, attribute.value);
    });
    textarea.rows = 2;
    textarea.maxLength = 1200;
    textarea.placeholder = `Hỏi ${petName()} về bài học hoặc kiến thức con muốn biết…`;
    input.replaceWith(textarea);
    textarea.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        textarea.form?.requestSubmit();
      }
    });
  }

  function upgradeLessonTutor() {
    const panel = document.querySelector("#lessonTutorPanel");
    if (!panel || panel.querySelector(".lesson-ai-capability")) return;
    panel.insertAdjacentHTML(
      "afterbegin",
      `<div class="lesson-ai-capability">
        <div><b>✨ ${petName()} · Gia sư AI ngay trong bài học</b><small>Hỏi bài, luyện nói và sửa lỗi ngay. Nâng cấp VIP PRO MAX để Milo ghi nhớ điểm yếu, cá nhân hóa cách dạy và theo sát tiến bộ của con.</small></div>
        <span class="tutor-mode" data-assistant-mode data-mode="checking">● Đang kiểm tra AI</span>
      </div>`,
    );
    panel.querySelector(".lesson-ai-capability")?.insertAdjacentHTML(
      "afterend",
      `<div class="lesson-live-controls">
        <div><b>💬 Gia sư hội thoại</b><small>Hỏi bài, luyện phản xạ và trò chuyện tự nhiên cùng Milo.</small></div>
        <select id="lessonAiLiveLanguage" aria-label="Ngôn ngữ nhận giọng nói"><option value="auto">Tự động Việt–Anh</option><option value="vi-VN">🇻🇳 Tiếng Việt</option><option value="en-US">🇬🇧 English</option></select>
        <button id="lessonAiLive" class="lesson-ai-mic-primary" type="button">🎤 Hỏi bằng micro</button>
        <button id="lessonAiLiveStop" class="hidden" type="button">⏹ Dừng nghe</button>
        <p id="lessonAiLiveStatus">🔊 AI sẽ tự trả lời bằng giọng nói sau khi nghe câu hỏi.</p>
      </div>`,
    );
    panel.insertAdjacentHTML(
      "beforeend",
      `<small class="lesson-ai-safety">🛡️ Không gửi họ tên đầy đủ, địa chỉ, số điện thoại, mật khẩu hoặc ảnh riêng tư. Trợ lý AI có thể nhầm; việc quan trọng hãy hỏi thêm người lớn.</small>`,
    );
    const input = document.querySelector("#lessonTutorInput");
    if (input) {
      input.maxLength = 1200;
      input.placeholder = `Hỏi ${petName()} bất cứ điều gì về bài này…`;
    }
  }

  function updateCopyForPet() {
    const name = petName();
    const chatInput = document.querySelector("#chatText");
    if (chatInput) {
      chatInput.placeholder = `Hỏi ${name} về bài học hoặc kiến thức con muốn biết…`;
    }
    const lessonInput = document.querySelector("#lessonTutorInput");
    if (lessonInput) {
      lessonInput.placeholder = `Hỏi ${name} bất cứ điều gì về bài này…`;
    }
    const lessonTitle = document.querySelector(".lesson-ai-capability b");
    if (lessonTitle) lessonTitle.textContent = `✨ ${name} · Gia sư AI ngay trong bài học`;
    const opening = document.querySelector("[data-tutor-opening='true']");
    if (opening) {
      opening.textContent = `${name} là trợ lý ảo của con. Con hãy hỏi bất cứ điều gì đang làm con khó; mình sẽ trả lời đúng câu hỏi và hướng dẫn từng bước.`;
    }
  }

  async function checkConnection() {
    if (!navigator.onLine) {
      setMode("offline");
      return;
    }
    setMode("checking");
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(ENDPOINT, {
        headers: {
          Accept: "application/json",
          ...(localStorage.getItem("milo-commerce-token-v1")
            ? {
                Authorization: `Bearer ${localStorage.getItem("milo-commerce-token-v1")}`,
              }
            : {}),
        },
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timer);
      const result = response.ok ? await response.json() : null;
      setMode(
        result?.configured
            ? "online"
            : "offline",
        result?.accessLevel,
      );
    } catch {
      setMode("offline");
    }
  }

  function start() {
    addSafetyNotice();
    upgradeChatInput();
    upgradeLessonTutor();
    updateCopyForPet();
    document.querySelector("#messages")?.setAttribute("aria-live", "polite");

    window.addEventListener("milo:tutor-mode", (event) => {
      setMode(
        ["online", "offline", "locked"].includes(event.detail?.mode)
          ? event.detail.mode
          : "offline",
        event.detail?.accessLevel,
      );
    });
    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", () => setMode("offline"));

    const petStatus = document.querySelector("#petStatusName");
    if (petStatus) {
      new MutationObserver(updateCopyForPet).observe(petStatus, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
    const lessonPet = document.querySelector("#lessonPetRewardName");
    if (lessonPet) {
      new MutationObserver(updateCopyForPet).observe(lessonPet, {
        childList: true,
        characterData: true,
        subtree: true,
      });
    }
    checkConnection();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
