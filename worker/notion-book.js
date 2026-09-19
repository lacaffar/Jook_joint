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

    const res = await fetch('https://api.notion.com/v1/pages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.NOTION_TOKEN}`,
        'Notion-Version': NOTION_VERSION,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_DB },
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
      /* never hand Notion's error back to the browser, it can name the
         database. log it and tell the page nothing useful. */
      console.log('notion said', res.status, await res.text());
      return text('not written', 502, head);
    }

    return text('written', 200, head);
  }
};
