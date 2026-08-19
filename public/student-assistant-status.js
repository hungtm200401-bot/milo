// Student Assistant Status Module (Responsibility-based wrapper)
(function () {
  "use strict";

  function getStatusModule() {
    return window.MILO_STUDENT_ASSISTANT_STATUS_V60_24 || null;
  }

  function refresh() {
    const mod = getStatusModule();
    if (mod && typeof mod.refresh === "function") {
      return mod.refresh();
    }
  }

  function isActiveVip(data) {
    const mod = getStatusModule();
    if (mod && typeof mod.isActiveVip === "function") {
      return mod.isActiveVip(data);
    }
    return Boolean(data?.accessLevel === "vip-pro-max" || data?.accessLevel === "vip-pro-max-trial");
  }

  window.StudentAssistantStatus = {
    refresh,
    isActiveVip,
    getStatusModule,
  };
})();
