/* Servidor estático + réplica do endpoint /api/charges do site original (Vercel serverless). */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const PUBLIC = path.join(__dirname, 'public');

const ENTITY = '10116';
const REFERENCE = '955907771';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const charges = new Map();

function json(res, code, data) {
  const body = JSON.stringify(data);
  res.writeHead(code, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'public, max-age=0, must-revalidate',
  });
  res.end(body);
}

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => {
      raw += c;
      if (raw.length > 1e6) req.destroy();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(raw || '{}'));
      } catch (e) {
        resolve(null);
      }
    });
    req.on('error', () => resolve(null));
  });
}

function cleanup() {
  const now = Date.now();
  for (const [id, c] of charges) {
    if (c.status === 'pending' && now - c.created_at > 60 * 60 * 1000) {
      c.status = 'expired';
    }
    if (now - c.created_at > 7 * 24 * 60 * 60 * 1000) charges.delete(id);
  }
}
setInterval(cleanup, 60 * 1000).unref();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  if (pathname === '/api/charges') {
    if (req.method !== 'POST') return json(res, 405, { error: 'Método não permitido' });

    const body = await readBody(req);
    if (!body) return json(res, 400, { error: 'JSON inválido' });

    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return json(res, 400, { error: 'Valor inválido' });
    }

    const id = String(body.merchant_transaction_id || '').trim() ||
      'tk_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);

    const charge = {
      id,
      amount: Math.round(amount),
      method: body.method || 'GPR',
      status: 'pending',
      description: body.description || '',
      metadata: body.metadata || {},
      created_at: Date.now(),
    };
    charges.set(id, charge);

    return json(res, 200, {
      id: charge.id,
      amount: charge.amount,
      method: charge.method,
      status: charge.status,
      entity: ENTITY,
      reference: REFERENCE,
    });
  }

  const chargeMatch = pathname.match(/^\/api\/charges\/([^/]+)$/);
  if (chargeMatch) {
    const charge = charges.get(chargeMatch[1]);
    if (!charge) return json(res, 404, { error: 'Cobrança não encontrada' });
    return json(res, 200, {
      id: charge.id,
      amount: charge.amount,
      method: charge.method,
      status: charge.status,
    });
  }

  if (pathname === '/' || pathname === '') {
    return serveFile(res, path.join(PUBLIC, 'index.html'));
  }

  const target = path.join(PUBLIC, pathname.replace(/^\/+/, ''));
  if (!target.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end('<!DOCTYPE html><html lang="pt-PT"><head><meta charset="UTF-8"><title>404</title></head><body><h1>404</h1></body></html>');
  }

  serveFile(res, target);
});

function serveFile(res, file) {
  const ext = path.extname(file).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}

server.listen(PORT, HOST, () => {
  console.log(`Ticket.ao clone em http://localhost:${PORT}`);
});
