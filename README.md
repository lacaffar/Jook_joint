# Swifty's Jook Joint 🦝

A cozy, multi-page personal site in the small-web / [dimden.dev](https://dimden.dev/) style -
except **every room is a playable game**. Hand-built with plain HTML, CSS, and vanilla JS.
No frameworks, no build step, no image or extra audio assets (all art is CSS/emoji/inline SVG,
all new sound is synthesized with the WebAudio API).

## Rooms & games
| File | Room | The game |
|------|------|----------|
| `index.html`     | The bar | Interactive scene: themed doors, jukebox, tip jar, light switch, a territorial trash can, and a certain ↑↑↓↓←→←→BA code |
| `fnaf.html`      | The office | **One Night at Swifty's** - doors, lights, cameras, draining power, 12AM→6AM, escalating nights |
| `stardew.html`   | Raccoon Hollow | **Walkable farm** - WASD around a tile map; till → plant → water → sleep → harvest 9 parsnips; villagers, mine |
| `undertale.html` | The encounter | **FIGHT / ACT / ITEM / MERCY** battle with bullet-hell dodging; ACT your way to the pacifist spare |
| `fencing.html`   | The piste | **Allez!** - directional reaction duel; foil/sabre roll right-of-way (attack vs parry), épée is a speed race |
| `hamilton.html`  | Weehawken, dawn | **The Duel of Wits** - 10 history/show questions; every miss, Burr takes a pace closer |
| `guestbook.html` | Guestbook | Wax-seal moods, entries saved per-browser. The raccoon's entry is... encoded |
| `backroom.html`  | The back room | 🔒 **Secret.** Unlocks with all five bottle caps: certificate, credits, stats, reset |
| `404.html`       | Lost | Dig a door out of the raccoon's trash can |

## The Bottle Cap Hunt (site-wide meta-puzzle)
Win the game in each of the five main rooms and the raccoon tosses you a **bottle cap**
(`js/quest.js`, stored in `localStorage.sjj_caps`). Collect all five and a **sixth door**
fades into the bar on the home page → the Back Room.

## Shared machinery
- **`js/quest.js`** - the cap system: `SJJQuest.award/has/count/all/renderShelf`, toasts, the
  `sjj:caps` event. Any element with `data-cap-shelf` renders the collection.
- **`js/sfx.js`** - `SFX.*` synth sounds (blips, coins, static, jumpscare…). Mute toggle in the
  topbar, persisted.
- **`js/site.js`** - jukebox (real MP3s in `audio/`), systems status pings, hit counter, guestbook.
- **`js/raccoon.js`** - the pixel raccoon cursor-follower; exports `window.RaccoonSVG` for the
  battle sprite, jumpscare, konami party and back room.
- **Per-room code** - each page loads its own `css/<room>.css` + `js/rooms/<room>.js`, so every
  room can look and behave like a different game.

## Progress kept in localStorage (`sjj_*`)
`sjj_caps`, `sjj_fnaf_night`, `sjj_fencing_best`, `sjj_hamilton_best`, `sjj_stardew`,
`sjj_tipjar`, `sjj_lights`, `sjj_mute`, `sjj_save`, `sjj_guestbook`, `sjj_hits`.
The Back Room has a reset button.

## Accessibility & phones
Every game is touch-playable (D-pad on the farm, drag-the-heart in the battle, tap zones on the
piste). Flashing/shake effects calm down under `prefers-reduced-motion`; the cursor raccoon
hides on touch screens; door hotspots have a plain-text fallback list.

## Run it locally
It's static - just open `index.html`, or:
```bash
# from inside personal.page/
python -m http.server 8080      # then visit http://localhost:8080
```

## Deploy
Any static host (GitHub Pages, Neocities, …). All links are relative, so it works at a
subpath or `file://` too.
