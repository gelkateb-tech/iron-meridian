// Iron Meridian rules, file 1: the shared namespace and the event sink.
// The rules files (rules/*.js) hold the game rules only: no DOM, canvas, window, localStorage, sound or camera. They are plain scripts loaded
// before the page's own script and share its script scope, so rule code and UI code call each other by bare names.
// Rules tell the client what happened through IM.emit(type, ...); the client subscribes with IM.on(type, fn). emit is synchronous, so a
// handler runs at exactly the point in the hour where the rule ran. Handlers never call rng() and never change rule state.
//   IM.cfg   run options (allAI: the AI also plays seat 0)
//   IM.hook  questions the rules ask the client; the defaults are pure, so a run without a client needs none
// Developer-only and test-only code is fenced here as in index.html, and tools/build.js strips every rules file (see BUILD.md).
'use strict';
const IM = { subs:{}, cfg:{allAI:false}, hook:{approach:a => null, surpriseOk:o => false, spotOf:a => null, posOf:null},
  on(t, f){ (this.subs[t] || (this.subs[t] = [])).push(f); },
  emit(t, a, b, c, d){ const L = this.subs[t]; if (L) for (let i = 0; i < L.length; i++) L[i](a, b, c, d); } };

/*@DEV*/
// developer switches (test build only; all off unless the client turns one on): the developer rules in rules/production.js read them
const DEV = {instant:false, research:false, res:false, reveal:false}, DEV_FILL = 500000;
/*@ENDDEV*/

// ---- reports: the names the rules have always called; each one tells the client and nothing else
// the player's dispatch list (part of the save); the client shows it and may pop a toast
function log(text, kind, p = null){ S.log.unshift({h:S.hour, text, kind, p}); if (S.log.length > 80) S.log.length = 80; IM.emit('log', text, kind, p); }
function toast(text, kind, p){ IM.emit('toast', text, kind, p); }
function sfx(name){ IM.emit('sfx', name); }
function fx(type, p, extra = {}){ IM.emit('fx', type, p, extra); }
// province ownership changed: the client rebuilds its border geometry
function geoChanged(){ IM.emit('geo'); }
function alarm(){ if (S.speed > 1){ S.speed = 1; } sfx('alarm'); }
const bump = (k, v = 1) => { const st0 = S.stats || (S.stats = {}); st0[k] = (st0[k] || 0) + v; };
