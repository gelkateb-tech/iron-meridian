**Starting armies is done (2 fix rounds used, final review READY), and the recon vehicle proposal is ready. Nothing is merged.** The 3 sheets above show master on the left and the branch on the right, phone size, day 1: Russia, Germany and Belarus as the small nation.

Pictures: `shots/2026-11-27/start-armies/`

**The new start (every nation, players and computer alike)**
- Capital: 2 infantry and 1 artillery, plus the Air Superiority Fighter at its Airbase.
- Two outer stacks of 2 infantry each. The recon vehicle joins each stack once you OK it, a one-line change already in place and tested.
- No tanks, no other city garrisons and no border guards.
- That's 8 units a nation, or 10 with recon. Russia goes from 44 units in 19 stacks to 8 in 4, and Germany from 33 to 8.
- New games only: old saves keep their armies.

**My rule for the two cities:**
1. The first stack goes to your biggest city outside the capital.
2. The second goes to your biggest city on another side of the capital (at least 60° apart as seen from it), or one far from the first.
3. A city on another nation's border or on a highway counts as 50% bigger.
4. Only cities you can reach over your own land count, never one next to the capital or next to the other stack.

**What the rule picks:**
- Russia: Saint Petersburg and Rostov
- Germany: Cologne and Munich
- Belarus: Vitebsk and Gomel
- USA: Los Angeles and New York
- China: Guangzhou and Shenyang

The full list of 68 is in `docs/START-ARMIES-CITIES.txt`.

**What changed for the computer:** with the smaller start, the computer marched its whole capital force away, leaving 40 of 68 capitals empty. That's fixed: in peace it keeps its capital force home until it holds 4 infantry. Now no capital is empty after 1 or 3 days.

**Checks:**
- Balance, the 68-nation balance, economy and combat all pass. All 68 nations are alive at day 60.
- Expansion is about the same as master: 300 independent provinces taken by day 10, against 335 on master.
- The same-seed test file was re-recorded because of the capital fix.

**Honest points:**
- **Empty cities:** about 250 computer cities stand empty on day 60, against 70–90 on master, so an early attacker meets fewer garrisons. In forced early wars, defenders did no worse than on master. A small habit could send the nearest units into border cities when war is declared; it's not built.
- **Some weak picks:** Ethiopia gets two distant towns because its big cities sit next to the capital. The UK's second stack is Bournemouth. Brazil, Turkey and Poland have both stacks on one side.
- **Map quirks, separate data fixes:**
  - New Zealand's capital sits on the South Island, so Auckland can't be picked.
  - The West Bank cuts Israel off from Haifa.
  - The Philippines and Indonesia link across a strait the map treats as land.
- **One check couldn't finish:** the disk filled up during the last full run, and one balance run crashed loading the page. It passed fully on the earlier commit. I've freed 3 GB, and I'll re-run it at merge.

**Recon vehicle proposal** (full text in `docs/RECON-VEHICLE-PROPOSAL.md`)
- **Stats:** $30M and 30 h to build, at Army Base I, known from day 1.
  - Speed 8, the fastest ground unit (infantry 4, IFV 7).
  - Health 7 and attack 2, against infantry's 10 and 3, so it's weak in a fight.
  - It counts as a soft target, so it shares damage with the infantry it travels with.
- **Sight, two options:**
  - **A:** 70 km, or 80 km with research.
  - **B:** 60 km, or 70 km with research.
  - Infantry sees 50 km and Special Forces 100 km. I recommend A: it never sees past artillery reach.
- **Its ability:** every enemy army inside its sight is fully identified (types and counts), for you and your allies. Other ground units only see that something is there.
- **Research line:** Firepower and Protection, plus Mast-Mounted Sensors, Powerpack and Signature Reduction. Nothing extreme.
- **The computer:** builds a few (about 1 for every 10 ground units, at most 6) and keeps them inside stacks.
- **Pictures:** the same 45-picture set as other units, plus 4 research pictures. About $2.1–2.3 as a batch, or about $0.7 for look 1 only. First there's one test picture for about $0.09, per your rule.
- **Credit:** your $24.05 would stay above $18 even after the unit pictures that stopped at the floor.

**Questions** (my default in brackets)
1. Merge starting armies as it is? (yes, after the waypoint fix merges, with the balance re-run)
2. Should the computer send units into its border cities when war is declared on it? (yes, as a small follow-up)
3. Recon sight: A (70/80 km) or B (60/70 km)? (A)
4. Recon vehicle: OK to add it, starting with the single test picture at about $0.09? (yes)
5. Keep Special Forces identifying at 100 km as well? (yes)
6. Should a lone recon be able to capture provinces? (no: it scouts, it doesn't hold)

**Also:** the Naval Yard follow-up started in the slot that freed up. I also fixed a mistake of mine in `docs/QUEUE.md`: an earlier edit had cut off the lower half of the file. It's restored from the history, and nothing in the game was affected.

---
Pictures: `shots/2026-11-27/start-armies/`
