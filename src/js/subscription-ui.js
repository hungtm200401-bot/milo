// Subscription UI Client (Responsibility-based module for VIP Paywall UI)
(function () {
  "use strict";

  function openPlans(options) {
    if (window.SubscriptionUI && typeof window.SubscriptionUI.openPlans === "function" && window.SubscriptionUI.openPlans !== openPlans) {
      window.SubscriptionUI.openPlans(options);
      return true;
    }
    if (window.MILO_COMMERCE && typeof window.MILO_COMMERCE.openVipPlans === "function") {
      window.MILO_COMMERCE.openVipPlans(options);
      return true;
    }
    if (window.MILO_COMMERCE && typeof window.MILO_COMMERCE.openAiPlans === "function") {
      window.MILO_COMMERCE.openAiPlans(options);
      return true;
    }
    const modal = document.querySelector("#premiumPaymentModal");
    if (modal) {
      modal.classList.remove("hidden");
      return true;
    }
    return false;
  }

  window.MiloSubscriptionUI = {
    openPlans,
    isAvailable: () => Boolean(window.SubscriptionUI || window.MILO_COMMERCE || document.querySelector("#premiumPaymentModal")),
  };
})();
