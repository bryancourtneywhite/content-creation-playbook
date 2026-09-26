/* ------------------------------------------------------------------
   Email capture / newsletter for Ashura Whole Heavens.

   Renders a styled "get notified" signup wherever you drop:
       <div data-subscribe></div>            (full block)
       <div data-subscribe="mini"></div>     (compact footer bar)

   ── ONE-TIME SETUP ────────────────────────────────────────────────
   Uses Buttondown (free up to 100 subs, simple, no backend needed).
   1. Sign up at https://buttondown.com/  (free).
   2. Your username becomes your list. Set BUTTONDOWN_USER below to it.
   3. That's it — the form posts straight to Buttondown; new subscribers
      appear in your dashboard and get your emails.

   Prefer ConvertKit / Beehiiv / Mailchimp instead? Set PROVIDER='custom'
   and paste your form's action URL + email field name in CUSTOM_ACTION /
   CUSTOM_FIELD. The markup below is a standard POST form, so any provider
   that gives you an embed action URL works.

   Until BUTTONDOWN_USER (or a custom action) is set, the form shows but
   submitting opens a friendly "coming soon" note instead of erroring.
   ------------------------------------------------------------------ */
(function () {
  // ▼▼▼ CONFIG ▼▼▼
  var PROVIDER = 'buttondown';       // 'buttondown' | 'custom'
  var BUTTONDOWN_USER = '';          // e.g. 'solashur'
  var CUSTOM_ACTION = '';            // full form action URL (if PROVIDER='custom')
  var CUSTOM_FIELD = 'email';        // the email input's name attribute
  // ▲▲▲

  function actionURL() {
    if (PROVIDER === 'buttondown' && BUTTONDOWN_USER) {
      return 'https://buttondown.com/api/emails/embed-subscribe/' + encodeURIComponent(BUTTONDOWN_USER);
    }
    if (PROVIDER === 'custom' && CUSTOM_ACTION) return CUSTOM_ACTION;
    return '';
  }
  function fieldName() {
    return PROVIDER === 'buttondown' ? 'email' : (CUSTOM_FIELD || 'email');
  }

  var configured = !!actionURL();

  function fullHTML() {
    return '' +
      '<div class="sub-card">' +
        '<div class="sub-ico">🔔</div>' +
        '<h3 class="sub-title">Never miss a stream or a build</h3>' +
        '<p class="sub-copy">Get an email when Solashur goes live and when a new AION 2 build or guide drops. No spam — just the good stuff. 🌙</p>' +
        formHTML('sub-form') +
        '<p class="sub-fine">Unsubscribe anytime. Your email stays private.</p>' +
      '</div>';
  }

  function miniHTML() {
    return '' +
      '<div class="sub-mini">' +
        '<span class="sub-mini-label">🔔 Get notified when I go live &amp; when new builds drop</span>' +
        formHTML('sub-form mini') +
      '</div>';
  }

  function formHTML(cls) {
    var act = actionURL();
    var method = configured ? 'post' : 'get';
    var target = (PROVIDER === 'buttondown') ? ' target="popupwindow" onsubmit="window.open(\'' + act + '\',\'popupwindow\')"' : '';
    return '' +
      '<form class="' + cls + '" action="' + (act || '#') + '" method="' + method + '"' + (configured ? target : '') + '>' +
        '<input class="sub-input" type="email" name="' + fieldName() + '" placeholder="you@email.com" required aria-label="Email address">' +
        '<button class="sub-btn" type="submit">Notify me →</button>' +
      '</form>';
  }

  function wireFallback(root) {
    if (configured) return;
    root.querySelectorAll('form').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        var note = document.createElement('div');
        note.className = 'sub-note';
        note.textContent = '📬 Signups open very soon — follow on YouTube/Twitch in the meantime!';
        if (!f.parentNode.querySelector('.sub-note')) f.parentNode.appendChild(note);
      });
    });
  }

  function render() {
    document.querySelectorAll('[data-subscribe]').forEach(function (el) {
      var mode = el.getAttribute('data-subscribe');
      el.innerHTML = (mode === 'mini') ? miniHTML() : fullHTML();
      wireFallback(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
