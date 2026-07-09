# Swifty's Jook Joint 🦝

A cozy, multi-page personal site in the small-web / [dimden.dev](https://dimden.dev/) style.
Hand-built with plain HTML, CSS, and a little vanilla JS - no frameworks, no build step.

## Pages
| File | Room |
|------|------|
| `index.html`     | Home - neon sign, **systems status**, rooms grid, jukebox ticker |
| `fnaf.html`      | Five Nights at Freddy's - flickering office |
| `stardew.html`   | Stardew Valley - the farm |
| `undertale.html` | Undertale - dialogue box + save point |
| `fencing.html`   | Fencing - interactive scoring lights |
| `hamilton.html`  | Hamilton - my shot, cast recording ranked |
| `guestbook.html` | Guestbook - sign it; entries saved in the browser |
| `404.html`       | Friendly not-found page |

## The bits that move
- **Raccoon cursor-follower** - `js/raccoon.js`. A self-contained pixel SVG that chases your
  mouse, faces the way it runs, and occasionally chitters. Hidden on touch screens and dialled
  down for `prefers-reduced-motion`.
- **Systems status panel** - `js/site.js`. The top two entries (your work page + Windpack) are
  *live-pinged*: if the site loads, it shows `[ OK ]`, otherwise `[ DOWN ]`.
- **Guestbook** - `guestbook.html` + `js/site.js`. Visitors sign with a name, a mood emoji, and a
  message; entries persist in `localStorage`. Because GitHub Pages has no backend, signatures are
  saved **per-browser** (each visitor sees their own + the seed entries). To make it a *shared*
  guestbook everyone can see, wire it to a free backend later - e.g. [giscus](https://giscus.app)
  (GitHub Discussions) or a form service like Formspree.
- **Visitor counter** - `js/site.js` (`#hits`). A retro hit counter that ticks up per visit
  (stored in `localStorage`, starting from a small base for vibes).

## How to customise
1. **Your systems** - edit the `SYSTEMS` array near the top of [`js/site.js`](js/site.js).
   When Windpack gets its own domain, swap its `url` and `ping` (the `ping` must be an **image**
   URL on that site, e.g. a favicon or logo).
2. **Theme colors** - each room re-skins itself by overriding CSS variables in
   [`css/style.css`](css/style.css) (search for `body.room-fnaf`, `body.room-stardew`, etc.).
3. **Content** - anything marked with a `✎` note in a page is a placeholder meant for you.
4. **Site name / handle** - replace "Swifty" / "Swifty's Jook Joint" throughout if you like.

## Run it locally
It's static - just open `index.html` in a browser. Or serve the folder:
```bash
# from inside personal.page/
python -m http.server 8080      # then visit http://localhost:8080
```

## Deploy
Any static host works. Two easy options:

- **GitHub Pages** - make this folder a repo, push it, then in *Settings → Pages* serve from the
  `main` branch root. Links are all relative, so it works at a subpath too.
- **Neocities** - drag-and-drop the whole `personal.page` folder into your dashboard.

Because every link is relative (`fnaf.html`, `css/style.css`, …), the site runs the same from
`file://`, a subfolder, or a custom domain like `personal.site`.
