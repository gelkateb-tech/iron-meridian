# Questions for the owner (playtest session)

The session does not stop to ask (owner's request 2026-11-21): each question is logged here and the work carries on with the default
named under it. Answer in any order; the number is enough ("Q3: yes").

Format (copy the block):

```
## Q<n>. <the question, one line>   (round <r>)

**Why it matters.** One or two sentences, with the evidence.
**Options.** A ... / B ... (suggested answer in bold)
**Until you answer.** What the session does meanwhile.
```

---

<!-- Questions go below, newest last. -->

## Q1. "Embark/disembark cooldowns": is the boarding and landing time (45 minutes each) the cooldown you mean?   (setup)

**Why it matters.** Your request asks the harness to cover embark/disembark "and their cooldowns". The rules have no separate cooldown: boarding
takes 45 minutes, landing 45 minutes (never under 15 with upgrades), and a force fights its first day ashore at the landing penalty
(docs/DECISIONS.md EMB-2 to EMB-4).
**Options.** **A: yes, those times and the first-day penalty are the cooldowns; test those.** B: you want a real cooldown (for example no
re-boarding for some hours after landing): that is a new rule for you to decide, not something the session adds.
**Until you answer.** The harness checks the 45-minute times (`headless.js --scenarios`), the 15-minute floor and boarding, landing and
rearm timers that stop counting down (`--invariants`, and rule mutants in `--selftest`), and that no force boards or lands outside a naval
city (Marines aside). The first-day landing penalty is not checked yet (round 1).
