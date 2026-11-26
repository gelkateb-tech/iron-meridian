Rebels is built and ready for you to look at. The phone sheets are above (before on the left, after on the right). It is not merged.

**What you'll see**
- **City panel (sheet 1):** "MORALE 28% → 22% target, −0.7 a day", then the chance of a rising tonight, then one row per factor:
  - occupied city (base 60);
  - distance to your capital (−5 per 1,000 km, at most −30);
  - wars (−2 each);
  - neighbours held by Germany (−5 each);
  - neighbours at 40% morale or less (−7 per city, −4 per countryside province).

  Below the rows are the output line and the Annex City button. While annexing is under way, a progress bar shows the time left.
- **Annex City:** it heads the Build list. Prices:

  | City size | Cost | Time |
  |---|---|---|
  | Town | $50M · 10k | 3 days |
  | City | $80M · 15k | 4 days |
  | Large city | $120M · 25k | 5 days |
  | Metropolis | $180M · 40k | 6 days |

  An occupied city says "Occupied: annex the city to mobilize here".
- **Fire (sheets 2 and 3):** a city burns at 33% morale or lower, and the fire goes out at 34%. On phones it's a light flame with no glow.
- **Risings (sheets 4 and 7):** the chance rises from 0% at 33% to 50% at 25%, and halves for each of your units in the city.
  - With troops in the city, the rebels fight them for real and your troops get +25% dug in. In tests, 4 or more of your infantry always beat the rebels.
  - An empty city is lost, along with any annexing under way and what you paid for it.
  - Sheet 4's first row still shows an old message; sheet 7 shows the fixed version.
- **Occupying a trade partner (sheet 5):** over 30 days, Poland holding 4 German cities earned $643M less with Germany as a trade partner than without. $547M of that was lost trade. The trade route is lost, and your other routes pay 25% less until you annex the cities.

All checks pass, including balance, old saves and the 162-check rebels test.

**Questions** (also logged in `docs/QUESTIONS.md`; my default in brackets):
1. Your troops in a city never retreat from rebels and fight to the end. Is that what you meant by "the city stays mine"? (yes)
2. Should poor computer nations keep a smaller cash reserve before annexing? Vietnam never annexes now. (yes: half the price)
3. Keep the extra "Mobilisation" row in the morale list (−5 per mobilisation level, homeland only)? (yes)
4. Old saves get 24 hours with no risings. Is that enough, or should converted cities also never drop below 34%? (24 hours only)
5. Sabotage no longer destroys an annexing in progress, and land handed over keeps its old home country. OK? (yes)

Once you OK it, I'll bring Rebels up to date with today's merges, re-run all the checks and then merge. One small fix goes in then too: a duplicate message after rebels are crushed.

**Still running:** the merges, units in cities, and the city lots follow-up (A6 and A7). Missiles starts after Rebels is merged and the playtest fixes are in, as you asked.

---
Pictures: `shots/2026-11-26/rebels/`
