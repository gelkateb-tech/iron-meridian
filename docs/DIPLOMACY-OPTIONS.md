# Diplomacy: layout options (owner point 14, 2026-11-25)

Status: proposal only. No game code changed. The mockups are scratch copies of the test page with the Diplomacy panel replaced by option A, B or C; they use the game's own styles and the real state (US, day 41, 68-nation world: 3 wars, 6 allies in one coalition plus a second coalition, 8 trade routes, 2 offers waiting, an embargo, a ceasefire, captured land). Sheets (desktop 1440x900 at 2x, phone 440 px at 3x): `0-today.jpg`, `option-A.jpg`, `option-B.jpg`, `option-C.jpg`. They are kept outside the repository (see the report); this file holds the text and the button inventory.

Related, on `auto-test/fixes` (read only, nothing repeated here): B2.22 (phone: the "More" menu opens off the left edge and cuts off Declare war, passage, alliance, route and Embargo; still visible on master in `0-today.jpg`) and IMP-17 (opening Diplomacy takes about 1.5 s on an older phone, and `blocs()` writes state while drawing). Decisions that bear on this screen: ECO-13 (gifts only inside a bloc), DIP-4 (embargo is a real rule), DIP-5 (territory sales). None is changed by any option.

## Today: what the screen offers (`diploHTML` in `index.html`, `tradeHTML`, `nationHTML`)

Header: Show/Hide relations on map, close (X), Back to the map.

Offers on top (per offer): treaty or trade proposal: Accept, Decline; territory offer: Accept, Counter..., Decline; a line for each declaration of war on you.

Trade routes (table, up to 8 routes): per route Show, Escort (sea routes), Pause route / Resume, Close = 3 to 4 buttons (31 for the 8 routes in the test state); Open a route with... (list) + Open route; chips for closed routes with a reopen button.

Coalitions: Rename, Leave coalition (and a name box); founding one needs an alliance.

Per nation (one row each, 67 rows). Not every button shows every time; this is the full set:

| Group | Buttons | Shown when |
|---|---|---|
| Talk | Message, Trade deal | always |
| Treaties | Propose peace, Pay $X for peace (tribute) | at war |
| | Offer NAP | peace, ceasefire |
| | Ask passage | peace, NAP |
| | Propose alliance | not allied |
| | Declare war | not at war, not in ceasefire |
| Trade | Open trade route / Close trade route | not at war |
| | Embargo / Join embargo / Lift embargo | always |
| Land and gifts | Territory | you hold captured land, or the nation is a person's seat, or an offer is open |
| | Give | same coalition |
| | Gift $50M | allied or same coalition |

Behind the nation window (Message / Trade deal / Territory / Give tabs): six quick messages and Send; the deal grid (resources both ways, treaties as tick boxes) with Send proposal and Clear; province rows with Show on map, Offer to sell/buy, Cancel, Withdraw; the coalition gift form. These stay as they are in all three options (they are the "second level" already).

Count in the test state, 67 nations: 581 buttons plus 67 "More" menus = 648 controls in the rows; 7 to 10 per row; 5 to 6 visible at rest. Every relation shows the same row of equal buttons; the one that matters (the next step) is only marked by colour. Sheet: `0-today.jpg`.

## Option A: one next step plus one Actions menu (`option-A.jpg`)

Same list and sections. Each row shows 2 controls: a next-step button chosen from the relation (war: Propose peace; peace: Offer NAP, then Ask passage, then Propose alliance; ceasefire or ally: Message) and `Actions ▾`, a menu in labelled groups (Talk, Treaties, Trade, Land and gifts, War). Trade routes keep their table: Show plus a `⋯` menu (Escort, Pause, Close).
- At rest: 2 per nation row (134 for 67), 2 per route row (16, was 31). All 581 nation actions reachable (checked by script).
- Pro: smallest change, same places, same keyboard/tap habits; the nation window and everything else untouched; easy to build (one function).
- Con: still a long list of 67 rows; a menu is one more tap for Message and Trade deal on non-allies; the menu must open inside the screen on a phone (B2.22).

## Option B: relation-first list, one button per row, nation card (`option-B.jpg`)

List grouped by relation (At war, Allies and coalition, Treaties and ceasefire, At peace neighbours, then the rest collapsed). A row has the name, relation, opinion and ONE button (the same next step as A). Tapping the row opens the nation's card: every action in labelled groups, no menus (desktop: a pane on the right; phone: the card opens under the row). The route table becomes one row of chips; a route's Show / Escort / Pause / Close sit in its nation's card (group "This trade route"). Coalitions fold into one line.
- At rest: 1 button per row; the card shows 8 to 12 buttons for ONE nation only. Reachable: all 581 plus the 20 route buttons (script checked for all 67 nations).
- Pro: the calmest screen; fits the real order of play (who am I at war with, who are my friends); the card is the natural place for the opinion reasons, the likely-answer line and the route.
- Con: most work (new list, card, selection state, phone accordion); every uncommon action costs a tap on the row first; changes where trade routes live.

## Option C: a card per nation, three labelled buttons (`option-C.jpg`)

Cards in a grid (one column on a phone), war cards edged red. Each card: name, relation, opinion bar, the likely-answer line, then three buttons: Message, `Treaties & war ▾` (peace, NAP, passage, alliance, tribute, Declare war) and `Trade & gifts ▾` (route and its Show / Escort / Pause / Close, embargo, trade deal, Territory, Give, Gift).
- At rest: 3 per card (201 for 67). All reachable (script checked).
- Pro: no hidden "More"; the menu names say what is inside; the opinion bar and the answer are visible without hover.
- Con: cards are taller than rows (about 2 cards per screen on a phone); 67 cards need the relation grouping and a collapse to be usable; two menus where A has one.

## Recommendation

B if the owner wants the screen really calm and is happy to pay for it; otherwise A as a quick first step. A and B share the next-step rule and the grouped action list, so A can be built first and grown into B later (the card is A's menu laid open). C is the weakest: it keeps the long list and adds a second menu. Suggest: build A now, keep B as the follow-up; in either, fix the phone menu edge (B2.22) and fold the 60 nations at peace and without borders into one collapsed block.

## Limits of the mockups

Menus are native `details` elements, the next-step rule is only the one above, the unread badge and hints are the real ones. Not drawn: the route chip opening its nation's card (B, C), keyboard use, the territory and give tabs (unchanged). Nothing here is tested for speed (IMP-17 is a separate fix on `auto-test/fixes`).
