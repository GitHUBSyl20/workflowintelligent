/* =====================================================================
   JimBot : widget de discussion (JavaScript natif, sans framework).
   * Ouverture uniquement sur action du visiteur.
   * Aucun HTML venant du serveur ou du modèle n'est interprété :
     tout passe par textContent (mise en forme minimale reconstruite).
   * La session est un cookie HttpOnly posé par le serveur : ce script ne
     manipule aucun identifiant de conversation.
   ===================================================================== */
(function () {
  'use strict';

  var CFG = window.JIMBOT_CONFIG;
  if (!CFG || !CFG.enabled || window.__jimbotLoaded) return;
  window.__jimbotLoaded = true;
  var L = CFG.labels;

  // ---------------------------------------------------------------
  // Outils
  // ---------------------------------------------------------------
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'text') node.textContent = v;
        else if (k === 'className') node.className = v;
        else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), v);
        else node.setAttribute(k, v === true ? '' : String(v));
      });
    }
    (children || []).forEach(function (c) {
      if (c) node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function svg(path) {
    var ns = 'http://www.w3.org/2000/svg';
    var s = document.createElementNS(ns, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('fill', 'none');
    s.setAttribute('stroke', 'currentColor');
    s.setAttribute('stroke-width', '2');
    s.setAttribute('stroke-linecap', 'round');
    s.setAttribute('stroke-linejoin', 'round');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    var p = document.createElementNS(ns, 'path');
    p.setAttribute('d', path);
    s.appendChild(p);
    return s;
  }
  var ICON_CHAT = 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z';
  var ICON_CLOSE = 'M6 6l12 12M18 6L6 18';
  var ICON_NEW = 'M12 5v14M5 12h14';

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    var b = new Uint8Array(16);
    window.crypto.getRandomValues(b);
    return Array.prototype.map.call(b, function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
  }

  // Texte inline : seul **gras** est reconnu, le reste reste du texte brut.
  function inline(text, parent) {
    var parts = String(text).split(/\*\*([^*\n]+)\*\*/g);
    parts.forEach(function (part, i) {
      if (!part) return;
      parent.appendChild(i % 2 ? el('strong', { text: part }) : document.createTextNode(part));
    });
  }

  // Paragraphes et listes simples, construits élément par élément.
  function richText(text) {
    var frag = document.createDocumentFragment();
    String(text).replace(/\r/g, '').split(/\n{2,}/).forEach(function (block) {
      var lines = block.split('\n').filter(function (l) { return l.trim() !== ''; });
      if (!lines.length) return;
      var bullet = /^\s*[-•*]\s+/;
      var ordered = /^\s*\d+[.)]\s+/;
      if (lines.every(function (l) { return bullet.test(l); }) || lines.every(function (l) { return ordered.test(l); })) {
        var isOl = ordered.test(lines[0]);
        var list = el(isOl ? 'ol' : 'ul');
        lines.forEach(function (l) {
          var li = el('li');
          inline(l.replace(isOl ? ordered : bullet, ''), li);
          list.appendChild(li);
        });
        frag.appendChild(list);
      } else {
        var p = el('p');
        lines.forEach(function (l, i) {
          if (i) p.appendChild(el('br'));
          inline(l, p);
        });
        frag.appendChild(p);
      }
    });
    return frag;
  }

  function request(url, options) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, CFG.requestTimeoutMs);
    var opts = Object.assign({ credentials: 'same-origin', headers: {}, signal: controller.signal }, options || {});
    if (opts.body) opts.headers['Content-Type'] = 'application/json';
    return fetch(url, opts)
      .then(function (res) {
        return res.text().then(function (t) {
          var data = {};
          try { data = t ? JSON.parse(t) : {}; } catch (e) { data = {}; }
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .catch(function (err) {
        return { ok: false, status: 0, data: {}, kind: err && err.name === 'AbortError' ? 'timeout' : 'network' };
      })
      .finally(function () { clearTimeout(timer); });
  }

  function errorText(r) {
    if (r.kind === 'timeout') return L.errors.timeout;
    if (r.kind === 'network') return L.errors.network;
    return (r.data && typeof r.data.message === 'string' && r.data.message) || L.errors.generic;
  }

  // ---------------------------------------------------------------
  // Construction de l'interface
  // ---------------------------------------------------------------
  var state = { open: false, loaded: false, sending: false, contactKey: null, contactSending: false, returnFocus: null };

  var root = el('div', { className: 'jimbot', id: 'jimbot' });
  var launcher = el('button', { type: 'button', className: 'jb-launcher', 'aria-expanded': 'false', 'aria-controls': 'jimbot-panel', 'aria-label': L.launcher }, [svg(ICON_CHAT)]);

  var log = el('div', { className: 'jb-log', role: 'log', 'aria-live': 'polite', 'aria-relevant': 'additions', tabindex: '0', 'aria-label': L.title });
  var input = el('textarea', {
    id: 'jimbot-input', className: 'jb-input', rows: '1', maxlength: String(CFG.maxMessageChars),
    placeholder: L.inputPlaceholder, 'aria-describedby': 'jimbot-counter', autocomplete: 'off',
  });
  var sendBtn = el('button', { type: 'submit', className: 'jb-send', text: L.send });
  var counter = el('span', { id: 'jimbot-counter', 'aria-live': 'off', text: L.counter(0, CFG.maxMessageChars) });
  var composer = el('form', { className: 'jb-composer', novalidate: true }, [
    el('label', { className: 'jb-sr-only', for: 'jimbot-input', text: L.inputLabel }), input, sendBtn,
  ]);
  var contactBtn = el('button', { type: 'button', className: 'jb-link-btn', text: L.contactButton });
  var foot = el('div', { className: 'jb-foot' }, [contactBtn, counter]);
  var contactSection = el('section', { className: 'jb-contact', hidden: true, 'aria-labelledby': 'jimbot-contact-title' });

  var closeBtn = el('button', { type: 'button', className: 'jb-icon-btn', 'aria-label': L.close, title: L.close }, [svg(ICON_CLOSE)]);
  var newBtn = el('button', { type: 'button', className: 'jb-icon-btn', 'aria-label': L.newConversation, title: L.newConversation }, [svg(ICON_NEW)]);

  var panel = el('section', { id: 'jimbot-panel', className: 'jb-panel', role: 'dialog', 'aria-labelledby': 'jimbot-title', 'aria-describedby': 'jimbot-notice', hidden: true }, [
    el('header', { className: 'jb-head' }, [
      el('div', null, [
        el('h2', { id: 'jimbot-title', className: 'jb-title', text: L.title }),
        el('p', { className: 'jb-subtitle', text: L.subtitle }),
      ]),
      el('div', { className: 'jb-head-actions' }, [newBtn, closeBtn]),
    ]),
    el('p', { id: 'jimbot-notice', className: 'jb-notice' }, [
      L.notice + ' ',
      el('a', { href: CFG.privacyUrl, text: L.noticeLink }),
    ]),
    log,
    contactSection,
    composer,
    foot,
  ]);

  root.appendChild(launcher);
  root.appendChild(panel);

  // ---------------------------------------------------------------
  // Messages
  // ---------------------------------------------------------------
  function scrollToEnd() { log.scrollTop = log.scrollHeight; }

  function addMessage(role, text) {
    var body = el('div', { className: 'jb-msg-body' });
    if (role === 'user') body.textContent = text;
    else body.appendChild(richText(text));
    var node = el('div', { className: 'jb-msg ' + (role === 'user' ? 'jb-msg--user' : 'jb-msg--bot') }, [
      el('p', { className: 'jb-msg-who', text: role === 'user' ? L.you : L.bot }),
      body,
    ]);
    log.appendChild(node);
    scrollToEnd();
    return node;
  }

  function addAlert(text, opts) {
    var node = el('div', { className: 'jb-alert' + (opts && opts.ok ? ' jb-alert--ok' : ''), role: opts && opts.ok ? 'status' : 'alert' }, [text]);
    if (opts && opts.retry) {
      node.appendChild(el('button', { type: 'button', text: L.retry, onclick: function () { node.remove(); opts.retry(); } }));
    }
    log.appendChild(node);
    scrollToEnd();
    return node;
  }

  var typingNode = null;
  function setTyping(on) {
    if (on && !typingNode) {
      typingNode = el('div', { className: 'jb-typing' }, [
        el('span', { className: 'jb-dots', 'aria-hidden': 'true' }, [el('span'), el('span'), el('span')]),
        el('span', { text: L.typing }),
      ]);
      log.appendChild(typingNode);
      log.setAttribute('aria-busy', 'true');
      scrollToEnd();
    } else if (!on && typingNode) {
      typingNode.remove();
      typingNode = null;
      log.removeAttribute('aria-busy');
    }
  }

  function updateComposer() {
    var n = input.value.length;
    counter.textContent = L.counter(n, CFG.maxMessageChars);
    sendBtn.disabled = state.sending || !input.value.trim() || n > CFG.maxMessageChars;
    // Hauteur ajustée au texte, seulement quand le champ est visible.
    input.style.height = '';
    if (n && input.offsetParent !== null) input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  }

  function showGreeting() {
    addMessage('assistant', L.greeting);
  }

  function loadHistory() {
    state.loaded = true;
    showGreeting();
    request(CFG.endpoints.history).then(function (r) {
      if (!r.ok) {
        if (r.status !== 503) addAlert(L.errors.history);
        return;
      }
      (r.data.messages || []).forEach(function (m) {
        if (m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string') addMessage(m.role, m.content);
      });
    });
  }

  function send(text, clientMessageId) {
    if (state.sending) return; // protection contre le double envoi
    state.sending = true;
    updateComposer();
    setTyping(true);
    request(CFG.endpoints.chat, {
      method: 'POST',
      body: JSON.stringify({ message: text, clientMessageId: clientMessageId }),
    }).then(function (r) {
      setTyping(false);
      state.sending = false;
      updateComposer();
      if (r.ok && typeof r.data.reply === 'string') {
        addMessage('assistant', r.data.reply);
        return;
      }
      var retryable = r.kind || r.status === 0 || r.status >= 500 || r.status === 409 || r.status === 429;
      addAlert(errorText(r), retryable ? { retry: function () { send(text, clientMessageId); } } : null);
    });
  }

  composer.addEventListener('submit', function (e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text || state.sending) return;
    if (text.length > CFG.maxMessageChars) {
      addAlert(L.errors.tooLong(CFG.maxMessageChars));
      return;
    }
    addMessage('user', text);
    input.value = '';
    updateComposer();
    send(text, uuid());
  });

  input.addEventListener('input', updateComposer);
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      if (typeof composer.requestSubmit === 'function') composer.requestSubmit();
      else composer.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  newBtn.addEventListener('click', function () {
    if (state.sending || !window.confirm(L.newConversationConfirm)) return;
    request(CFG.endpoints.reset, { method: 'POST', body: '{}' }).then(function (r) {
      if (!r.ok) {
        addAlert(errorText(r));
        return;
      }
      closeContact();
      log.textContent = '';
      showGreeting();
      input.focus();
    });
  });

  // ---------------------------------------------------------------
  // Formulaire « Être recontacté »
  // ---------------------------------------------------------------
  var C = L.contact;
  var fields = {};

  function field(name, label, control, hint) {
    var errId = 'jimbot-err-' + name;
    var describedBy = [hint ? 'jimbot-hint-' + name : null, errId].filter(Boolean).join(' ');
    control.setAttribute('aria-describedby', describedBy);
    var wrap = el('div', { className: 'jb-field' }, [
      el('label', { for: control.id }, [label + ' ', el('span', { className: 'jb-required', 'aria-hidden': 'true', text: '*' })]),
      control,
      hint ? el('p', { id: 'jimbot-hint-' + name, className: 'jb-hint', text: hint }) : null,
      el('p', { id: errId, className: 'jb-error' }),
    ]);
    fields[name] = { control: control, error: wrap.querySelector('.jb-error') };
    return wrap;
  }

  var fLast = el('input', { type: 'text', id: 'jimbot-last', name: 'lastName', autocomplete: 'family-name', maxlength: '100', required: true });
  var fFirst = el('input', { type: 'text', id: 'jimbot-first', name: 'firstName', autocomplete: 'given-name', maxlength: '100', required: true });
  var fEmail = el('input', { type: 'email', id: 'jimbot-email', name: 'email', autocomplete: 'email', maxlength: '254', required: true });
  var fCompany = el('input', { type: 'text', id: 'jimbot-company', name: 'company', autocomplete: 'organization', maxlength: '150', required: true });
  var fNoCompany = el('input', { type: 'checkbox', id: 'jimbot-nocompany', name: 'noCompany' });
  var fNeed = el('textarea', { id: 'jimbot-need', name: 'need', maxlength: '3000', required: true });
  var submitBtn = el('button', { type: 'submit', className: 'jb-primary', text: C.submit });
  var formStatus = el('div', { className: 'jb-form-status', role: 'status' });

  var companyField = field('company', C.company, fCompany);
  companyField.appendChild(el('label', { className: 'jb-check', for: 'jimbot-nocompany' }, [fNoCompany, C.noCompany]));
  fNoCompany.addEventListener('change', function () {
    fCompany.disabled = fNoCompany.checked;
    fCompany.required = !fNoCompany.checked;
    if (fNoCompany.checked) fCompany.value = '';
  });

  var contactForm = el('form', { novalidate: true }, [
    field('lastName', C.lastName, fLast),
    field('firstName', C.firstName, fFirst),
    field('email', C.email, fEmail),
    companyField,
    field('need', C.need, fNeed, C.needHint),
    el('p', { className: 'jb-transmission', text: C.transmission }),
    formStatus,
    el('div', { className: 'jb-contact-actions' }, [
      submitBtn,
      el('button', { type: 'button', className: 'jb-secondary', text: C.back, onclick: function () { closeContact(); input.focus(); } }),
    ]),
  ]);
  contactSection.appendChild(el('h3', { id: 'jimbot-contact-title', tabindex: '-1', text: C.title }));
  contactSection.appendChild(el('p', { className: 'jb-contact-intro', text: C.intro }));
  contactSection.appendChild(contactForm);

  function clearErrors() {
    Object.keys(fields).forEach(function (k) {
      fields[k].error.textContent = '';
      fields[k].control.removeAttribute('aria-invalid');
    });
    formStatus.textContent = '';
    formStatus.className = 'jb-form-status';
  }

  function openContact() {
    if (!contactSection.hidden) return;
    state.contactKey = state.contactKey || uuid();
    log.hidden = true;
    composer.hidden = true;
    foot.hidden = true;
    contactSection.hidden = false;
    contactSection.querySelector('h3').focus();
    if (!fNeed.value) {
      request(CFG.endpoints.contactDraft).then(function (r) {
        if (r.ok && typeof r.data.need === 'string' && !fNeed.value) fNeed.value = r.data.need;
      });
    }
  }

  function closeContact() {
    if (contactSection.hidden) return;
    contactSection.hidden = true;
    log.hidden = false;
    composer.hidden = false;
    foot.hidden = false;
    clearErrors();
    updateComposer();
    scrollToEnd();
  }

  contactBtn.addEventListener('click', openContact);

  contactForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (state.contactSending) return; // pas de double envoi
    clearErrors();
    state.contactSending = true;
    submitBtn.disabled = true;
    submitBtn.textContent = C.submitting;
    var payload = {
      lastName: fLast.value,
      firstName: fFirst.value,
      email: fEmail.value,
      company: fNoCompany.checked ? '' : fCompany.value,
      noCompany: fNoCompany.checked,
      need: fNeed.value,
      confirmed: true,
      idempotencyKey: state.contactKey,
    };
    request(CFG.endpoints.contact, { method: 'POST', body: JSON.stringify(payload) }).then(function (r) {
      state.contactSending = false;
      submitBtn.disabled = false;
      submitBtn.textContent = C.submit;
      // Succès affiché uniquement sur confirmation réelle du serveur.
      if (r.ok && r.data && r.data.saved === true) {
        contactForm.reset();
        fCompany.disabled = false;
        state.contactKey = null;
        closeContact();
        addAlert(C.success, { ok: true });
        input.focus();
        return;
      }
      if (r.status === 422 && r.data.fields) {
        var first = null;
        Object.keys(r.data.fields).forEach(function (k) {
          if (fields[k]) {
            fields[k].error.textContent = r.data.fields[k];
            fields[k].control.setAttribute('aria-invalid', 'true');
            first = first || fields[k].control;
          }
        });
        formStatus.textContent = r.data.fields.form || r.data.fields.confirmed || C.fixFields;
        formStatus.className = 'jb-form-status jb-error';
        if (first) first.focus();
        return;
      }
      formStatus.className = 'jb-form-status jb-error';
      formStatus.textContent = r.status === 0 || r.status >= 500 ? C.unconfirmed : errorText(r);
    });
  });

  // ---------------------------------------------------------------
  // Ouverture, fermeture, clavier
  // ---------------------------------------------------------------
  var mobile = window.matchMedia('(max-width: 600px)');

  function openPanel() {
    if (state.open) return;
    state.open = true;
    state.returnFocus = document.activeElement;
    panel.hidden = false;
    launcher.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-modal', mobile.matches ? 'true' : 'false');
    if (mobile.matches) document.documentElement.style.overflow = 'hidden';
    if (!state.loaded) loadHistory();
    updateComposer();
    (contactSection.hidden ? input : contactSection.querySelector('h3')).focus();
  }

  function closePanel() {
    if (!state.open) return;
    state.open = false;
    panel.hidden = true;
    launcher.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    launcher.focus();
  }

  launcher.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);

  panel.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closePanel();
      return;
    }
    // Plein écran (mobile) : le focus reste dans la fenêtre.
    if (e.key === 'Tab' && mobile.matches) {
      var focusables = Array.prototype.filter.call(
        panel.querySelectorAll('a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex="0"]'),
        function (n) { return n.offsetParent !== null; }
      );
      if (!focusables.length) return;
      var first = focusables[0];
      var last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  function mount() {
    if ((CFG.raiseAbove || []).some(function (sel) { return document.querySelector(sel); })) {
      root.classList.add('jimbot--raised');
    }
    document.body.appendChild(root);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
