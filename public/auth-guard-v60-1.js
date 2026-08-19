(function () {
  const TOKEN_KEY = "milo-commerce-token-v1";
  const PROFILE_KEY = "milo-child-profile-v1";
  const ACCESS_KEY = "milo-commerce-access-v1";
  const LOCK_KEY = "milo-commerce-grade-lock-v1";
  const isLesson = /(?:^|\/)lesson\.html$/i.test(location.pathname);
  if (!isLesson) return;

  const redirectToLogin = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(LOCK_KEY);
    const back = `${location.pathname.split('/').pop() || 'lesson.html'}${location.search}${location.hash}`;
    location.replace(`index.html?auth=required&return=${encodeURIComponent(back)}`);
  };

  const token = localStorage.getItem(TOKEN_KEY) || "";
  if (!token) {
    redirectToLogin();
    return;
  }

  document.documentElement.classList.add("milo-auth-checking");
  const style = document.createElement("style");
  style.textContent = "html.milo-auth-checking body{visibility:hidden!important}";
  document.head.appendChild(style);

  fetch("/api/account", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    cache: "no-store",
  })
    .then((response) => {
      if (!response.ok) throw new Error("AUTH_REQUIRED");
      return response.json();
    })
    .then(() => document.documentElement.classList.remove("milo-auth-checking"))
    .catch(redirectToLogin);
})();
