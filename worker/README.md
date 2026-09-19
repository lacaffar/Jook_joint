# The book

`notion-book.js` is the only server the joint has. The page posts a name to it,
it reads the caller's IP off the request, and it writes one row to Notion.

It exists because GitHub Pages cannot see an IP and a Notion token in page
source would be readable by anyone who opened devtools.

## What it writes

Exactly the three things the notice at `js/gate.js` discloses:

| Notion property | Type      | Source                          |
|-----------------|-----------|---------------------------------|
| `Name`          | Title     | what the visitor typed, max 40  |
| `IP`            | Rich text | `CF-Connecting-IP` header       |
| `Seen`          | Date      | server time at write            |

The property names are matched exactly and the types must match too, or
Notion rejects the write and the worker logs a 502. **If you add a field
here, add it to the notice in `js/gate.js` in the same commit.**

## 1. Notion

1. <https://www.notion.so/my-integrations> then New integration. Internal.
   Pick the workspace. Copy the Internal Integration Secret.
2. Make a database (full page, not inline) with the three properties above.
   `Name` is the title column, so it is already there. Add `IP` as Text and
   `Seen` as Date.
3. Open the database, `...` menu, Connections, and add the integration.
   **Skipping this is the usual reason writes fail.** The token alone grants
   nothing; the database has to be shared with it.
4. Get the database id out of the URL. It is the 32 hex characters after the
   workspace name and before `?v=`:

       notion.so/luke/1a2b3c4d5e6f7890abcdef1234567890?v=...
                       ^------------ this ------------^

## 2. Deploy

Either way, **this folder is the root**. Deploying from the repo root makes
wrangler guess the project is a static site, treat all 153 files as assets,
and fail on the 29 MiB pack file in `.git`.

### From the dashboard (no command line)

Workers & Pages, your `jook-joint` worker, Settings, Build.

- **Root directory**: `worker`
- **Build command**: `npx wrangler deploy`
- **Build variables**: none. They are build-time only and the running
  worker never sees them.

Retry the deployment. `wrangler.toml` in this folder supplies the name and
the entry point, so nothing is guessed.

Every push to `Jook_joint` triggers a rebuild, including pure content
changes to the website. Harmless, just noisy.

### From your machine

    npx wrangler login
    npx wrangler deploy

Either way you end up with `https://jook-joint.<subdomain>.workers.dev`.

## 3. Secrets

After the first successful deploy, not before.

### From the dashboard

Your worker, Settings, Variables and Secrets, Add. Add two, and set the
type to **Secret** rather than Text on both:

- `NOTION_TOKEN`, the Internal Integration Secret
- `NOTION_DB`, the 32 hex characters from the database URL

Deploy once more so the running worker picks them up.

### From your machine

    npx wrangler secret put NOTION_TOKEN
    npx wrangler secret put NOTION_DB

Secrets survive later deploys, so this is a one time step. Setting them as
**build** variables does not work: those exist only while the build runs.

## 4. Point the page at it

Two edits that have to ship together, or the browser blocks the call:

- `js/gate.js`, set `LOG_TO` to the worker URL
- add that same origin to `connect-src` in the CSP meta tag, in all 19 HTML
  files that load `gate.js`

## Checking it

    curl -X POST https://jook-joint.<subdomain>.workers.dev/ \
      -H 'Content-Type: application/json' \
      -H 'Origin: https://lacaffar.github.io' \
      -d '{"name":"curl test"}'

`written` means the row landed. `not written` means Notion refused: run
`npx wrangler tail` and knock again to see what it said. Nearly always the
database was not shared with the integration, or a property name or type
does not match.

Rows written from curl carry your own IP. Delete the test rows.

## Note

`ALLOWED` in the worker still holds `http://localhost:8080` for testing.
Drop that line once the real URL works.
