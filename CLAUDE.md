# CLAUDE.md

## Proyecto

Sistema web de gestión de cobranza para un despacho de abogados con dos empresas: **DLG** y **SMGS**. Reemplaza un proceso manual en Excel. Parsea XMLs de facturas CFDI (3.3/4.0), extrae datos fiscales automáticamente y ofrece dashboard, alertas, filtros y exportación.

## Comandos

```bash
npm run dev          # Desarrollo: Express (:3000) + Vite (:5173) con hot reload
npm run build        # Build de producción del frontend
npm start            # Producción: Express sirve el build estático en :3000
docker compose up -d --build   # Docker: todo en un contenedor
```

Instalar dependencias: `npm install` en raíz y `cd client && npm install`.

## Arquitectura

Monorepo con dos paquetes (sin workspaces, scripts manuales):

- `server/` — Node.js + Express (CommonJS, require)
- `client/` — React 18 + Vite + TailwindCSS (ESM, import)
- `data/cobranza.db` — SQLite (better-sqlite3), creado automáticamente al arrancar

### Backend

| Archivo | Responsabilidad |
|---|---|
| `server/index.js` | Entry point Express, monta rutas, sirve static build |
| `server/db.js` | Conexión SQLite, crea tablas al arrancar (invoices, company_rfcs, client_aliases) |
| `server/utils/xmlParser.js` | Parsea CFDI 3.3/4.0 con fast-xml-parser, extrae UUID, emisor, receptor, impuestos, conceptos |
| `server/routes/upload.js` | POST /api/upload — multer multipart, parsea XMLs, detecta empresa por RFC, rechaza duplicados por UUID |
| `server/routes/invoices.js` | GET (con filtros, paginación, LEFT JOIN aliases), PATCH (campos manuales), DELETE, POST bulk-delete. Exporta `computeEstadoVisual()` |
| `server/routes/dashboard.js` | GET /api/dashboard — KPIs, statusCounts, monthlyChart, topClientes, listas de alertas |
| `server/routes/export.js` | GET /api/export — genera .xlsx con exceljs respetando filtros |
| `server/routes/aliases.js` | CRUD de client_aliases (upsert por rfc_receptor) |
| `server/routes/settings.js` | CRUD de company_rfcs + POST /api/settings/reassign para reasignar facturas existentes |

### Frontend

| Archivo | Responsabilidad |
|---|---|
| `client/src/App.jsx` | Router: /, /dlg, /smgs, /configuracion |
| `client/src/api.js` | Wrapper fetch para todas las llamadas al backend |
| `client/src/pages/DashboardPage.jsx` | Dashboard con KPIs, gráficas, tablas de alertas. Toggle consolidado/DLG/SMGS |
| `client/src/pages/CompanyPage.jsx` | Página por empresa: upload, alertas, filtros, tabla |
| `client/src/pages/SettingsPage.jsx` | Configuración: RFCs por empresa + alias de clientes |
| `client/src/components/InvoiceTable.jsx` | Tabla principal: edición inline por celda, checkboxes, bulk delete, modal de pago, copiar UUID |
| `client/src/components/FilterBar.jsx` | Filtros combinables + búsqueda libre |
| `client/src/components/UploadZone.jsx` | Drag & drop + selector de carpeta |
| `client/src/components/AlertPanel.jsx` | Contadores expandibles de sin fecha / próximas / vencidas |
| `client/src/components/DashboardCards.jsx` | Tarjetas KPI |
| `client/src/components/DashboardCharts.jsx` | Gráficas Recharts (pie, barras, barras horizontales) |
| `client/src/components/Sidebar.jsx` | Nav lateral colapsable |
| `client/src/components/StatusBadge.jsx` | Badge de estado con color |
| `client/src/components/AliasModal.jsx` | Modal para asignar alias a un cliente |
| `client/src/components/ConfirmModal.jsx` | Modal de confirmación propio (reemplaza confirm() nativo) |
| `client/src/components/ExportButton.jsx` | Botón de descarga Excel |

## Base de datos

Tres tablas en SQLite:

- **invoices** — datos del CFDI + campos manuales (proyecto, fecha_tentativa_pago, comentarios, estado, fecha_pago)
- **company_rfcs** — mapeo RFC emisor → empresa (DLG/SMGS) para auto-detección
- **client_aliases** — mapeo RFC receptor → alias para nombres legibles

## Lógica de estados

Se calcula en runtime (`computeEstadoVisual` en `server/routes/invoices.js`), no se almacena:

- CANCELADA / PAGADO → directo del campo `estado`
- Sin `fecha_tentativa_pago`: PENDIENTE (<7 días desde creación) o SIN FECHA (>=7 días)
- Con `fecha_tentativa_pago`: VENCIDO (pasó), PROXIMO A VENCER (<=7 días), ON TRACK (>7 días)

## Convenciones

- UI completamente en español
- No usar `confirm()` / `alert()` nativos del navegador — usar ConfirmModal
- Edición de celdas es inline por celda (clic directo), no por fila
- Al marcar como pagado siempre pedir fecha de pago via modal
- Los campos editables por clic son: proyecto, fecha_tentativa_pago, estado_visual, comentarios
- El checkbox y la columna CFDI están sticky (fijadas a la izquierda) con z-index al hacer scroll horizontal
- El sidebar es colapsable a solo iconos

## Notas técnicas

- `better-sqlite3` es módulo nativo C++ — en Windows puede requerir build tools. Considerar migrar a `sql.js` (WASM) si da problemas
- El frontend usa proxy de Vite a Express en desarrollo (vite.config.js)
- Docker usa un volumen para persistir la DB (`cobranza-data:/app/data`)
- No hay tests automatizados actualmente
- No hay autenticación — la app se asume en red interna
