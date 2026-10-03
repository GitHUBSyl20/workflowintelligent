// Exemples de fonctionnement (accueil, section #exemples).
// Onglets accessibles (flèches, Début, Fin) et lecture animée des étapes :
// une seule lecture quand la section devient visible, aucun changement
// d'onglet automatique, bouton Pause / Reprendre / Rejouer. La lecture se
// suspend hors écran et quand l'onglet du navigateur est masqué.
// prefers-reduced-motion : toutes les étapes affichées d'emblée, sans mouvement.
// Sans ce script, le HTML affiche les 4 scénarios complets l'un sous l'autre.
(function () {
  'use strict';

  var STEP_DELAY = 650;   // ms entre deux étapes
  var FIRST_DELAY = 250;  // ms avant la première étape

  function init(root) {
    var tablist = root.querySelector('.wfd-tabs');
    var tabs = Array.prototype.slice.call(root.querySelectorAll('.wfd-tab'));
    var panels = tabs.map(function (tab) {
      return document.getElementById(tab.getAttribute('aria-controls'));
    });
    var control = root.querySelector('.wfd-control');
    var controlLabel = root.querySelector('.wfd-control-label');
    if (!tablist || !tabs.length || panels.indexOf(null) !== -1 || !control) return null;

    var motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
    var reduce = !!(motionQuery && motionQuery.matches);
    var current = -1;
    var steps = [];
    var shown = 0;          // nombre d'étapes allumées
    var mode = 'idle';      // idle | playing | paused | done
    var timer = null;
    var inView = false;
    var seen = false;       // la section a déjà été vue : lecture déjà lancée une fois
    var observer = null;

    function canRun() {
      return inView && !document.hidden;
    }

    function clearTimer() {
      if (timer) { clearTimeout(timer); timer = null; }
    }

    function setControl(action, label) {
      if (!action) { control.hidden = true; return; }
      control.hidden = false;
      control.setAttribute('data-action', action);
      controlLabel.textContent = label;
    }

    function showAll() {
      steps.forEach(function (s) { s.classList.add('is-on'); });
      shown = steps.length;
    }

    function finish() {
      clearTimer();
      showAll();
      mode = 'done';
      setControl(reduce ? null : 'replay', 'Rejouer');
    }

    function tick() {
      timer = null;
      if (mode !== 'playing') return;
      steps[shown].classList.add('is-on');
      shown += 1;
      if (shown >= steps.length) { finish(); return; }
      schedule();
    }

    function schedule() {
      if (mode !== 'playing' || timer || !canRun()) return;
      timer = setTimeout(tick, shown === 0 ? FIRST_DELAY : STEP_DELAY);
    }

    function play() {
      clearTimer();
      if (reduce) { finish(); return; }
      steps.forEach(function (s) { s.classList.remove('is-on'); });
      shown = 0;
      mode = 'playing';
      setControl('pause', 'Pause');
      schedule();
    }

    function select(index, focus) {
      if (index === current) return;
      current = index;
      tabs.forEach(function (tab, i) {
        var on = i === index;
        tab.setAttribute('aria-selected', on ? 'true' : 'false');
        tab.tabIndex = on ? 0 : -1;
        panels[i].classList.toggle('is-active', on);
      });
      if (focus) tabs[index].focus();
      steps = Array.prototype.slice.call(panels[index].querySelectorAll('.wfd-step'));
      if (reduce) { finish(); return; }
      if (seen) { play(); return; }
      // Avant la première apparition : étapes en attente, lecture au premier affichage.
      clearTimer();
      steps.forEach(function (s) { s.classList.remove('is-on'); });
      shown = 0;
      mode = 'idle';
      setControl(null);
    }

    function onTabClick(e) {
      seen = true;
      select(tabs.indexOf(e.currentTarget), false);
    }

    function onTabKey(e) {
      var i = tabs.indexOf(e.currentTarget);
      var next = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === 'Home') next = 0;
      else if (e.key === 'End') next = tabs.length - 1;
      if (next === null) return;
      e.preventDefault();
      seen = true;
      select(next, true);
    }

    function onControl() {
      var action = control.getAttribute('data-action');
      if (action === 'pause') {
        clearTimer();
        mode = 'paused';
        setControl('resume', 'Reprendre');
      } else if (action === 'resume') {
        mode = 'playing';
        setControl('pause', 'Pause');
        schedule();
      } else {
        play();
      }
    }

    function onVisibility() {
      if (canRun()) schedule(); else clearTimer();
    }

    function onMotionChange(e) {
      reduce = e.matches;
      root.classList.toggle('is-anim', !reduce);
      if (reduce) finish();
      else if (mode === 'done') setControl('replay', 'Rejouer');
    }

    function onIntersect(entries) {
      entries.forEach(function (entry) {
        inView = entry.isIntersecting;
        if (inView && !seen && entry.intersectionRatio >= 0.35) {
          seen = true;
          play();
        } else {
          onVisibility();
        }
      });
    }

    // Mise en place
    var initial = tabs.map(function (t) { return t.getAttribute('aria-selected'); }).indexOf('true');
    root.classList.add('is-ready');
    root.classList.toggle('is-anim', !reduce);
    tablist.hidden = false;
    panels.forEach(function (p) { p.tabIndex = 0; });
    select(initial === -1 ? 0 : initial, false);

    tabs.forEach(function (tab) {
      tab.addEventListener('click', onTabClick);
      tab.addEventListener('keydown', onTabKey);
    });
    control.addEventListener('click', onControl);
    document.addEventListener('visibilitychange', onVisibility);
    if (motionQuery) {
      if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
      else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);
    }

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(onIntersect, { threshold: [0, 0.35] });
      observer.observe(root.querySelector('.wfd-panels'));
    } else {
      inView = true;
      seen = true;
      finish();
    }

    // Nettoyage (temporisateur, observateur, écouteurs)
    return function destroy() {
      clearTimer();
      if (observer) observer.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      if (motionQuery) {
        if (motionQuery.removeEventListener) motionQuery.removeEventListener('change', onMotionChange);
        else if (motionQuery.removeListener) motionQuery.removeListener(onMotionChange);
      }
    };
  }

  function start() {
    var destroyers = [];
    Array.prototype.forEach.call(document.querySelectorAll('[data-wfd]'), function (root) {
      var d = init(root);
      if (d) destroyers.push(d);
    });
    window.addEventListener('pagehide', function (e) {
      if (!e.persisted) destroyers.forEach(function (d) { d(); });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
