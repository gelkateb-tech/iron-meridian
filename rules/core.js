// Iron Meridian rules, file 1: the shared namespace and the event sink.
// The rules files (rules/*.js) hold the game rules only: no DOM, canvas, window, localStorage, sound or camera. They are plain scripts loaded
// before the page's own script and share its script scope, so rule code and UI code call each other by bare names.
// Rules tell the client what happened through IM.emit(type, ...); the client subscribes with IM.on(type, fn). emit is synchronous, so a
// handler runs at exactly the point in the hour where the rule ran. Handlers never call rng() and never change rule state.
// A seat is a nation a person plays (its `ai` flag is off; newGame takes the list of seats). The rules name no seat of their own: orders take
// the nation that gives them, and everything a person is told (dispatch, refusal, sound cue, alarm) is addressed to a seat. A client shows
// what is addressed to its own seat; a run with no seat (tools/headless.js) has every nation played by the AI and nobody is told anything.
// Developer-only and test-only code is fenced here as in index.html, and tools/build.js strips every rules file (see BUILD.md).
'use strict';
const IM = { subs:{},
  on(t, f){ (this.subs[t] || (this.subs[t] = [])).push(f); },
  emit(t, a, b, c, d){ const L = this.subs[t]; if (L) for (let i = 0; i < L.length; i++) L[i](a, b, c, d); } };

/*@DEV*/
// developer switches (test build only; all off unless the client turns one on): the developer rules in rules/production.js read them
const DEV = {instant:false, research:false, res:false, reveal:false}, DEV_FILL = 500000;
/*@ENDDEV*/

// ---- seats
const isSeat = n => n >= 0 && !S.nations[n].ai;
function seats(){ const L = []; for (const N of S.nations) if (!N.ai) L.push(N.id); return L; }
const seatsBut = o => seats().filter(n => n !== o);   // the seats other than nation o (the ones on the receiving end of what o did)
// a seat's own records: dispatches (log), statistics, tutorial flags, advisor notes, morning papers, rally points, offers received, chats,
// battle reports. The first seat's are fields of S itself (the save format of the one-player game, so every old save loads unchanged);
// another seat's are in S.desks[n]. The verdict S.over is the one thing still kept once per game (see checkEnd in rules/state.js).
function desk(n){ for (const N of S.nations) if (!N.ai){ if (N.id === n) return S; break; }
  const D = S.desks || (S.desks = {}); return D[n] || (D[n] = {log:[], offers:[]}); }

// ---- reports: each one tells the clients what happened and nothing else. The first argument is the seat it is for
// a dispatch for seat n: kept in that seat's list (part of the save) and sent to the clients. Returns the entry (null when n is not a seat or there is no text)
function tell(n, text, kind, p = null){ if (text == null || !isSeat(n)) return null; const D = desk(n), L = D.log || (D.log = []), e = {h:S.hour, text, kind, p};
  L.unshift(e); if (L.length > 80) L.length = 80; IM.emit('log', n, text, kind, p); return e; }
// a dispatch for every seat; text and kind may be functions of the seat (the wording and the colour depend on who reads it)
function tellAll(text, kind, p = null){ for (const N of S.nations) if (!N.ai) tell(N.id, typeof text === 'function' ? text(N.id) : text, typeof kind === 'function' ? kind(N.id) : kind, p); }
// an order of seat n was refused (why), a sound cue for seat n, the alarm for seat n (the game drops to normal speed)
function refuse(n, why){ if (isSeat(n)) IM.emit('toast', n, why, 'bad', null); }
function cue(n, name){ if (n == null || isSeat(n)) IM.emit('sfx', n, name); }   // (n null: every client hears it)
function alarm(n){ if (!isSeat(n)) return; if (S.speed > 1){ S.speed = 1; } IM.emit('sfx', n, 'alarm'); }
// something to see at province p. by: the nation that did it, or null when only `to` should see it (a client shows it for its own seat's
// doing and for what its seat can see: the fog-of-war filter is the client's, with visibleSet(seat))
function fxAt(type, p, extra = {}, by = null, to = null){ IM.emit('fx', type, p, extra, {by, to}); }
// province ownership changed: the client rebuilds its border geometry
function geoChanged(){ IM.emit('geo'); }
// a seat's campaign statistics
const bump = (n, k, v = 1) => { if (!isSeat(n)) return; const D = desk(n), st0 = D.stats || (D.stats = {}); st0[k] = (st0[k] || 0) + v; };
