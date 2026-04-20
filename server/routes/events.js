const express = require('express');
const bus = require('../events');

const router = express.Router();

const EVENT_TYPES = ['invoices:changed', 'aliases:changed', 'settings:changed'];

// GET /api/events — Server-Sent Events stream.
// Los clientes mantienen esta conexión abierta y reciben eventos cada vez
// que otro cliente modifica algo. Auth por Cloudflare Zero Trust cookie.
router.get('/', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders?.();
  res.write('retry: 3000\n\n');
  res.write(': connected\n\n');

  const listeners = {};
  for (const type of EVENT_TYPES) {
    const listener = (payload = {}) => {
      res.write(`event: ${type}\n`);
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    };
    listeners[type] = listener;
    bus.on(type, listener);
  }

  // Heartbeat cada 25 s para evitar cortes por idle (Cloudflare ~100 s).
  const heartbeat = setInterval(() => {
    res.write(': ping\n\n');
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    for (const type of EVENT_TYPES) bus.off(type, listeners[type]);
    res.end();
  });
});

module.exports = router;
