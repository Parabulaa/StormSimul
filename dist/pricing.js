// StormSight pricing page: Premium plan toggle and header shadow on scroll.
(function () {
  'use strict';

  var card = document.getElementById('premiumCard');
  if (card) {
    var buttons = card.querySelectorAll('[data-plan]');
    var variants = card.querySelectorAll('[data-variant]');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var plan = btn.getAttribute('data-plan');
        buttons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
        variants.forEach(function (v) { v.hidden = v.getAttribute('data-variant') !== plan; });
      });
    });
  }

  var header = document.getElementById('prHeader');
  if (header) {
    var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
