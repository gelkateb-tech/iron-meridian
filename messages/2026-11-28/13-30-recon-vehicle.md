**The Recon Vehicle is built on its own branch (`recon-vehicle`) and is not merged.** It passed an independent check and one repair, and all checks pass except the usual plate-to-figure gap check, which fails the same way on master. The sheets compare v73 (left) with the branch (right), on desktop and phone.

Pictures: `shots/2026-11-28/recon-vehicle/` (the `sheet-*` files are the comparisons; the rest are the single shots)

**Starting armies** (sheets: Russia, Germany and Belarus as the small nation)
- Every one of the 68 nations: the capital keeps 2 infantry + 1 artillery. Each of the two outer city stacks is now 2 infantry + 1 Recon Vehicle, where v73 had 2 infantry.
  - Russia: Saint Petersburg and Rostov.
  - Germany: Cologne and Munich.
  - Belarus: Vitebsk and Gomel.
- On the map the counter of a mixed stack still shows the infantry helmet. The recon icon appears in the stack panel, and on the counter of a recon vehicle on its own.

**What it does** (your approved defaults)
- **Sight 70 km, 80 km with the Mast-Mounted Sensors research.** No research or combination ever takes a stack without Special Forces past 80 km.
- **Armies inside that range are fully identified:** nation, name, unit types and counts. On the identification sheet, a Kazakh army 25 km away shows "Kazakhstan 1st Armored Division, 3 + 2 units" with the recon vehicle present, and "Unidentified army" with infantry only. An army 90 km away stays "?" either way. The hover tip now says "Identified by Recon Vehicle".
- Allies identify through your recon vehicles, and you through theirs.
- **Special Forces keep identifying** at 100 km.
- **A recon vehicle alone can't capture.** It sat 3 hours in an enemy province without taking it; with infantry, the province was taken.
- **Unit:** $30M, 30 hours at an Army Base level I, health 7, attack 2, defence 2, soft, speed 8 (infantry 4, IFV 7).
- **Research line** under Armoured Forces: Firepower and Protection in three steps each, Sensors (day 4), Uprated Powerpack (day 7, speed +1), Signature Reduction (day 10: a force of recon vehicles alone is only spotted by enemy ground forces within half their sight), and Recon Vehicle II (day 13).
- **Pictures:** only the recon pictures already made (45 unit pictures and 4 research pictures). No other picture changed and nothing was remade.

**What the check caught and the repair fixed**
- In one of four wartime test games, the computer split an army and sent the 2 recon vehicles left over to attack an enemy province on their own. Now the computer never leaves recon vehicles behind on their own when it splits, and never sends a recon-only force at foreign land. After the fix, 0 cases in 4 more 30-day wartime games.
- The hover tip still credited only "drone, satellite, special forces or radar". It now names the Recon Vehicle.
- Signature Reduction also halved the sight of enemy fleets. It now applies only to ground forces, as in the proposal.

**Numbers**
- In 30-day computer games, the computer fields about 150–220 recon vehicles worldwide, at most 6 per nation, all inside stacks.
- Turkey's daily income drops by 3 (190.7 instead of 193.7), from recon upkeep.
- Germany takes 11 provinces by day 30 in all 5 test games (was 8–11).
- Speed and save size are about the same. Old saves load unchanged.

**One choice made beyond the proposal:** the computer doesn't count recon vehicles when deciding whether an army is strong enough to attack. Without this, the extra recon vehicle made a starting stack look strong enough to march off, and Libya left its capital empty.

**Next:** it merges when you say so, after the merges already queued. The merges are still running one at a time (combat display, missiles, cities-redo), then the Dev Build, then Naval Yards.

---
Pictures: `shots/2026-11-28/recon-vehicle/`
