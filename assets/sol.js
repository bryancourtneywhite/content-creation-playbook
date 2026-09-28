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

  /* Default identity for souls with no set alias / no provider avatar.
     Path is resolved for subfolder pages (builds/, lore/). */
  var _deep = /\/(builds|lore)\//.test(location.pathname);
  var DEFAULT_AVATAR = (_deep ? '../' : '') + 'assets/RINNEGAN%20EYE%20LOGO.png';
  var DEFAULT_ALIAS = 'Unclaimed Sol';
  function displayName(alias) { return alias && String(alias).trim() ? alias : DEFAULT_ALIAS; }
  function avatarFor(url) { return url && String(url).trim() ? url : DEFAULT_AVATAR; }

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
      // alias + avatar are IDENTITY-LOCKED (derived from Discord/email, enforced
      // by the DB column-guard). Users can only edit these presentation fields.
      var allowed = {};
      ['email_opt_in', 'settings', 'tagline', 'fav_class', 'accent'].forEach(function (k) {
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

  /* ---- MミRC Guild Roster (signup + confirm; members-only) ----
     Roster starts empty. A member signs up (rosterSignup) -> pending. The owner
     confirms them. Only CONFIRMED members can read the full roster (RLS-gated);
     everyone else can read only their own signup row. */

  // My own signup row (or null if I never signed up).
  function myRoster() {
    return getSession().then(function (s) {
      if (!s) return null;
      return sb.rpc('my_roster').then(function (r) {
        // rpc returns the row (or null). Some PostgREST setups wrap in array.
        var d = r.data;
        if (Array.isArray(d)) return d[0] || null;
        return d || null;
      });
    });
  }
  // Am I a confirmed roster member? (gates the members-only view/UI)
  function isRosterMember() {
    return myRoster().then(function (row) { return !!(row && row.status === 'confirmed'); });
  }
  // Am I a roster ADMIN (owner OR delegated admin)? Gates the admin tools.
  function amIRosterAdmin() {
    return sb.rpc('my_roster_admin').then(function (r) { return !!r.data; });
  }
  // Owner-only: promote/demote a confirmed member to roster admin.
  function rosterSetAdmin(id, isAdmin) {
    return sb.rpc('roster_set_admin', { p_id: id, p_is_admin: !!isAdmin });
  }
  // Owner-only: full signups list (everyone + roster status + contact).
  function adminSignups() {
    return sb.rpc('admin_signups').then(function (r) { return r.data || []; });
  }
  // Owner/admin: add an account directly to the roster (confirmed), even if they
  // never filled out the signup form. Defaults class/role; edit inline after.
  function rosterAddMember(userId, name, aionClass, guildRole) {
    return sb.rpc('roster_add_member', {
      p_user: userId, p_name: name || null,
      p_class: aionClass || 'Templar', p_role: guildRole || 'DPS'
    });
  }
  // Owner/admin: remove a roster row entirely (returns them to "not signed up").
  function rosterRemove(id) { return sb.rpc('roster_remove', { p_id: id }); }
  // Create/update my signup. status is server-managed (pending until confirmed).
  function rosterSignup(name, aionClass, guildRole, note) {
    return sb.rpc('roster_signup', {
      p_name: name, p_class: aionClass, p_role: guildRole, p_note: note || null
    }).then(function (r) {
      if (r.error) throw r.error;
      var d = r.data; return Array.isArray(d) ? d[0] : d;
    });
  }
  // Read the roster. RLS returns all CONFIRMED rows only to confirmed members;
  // to everyone else it returns just their own row.
  function fetchRoster() {
    return sb.from('guild_roster')
      .select('*')
      .order('assigned_group', { ascending: true })
      .order('player_name', { ascending: true })
      .then(function (r) { return r.data || []; });
  }
  function rosterSummary() {
    return sb.rpc('roster_summary').then(function (r) { return (r.data && r.data[0]) || null; });
  }
  // ---- owner controls (no-op / error for non-owners, enforced server-side) ----
  function rosterConfirm(id) { return sb.rpc('roster_confirm', { p_id: id }); }
  function rosterReject(id)  { return sb.rpc('roster_reject',  { p_id: id }); }
  function rosterAssign(id, opts) {
    opts = opts || {};
    return sb.rpc('roster_assign', {
      p_id: id, p_group: opts.group || null, p_team: opts.team || null,
      p_cp: (opts.cp != null ? opts.cp : null), p_war: (opts.war != null ? opts.war : null),
      p_core: (opts.core != null ? opts.core : null), p_vet: (opts.vet != null ? opts.vet : null)
    });
  }
  // Interactive rebuild: move a member to a group/team.
  function rosterMove(memberId, group, team) {
    return sb.rpc('roster_move', { p_member: memberId, p_group: group, p_team: team || null });
  }

  /* ---- Events + attendance ---- */
  function fetchEvents() {
    return sb.from('roster_events_view').select('*').order('starts_at', { ascending: false }).limit(50)
      .then(function (r) { return r.data || []; });
  }
  function fetchAttendance(eventId) {
    return sb.from('attendance').select('*').eq('event_id', eventId)
      .then(function (r) { return r.data || []; });
  }
  function fetchAttendanceRates() {
    return sb.from('attendance_rates').select('*').then(function (r) { return r.data || []; });
  }
  function eventCreate(title, type, startsAt) {
    return sb.rpc('event_create', { p_title: title, p_type: type || null, p_starts: startsAt || new Date().toISOString() })
      .then(function (r) { if (r.error) throw r.error; return r.data; });
  }
  function eventClose(id, open) { return sb.rpc('event_close', { p_id: id, p_open: !!open }); }
  function attendMark(eventId, memberId, status) {
    return sb.rpc('attend_mark', { p_event: eventId, p_member: memberId, p_status: status });
  }
  function attendRsvp(eventId, going) {
    return sb.rpc('attend_rsvp', { p_event: eventId, p_going: !!going });
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
    DEFAULT_AVATAR: DEFAULT_AVATAR,
    DEFAULT_ALIAS: DEFAULT_ALIAS,
    displayName: displayName,
    avatarFor: avatarFor,
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
    myRoster: myRoster,
    isRosterMember: isRosterMember,
    amIRosterAdmin: amIRosterAdmin,
    rosterSetAdmin: rosterSetAdmin,
    adminSignups: adminSignups,
    rosterAddMember: rosterAddMember,
    rosterRemove: rosterRemove,
    rosterSignup: rosterSignup,
    fetchRoster: fetchRoster,
    rosterSummary: rosterSummary,
    rosterConfirm: rosterConfirm,
    rosterReject: rosterReject,
    rosterAssign: rosterAssign,
    rosterMove: rosterMove,
    fetchEvents: fetchEvents,
    fetchAttendance: fetchAttendance,
    fetchAttendanceRates: fetchAttendanceRates,
    eventCreate: eventCreate,
    eventClose: eventClose,
    attendMark: attendMark,
    attendRsvp: attendRsvp,
    checkIn: checkIn
  };
})();
