// Event bus singleton para propagar cambios (escrituras en DB) a los clientes
// conectados por SSE. Los handlers de routes/*.js emiten después de confirmar
// la escritura; el endpoint /api/events se suscribe y reenvía a los clientes.

const { EventEmitter } = require('events');

const bus = new EventEmitter();
bus.setMaxListeners(100); // permite muchos clientes SSE conectados simultáneamente

module.exports = bus;
