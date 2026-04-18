# Sistema de Cobranza - DLG & SMGS

Sistema web para gestión de cobranza de facturas CFDI. Reemplaza el proceso manual en Excel con carga automática de XMLs, seguimiento de pagos, alertas de vencimiento, dashboard operativo y exportación a Excel.

## Funcionalidades

### Carga de Facturas XML
- Drag & drop de uno o múltiples archivos XML directamente en el navegador
- Selección de carpeta completa para carga masiva (botón "Seleccionar carpeta")
- Parseo automático de CFDI versiones 3.3 y 4.0
- Extracción de todos los campos fiscales: UUID, serie, folio, emisor, receptor, conceptos, impuestos (IVA trasladado y retenido), moneda, tipo de cambio, método y forma de pago
- Detección y rechazo de duplicados por UUID
- Resumen post-carga: cantidad insertada, duplicadas omitidas y errores con detalle por archivo

### Auto-detección de Empresa
- Al cargar un XML, el sistema identifica automáticamente si la factura pertenece a DLG o SMGS comparando el RFC del emisor contra los RFCs registrados en Configuración
- Si el RFC no está registrado, se puede seleccionar la empresa manualmente desde la zona de carga
- Los RFCs se administran desde la pantalla de Configuración en el sidebar
- Al agregar o corregir un RFC, las facturas existentes se reasignan automáticamente a la empresa correcta

### Tabla de Facturas
- Sección separada para cada empresa (DLG y SMGS) accesible desde el sidebar
- Columnas: CFDI (serie+folio), Folio Fiscal (UUID), Fecha Emisión, Cliente, Concepto, Proyecto, Moneda, Tipo de Cambio, Subtotal, IVA, Total, Fecha Tentativa, Estado, Fecha Pago, Comentarios
- Edición inline por celda: clic directo sobre proyecto, fecha tentativa, estado o comentarios para editar sin botones extra
- Folio Fiscal visible completo, clic para copiar al portapapeles
- Marcar como pagado solicita la fecha de pago mediante un modal; opción de revertir el pago para regresar a pendiente
- Selección múltiple con checkboxes y eliminación masiva de facturas
- Eliminación individual con modal de confirmación propio (no depende de diálogos del navegador)
- Ordenamiento ascendente/descendente por cualquier columna sorteable
- Paginación con selector de filas por página (25 / 50 / 100 / 200, default 50) y navegación numérica
- Columnas pineables: Fecha Emisión y Cliente se pueden fijar junto a CFDI para mantenerlas visibles al scroll horizontal
- Indicador visual de alias: ícono azul sólido en la columna Cliente cuando el cliente ya tiene alias configurado (gris cuando no)
- Formatos: montos con separador de miles y dos decimales, fechas en dd/mm/yyyy

### Alias de Clientes
- Permite asignar nombres cortos y legibles a los clientes en lugar de los nombres largos del XML (ej: "BANCO CITI MEXICO, SOCIEDAD ANONIMA, INSTITUCION DE BANCA MULTIPLE, GRUPO" → "Citibanamex")
- El alias se asocia al **nombre del receptor** que aparece en el XML (no al RFC), lo que permite distinguir clientes internacionales que comparten el RFC genérico XEXX010101000
- Acceso rápido: botón de etiqueta junto al nombre del cliente en la tabla de facturas — ícono azul cuando ya tiene alias, gris cuando no. Abre un modal con el nombre del XML y RFC como referencia, y campo para escribir el alias
- Gestión centralizada en Configuración > Alias de Clientes: tabla con nombre del XML y alias editable inline, con opción de eliminar
- Si se intenta crear un alias para un nombre que ya tiene uno, se sobreescribe automáticamente
- La búsqueda y los filtros de cliente reconocen los alias

### Estados Automáticos
El estado visual de cada factura se calcula automáticamente en base a sus fechas. El umbral de 7 días se mide desde la **fecha de emisión** del CFDI (no desde la carga al sistema), así que una factura cargada hoy pero emitida hace un mes entra directo a Revisión.

| Estado | Condición | Color |
|---|---|---|
| **Pendiente** | Sin fecha tentativa, emitida hace menos de 7 días | Amarillo |
| **Revisión** | Sin fecha tentativa, emitida hace 7+ días | Rojo (alerta) |
| **On Track** | Con fecha tentativa a más de 7 días | Verde |
| **Próximo a Vencer** | Faltan 7 días o menos para la fecha tentativa | Naranja |
| **Vencido** | La fecha tentativa ya pasó | Rojo |
| **Pagado** | Marcado manualmente como pagado | Verde |
| **Cancelada** | Marcado manualmente como cancelada | Gris |

### Alertas
Panel visible en la parte superior de cada sección de empresa con tres contadores expandibles:
- **Sin fecha tentativa**: facturas en estado Revisión (emitidas hace 7+ días sin fecha de pago asignada)
- **Próximas a vencer**: facturas cuya fecha tentativa vence en los próximos 7 días
- **Vencidas**: facturas cuya fecha tentativa ya pasó y no se han marcado como pagadas

Cada alerta se puede expandir para ver la lista de facturas afectadas con su folio, cliente, monto y fecha.

### Filtros y Búsqueda
Todos los filtros son combinables entre sí:
- **Búsqueda libre**: busca simultáneamente en cliente (nombre y alias), RFC, folio fiscal (UUID), concepto, proyecto, folio/serie y comentarios
- **Estado**: multi-selección — puedes filtrar por varios estados al mismo tiempo (Pendiente, On Track, Próximo a Vencer, Vencido, Pagado, Cancelada, Revisión) mediante un dropdown con checkboxes
- **Moneda**: MXN, USD o todas
- **Rango de fecha de emisión**: desde y hasta
- **Rango de fecha tentativa**: desde y hasta
- **Cliente**: dropdown con todos los clientes únicos (muestra alias cuando existe)
- Botón "Limpiar" para resetear todos los filtros

### Dashboard
Vista general con toggle para ver datos consolidados, solo DLG o solo SMGS, con filtros combinables y chips visuales.

**Filtros en el dashboard:**
- Selector multi-cliente (dropdown con checkboxes, búsqueda interna)
- Barra de filtros completa: búsqueda libre, estado (multi-selección), moneda, rango de fecha de emisión y rango de fecha tentativa
- Chips de filtros activos con botón × para remover individualmente, y opción "Limpiar todo"
- Todos los KPIs, gráficas y tablas se actualizan en tiempo real al filtrar

**KPIs (tarjetas superiores):**
- Total facturado: con IVA + sin IVA (subtotal), en MXN (convierte USD a MXN usando el tipo de cambio de cada factura)
- Total cobrado: con IVA + sin IVA, solo facturas en estado Pagado
- Pendiente de cobro: con IVA + sin IVA
- Total de facturas con desglose "Activas: N · Canceladas: M"
- Facturas sin fecha tentativa (Revisión)
- Facturas vencidas

**Gráficas:**
- Pie chart: distribución de facturas por estado con colores
- Bar chart: facturación mensual agrupada por mes de emisión
- Bar chart horizontal: top 10 clientes por monto pendiente, con suma del top 10 y total pendiente global al pie

**Tablas resumen:**
- Próximas a vencer: lista con folio, cliente, total y fecha de vencimiento
- Sin fecha de pago: lista con folio, cliente, total y opción de asignar fecha tentativa directamente desde el dashboard

**Facturas Rezagadas:**
- Nueva sección que detecta folios CFDI faltantes en la secuencia numérica de los ya cargados, agrupados por empresa y serie
- Cada grupo muestra el rango (min–max), el conteo de faltantes y la lista expandible de folios ausentes
- Las facturas canceladas cuentan como "folio presente" (el folio fue consumido ante el SAT)

### Exportación a Excel
- Genera un archivo .xlsx descargable con los datos de la tabla
- Respeta todos los filtros activos al momento de exportar (estado multi-selección, periodo, cliente, moneda, búsqueda); exporta el set completo sin límite de paginación
- Orden ascendente por folio CFDI
- Columnas separadas para **Alias** y **Cliente (XML)**, de modo que el alias asignado y el nombre original conviven en el reporte
- Formato numérico para CFDI (entero), fechas en DD/MM/AAAA, montos en formato moneda (`$#,##0.00`)
- Facturas canceladas con montos a 0 (Subtotal, IVA, IVA Retenido, Total), con el estado "Cancelada" visible para identificarlas
- Fila de totales al final con fórmula `=SUBTOTAL(9, rango)` que se recalcula automáticamente al filtrar manualmente en Excel
- Auto-filtro de Excel habilitado en todas las columnas; estados con color de texto
- Nombre del archivo con empresa y fecha: `Cobranza_DLG_2026-04-17.xlsx`

### Sidebar Colapsable
- Navegación lateral con acceso a Dashboard, DLG, SMGS y Configuración
- Se puede contraer a solo iconos para ganar espacio de pantalla
- Tooltip con el nombre de la sección al pasar el mouse en modo contraído

## Stack

- **Frontend**: React 18 + Vite + TailwindCSS + Recharts + Lucide Icons
- **Backend**: Node.js + Express
- **Base de datos**: SQLite (better-sqlite3) — archivo único, cero configuración, portable
- **XML**: fast-xml-parser (CFDI 3.3 y 4.0)
- **Excel**: exceljs

## Requisitos

- Node.js 18 o superior
- npm

## Instalación y ejecución en macOS

```bash
# Clonar el repositorio
git clone https://github.com/dlfno/Facturas_V2.0.2.git
cd Facturas_V2.0.2

# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client && npm install && cd ..

# Desarrollo (levanta backend en :3000 y frontend en :5173)
npm run dev

# Producción
npm run build
npm start
```

Abrir `http://localhost:5173` en desarrollo o `http://localhost:3000` en producción.

## Instalación y ejecución en Windows

```powershell
# Clonar el repositorio
git clone https://github.com/dlfno/Facturas_V2.0.2.git
cd Facturas_V2.0.2

# Instalar dependencias del servidor
npm install

# Instalar dependencias del cliente
cd client
npm install
cd ..

# Desarrollo (levanta backend en :3000 y frontend en :5173)
npm run dev

# Producción
npm run build
npm start
```

Abrir `http://localhost:5173` en desarrollo o `http://localhost:3000` en producción.

> **Nota Windows**: el módulo `better-sqlite3` requiere herramientas de compilación nativas. Si `npm install` falla con errores de `node-gyp`, instala las build tools ejecutando en PowerShell como administrador:
>
> ```powershell
> npm install -g windows-build-tools
> ```
>
> O instala Visual Studio Build Tools desde https://visualstudio.microsoft.com/visual-cpp-build-tools/ seleccionando "Desktop development with C++".

## Instalación y ejecución con Docker

```bash
# Clonar el repositorio
git clone https://github.com/dlfno/Facturas_V2.0.2.git
cd Facturas_V2.0.2

# Levantar el contenedor
docker compose up -d --build
```

Abrir `http://tu-servidor:3000`. La base de datos persiste en un volumen de Docker.

```bash
# Detener
docker compose down

# Ver logs
docker compose logs -f

# Reconstruir después de cambios
docker compose up -d --build
```

## Uso

1. Ir a **Configuración** y registrar los RFCs emisores de cada empresa (DLG y SMGS)
2. Opcionalmente, configurar alias de clientes para nombres más legibles
3. Ir a la sección de la empresa (DLG o SMGS) y hacer clic en **Cargar XML**
4. Arrastrar archivos XML o seleccionar una carpeta completa
5. Completar los campos manuales: proyecto, fecha tentativa de pago, comentarios
6. Revisar las alertas en la parte superior para facturas que requieren atención
7. Usar los filtros y búsqueda para encontrar facturas específicas
8. Exportar a Excel con los filtros aplicados usando el botón **Exportar a Excel**
