const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'cobranza.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS invoices (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    empresa         TEXT NOT NULL CHECK(empresa IN ('DLG', 'SMGS')),
    uuid            TEXT UNIQUE NOT NULL,
    serie           TEXT,
    folio           TEXT,
    fecha_emision   TEXT NOT NULL,
    moneda          TEXT DEFAULT 'MXN',
    tipo_cambio     REAL,
    subtotal        REAL NOT NULL,
    iva             REAL DEFAULT 0,
    iva_retenido    REAL DEFAULT 0,
    total           REAL NOT NULL,
    rfc_emisor      TEXT,
    nombre_emisor   TEXT,
    rfc_receptor    TEXT NOT NULL,
    nombre_receptor TEXT NOT NULL,
    concepto        TEXT,
    metodo_pago     TEXT,
    forma_pago      TEXT,
    uso_cfdi        TEXT,
    proyecto        TEXT,
    fecha_tentativa_pago TEXT,
    comentarios     TEXT,
    estado          TEXT DEFAULT 'PENDIENTE',
    fecha_pago      TEXT,
    xml_filename    TEXT,
    created_at      TEXT DEFAULT (datetime('now')),
    updated_at      TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS company_rfcs (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    rfc     TEXT UNIQUE NOT NULL,
    empresa TEXT NOT NULL CHECK(empresa IN ('DLG', 'SMGS'))
  );

  CREATE TABLE IF NOT EXISTS client_aliases (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    rfc_receptor    TEXT UNIQUE NOT NULL,
    nombre_original TEXT,
    alias           TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_empresa ON invoices(empresa);
  CREATE INDEX IF NOT EXISTS idx_estado ON invoices(estado);
  CREATE INDEX IF NOT EXISTS idx_rfc_receptor ON invoices(rfc_receptor);
  CREATE INDEX IF NOT EXISTS idx_fecha_emision ON invoices(fecha_emision);
  CREATE INDEX IF NOT EXISTS idx_fecha_tentativa ON invoices(fecha_tentativa_pago);
`);

// Seed default company RFCs if empty
const count = db.prepare('SELECT COUNT(*) as c FROM company_rfcs').get();
if (count.c === 0) {
  const insert = db.prepare('INSERT INTO company_rfcs (rfc, empresa) VALUES (?, ?)');
  // These will be auto-detected from XML emisor RFCs or configured via settings
  insert.run('DLG200820EE4', 'DLG');
  insert.run('SMG200820ABC', 'SMGS');
}

module.exports = db;
