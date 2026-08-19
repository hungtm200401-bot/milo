// Previous release caches: milo-v60-23-book-exercises-voice → milo-v60-24-simple-child-chat.
const CACHE_NAME = "milo-v60-25-ai-corner-toggle";
const CORE_FILES = [
  "./",
  "./index.html",
  "./lesson.html",
  "./milo-tokens-v60-12.css?v=60.12.0",
  "./student-ui-sync-v60-16.css?v=60.25.0-learning-focus",
  "./student-ui-single-v60-17.css?v=60.12.0-g2full2",
  "./app-v37.js?v=60.24.0",
  "./ai-language-v60-14.js?v=60.14.0",
  "./ai-feedback-v60-14.js?v=60.14.0",
  "./ai-feedback-v60-14.css?v=60.14.0",
  "./ai-conversation-polish-v60-14.css?v=60.14.0",
  "./pronunciation-vip-v60-15.css?v=60.15.0",
  "./cute-voice-v60-16.css?v=60.16.0",
  "./pronunciation-lexicon-v60-16.js?v=60.16.0",
  "./cute-voice-v60-16.js?v=60.16.0",
  "./source-sections-v60-17.js?v=60.18.0",
  "./source-exact-transcriptions.js",
  "./source-sections-v60-17.css?v=60.25.1-source-exact",
  "./pronunciation-coach.js?v=60.21.0",
  "./milo-student-app.svg",
  "./manifest.webmanifest",
  "./lesson-studio-v60-18.css?v=60.18.0",
  "./micro-lesson-v60-19.css?v=60.24.0",
  "./learning-session.css?v=60.25.5-ai-corner-toggle",
  "./learning-session-flow.js?v=60.25.5-ai-corner-toggle",
  "./learning-review.js?v=60.25.0",
  "./quick-learn-v60-1.js?v=60.25.0",
  "./study-pro-v60-13.js?v=60.25.0",
  "./grade2-sourcebook.js?v=60.25.1-source-exact",
  "./grade3-sourcebook.js?v=60.25.1-source-exact",
  "./lesson.js?v=60.25.5-ai-corner-toggle",
  "./lesson-v37.js?v=60.25.5-ai-corner-toggle",
  "./micro-lesson-v60-19.js?v=60.25.5-ai-corner-toggle",
  "./ai-journey-v60-13-14.js?v=60.25.5-ai-corner-toggle",
  "./unit-progression-v60-20.js?v=60.21.0",
  "./unit-progression-v60-20.css?v=60.20.0",
  "./voice-reply-v60-21.js?v=60.21.0",
  "./interaction-performance-v60-22.js?v=60.22.0",
  "./interaction-performance-v60-22.css?v=60.22.0",
  "./book-exercises-v60-23.js?v=60.23.0",
  "./vocab-repeat-v60-23.js?v=60.23.0",
  "./vocab-repeat-v60-23.css?v=60.23.0",
  "./voice-reply-v60-21.css?v=60.21.0",
  "./chat-ui-v60-21.css?v=60.21.0",
  "./student-chat-v60-24.css?v=60.24.0",
  "./student-assistant-status-v60-24.js?v=60.24.0",
  "./source-review-v60-18.html",
  "./source-review-v60-18.css?v=60.25.0-source-exact",
  "./source-review-v60-18.js?v=60.25.0-source-exact",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(CORE_FILES.map((file) => cache.add(file)));
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (
    requestUrl.origin === self.location.origin &&
    requestUrl.pathname.startsWith("/api/")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Navigation must prefer the network so a published lesson/UI update is
  // visible immediately. The cached shell is only the offline fallback.
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request, { cache: "no-store" })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) =>
          cached || caches.match("./index.html")
        ))
    );
    return;
  }

  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((response) => {
        if (response.ok && new URL(event.request.url).origin === self.location.origin) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) =>
        cached || caches.match("./index.html")
      ))
  );
});
