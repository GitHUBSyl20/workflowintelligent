// WebFont Loader
WebFont.load({
  google: {
    families: [
      "Lato:100,100italic,300,300italic,400,400italic,700,700italic,900,900italic",
    ],
  },
});

// Webflow Touch Detection
(function (o, c) {
  var n = c.documentElement,
    t = " w-mod-";
  n.className += t + "js";
  ("ontouchstart" in o || (o.DocumentTouch && c instanceof DocumentTouch)) &&
    (n.className += t + "touch");
})(window, document);

// Hide Webflow "Made in Webflow" badge if present
(function () {
  "use strict";
  function hideWebflowBadge() {
    const selectors = [
      ".w-webflow-badge",
      '[class*="webflow-badge"]',
      '[class*="made-in-webflow"]',
    ];
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((el) => {
        el.style.display = "none";
      });
    });
  }
  // Use MutationObserver to hide badge if it appears later
  const observer = new MutationObserver(hideWebflowBadge);
  observer.observe(document.body, { childList: true, subtree: true });
  // Initial call
  hideWebflowBadge();
})(); 