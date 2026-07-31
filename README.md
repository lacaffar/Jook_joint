# Swifty's Jook Joint

A cozy, multi-page personal site in the small-web / [dimden.dev](https://dimden.dev/) style -
except **every room is a playable game**. Hand-built with plain HTML, CSS, and vanilla JS.
No frameworks, no build step, no image or extra audio assets (all art is CSS/emoji/inline SVG,
all new sound is synthesized with the WebAudio API).

## Rooms & games
| File | Room | The game |
|------|------|----------|
| `index.html` | The bar | Interactive scene: themed doors that swing on their hinges, jukebox, a Kingdom coin pouch with real coin physics, light switch, a territorial trash can, and a certain ↑↑↓↓←→←→BA code |
| `fnaf.html` | The office | **One Night at Swifty's** - doors, lights, cameras, draining power, 12AM→6AM, escalating nights |
| `stardew.html` | Raccoon Hollow | **Walkable farm** - WASD around a tile map; three crops with seed costs and multi-night growth, stamina, rain, a store, fishing, a mine. Two goals: grandpa's 9 parsnips, and 2,500g for **the ring**. Optional **rival mode** races you for it |
| `undertale.html` | The encounter | **FIGHT / ACT / ITEM / MERCY** battle with bullet-hell dodging; ACT your way to the pacifist spare |
| `fencing.html` | The piste | **Allez!** - directional reaction duel; foil/sabre roll right-of-way (attack vs parry), épée is a speed race |
| `hamilton.html` | Weehawken, dawn | **The Duel of Wits** - 10 history/show questions; every miss, Burr takes a pace closer |
| `medieval.html` | The keep | Six favourite castles on a curtain wall. Five gates are struck off the list; one still opens |
| `coucy.html` | The great donjon | Behind the one open gate: an in-depth history of the largest keep ever built, plus **Hold the Donjon** - match each way of taking a castle to the feature built to stop it. Earns a bonus cap |
| `guestbook.html` | Guestbook | Wax-seal moods, entries saved per-browser. The raccoon's entry is... encoded |
| `backroom.html` | The back room | **Secret.** Unlocks with all five bottle caps: certificate, credits, stats, reset |
| `404.html` | Lost | Dig a door out of the raccoon's trash can |

## Bar hours (`js/gate.js`)
The joint is **shut from 8am to 5pm** local time. During the day every page shows a
CLOSED sign with a password box; get it right once and the device is remembered
(`localStorage.sjj_pass`). It is a doorman, not a lock - the password is a constant at
the top of `js/gate.js`, along with the two hours, and those three lines are the only
ones meant to be edited. The script loads from `<head>` so nothing flashes up behind
the sign.

## The Bottle Cap Hunt (site-wide meta-puzzle)
Win the game in each of the five main rooms and the raccoon tosses you a **bottle cap**
(`js/quest.js`, stored in `localStorage.sjj_caps`). Collect all five and a **sixth door**
fades into the bar on the home page → the Back Room.

**Bonus caps** never count toward that door — `js/quest.js` keeps them in `EXTRA`, apart
from the five in `ROOMS`:
- `coucy` — survive all six assaults in Hold the Donjon.
- `tips` — overflow five coins out of the tip pouch and the raccoon carries the whole bag
  off screen, leaving his own cap behind. Marked `secret`, so it stays off the shelf until
  it is earned.

## Reskinning the Stardew sweetheart
The character the ring is for is a deliberate placeholder. Two edits swap them in:
`SWEETHEART` at the top of `js/rooms/stardew.js` (name, and drop the `placeholder` flag),
and the `.npc-sweetheart` block in `css/stardew.css` (give it a sprite sheet the way
`.farm-sprite.player` does). Both are commented in place.

## Shared machinery
- **`js/gate.js`** - bar hours + the password door. Loads first, from `<head>`.
- **`js/quest.js`** - the cap system: `SJJQuest.award/has/count/all/renderShelf`, toasts, the
  `sjj:caps` event. Any element with `data-cap-shelf` renders the collection.
- **`js/sfx.js`** - `SFX.*` synth sounds (blips, coins, static, jumpscare…). Mute toggle in the
  topbar, persisted.
- **`js/site.js`** - jukebox (real MP3s in `audio/`), the now-playing readout in the top right,
  systems status pings, hit counter, guestbook.
- **`js/raccoon.js`** - the pixel raccoon cursor-follower. He trails half a second behind the
  cursor and keeps his distance. Exports `window.RaccoonSVG` for the battle sprite, jumpscare,
  konami party and back room, plus `window.SJJRaccoon.steal(node, done)` - walk over, pick a
  thing up, and leave with it.
- **Per-room code** - each page loads its own `css/<room>.css` + `js/rooms/<room>.js`, so every
  room can look and behave like a different game.

## Progress kept in localStorage (`sjj_*`)
`sjj_caps`, `sjj_fnaf_night`, `sjj_fencing_best`, `sjj_hamilton_best`, `sjj_stardew`,
`sjj_tipjar`, `sjj_lights`, `sjj_mute`, `sjj_save`, `sjj_guestbook`, `sjj_hits`,
`sjj_pass`, `sjj_music_hint`. The Back Room has a reset button.

The tip pouch is deliberately **not** in that list as a savings account: `sjj_tipjar` is a
running lifetime total for the stats shelf, but the pile itself starts empty every visit.

## Accessibility & phones
Every game is touch-playable (D-pad on the farm, drag-the-heart in the battle, tap zones on the
piste). Flashing/shake effects calm down under `prefers-reduced-motion`; the cursor raccoon
hides on touch screens; door hotspots have a plain-text fallback list.

## Run it locally
It's static - just open `index.html`, or:
```bash
# from inside personal.page/
python -m http.server 8080 # then visit http://localhost:8080
```

## Deploy
Any static host (GitHub Pages, Neocities, …). All links are relative, so it works at a
subpath or `file://` too.
