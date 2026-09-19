/* =====================================================================
   notion-book.js - the only thing that ever holds the Notion token.

   The joint is a static site on GitHub Pages. It has no server, so it
   cannot see a visitor's IP, and a Notion token put in the page source
   would be readable by anyone who opened devtools. This worker is the
   missing server: the page posts a name to it, the worker reads the IP
   off the request itself, and it writes the row to Notion.

   Deploy: see README.md in this folder.
   ===================================================================== */

const ALLOWED = [
  'https://lacaffar.github.io',
  'http://localhost:8080'          // drop this line once you are done testing
];

const NOTION_VERSION = '2022-06-28';

function cors(origin) {
  const ok = ALLOWED.includes(origin);
  return {
    'Access-Control-Allow-Origin': ok ? origin : ALLOWED[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function text(s, status, headers) {
  return new Response(s, { status, headers: { 'Content-Type': 'text/plain', ...headers } });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const head = cors(origin);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: head });
    if (request.method !== 'POST') return text('post only', 405, head);
    if (!ALLOWED.includes(origin)) return text('not your door', 403, head);

    let body;
    try {
      body = await request.json();
    } catch {
      return text('bad json', 400, head);
    }

    const name = String(body?.name ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
    if (name.length < 2) return text('no name', 400, head);

    /* Cloudflare puts the caller's real address here. This is the whole
       reason the worker exists: the browser cannot know it. */
    const ip = request.headers.get('CF-Connecting-IP') || '';

    /* Trim both. These are pasted into a dashboard field by hand, and a
       trailing newline riding along on the token is silently fatal: Notion
       answers 401 "API token is invalid" for a token that is otherwise
       perfectly good. */
    const token = String(env.NOTION_TOKEN ?? '').trim();
    const db = String(env.NOTION_DB ?? '').trim();

    if (!token || !db) {
      console.log('missing secret: token', !!token, 'db', !!db);
      return text('not configured', 500, head);
    }

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: db },
        /* Exactly the three things the notice on the door discloses, and
           nothing else. If you add a field here, add it to the notice in
           js/gate.js in the same commit. */
        properties: {
          'Name': { title: [{ text: { content: name } }] },
          'IP':   { rich_text: [{ text: { content: ip } }] },
          'Seen': { date: { start: new Date().toISOString() } }
        }
      })
    });

    if (!res.ok) {
      /* Never hand Notion's message back to the browser, it can name the
         database. The status alone is safe and is the whole diagnosis:
           401  the token is wrong
           403  the integration lacks insert capability
           404  the database is not shared with the integration, or the id
                is wrong, or the database is in the trash
           400  a property name or type does not match the table above
         Full text goes to the log, readable under Workers, Logs. */
      console.log('notion said', res.status, await res.text());
      return text('not written ' + res.status, 502, head);
    }

    return text('written', 200, head);
  }
};
