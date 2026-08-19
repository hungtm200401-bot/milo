// Pricing & Subscription Utils (Responsibility-based shared module)
(function () {
  "use strict";

  const STARTER_PRICE = 299000;
  const PLUS_PRICE = 649000;
  const PREMIUM_PRICE = 1199000;

  function formatMoney(amount) {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  }

  function calculateMonthlyPrice(price, durationMonths) {
    const months = Number(durationMonths) || 1;
    return Math.round(Number(price || 0) / months);
  }

  function calculatePlanSavings(price, durationMonths) {
    const months = Number(durationMonths) || 1;
    const baseCost = STARTER_PRICE * months;
    return Math.max(0, baseCost - Number(price || 0));
  }

  const PLAN_SUMMARY = Object.freeze({
    starter: { price: STARTER_PRICE, durationMonths: 1, monthly: STARTER_PRICE, savings: 0 },
    plus: { price: PLUS_PRICE, durationMonths: 3, monthly: calculateMonthlyPrice(PLUS_PRICE, 3), savings: calculatePlanSavings(PLUS_PRICE, 3) },
    premium: { price: PREMIUM_PRICE, durationMonths: 6, monthly: calculateMonthlyPrice(PREMIUM_PRICE, 6), savings: calculatePlanSavings(PREMIUM_PRICE, 6) },
  });

  window.MiloPricingUtils = {
    formatMoney,
    calculateMonthlyPrice,
    calculatePlanSavings,
    PLAN_SUMMARY,
  };
})();
