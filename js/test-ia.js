/**
 * Test IA express : 8 questions -> niveau de solution (1 a 8).
 * Tout se passe dans le navigateur : aucune donnee envoyee ni stockee.
 * Partage : ?r=<8 valeurs separees par des points> rouvre le resultat.
 * Teaser accueil : ?start=f.<valeur> reprend a la question 2.
 */
(function () {
  'use strict';

  // ---------- Logique de reference (portee a l'identique) ----------
  const QUESTIONS=[
   {k:'f',t:'Fréquence',h:'À quel rythme ce travail revient-il ?',o:[
    ['once','Une fois','projet ou étude ponctuelle'],['week','Chaque semaine',''],['day','Chaque jour',''],['cont','En continu','flux permanent']]},
   {k:'v',t:'Variabilité',h:'Les étapes sont-elles toujours les mêmes ?',o:[
    ['fixed','Toujours identiques',''],['some','Quelques variantes connues',''],['var','Chaque cas est différent','le chemin est à trouver']]},
   {k:'j',t:'Jugement',h:'Faut-il comprendre ou décider en cours de route ?',o:[
    ['none','Non, on applique des règles','copier, transférer, notifier'],['read','Lire, trier, rédiger','comprendre un mail, classer'],['decide','Interpréter et arbitrer','choisir une approche, prioriser']]},
   {k:'d',t:'Données',h:'Où se trouvent les informations utiles ?',o:[
    ['docs','Dans des documents','procédures, offres, contrats'],['scattered','Dans plusieurs outils','mail, tableurs, CRM…'],['suite','Dans un écosystème unique','suite bureautique, ERP, CRM central'],['custom','Il faut une application dédiée','produit, données sensibles']]},
   {k:'a',t:'Actions',h:"L'IA propose ou elle agit ?",o:[
    ['assist','Elle aide la personne','conseille, rédige, analyse'],['validate','Elle prépare, un humain valide',''],['act','Elle agit seule','envoie, modifie, crée']]},
   {k:'c',t:'Criticité',h:"Si l'IA se trompe, que se passe-t-il ?",o:[
    ['low','Sans conséquence',''],['mid','Gênant, rattrapable',''],['high','Coûteux','client, argent, conformité']]},
   {k:'p',t:'Autonomie dans le temps',h:"L'IA doit-elle travailler sans qu'on la sollicite ?",o:[
    ['ask','Seulement quand on lui demande',''],['event','Elle se déclenche sur un événement','nouveau mail, formulaire, date'],['cont','Elle poursuit un objectif en continu','surveille, relance, ajuste']]},
   {k:'t',t:'Volume et ROI',h:'Temps humain passé sur ce processus par semaine',o:[
    ['xs','Moins d’1 h',''],['s','1 à 5 h',''],['m','5 à 20 h',''],['l','Plus de 20 h','']]}
  ];
  const NQ=QUESTIONS.length;
  const RATE=40; // €/h chargé, hypothèse affichée
  const LEVELS=[
   null,
   {name:'Assistant conversationnel',short:'Chat',au:'faible',delay:'Moins d’1 jour',soft:'0 à 100 €/utilisateur/mois',cx:1,ex:'La personne pose ses questions, relit et décide.'},
   {name:'Assistant métier',short:'Assistant métier',au:'faible',delay:'1 à 3 jours',soft:'20 à 100 €/mois + licences',cx:2,ex:"Un assistant qui connaît vos offres, procédures et documents."},
   {name:'Agent de travail',short:'Agent de travail',au:'moyenne',delay:'Quelques heures à quelques jours',soft:'Abonnement + consommation',cx:2,ex:"On confie une mission complète, l'IA livre le résultat."},
   {name:'Automatisation',short:'Automatisation',au:'faible',delay:'1 à 7 jours',soft:'≈ 10 à 100 €/mois',cx:2,ex:"Déclencheur, règles, actions : le chemin est connu d'avance."},
   {name:'Workflow IA',short:'Workflow IA',au:'moyenne',delay:'3 à 10 jours',soft:'Automatisation + API IA à l’usage',cx:3,ex:"L'IA lit et décide là où c'est utile, l'automatisation contrôle le reste."},
   {name:'Agent persistant',short:'Agent persistant',au:'forte',delay:'1 à 10 jours selon intégrations',soft:'≈ 20 à 100 €/mois et plus',cx:3,ex:'Un agent qui suit un objectif dans la durée, avec ses outils et sa mémoire.'},
   {name:"Agent natif de l'écosystème",short:'Agent natif',au:'moyenne à forte',delay:'1 à 4 semaines',soft:'Licences + consommation',cx:4,ex:"L'agent fourni par l'éditeur, branché sur vos données et droits existants."},
   {name:'Système IA sur mesure',short:'Sur mesure',au:'très forte, contrôlée',delay:'2 à 8 semaines et plus',soft:'API + hébergement',cx:5,ex:'Application dédiée : outils, base de connaissances, garde-fous, journaux.'}
  ];
  const HOURS={xs:.5,s:3,m:12,l:25};

  function decide(s){
    const r=[];let L;
    if(s.f==='once'){
      if(s.v==='var'||s.j==='decide'||s.a!=='assist'){L=3;r.push('Besoin ponctuel mais lourd : on confie une mission complète, pas un processus.');}
      else{L=1;r.push('Besoin ponctuel où la personne garde la main : un assistant conversationnel suffit.');}
    }else if(s.d==='custom'){L=8;r.push('Il faut une application dédiée : seul le sur-mesure donne le contrôle sur les données, l’interface et les garde-fous.');}
    else if(s.j==='none'&&s.v!=='var'){L=4;r.push("Travail répétitif sans jugement : une automatisation classique est plus fiable et moins chère qu'un agent.");}
    else if(s.d==='suite'){L=7;r.push("Données, droits et actions sont déjà dans un même écosystème : on regarde d'abord l'agent fourni par l'éditeur.");}
    else if(s.a==='assist'&&s.p==='ask'){
      if(s.v==='var'){L=3;r.push("On connaît l'objectif mais pas le chemin, et la personne garde la main : agent de travail à la demande.");}
      else{L=2;r.push("Il faut comprendre et rédiger, mais la personne décide : un assistant nourri des données de l'entreprise.");}
    }else if(s.v==='var'&&(s.p==='cont'||s.a==='act')){L=6;r.push('Objectif permanent, chemin variable, actions dans les outils : profil agent persistant.');}
    else{L=5;r.push("Processus récurrent avec une part de lecture ou de décision : l'IA réfléchit là où c'est utile, l'automatisation encadre le reste.");}
    if(s.d==='docs'&&s.f!=='once'&&L!==8)r.push('Les réponses sont dans vos documents : la solution doit s’appuyer sur une base de connaissances (RAG).');
    if(s.f!=='once'&&s.t==='l'&&(L>=4&&L<=6))r.push('Volume élevé : au-delà de 20 h par semaine, une solution sur mesure peut devenir rentable.');
    return {L,r};
  }
  function risk(s,L){
    const p={assist:0,validate:1,act:2}[s.a]+{low:0,mid:1,high:2}[s.c]+{ask:0,event:0,cont:1}[s.p]+(L>=6?1:0);
    return p<=1?['low','Faible']:p<=3?['mid','Modéré']:['high','Élevé'];
  }
  function watch(s,L){
    const w=[];
    if(s.a==='act'&&s.c==='high')w.push('Action autonome sur un processus coûteux en cas d’erreur : validation humaine avant toute action irréversible.');
    if(L===6&&s.c!=='low')w.push('Option plus sûre pour démarrer : un workflow IA avec validation, puis élargir l’autonomie.');
    if(L>=6||s.p==='cont')w.push('Donner à l’IA le minimum de permissions et journaliser chaque action.');
    if(s.d==='scattered'&&L>=4&&L!==8)w.push('Données dispersées : vérifier leur qualité avant d’automatiser, sinon on automatise le désordre.');
    if(s.f!=='once'&&s.t==='xs'&&L>=5)w.push('Moins d’1 h par semaine : le gain risque de ne pas couvrir la mise en place. Commencer plus simple.');
    if(!w.length)w.push('Commencer petit : un périmètre, un indicateur de temps gagné, puis étendre.');
    return w;
  }

  // Expose pour les tests en console (lecture seule).
  window.TestIA = { QUESTIONS: QUESTIONS, LEVELS: LEVELS, decide: decide, risk: risk, watch: watch };

  // ---------- Interface ----------
  const WEEKS = 47; // semaines travaillées par an (hypothèse)
  const app = document.getElementById('tia-app');
  if (!app) return;
  const live = document.getElementById('tia-live');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // step : -1 = intro, 0..7 = question, 8 = resultat
  let state = { step: -1, answers: {}, process: '' };

  function esc(str) {
    return String(str).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nf(n) { return Math.round(n).toLocaleString('fr-FR'); }
  function optionOf(q, v) { return q.o.find(function (o) { return o[0] === v; }); }
  function isComplete(a) { return QUESTIONS.every(function (q) { return a[q.k]; }); }
  function announce(msg) { if (live) { live.textContent = ''; setTimeout(function () { live.textContent = msg; }, 30); } }

  function encode(a) { return QUESTIONS.map(function (q) { return a[q.k]; }).join('.'); }
  function decode(str) {
    const parts = String(str || '').split('.');
    if (parts.length !== NQ) return null;
    const a = {};
    for (let i = 0; i < NQ; i++) {
      if (!optionOf(QUESTIONS[i], parts[i])) return null;
      a[QUESTIONS[i].k] = parts[i];
    }
    return a;
  }

  function basePath() { return window.location.pathname; }
  function urlFor(step) {
    return step === NQ ? basePath() + '?r=' + encode(state.answers) : basePath();
  }
  function shareUrl() { return window.location.origin + basePath() + '?r=' + encode(state.answers); }

  function go(step, opts) {
    opts = opts || {};
    const doRender = function () {
      state.step = step;
      const url = urlFor(step);
      const hState = { tia: step, answers: state.answers, process: state.process };
      if (opts.replace) history.replaceState(hState, '', url);
      else history.pushState(hState, '', url);
      render(true);
    };
    if (reduceMotion || opts.instant) { doRender(); return; }
    app.classList.add('tia-leaving');
    setTimeout(function () { app.classList.remove('tia-leaving'); doRender(); }, 160);
  }

  function focusTarget() {
    const t = app.querySelector('[data-tia-focus]');
    if (t) t.focus({ preventScroll: true });
    const top = app.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) {
      app.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function render(moveFocus) {
    if (state.step < 0) renderIntro();
    else if (state.step < NQ) renderQuestion(state.step);
    else renderResult();
    if (moveFocus) focusTarget();
  }

  // ----- Intro -----
  function renderIntro() {
    app.innerHTML =
      '<form class="tia-intro" novalidate>' +
        '<h2 class="tia-q-title" tabindex="-1" data-tia-focus>Avant de commencer</h2>' +
        '<label for="tia-process" class="tia-label">Quel processus avez-vous en tête ? <span class="tia-optional">(facultatif)</span></label>' +
        '<input type="text" id="tia-process" class="tia-input" maxlength="120" autocomplete="off" placeholder="Ex. : relances des devis non signés" value="' + esc(state.process) + '">' +
        '<p class="tia-help">Il sert seulement à personnaliser votre résultat. Rien n’est envoyé ni enregistré.</p>' +
        '<button type="submit" class="button w-button tia-start">Commencer le test</button>' +
      '</form>';
    app.querySelector('form').addEventListener('submit', function (e) {
      e.preventDefault();
      state.process = app.querySelector('#tia-process').value.trim();
      go(0);
    });
    announce('Test IA express. Champ facultatif : quel processus avez-vous en tête ?');
  }

  // ----- Question -----
  function renderQuestion(i) {
    const q = QUESTIONS[i];
    const current = state.answers[q.k];
    const pct = Math.round(((i + 1) / NQ) * 100);
    let html =
      '<div class="tia-progress-row">' +
        '<button type="button" class="tia-back" data-tia-back><span aria-hidden="true">←</span> Retour</button>' +
        '<span class="tia-count">' + (i + 1) + ' / ' + NQ + '</span>' +
      '</div>' +
      '<div class="tia-progress" role="progressbar" aria-label="Progression du test" aria-valuemin="1" aria-valuemax="' + NQ + '" aria-valuenow="' + (i + 1) + '" aria-valuetext="Question ' + (i + 1) + ' sur ' + NQ + '">' +
        '<span style="width:' + pct + '%"></span>' +
      '</div>' +
      '<p class="tia-q-eyebrow">' + esc(q.t) + '</p>' +
      '<h2 class="tia-q-title" id="tia-q-title" tabindex="-1" data-tia-focus>' + esc(q.h) + '</h2>' +
      '<div class="tia-options tia-options-' + q.o.length + '" role="group" aria-labelledby="tia-q-title">';
    q.o.forEach(function (o) {
      const sel = current === o[0];
      html +=
        '<button type="button" class="tia-option' + (sel ? ' is-selected' : '') + '" data-v="' + o[0] + '" aria-pressed="' + sel + '">' +
          '<span class="tia-option-label">' + esc(o[1]) + '</span>' +
          (o[2] ? '<span class="tia-option-sub">' + esc(o[2]) + '</span>' : '') +
        '</button>';
    });
    html += '</div>';
    app.innerHTML = html;

    app.querySelector('[data-tia-back]').addEventListener('click', function () { history.back(); });
    const opts = Array.prototype.slice.call(app.querySelectorAll('.tia-option'));
    opts.forEach(function (btn, idx) {
      btn.addEventListener('click', function () {
        if (app.classList.contains('tia-leaving')) return;
        state.answers[q.k] = btn.getAttribute('data-v');
        opts.forEach(function (b) { b.classList.remove('is-selected'); b.setAttribute('aria-pressed', 'false'); });
        btn.classList.add('is-selected');
        btn.setAttribute('aria-pressed', 'true');
        go(i + 1 < NQ ? i + 1 : NQ);
      });
      btn.addEventListener('keydown', function (e) {
        let n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (idx + 1) % opts.length;
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (idx - 1 + opts.length) % opts.length;
        if (n !== null) { e.preventDefault(); opts[n].focus(); }
      });
    });
    announce('Question ' + (i + 1) + ' sur ' + NQ + ' : ' + q.h);
  }

  // ----- Resultat -----
  function scaleHtml(L) {
    let html = '<ol class="tia-scale" aria-label="Échelle des 8 niveaux de solutions IA">';
    for (let n = 1; n <= 8; n++) {
      const on = n === L;
      html += '<li class="tia-scale-step' + (on ? ' is-current' : '') + '"' + (on ? ' aria-current="true"' : '') + ' style="--tia-h:' + n + '">' +
        '<span class="tia-scale-bar" aria-hidden="true"></span>' +
        '<span class="tia-scale-num">' + n + '</span>' +
        '<span class="tia-scale-name">' + esc(LEVELS[n].short) + (on ? '<span class="tia-sr"> (votre niveau)</span>' : '') + '</span>' +
      '</li>';
    }
    return html + '</ol>';
  }

  function contactUrl(demande, res) {
    const lines = ['Résultat du test IA express : niveau ' + res.L + ' · ' + LEVELS[res.L].name + '.'];
    if (state.process) lines.push('Processus : ' + state.process);
    lines.push('Réponses : ' + QUESTIONS.map(function (q) {
      return q.t + ' : ' + optionOf(q, state.answers[q.k])[1];
    }).join(' ; ') + '.');
    const msg = lines.join('\n').slice(0, 1000);
    return '/contact-devis?demande=' + encodeURIComponent(demande) +
      '&source=test-ia&niveau=' + res.L + '&message=' + encodeURIComponent(msg) + '#contact-form';
  }

  function resultText(res, rk, w, hours) {
    const lv = LEVELS[res.L];
    const out = [
      'Test IA express · Workflow Intelligent',
      state.process ? 'Processus : ' + state.process : null,
      'Niveau ' + res.L + ' · ' + lv.name,
      lv.ex,
      'Mise en place : ' + lv.delay + ' · Complexité : ' + lv.cx + '/5 · Risque : ' + rk[1],
      'Coût logiciel (ordre de grandeur indicatif) : ' + lv.soft,
      hours ? 'Votre temps aujourd’hui : ≈ ' + nf(hours) + ' h/an, soit ≈ ' + nf(hours * RATE) + ' € à ' + RATE + ' €/h chargé (hypothèse)' : null,
      '',
      'Pourquoi ce niveau :'
    ].concat(res.r.map(function (x) { return '- ' + x; }), ['', 'Points de vigilance :'],
      w.map(function (x) { return '- ' + x; }),
      ['', 'Revoir le résultat : ' + shareUrl()]);
    return out.filter(function (x) { return x !== null; }).join('\n');
  }

  function renderResult() {
    const s = state.answers;
    const res = decide(s);
    const L = res.L;
    const lv = LEVELS[L];
    const rk = risk(s, L);
    const w = watch(s, L);
    const hours = s.f === 'once' ? 0 : HOURS[s.t] * WEEKS;

    let dots = '';
    for (let n = 1; n <= 5; n++) dots += '<span class="tia-dot' + (n <= lv.cx ? ' is-on' : '') + '"></span>';

    let convert;
    if (L <= 3) {
      convert =
        '<p>À ce niveau, la clé, c’est que votre équipe sache bien utiliser l’outil. Une formation courte suffit souvent à passer à la pratique.</p>' +
        '<div class="tia-convert-actions">' +
          '<a href="formations-ia.html" class="button w-button" data-cible="formation">Former mon équipe</a>' +
          '<a href="' + esc(contactUrl('Premier echange', res)) + '" class="button w-button tia-btn-outline" data-cible="contact">Parler de mon projet</a>' +
        '</div>';
    } else {
      convert =
        '<p class="tia-convert-lead">Le test vous dit quel type de solution. Le diagnostic vous dit laquelle, ce qu’elle rapporte et dans quel ordre.</p>' +
        '<div class="tia-convert-actions">' +
          '<a href="tarifs-prestations.html" class="button w-button" data-cible="diagnostic">Découvrir le diagnostic (690&nbsp;€&nbsp;HT)</a>' +
          '<a href="' + esc(contactUrl('Premier echange', res)) + '" class="button w-button tia-btn-outline" data-cible="contact">Échange gratuit de 30&nbsp;min</a>' +
        '</div>';
    }

    app.innerHTML =
      '<div class="tia-result">' +
        '<p class="tia-q-eyebrow">Votre résultat' + (state.process ? ' · ' + esc(state.process) : '') + '</p>' +
        scaleHtml(L) +
        '<h2 class="tia-result-title" tabindex="-1" data-tia-focus>Niveau ' + L + ' · ' + esc(lv.name) + '</h2>' +
        '<p class="tia-result-ex">' + esc(lv.ex) + '</p>' +

        '<dl class="tia-indicators">' +
          '<div class="tia-ind"><dt>Mise en place</dt><dd>' + esc(lv.delay) + '</dd></div>' +
          '<div class="tia-ind"><dt>Complexité</dt><dd><span class="tia-dots" role="img" aria-label="' + lv.cx + ' sur 5">' + dots + '</span></dd></div>' +
          '<div class="tia-ind"><dt>Risque</dt><dd><span class="tia-pill tia-pill-' + rk[0] + '">' + rk[1] + '</span></dd></div>' +
        '</dl>' +

        '<div class="tia-facts">' +
          '<div class="tia-fact"><h3>Coût logiciel</h3><p><strong>' + esc(lv.soft) + '</strong></p><p class="tia-note">Ordre de grandeur indicatif.</p></div>' +
          (hours ? '<div class="tia-fact"><h3>Votre temps aujourd’hui</h3><p><strong>≈ ' + nf(hours) + ' h/an</strong>, soit ≈ ' + nf(hours * RATE) + '&nbsp;€ à ' + RATE + '&nbsp;€/h chargé</p><p class="tia-note">Hypothèse : ' + String(HOURS[s.t]).replace('.', ',') + ' h/semaine sur ' + WEEKS + ' semaines.</p></div>' : '') +
        '</div>' +

        '<div class="tia-lists">' +
          '<div><h3>Pourquoi ce niveau</h3><ul class="tia-list">' + res.r.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
          '<div><h3>Points de vigilance</h3><ul class="tia-list tia-list-watch">' + w.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
        '</div>' +

        '<div class="tia-convert">' + convert + '</div>' +

        '<div class="tia-secondary">' +
          '<button type="button" class="tia-link-btn" data-tia-restart>Refaire le test</button>' +
          '<button type="button" class="tia-link-btn" data-tia-copy>Copier mon résultat</button>' +
          '<button type="button" class="tia-link-btn" data-tia-share>Copier le lien de mon résultat</button>' +
        '</div>' +
        '<p class="tia-copy-status" role="status" aria-live="polite"></p>' +
        '<div class="tia-copy-fallback" hidden><label for="tia-copy-area">Sélectionnez puis copiez le texte :</label><textarea id="tia-copy-area" rows="8" readonly></textarea></div>' +

        '<p class="tia-disclaimer">Résultat indicatif, établi à partir de 8 critères. Il ne remplace pas l’analyse de vos processus réels.</p>' +
      '</div>';

    app.querySelector('[data-tia-restart]').addEventListener('click', function () {
      state.answers = {};
      go(-1);
    });
    app.querySelector('[data-tia-copy]').addEventListener('click', function () {
      copy(resultText(res, rk, w, hours), 'Résultat copié.');
    });
    app.querySelector('[data-tia-share]').addEventListener('click', function () {
      copy(shareUrl(), 'Lien copié.');
    });
    announce('Résultat : niveau ' + L + ', ' + lv.name + '.');
  }

  function copy(text, okMsg) {
    const status = app.querySelector('.tia-copy-status');
    const fb = app.querySelector('.tia-copy-fallback');
    const fallback = function () {
      const ta = fb.querySelector('textarea');
      ta.value = text;
      fb.hidden = false;
      ta.focus();
      ta.select();
      status.textContent = 'Copie automatique impossible : le texte est sélectionné, utilisez Ctrl+C (ou ⌘+C).';
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(function () {
        fb.hidden = true;
        status.textContent = okMsg;
      }, fallback);
    } else {
      fallback();
    }
  }

  // ---------- Demarrage ----------
  window.addEventListener('popstate', function (e) {
    const st = e.state;
    if (st && typeof st.tia === 'number') {
      state.step = st.tia;
      // Un resultat est defini par son URL ; sur une question, on garde les reponses deja donnees.
      if (st.tia === NQ) state.answers = st.answers || {};
      else state.answers = Object.assign({}, st.answers, state.answers);
      if (typeof st.process === 'string') state.process = st.process;
    } else {
      init(true);
      return;
    }
    if (state.step === NQ && !isComplete(state.answers)) state.step = -1;
    render(true);
  });

  function init(fromPop) {
    const params = new URLSearchParams(window.location.search);
    const r = decode(params.get('r'));
    const start = params.get('start');
    if (r) {
      state.answers = r;
      state.step = NQ;
    } else if (start && /^f\./.test(start) && optionOf(QUESTIONS[0], start.slice(2))) {
      state.answers = { f: start.slice(2) };
      // Historique : intro -> Q1 -> Q2, pour que « Retour » remonte naturellement.
      history.replaceState({ tia: -1, answers: {}, process: '' }, '', basePath());
      history.pushState({ tia: 0, answers: state.answers, process: '' }, '', basePath());
      state.step = 1;
      history.pushState({ tia: 1, answers: state.answers, process: '' }, '', basePath());
      render(!fromPop);
      return;
    } else {
      state.step = -1;
    }
    history.replaceState({ tia: state.step, answers: state.answers, process: state.process }, '', state.step === NQ ? basePath() + '?r=' + encode(state.answers) : basePath());
    render(!!fromPop || state.step !== -1);
  }

  init(false);
})();
