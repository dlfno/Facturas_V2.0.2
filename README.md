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

### Tabla de Facturas
- Sección separada para cada empresa (DLG y SMGS) accesible desde el sidebar
- Columnas: CFDI (serie+folio), Fecha Emisión, Cliente, Concepto, Proyecto, Moneda, Subtotal, IVA, Total, Fecha Tentativa, Estado, Comentarios
- Edición inline de campos manuales: hacer clic en el lápiz de una fila para editar proyecto, fecha tentativa de pago, comentarios y estado
- Cambio rápido de estado a "Pagado" con un solo clic (botón de check verde)
- Eliminación de facturas individuales
- Ordenamiento ascendente/descendente por cualquier columna sorteable
- Paginación de 50 facturas por página con navegación numérica
- Formatos: montos con separador de miles y dos decimales, fechas en dd/mm/yyyy

### Alias de Clientes
- Permite asignar nombres cortos y legibles a los clientes en lugar de los nombres largos del XML (ej: "BANCO CITI MEXICO, SOCIEDAD ANONIMA, INSTITUCION DE BANCA MULTIPLE, GRUPO" → "Citibanamex")
- El alias se aplica globalmente a todas las facturas que compartan el mismo RFC receptor
- Acceso rápido: botón de etiqueta junto al nombre del cliente en la tabla de facturas, abre un modal con el RFC, nombre XML como referencia, y campo para escribir el alias
- Gestión centralizada en Configuración > Alias de Clientes: tabla con RFC, nombre XML original, alias editable inline, y opción de eliminar
- La búsqueda y los filtros de cliente reconocen los alias

### Estados Automáticos
El estado visual de cada factura se calcula automáticamente en base a sus fechas:

| Estado | Condición | Color |
|---|---|---|
| **Pendiente** | Sin fecha tentativa, menos de 7 días desde la carga | Amarillo |
| **Sin Fecha** | Sin fecha tentativa, 7+ días desde la carga | Rojo (alerta) |
| **On Track** | Con fecha tentativa a más de 7 días | Verde |
| **Próximo a Vencer** | Faltan 7 días o menos para la fecha tentativa | Naranja |
| **Vencido** | La fecha tentativa ya pasó | Rojo |
| **Pagado** | Marcado manualmente como pagado | Verde |
| **Cancelada** | Marcado manualmente como cancelada | Gris |

### Alertas
Panel visible en la parte superior de cada sección de empresa con tres contadores expandibles:
- **Sin fecha tentativa**: facturas que llevan 7+ días sin fecha de pago asignada
- **Próximas a vencer**: facturas cuya fecha tentativa vence en los próximos 7 días
- **Vencidas**: facturas cuya fecha tentativa ya pasó y no se han marcado como pagadas

Cada alerta se puede expandir para ver la lista de facturas afectadas con su folio, cliente, monto y fecha.

### Filtros y Búsqueda
Todos los filtros son combinables entre sí:
- **Búsqueda libre**: busca simultáneamente en cliente (nombre y alias), RFC, concepto, proyecto, folio y comentarios
- **Estado**: filtra por cualquiera de los 7 estados (Pendiente, On Track, Próximo a Vencer, Vencido, Pagado, Cancelada, Sin Fecha)
- **Moneda**: MXN, USD o todas
- **Rango de fecha de emisión**: desde y hasta
- **Rango de fecha tentativa**: desde y hasta
- **Cliente**: dropdown con todos los clientes únicos (muestra alias cuando existe)
- Botón "Limpiar" para resetear todos los filtros

### Dashboard
Vista general con toggle para ver datos consolidados, solo DLG o solo SMGS:

**KPIs (tarjetas superiores):**
- Total facturado en MXN (convierte USD a MXN usando el tipo de cambio de cada factura)
- Total cobrado (facturas en estado Pagado)
- Total pendiente de cobro
- Total de facturas
- Facturas sin fecha tentativa
- Facturas vencidas

**Gráficas:**
- Pie chart: distribución de facturas por estado con colores
- Bar chart: facturación mensual agrupada por mes de emisión
- Bar chart horizontal: top 10 clientes por monto pendiente

**Tablas resumen:**
- Próximas a vencer: lista con folio, cliente, total y fecha de vencimiento
- Sin fecha de pago: lista con folio, cliente, total y fecha de emisión

### Exportación a Excel
- Genera un archivo .xlsx descargable con los datos de la tabla
- Respeta todos los filtros activos al momento de exportar (si filtras por "Pendiente" y moneda "MXN", el Excel solo contiene esas facturas)
- Formato profesional: encabezados con color, montos en formato de moneda, estados con color de texto, columnas con ancho ajustado
- Fila de totales al final con suma de subtotal, IVA, IVA retenido y total
- Auto-filtro de Excel habilitado en todas las columnas
- Nombre del archivo con empresa y fecha: `Cobranza_DLG_2026-04-11.xlsx`

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
git clone <url-del-repo>
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
git clone <url-del-repo>
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

## Uso

1. Ir a **Configuración** y registrar los RFCs emisores de cada empresa (DLG y SMGS)
2. Opcionalmente, configurar alias de clientes para nombres más legibles
3. Ir a la sección de la empresa (DLG o SMGS) y hacer clic en **Cargar XML**
4. Arrastrar archivos XML o seleccionar una carpeta completa
5. Completar los campos manuales: proyecto, fecha tentativa de pago, comentarios
6. Revisar las alertas en la parte superior para facturas que requieren atención
7. Usar los filtros y búsqueda para encontrar facturas específicas
8. Exportar a Excel con los filtros aplicados usando el botón **Exportar a Excel**
