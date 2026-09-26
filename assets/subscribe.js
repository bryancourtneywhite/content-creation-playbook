/* ------------------------------------------------------------------
   Email capture / newsletter for Ashura Whole Heavens.

   Renders a styled "get notified" signup wherever you drop:
       <div data-subscribe></div>            (full block)
       <div data-subscribe="mini"></div>     (compact footer bar)

   ── ONE-TIME SETUP (pick ONE provider) ────────────────────────────

   OPTION A — Formspree (recommended: easiest, real inbox, no domain setup)
     1. Go to https://formspree.io/  → sign up free with your email.
     2. Create a new form → it gives you an endpoint like
        https://formspree.io/f/abcdwxyz  (the "abcdwxyz" is your form ID).
     3. Set PROVIDER='formspree' and FORMSPREE_ID='abcdwxyz' below.
     • Submissions land in your Formspree inbox + forward to your email.
     • Free tier: 50 submissions/month. Upgrade later if you outgrow it.
     • Uses AJAX so the visitor stays on the page and sees a success note.

   OPTION B — Buttondown (a real newsletter list, free to 100 subs)
     1. Sign up at https://buttondown.com/  → your username is your list.
     2. Set PROVIDER='buttondown' and BUTTONDOWN_USER='yourusername'.

   OPTION C — Custom (ConvertKit / Beehiiv / Mailchimp / Google Form)
     Set PROVIDER='custom', paste your form action URL in CUSTOM_ACTION,
     and the email field's name in CUSTOM_FIELD.

   Until a provider is configured, the form shows and submitting displays
   a friendly "coming soon" note instead of erroring. Nothing to remove.
   ------------------------------------------------------------------ */
(function () {
  // ▼▼▼ CONFIG — set PROVIDER + the matching value ▼▼▼
  var PROVIDER = 'formspree';        // 'formspree' | 'buttondown' | 'custom'
  var FORMSPREE_ID = '';             // e.g. 'abcdwxyz'  (from formspree.io/f/XXXX)
  var BUTTONDOWN_USER = '';          // e.g. 'solashur'
  var CUSTOM_ACTION = '';            // full form action URL (if PROVIDER='custom')
  var CUSTOM_FIELD = 'email';        // the email input's name attribute
  // ▲▲▲

  function actionURL() {
    if (PROVIDER === 'formspree' && FORMSPREE_ID) return 'https://formspree.io/f/' + FORMSPREE_ID;
    if (PROVIDER === 'buttondown' && BUTTONDOWN_USER) return 'https://buttondown.com/api/emails/embed-subscribe/' + encodeURIComponent(BUTTONDOWN_USER);
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
    return '' +
      '<form class="' + cls + '" action="' + (act || '#') + '" method="post">' +
        '<input class="sub-input" type="email" name="' + fieldName() + '" placeholder="you@email.com" required aria-label="Email address">' +
        '<button class="sub-btn" type="submit">Notify me →</button>' +
      '</form>';
  }

  function showNote(form, text, ok) {
    var note = form.parentNode.querySelector('.sub-note');
    if (!note) {
      note = document.createElement('div');
      note.className = 'sub-note';
      form.parentNode.appendChild(note);
    }
    note.textContent = text;
    note.classList.toggle('err', ok === false);
  }

  function wire(root) {
    root.querySelectorAll('form').forEach(function (f) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();

        // Not configured yet → friendly placeholder.
        if (!configured) {
          showNote(f, '📬 Signups open very soon — follow on YouTube/Twitch in the meantime!', true);
          return;
        }

        var input = f.querySelector('input[type="email"]');
        var btn = f.querySelector('button');
        var email = input ? input.value.trim() : '';
        if (!email) return;

        // Formspree + custom → AJAX (stay on page, inline success).
        // Buttondown → open its subscribe endpoint in a popup (its flow).
        if (PROVIDER === 'buttondown') {
          window.open(actionURL() + '?email=' + encodeURIComponent(email), 'popupwindow');
          showNote(f, '✅ Almost there — confirm in the popup to finish!', true);
          return;
        }

        if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }
        var data = new FormData(f);
        fetch(actionURL(), { method: 'POST', body: data, headers: { 'Accept': 'application/json' } })
          .then(function (r) {
            if (r.ok) {
              f.reset();
              showNote(f, '✅ You\'re in! Watch your inbox for streams & new builds. 🌙', true);
            } else {
              showNote(f, '⚠️ Something went wrong — try again in a moment.', false);
            }
          })
          .catch(function () {
            showNote(f, '⚠️ Network hiccup — please try again.', false);
          })
          .then(function () {
            if (btn) { btn.disabled = false; btn.textContent = 'Notify me →'; }
          });
      });
    });
  }

  function render() {
    document.querySelectorAll('[data-subscribe]').forEach(function (el) {
      var mode = el.getAttribute('data-subscribe');
      el.innerHTML = (mode === 'mini') ? miniHTML() : fullHTML();
      wire(el);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
