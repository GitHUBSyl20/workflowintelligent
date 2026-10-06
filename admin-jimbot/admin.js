/* Administration JimBot : affichage uniquement. Toutes les vérifications
   d'accès sont faites par le serveur à chaque requête (cookies HttpOnly). */
(function () {
  'use strict';

  var API = '/api/jimbot/admin/';
  var main = document.getElementById('main');
  var nav = document.getElementById('nav');
  var who = document.getElementById('who');
  var toastEl = document.getElementById('toast');

  var STATUS = { nouvelle: 'Nouvelle', a_traiter: 'À traiter', traitee: 'Traitée' };
  var NOTIF = { en_attente: 'En attente', envoi_en_cours: 'Envoi en cours', envoyee: 'Envoyée', echec: 'Échec' };

  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      var v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'text') n.textContent = v;
      else if (k === 'className') n.className = v;
      else if (k.slice(0, 2) === 'on') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : String(v));
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function badge(value, labels) { return el('span', { className: 'badge ' + value, text: labels[value] || value }); }
  function date(v) { return v ? new Date(v).toLocaleString('fr-FR') : '—'; }
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    setTimeout(function () { toastEl.classList.remove('show'); }, 2500);
  }
  function render(title, nodes) {
    main.textContent = '';
    if (title) main.appendChild(el('h1', { text: title }));
    nodes.forEach(function (n) { if (n) main.appendChild(n); });
    document.title = (title ? title + ' · ' : '') + 'JimBot · Administration';
    main.focus();
  }

  function api(action, opts) {
    opts = opts || {};
    var init = { credentials: 'same-origin', method: opts.body ? 'POST' : 'GET', headers: {} };
    if (opts.body) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(opts.body);
    }
    return fetch(API + action + (opts.query || ''), init).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (res.status === 401 && action !== 'login') {
          showLogin(data.message);
          throw new Error('unauthorized');
        }
        if (!res.ok) throw new Error(data.message || 'Erreur ' + res.status);
        return data;
      });
    });
  }

  function failure(err) {
    if (err.message === 'unauthorized') return;
    main.appendChild(el('p', { className: 'alert', role: 'alert', text: err.message }));
  }

  // ---------------------------------------------------------------- Connexion
  function showLogin(message) {
    nav.hidden = true;
    var email = el('input', { type: 'email', id: 'email', autocomplete: 'username', required: true });
    var password = el('input', { type: 'password', id: 'password', autocomplete: 'current-password', required: true });
    var error = el('p', { className: 'alert', role: 'alert', hidden: !message, text: message || '' });
    var submit = el('button', { type: 'submit', className: 'btn', text: 'Se connecter' });
    var form = el('form', { className: 'form card' }, [
      el('div', null, [el('label', { for: 'email', text: 'Adresse e-mail' }), email]),
      el('div', null, [el('label', { for: 'password', text: 'Mot de passe' }), password]),
      error,
      submit,
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      submit.disabled = true;
      api('login', { body: { email: email.value, password: password.value } })
        .then(function () { location.hash = '#/demandes'; route(); })
        .catch(function (err) {
          error.hidden = false;
          error.textContent = err.message;
          password.value = '';
          password.focus();
        })
        .finally(function () { submit.disabled = false; });
    });
    render('Connexion', [el('p', { className: 'muted', text: 'Accès réservé à l’administrateur autorisé. Aucune inscription possible.' }), form]);
    email.focus();
  }

  document.getElementById('logout').addEventListener('click', function () {
    api('logout', { body: {} }).catch(function () {}).then(function () { showLogin('Vous êtes déconnecté.'); });
  });

  // ---------------------------------------------------------------- Demandes
  function listRequests(params) {
    var q = el('input', { type: 'search', id: 'q', value: params.get('q') || '', placeholder: 'Nom, e-mail, entreprise, besoin' });
    var status = el('select', { id: 'status' }, [el('option', { value: '', text: 'Tous' })].concat(Object.keys(STATUS).map(function (k) {
      return el('option', { value: k, text: STATUS[k], selected: params.get('status') === k });
    })));
    var notif = el('select', { id: 'notif' }, [el('option', { value: '', text: 'Toutes' })].concat(Object.keys(NOTIF).map(function (k) {
      return el('option', { value: k, text: NOTIF[k], selected: params.get('notification') === k });
    })));
    var form = el('form', { className: 'filters', role: 'search' }, [
      el('div', null, [el('label', { for: 'q', text: 'Rechercher' }), q]),
      el('div', null, [el('label', { for: 'status', text: 'Statut' }), status]),
      el('div', null, [el('label', { for: 'notif', text: 'Notification' }), notif]),
      el('button', { type: 'submit', className: 'btn', text: 'Filtrer' }),
    ]);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var p = new URLSearchParams();
      if (q.value.trim()) p.set('q', q.value.trim());
      if (status.value) p.set('status', status.value);
      if (notif.value) p.set('notification', notif.value);
      location.hash = '#/demandes' + (p.toString() ? '?' + p : '');
    });
    var holder = el('div', null, [el('p', { className: 'muted', text: 'Chargement…' })]);
    render('Demandes de contact', [form, holder]);
    var page = Number(params.get('page') || 1);
    var query = new URLSearchParams(params);
    api('requests', { query: '?' + query }).then(function (data) {
      holder.textContent = '';
      holder.appendChild(el('p', { className: 'muted', text: data.total + ' demande(s)' }));
      if (!data.items.length) return;
      var tbody = el('tbody');
      data.items.forEach(function (r) {
        tbody.appendChild(el('tr', null, [
          el('td', null, [el('a', { href: '#/demandes/' + r.id, text: r.first_name + ' ' + r.last_name })]),
          el('td', { text: r.no_company ? 'Sans entreprise' : r.company }),
          el('td', { text: r.need_preview }),
          el('td', null, [badge(r.status, STATUS)]),
          el('td', null, [badge(r.notification_status, NOTIF)]),
          el('td', { text: date(r.created_at) }),
        ]));
      });
      holder.appendChild(el('div', { className: 'table-wrap' }, [el('table', null, [
        el('thead', null, [el('tr', null, ['Contact', 'Entreprise', 'Besoin', 'Statut', 'Notification', 'Reçue le'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]),
        tbody,
      ])]));
      holder.appendChild(pager(page, data.total, data.page_size, function (p) {
        query.set('page', p);
        return '#/demandes?' + query;
      }));
    }).catch(failure);
  }

  function pager(page, total, size, href) {
    var pages = Math.max(1, Math.ceil(total / size));
    return el('nav', { className: 'pager', 'aria-label': 'Pagination' }, [
      page > 1 ? el('a', { href: href(page - 1), text: '← Précédent' }) : null,
      el('span', { className: 'muted', text: 'Page ' + page + ' / ' + pages }),
      page < pages ? el('a', { href: href(page + 1), text: 'Suivant →' }) : null,
    ]);
  }

  function messagesBlock(messages) {
    if (!messages.length) return el('p', { className: 'muted', text: 'Aucun message (pas de conversation liée, ou conversation supprimée).' });
    return el('div', { className: 'msgs' }, messages.map(function (m) {
      return el('div', { className: 'msg ' + m.role }, [
        el('p', { className: 'meta', text: (m.role === 'user' ? 'Visiteur' : 'JimBot') + ' · ' + date(m.created_at) }),
        el('p', { className: 'pre', text: m.content }),
        m.source_refs && m.source_refs.length ? el('p', { className: 'refs', text: 'Sources utilisées : ' + m.source_refs.join(', ') }) : null,
      ]);
    }));
  }

  function showRequest(id) {
    render('Demande', [el('p', { className: 'muted', text: 'Chargement…' })]);
    api('request', { query: '?id=' + encodeURIComponent(id) }).then(function (data) {
      var r = data.request;
      var select = el('select', { id: 'st' }, Object.keys(STATUS).map(function (k) { return el('option', { value: k, text: STATUS[k], selected: r.status === k }); }));
      var saveBtn = el('button', { type: 'button', className: 'btn', text: 'Enregistrer le statut' });
      saveBtn.addEventListener('click', function () {
        saveBtn.disabled = true;
        api('request-status', { body: { id: r.id, status: select.value } })
          .then(function () { toast('Statut enregistré'); })
          .catch(function (e) { toast(e.message); })
          .finally(function () { saveBtn.disabled = false; });
      });
      var retryBtn = null;
      if (r.notification_status === 'echec' || r.notification_status === 'en_attente' || r.notification_status === 'envoi_en_cours') {
        retryBtn = el('button', { type: 'button', className: 'btn secondary', text: 'Relancer l’envoi de la notification' });
        retryBtn.addEventListener('click', function () {
          retryBtn.disabled = true;
          api('request-retry', { body: { id: r.id } })
            .then(function (d) { toast('Notification : ' + (NOTIF[d.notification_status] || d.notification_status)); showRequest(id); })
            .catch(function (e) { toast(e.message); retryBtn.disabled = false; });
        });
      }
      var delBtn = el('button', { type: 'button', className: 'btn danger', text: 'Supprimer la demande' });
      delBtn.addEventListener('click', function () {
        if (!confirm('Supprimer définitivement cette demande ? (La conversation liée n’est pas supprimée.)')) return;
        api('request-delete', { body: { id: r.id } }).then(function () { toast('Demande supprimée'); location.hash = '#/demandes'; }).catch(failure);
      });
      render(r.first_name + ' ' + r.last_name, [
        el('p', null, [el('a', { href: '#/demandes', text: '← Toutes les demandes' })]),
        el('section', { className: 'card' }, [
          el('h2', { text: 'Coordonnées' }),
          el('dl', { className: 'kv' }, [
            el('dt', { text: 'Nom' }), el('dd', { text: r.last_name }),
            el('dt', { text: 'Prénom' }), el('dd', { text: r.first_name }),
            el('dt', { text: 'E-mail' }), el('dd', null, [el('a', { href: 'mailto:' + r.email, text: r.email })]),
            el('dt', { text: 'Entreprise' }), el('dd', { text: r.no_company ? 'Sans entreprise' : r.company }),
            el('dt', { text: 'Reçue le' }), el('dd', { text: date(r.created_at) }),
            el('dt', { text: 'Expire le' }), el('dd', { text: date(r.expires_at) }),
            el('dt', { text: 'Demande explicite' }), el('dd', { text: 'Bouton « Envoyer ma demande », ' + date(r.explicit_request && r.explicit_request.submitted_at) }),
          ]),
        ]),
        el('section', { className: 'card' }, [el('h2', { text: 'Besoin validé' }), el('p', { className: 'pre', text: r.need })]),
        el('section', { className: 'card' }, [el('h2', { text: 'Résumé' }), el('p', { className: 'pre', text: r.summary || '—' })]),
        el('section', { className: 'card' }, [
          el('h2', { text: 'Suivi' }),
          el('div', { className: 'actions' }, [el('label', { for: 'st', text: 'Statut' }), select, saveBtn]),
          el('p', null, ['Notification : ', badge(r.notification_status, NOTIF), ' · tentatives : ' + r.notification_attempts +
            (r.notification_sent_at ? ' · envoyée le ' + date(r.notification_sent_at) : '') +
            (r.notification_last_error ? ' · dernière erreur : ' + r.notification_last_error : '')]),
          el('div', { className: 'actions' }, [retryBtn, delBtn]),
        ]),
        el('section', { className: 'card' }, [
          el('h2', { text: 'Messages de la conversation' }),
          r.conversation_id ? el('p', null, [el('a', { href: '#/conversations/' + r.conversation_id, text: 'Ouvrir la conversation' })]) : null,
          messagesBlock(data.messages || []),
        ]),
      ]);
    }).catch(function (e) { render('Demande', []); failure(e); });
  }

  // ---------------------------------------------------------------- Conversations
  function listConversations(params) {
    var page = Number(params.get('page') || 1);
    var holder = el('div', null, [el('p', { className: 'muted', text: 'Chargement…' })]);
    render('Conversations', [holder]);
    api('conversations', { query: '?page=' + page }).then(function (data) {
      holder.textContent = '';
      holder.appendChild(el('p', { className: 'muted', text: data.total + ' conversation(s)' }));
      if (!data.items.length) return;
      var tbody = el('tbody');
      data.items.forEach(function (c) {
        tbody.appendChild(el('tr', null, [
          el('td', null, [el('a', { href: '#/conversations/' + c.id, text: date(c.created_at) })]),
          el('td', { text: c.preview || '—' }),
          el('td', { text: String(c.message_count) }),
          el('td', { text: c.request_count ? 'Oui' : 'Non' }),
          el('td', { text: date(c.expires_at) }),
        ]));
      });
      holder.appendChild(el('div', { className: 'table-wrap' }, [el('table', null, [
        el('thead', null, [el('tr', null, ['Début', 'Premier message', 'Messages', 'Demande', 'Expire le'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]),
        tbody,
      ])]));
      holder.appendChild(pager(page, data.total, data.page_size, function (p) { return '#/conversations?page=' + p; }));
    }).catch(failure);
  }

  function showConversation(id) {
    render('Conversation', [el('p', { className: 'muted', text: 'Chargement…' })]);
    api('conversation', { query: '?id=' + encodeURIComponent(id) }).then(function (data) {
      var c = data.conversation;
      var delBtn = el('button', { type: 'button', className: 'btn danger', text: 'Supprimer la conversation' });
      delBtn.addEventListener('click', function () {
        if (!confirm('Supprimer définitivement cette conversation et ses messages ? Les demandes de contact liées sont conservées.')) return;
        api('conversation-delete', { body: { id: c.id } }).then(function () { toast('Conversation supprimée'); location.hash = '#/conversations'; }).catch(failure);
      });
      var retrievals = (data.retrievals || []).map(function (r) {
        return el('li', { text: date(r.created_at) + ' · « ' + r.query + ' » → ' + (r.results.length ? r.results.map(function (x) { return x.doc_ref + ' (' + x.similarity + ')'; }).join(', ') : 'aucun résultat') });
      });
      render('Conversation du ' + date(c.created_at), [
        el('p', null, [el('a', { href: '#/conversations', text: '← Toutes les conversations' })]),
        el('section', { className: 'card' }, [
          el('dl', { className: 'kv' }, [
            el('dt', { text: 'Messages' }), el('dd', { text: String(c.message_count) }),
            el('dt', { text: 'Dernière activité' }), el('dd', { text: date(c.last_activity_at) }),
            el('dt', { text: 'Expire le' }), el('dd', { text: date(c.expires_at) }),
            el('dt', { text: 'Demandes liées' }), el('dd', null, data.requests.length ? data.requests.map(function (q) { return el('a', { href: '#/demandes/' + q.id, text: 'Demande du ' + date(q.created_at) + ' ' }); }) : ['Aucune']),
          ]),
          el('div', { className: 'actions' }, [delBtn]),
        ]),
        el('section', { className: 'card' }, [el('h2', { text: 'Messages' }), messagesBlock(data.messages || [])]),
        el('section', { className: 'card' }, [el('h2', { text: 'Recherches dans la base de connaissances' }), retrievals.length ? el('ul', null, retrievals) : el('p', { className: 'muted', text: 'Aucune.' })]),
      ]);
    }).catch(function (e) { render('Conversation', []); failure(e); });
  }

  // ---------------------------------------------------------------- Routeur
  function route() {
    var hash = location.hash.replace(/^#/, '') || '/demandes';
    var parts = hash.split('?');
    var path = parts[0];
    var params = new URLSearchParams(parts[1] || '');
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      a.toggleAttribute('aria-current', path.indexOf(a.getAttribute('href').slice(1)) === 0);
      if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'page');
    });
    api('me').then(function (me) {
      nav.hidden = false;
      who.textContent = me.email;
      var m;
      if ((m = /^\/demandes\/([0-9a-f-]{36})$/.exec(path))) return showRequest(m[1]);
      if ((m = /^\/conversations\/([0-9a-f-]{36})$/.exec(path))) return showConversation(m[1]);
      if (path === '/conversations') return listConversations(params);
      return listRequests(params);
    }).catch(function (e) {
      if (e.message === 'unauthorized') return;
      render('Administration', []);
      failure(e);
    });
  }

  window.addEventListener('hashchange', route);
  route();
})();
