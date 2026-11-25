// distance to the capital: four ways to measure it, for real cities of the nations world (day 1 of seed 12345)
const R = require('./load.js')('', 'WORLD_W, ownedBy, hexDist, legHours, kmBetween, linkOf, KM_W');
const api = R.IM.api; api.useScenario('world64'); api.newGame(12345, 0, []); const S = R.S, G = R.G; S.started = true;
const lon0 = window.WORLD.lon0;
const lonOf = P => ((P.x/R.WORLD_W*360 + lon0) % 360 + 540) % 360 - 180;
const gc = (A, B) => { const r = Math.PI/180, la1 = A.lat*r, la2 = B.lat*r, dl = (lonOf(B) - lonOf(A))*r; const h = Math.sin((la2 - la1)/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dl/2)**2; return 2*6371*Math.asin(Math.min(1, Math.sqrt(h))); };
// hops over the holder's own land (and the sea, one hop per sea zone)
function hops(n, src){ const d = new Map([[src, 0]]), q = [src]; for (let i = 0; i < q.length; i++){ const u = q[i]; for (const v of G.P[u].nbs){ if (d.has(v)) continue; if (!G.P[v].sea && S.owner[v] !== n) continue; d.set(v, d.get(u) + 1); q.push(v); } } return d; }
// march time of an infantry unit (hours) over the holder's land, roads and rail, and by sea where it must (Dijkstra on legHours)
function march(n, src){ const dummy = {owner:n, u:{inf:1}, w:{}, at:src, to:null, path:[], m:80}; const d = new Map([[src, 0]]), done = new Set(); const pq = [[0, src]];
  while (pq.length){ pq.sort((a, b) => a[0] - b[0]); const [du, u] = pq.shift(); if (done.has(u)) continue; done.add(u);
    for (const v of G.P[u].nbs){ if (!G.P[v].sea && S.owner[v] !== n) continue; let h; try { h = R.legHours(dummy, u, v); } catch (e){ h = 24*G.P[u].nb.get(v)/1; } if (!isFinite(h)) continue; const nd = du + h; if (nd < (d.has(v) ? d.get(v) : 1e18)){ d.set(v, nd); pq.push([nd, v]); } } }
  return d; }
const want = process.argv.slice(2).length ? process.argv.slice(2) : ['Russia', 'United States', 'China', 'France', 'Brazil', 'Canada', 'Australia', 'India', 'Indonesia', 'Germany', 'United Kingdom', 'Japan', 'Poland', 'Chile'];
const capCheck = S.nations.find(N => N.name === 'France'); console.log('check Paris lon', lonOf(G.P[capCheck.capital]).toFixed(2), 'lat', G.P[capCheck.capital].lat.toFixed(2));
const out = [];
for (const nm of want){ const N = S.nations.find(x => x.name === nm); if (!N) continue; const C = G.P[N.capital], H = hops(N.id, N.capital), M = march(N.id, N.capital);
  for (const p of R.ownedBy(N.id)){ const P = G.P[p]; if (!P.city) continue; out.push({nation:nm, city:P.cityName, km:Math.round(gc(C, P)), hex:+R.hexDist(C.cc, P.cc).toFixed(1), hops:H.get(p) ?? -1, marchH:Math.round(M.get(p) ?? -1)}); } }
console.log(JSON.stringify(out));
