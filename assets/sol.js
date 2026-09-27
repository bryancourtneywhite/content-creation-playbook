/* ============================================================================
   sol.js — Sol leaderboard client helper for solashur.com
   Wraps Supabase auth + profile + leaderboard + check-in, and plays a
   level-up chime when a check-in awards Sol / ranks the user up.
   Exposes a single global: window.Sol

   Load order on a page:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="assets/sol.js"></script>
   ============================================================================ */
(function () {
  // Browser-safe project credentials (protected by RLS).
  var SUPABASE_URL = 'https://tafgsevpzhfnhyrmqvxx.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_Z0sXRiKKdMKkq7vqqOJn2A_HHke5fXp';

  if (!window.supabase || !window.supabase.createClient) {
    console.error('[Sol] Supabase JS not loaded. Add the supabase-js <script> before sol.js.');
    return;
  }
  var sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  /* ---- Shinigami rank presentation ---- */
  var ROLES = {
    sol_king:    { label: 'Sol King',    icon: '👑', color: '#ffd24a', rankText: 'The Sovereign' },
    royal_guard: { label: 'Royal Guard', icon: '🛡️', color: '#c9a24a', rankText: 'Elite Protector' },
    arrancar:    { label: 'Arrancar',    icon: '⚔️', color: '#ff5563', rankText: 'Ascended' },
    hollow:      { label: 'Hollow',      icon: '💀', color: '#b8c0e0', rankText: 'Awakened' },
    shinigami:   { label: 'Shinigami',   icon: '🗡️', color: '#9fb8d6', rankText: 'Soul Reaper' }
  };
  function roleInfo(role) { return ROLES[role] || ROLES.shinigami; }

  /* ---- Level-up chime (Web Audio; no file needed) ----
     A short ascending arpeggio, Zelda/Mario "power-up" flavored. `big` plays a
     longer, brighter fanfare (used on a rank-up). Respects a saved sound pref. */
  function playLevelUp(big) {
    try {
      if (localStorage.getItem('sol-sound') === 'off') return;
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      // note sequence (Hz). big = longer, brighter run.
      var notes = big
        ? [523.25, 659.25, 783.99, 1046.5, 1318.5]   // C5 E5 G5 C6 E6
        : [659.25, 783.99, 1046.5];                   // E5 G5 C6
      var t0 = ctx.currentTime, step = big ? 0.11 : 0.10;
      notes.forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(f, t0 + i * step);
        g.gain.setValueAtTime(0.0001, t0 + i * step);
        g.gain.exponentialRampToValueAtTime(0.22, t0 + i * step + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * step + step * 1.4);
        o.connect(g); g.connect(ctx.destination);
        o.start(t0 + i * step);
        o.stop(t0 + i * step + step * 1.5);
      });
      // sparkle tail on big
      if (big) {
        var o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(1567.98, t0 + notes.length * step);
        g2.gain.setValueAtTime(0.0001, t0 + notes.length * step);
        g2.gain.exponentialRampToValueAtTime(0.18, t0 + notes.length * step + 0.03);
        g2.gain.exponentialRampToValueAtTime(0.0001, t0 + notes.length * step + 0.5);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(t0 + notes.length * step); o2.stop(t0 + notes.length * step + 0.55);
      }
      setTimeout(function () { ctx.close(); }, 1600);
    } catch (e) { /* audio is best-effort */ }
  }

  /* ---- Auth ---- */
  function loginWith(provider) {
    return sb.auth.signInWithOAuth({
      provider: provider,   // 'discord' | 'google' | 'twitch'
      options: { redirectTo: location.origin + '/profile.html' }
    });
  }
  function loginEmail(email) {
    return sb.auth.signInWithOtp({
      email: email,
      options: { emailRedirectTo: location.origin + '/profile.html' }
    });
  }
  function logout() { return sb.auth.signOut(); }
  function getSession() { return sb.auth.getSession().then(function (r) { return r.data.session; }); }
  function getUser() { return sb.auth.getUser().then(function (r) { return r.data.user; }); }
  function onAuthChange(cb) { return sb.auth.onAuthStateChange(function (_e, s) { cb(s); }); }

  /* ---- Profile ---- */
  function myProfile() {
    return getUser().then(function (u) {
      if (!u) return null;
      return sb.from('profiles').select('*').eq('id', u.id).maybeSingle()
        .then(function (r) { return r.data; });
    });
  }
  // Only alias / email_opt_in / settings / avatar are editable (RLS + trigger guard the rest).
  function updateProfile(fields) {
    return getUser().then(function (u) {
      if (!u) throw new Error('not_authenticated');
      var allowed = {};
      ['alias', 'email_opt_in', 'settings', 'avatar_url', 'tagline', 'fav_class', 'accent'].forEach(function (k) {
        if (k in fields) allowed[k] = fields[k];
      });
      return sb.from('profiles').update(allowed).eq('id', u.id).select().maybeSingle();
    });
  }
  function mySummary() {
    return sb.rpc('my_summary').then(function (r) {
      return (r.data && r.data[0]) || null;
    });
  }

  /* ---- Leaderboard ---- */
  function fetchLeaderboard(limit) {
    return sb.from('leaderboard')
      .select('id, alias, role, avatar_url, sols, position')
      .order('position', { ascending: true })
      .limit(limit || 100)
      .then(function (r) { return r.data || []; });
  }

  /* ---- Check-in (earn Sol) ---- */
  function checkIn() {
    return getSession().then(function (s) {
      if (!s) throw new Error('not_authenticated');
      return fetch(SUPABASE_URL + '/functions/v1/checkin', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + s.access_token,
          'apikey': SUPABASE_ANON_KEY
        }
      }).then(function (res) {
        return res.json().then(function (body) { return { status: res.status, body: body }; });
      }).then(function (r) {
        // Play the sound on a successful award; bigger fanfare on a rank-up.
        if (r.body && r.body.ok && r.body.leveledUp) playLevelUp(!!r.body.rankedUp);
        return r.body;
      });
    });
  }

  window.Sol = {
    client: sb,
    ROLES: ROLES,
    roleInfo: roleInfo,
    playLevelUp: playLevelUp,
    loginWith: loginWith,
    loginEmail: loginEmail,
    logout: logout,
    getSession: getSession,
    getUser: getUser,
    onAuthChange: onAuthChange,
    myProfile: myProfile,
    updateProfile: updateProfile,
    mySummary: mySummary,
    fetchLeaderboard: fetchLeaderboard,
    checkIn: checkIn
  };
})();
