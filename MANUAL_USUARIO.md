# Manual de Usuario - Sistema de Cobranza

Sistema de gestión de cobranza y seguimiento de facturas CFDI para **DLG** y **SMGS**.

---

## Tabla de Contenidos

1. [Navegación](#1-navegación)
2. [Dashboard](#2-dashboard)
3. [Carga de Facturas (XML)](#3-carga-de-facturas-xml)
4. [Tabla de Facturas](#4-tabla-de-facturas)
5. [Filtros y Búsqueda](#5-filtros-y-búsqueda)
6. [Edición de Campos](#6-edición-de-campos)
7. [Flujo de Pagos](#7-flujo-de-pagos)
8. [Alertas y Estados](#8-alertas-y-estados)
9. [Alias de Clientes](#9-alias-de-clientes)
10. [Selección Masiva y Eliminación](#10-selección-masiva-y-eliminación)
11. [Exportar a Excel](#11-exportar-a-excel)
12. [Configuración](#12-configuración)
13. [Atajos de Teclado](#13-atajos-de-teclado)

---

## 1. Navegación

El sistema cuenta con una **barra lateral izquierda** con las siguientes secciones:

| Sección | Descripción |
|---------|-------------|
| **Dashboard** | Vista general con métricas, gráficas y alertas |
| **DLG** | Gestión de facturas de la empresa DLG |
| **SMGS** | Gestión de facturas de la empresa SMGS |
| **Configuración** | Administración de RFCs y alias de clientes |

La barra lateral se puede **colapsar** haciendo clic en el botón de menú en la parte superior, mostrando solo los iconos. Al pasar el cursor sobre un icono se muestra el nombre de la sección.

---

## 2. Dashboard

El Dashboard presenta un resumen ejecutivo de la cobranza. En la parte superior se encuentran los controles de filtrado:

**Filtro por cliente (multi-selección):** Desplegable que permite seleccionar uno o varios clientes. Al aplicar el filtro, todos los KPIs, gráficas y tablas de alerta se actualizan para mostrar solo los datos de los clientes seleccionados. Para limpiar la selección, haz clic en la **×** del botón o usa "Deseleccionar todos" dentro del desplegable.

**Vista por empresa:**
- **Consolidado**: Datos de ambas empresas combinados.
- **DLG**: Solo datos de DLG.
- **SMGS**: Solo datos de SMGS.

Al cambiar de vista, el filtro de cliente se limpia automáticamente.

**Barra de filtros:** Debajo del encabezado, el Dashboard incluye la misma barra de filtros que las páginas de empresa: búsqueda libre, estado (multi-selección), moneda, rango de fecha de emisión y rango de fecha tentativa. Todos son combinables con el selector de clientes.

**Chips de filtros activos:** Cuando hay filtros aplicados, se muestran como pills azules debajo de la barra. Cada chip tiene una **×** para removerlo individualmente. Si hay más de un chip, aparece un botón "Limpiar todo".

### Indicadores (KPIs)

| Indicador | Descripción |
|-----------|-------------|
| **Total Facturado** | Suma de totales con IVA (USD convertido a MXN). Debajo se muestra el subtotal sin IVA. |
| **Total Cobrado** | Suma de facturas en estado PAGADO, con IVA y sin IVA. |
| **Pendiente de Cobro** | Suma de facturas no pagadas ni canceladas, con IVA y sin IVA. |
| **Total Facturas** | Cantidad total de facturas. Debajo muestra el desglose: "Activas: N · Canc.: M". |
| **Sin Fecha Tentativa** | Facturas en estado REVISIÓN (sin fecha tentativa a 7+ días de la emisión). |
| **Vencidas** | Facturas cuya fecha tentativa ya pasó sin haberse cobrado. |

### Gráficas

- **Distribución por Estado**: Gráfica de dona que muestra la proporción de facturas por estado.
- **Facturación Mensual**: Gráfica de barras con el monto facturado por mes.
- **Top 10 Clientes por Monto Pendiente**: Gráfica horizontal mostrando los clientes con mayor deuda. Al pie se muestra la suma del top 10 y, si hay más clientes pendientes fuera del top, el total global pendiente.

### Tablas de Alerta

- **Próximas a Vencer**: Facturas que vencen dentro de los próximos 7 días. El contador muestra el total real aunque se pagine.
- **Sin Fecha de Pago**: Facturas que necesitan asignación de fecha tentativa (estado REVISIÓN). El contador muestra el total real. Se puede asignar la fecha directamente desde esta tabla haciendo clic en **Asignar fecha** y presionando el botón **OK**.

Ambas tablas muestran 20 facturas por página. Si hay más, aparecen los botones **Anterior** / **Siguiente** con un indicador de rango (p. ej. "1–20 de 47").

### Facturas Rezagadas

Al final del Dashboard, la sección **Facturas Rezagadas** detecta folios CFDI faltantes en la secuencia numérica de los ya cargados, agrupados por empresa y serie. Por ejemplo, si están cargados los folios {2293, 2294, 2296, 2297, 2300}, se reportarán como faltantes: 2295, 2298 y 2299.

- Cada grupo muestra el rango (min–max), la cantidad de faltantes y un ícono para expandir la lista completa de folios ausentes.
- Las facturas canceladas cuentan como "presentes" (el folio fue consumido ante el SAT), por lo que no aparecen en la lista de rezagadas.
- Si no hay huecos en ninguna serie, la sección muestra un mensaje positivo: "No se detectaron folios faltantes".

---

## 3. Carga de Facturas (XML)

Desde las páginas de **DLG** o **SMGS**, haz clic en el botón **Cargar XML** para abrir la zona de carga.

### Formas de cargar archivos

1. **Arrastrar y soltar**: Arrastra archivos XML directamente sobre la zona de carga.
2. **Seleccionar archivos**: Haz clic en el botón para elegir uno o varios archivos XML.
3. **Seleccionar carpeta**: Haz clic en el botón para seleccionar una carpeta completa; el sistema procesará todos los XML que contenga.

### Proceso de carga

- El sistema **detecta automáticamente** la empresa (DLG o SMGS) comparando el RFC del emisor con los RFCs configurados.
- Se soportan las versiones **CFDI 3.3 y 4.0**.
- Las facturas **duplicadas** (mismo UUID) se omiten automáticamente.
- Al finalizar, se muestra un resumen:
  - Facturas cargadas exitosamente.
  - Facturas duplicadas omitidas.
  - Errores encontrados (por ejemplo, RFC no registrado).

> Si aparece un error de RFC no registrado, ve a **Configuración** para agregar el RFC correspondiente.

---

## 4. Tabla de Facturas

La tabla principal muestra todas las facturas con las siguientes columnas:

| Columna | Descripción |
|---------|-------------|
| **CFDI** | Serie + Folio de la factura (columna fija al desplazarse horizontalmente) |
| **Folio Fiscal** | UUID de la factura. Clic para copiar al portapapeles |
| **Fecha Emisión** | Fecha de emisión en formato dd/mm/aaaa |
| **Cliente** | Nombre del receptor (muestra alias si tiene uno asignado) |
| **Concepto** | Descripción del servicio/producto |
| **Proyecto** | Campo editable para asignar proyecto |
| **Mon.** | Moneda (MXN o USD) |
| **T.C.** | Tipo de cambio |
| **Subtotal** | Monto antes de impuestos |
| **IVA** | Impuesto al Valor Agregado |
| **Total** | Monto total de la factura |
| **Fecha Tent.** | Fecha tentativa de pago (editable) |
| **Estado** | Estado actual de la factura (editable) |
| **Fecha Pago** | Fecha en que se realizó el pago |
| **Comentarios** | Notas adicionales (editable) |
| **Acciones** | Botones para marcar como pagado o eliminar |

### Ordenamiento

Haz clic en el encabezado de cualquier columna marcada con flecha para alternar entre orden ascendente y descendente.

### Paginación

La tabla muestra 50 facturas por página por defecto. En la parte inferior se encuentran los controles de paginación con los botones **Anterior**, páginas numéricas y **Siguiente**, además de un selector **Por página** con las opciones **25 / 50 / 100 / 200**. Al cambiar la cantidad, la tabla regresa automáticamente a la página 1.

### Columna CFDI fija

Al desplazarse horizontalmente, la columna **CFDI** (junto con el checkbox de selección) permanece fija en el lado izquierdo para facilitar la identificación de cada factura.

### Fijar columnas opcionales

Las columnas **Fecha Emisión** y **Cliente** se pueden fijar (pin) al lado de CFDI para mantenerlas visibles al desplazarse horizontalmente.

1. Pasa el cursor sobre el encabezado de **Fecha Emisión** o **Cliente**.
2. Haz clic en el ícono de pin (📌) que aparece a la derecha del nombre de la columna.
3. La columna se moverá inmediatamente a la posición contigua a CFDI y permanecerá fija al hacer scroll.
4. Para desfijar, haz clic nuevamente en el ícono (cambia a PinOff). La tabla regresará al inicio automáticamente.

Se pueden fijar ambas columnas al mismo tiempo. El orden de fijación sigue el orden original (Fecha Emisión antes que Cliente).

### Filas alternadas

Las filas alternan entre blanco y gris claro para facilitar la lectura.

### Indicador visual de alias

Junto al nombre del cliente hay un ícono de etiqueta que indica si el cliente ya tiene un alias configurado:

- **Ícono azul sólido**: el cliente tiene alias. El tooltip muestra el alias aplicado.
- **Ícono gris (contorno)**: el cliente no tiene alias; se muestra el nombre del XML tal cual. Haz clic para asignar uno.

---

## 5. Filtros y Búsqueda

La barra de filtros se encuentra encima de la tabla de facturas.

### Barra de búsqueda

Escribe en el campo de búsqueda para filtrar por:
- Nombre del cliente o alias
- RFC del receptor
- **Folio fiscal (UUID)** — puedes pegar los primeros caracteres o cualquier fragmento
- Concepto
- Proyecto
- Folio o serie
- Comentarios

La búsqueda se aplica en tiempo real conforme se escribe.

### Filtros disponibles

| Filtro | Opciones |
|--------|----------|
| **Estado** | Multi-selección: Pendiente, On Track, Próximo a Vencer, Vencido, Pagado, Cancelada, Revisión |
| **Moneda** | Todas, MXN, USD |
| **Fecha emisión desde/hasta** | Selector de fecha |
| **Fecha tentativa desde/hasta** | Selector de fecha |
| **Cliente** | Lista desplegable con todos los clientes |

El filtro de **Estado** se abre como un desplegable con checkboxes — puedes seleccionar varios estados al mismo tiempo (por ejemplo, Vencido + Revisión para ver todo lo urgente). El botón muestra un resumen: "Todos los estados", "1 estado" o "N estados". Incluye atajos "Seleccionar todos" / "Deseleccionar todos" dentro del desplegable.

Todos los filtros son combinables entre sí. Para restablecer todos los filtros, haz clic en el botón **Limpiar**.

---

## 6. Edición de Campos

Los siguientes campos se pueden editar directamente haciendo clic sobre ellos en la tabla:

### Proyecto y Comentarios

1. Haz clic sobre el texto (o donde dice "Vacío") para entrar en modo de edición.
2. Se abrirá un área de texto donde puedes escribir libremente, incluyendo saltos de línea.
3. Presiona **Ctrl+Enter** (o **Cmd+Enter** en Mac) para guardar.
4. Presiona **Escape** para cancelar.

### Expandir contenido

Cuando el texto de **Proyecto** o **Comentarios** es largo y aparece truncado:

1. Haz clic en el icono **>** (flecha) a la izquierda del texto para expandir y ver el contenido completo.
2. Haz clic nuevamente en el icono **v** para colapsar.

### Fecha Tentativa de Pago

1. Haz clic sobre la fecha (o donde dice "Revisión") para abrir el selector de fecha.
2. Selecciona la fecha deseada.
3. Presiona **Enter** o haz clic fuera del campo para guardar.
4. Presiona **Escape** para cancelar.

### Estado

1. Haz clic sobre la etiqueta de estado para abrir el selector.
2. Selecciona el nuevo estado: **Pendiente**, **Pagado** o **Cancelada**.
3. Si seleccionas **Pagado**, se abrirá el modal de pago (ver [Flujo de Pagos](#7-flujo-de-pagos)).

---

## 7. Flujo de Pagos

### Marcar como Pagado

Existen dos formas:

1. **Botón de acción**: Haz clic en el icono verde de palomita en la columna de Acciones.
2. **Cambiar estado**: Haz clic en la etiqueta de estado y selecciona "PAGADO".

En ambos casos se abrirá un modal donde:
- Se muestra el CFDI y nombre del cliente.
- Se pre-llena la fecha de pago con la fecha actual.
- Puedes modificar la fecha si el pago fue en otra fecha.
- Haz clic en **Confirmar pago** para guardar.

### Revertir un Pago

Si una factura fue marcada como pagada por error:

1. Haz clic en el icono amarillo de deshacer (flecha circular) en la columna de Acciones.
2. Confirma la acción en el modal de confirmación.
3. La factura regresará a estado **Pendiente** y se eliminará la fecha de pago.

---

## 8. Alertas y Estados

### Estados de las facturas

El estado de cada factura se calcula automáticamente según sus fechas:

| Estado | Color | Condición |
|--------|-------|-----------|
| **Pagado** | Verde | Factura marcada como cobrada |
| **On Track** | Verde esmeralda | Fecha tentativa a más de 7 días |
| **Pendiente** | Amarillo | Sin fecha tentativa, emitida hace menos de 7 días |
| **Próximo a Vencer** | Naranja | Fecha tentativa dentro de los próximos 7 días |
| **Vencido** | Rojo | Fecha tentativa ya pasó y no se ha cobrado |
| **Revisión** | Rojo oscuro | Sin fecha tentativa y emitida hace 7 días o más |
| **Cancelada** | Gris | Factura cancelada manualmente |

> El umbral de 7 días se mide desde la **fecha de emisión** del CFDI, no desde la fecha de carga al sistema. Si una factura emitida hace un mes se carga hoy, entra directamente a **Revisión**.

### Panel de alertas

En las páginas de empresa (DLG/SMGS), se muestra un panel con tres secciones de alerta:

- **Sin Fecha Tentativa**: Facturas en estado Revisión (emitidas hace 7+ días sin fecha tentativa).
- **Próximas a Vencer**: Facturas que vencen en los próximos 7 días.
- **Vencidas**: Facturas cuya fecha tentativa ya pasó.

Cada sección se puede expandir o colapsar haciendo clic sobre ella. Muestra el detalle de cada factura incluyendo folio, cliente, monto y fecha.

---

## 9. Alias de Clientes

Los alias permiten asignar nombres cortos y legibles a los clientes, reemplazando los nombres largos que vienen en el XML.

### Asignar un alias desde la tabla

1. En la columna **Cliente**, haz clic en el icono de etiqueta junto al nombre.
2. En el modal se muestran el nombre del XML y el RFC como referencia.
3. Escribe el alias deseado (por ejemplo: "Citibanamex") y haz clic en **Guardar**.

El alias se aplica automáticamente a **todas las facturas cuyo nombre del XML coincida exactamente**, incluyendo facturas futuras. Esto permite asignar alias distintos a clientes internacionales que comparten el RFC genérico **XEXX010101000**.

> Si un mismo cliente aparece con variantes del nombre en distintas facturas (por ejemplo por mayúsculas, comas o espacios), cada variante requiere su propio alias.

### Administrar alias desde Configuración

1. Ve a **Configuración** > sección **Alias de Clientes**.
2. La tabla muestra el **Nombre XML** (clave) y el **Alias** asignado.
3. Haz clic en el icono de lápiz para editar un alias existente.
4. Haz clic en el icono de basura para eliminar un alias.

Si intentas crear un alias para un nombre que ya tiene uno configurado, el alias anterior se sobreescribe automáticamente.

---

## 10. Selección Masiva y Eliminación

### Seleccionar facturas

- Usa el **checkbox** en la columna CFDI de cada fila para seleccionar facturas individuales.
- Usa el **checkbox del encabezado** para seleccionar o deseleccionar todas las facturas de la página actual.

### Eliminar facturas seleccionadas

1. Selecciona una o más facturas.
2. Aparecerá una barra azul indicando cuántas facturas están seleccionadas.
3. Haz clic en **Eliminar seleccionadas**.
4. Confirma la acción en el modal de confirmación.

> **Advertencia**: La eliminación es permanente y no se puede deshacer.

### Eliminar una factura individual

Haz clic en el icono rojo de basura en la columna de **Acciones** de la fila correspondiente y confirma la eliminación.

---

## 11. Exportar a Excel

Desde las páginas de empresa (DLG/SMGS):

1. Haz clic en el botón **Exportar a Excel**.
2. Se descargará un archivo `.xlsx` con el nombre `Cobranza_{Empresa}_{Fecha}.xlsx`.

### Contenido del archivo

- Todas las facturas que coincidan con los **filtros activos** al momento de exportar (sin límite de paginación — el xlsx trae todo el resultado filtrado, no solo la página visible).
- Columnas: CFDI, Folio Fiscal, Fecha Emisión, RFC, **Alias**, **Cliente (XML)**, Concepto, Proyecto, Moneda, T.C., Subtotal, IVA, IVA Retenido, Total, Fecha Tent. Pago, Estado, Fecha Pago, Comentarios.
- Las facturas se ordenan **ascendentemente por folio CFDI** para facilitar auditorías secuenciales.
- **Alias y Cliente (XML)** son columnas separadas: el alias está vacío cuando el cliente no tiene uno configurado.
- **CFDI** se exporta como número entero (alineado a la derecha). **Fechas** en formato DD/MM/AAAA.
- **Montos** con formato de moneda (`$#,##0.00`).
- **Facturas canceladas**: todos los montos (Subtotal, IVA, IVA Retenido, Total) se exportan como **0**; el estado "Cancelada" sigue visible para identificarlas.
- La columna de Estado muestra colores según el tipo (verde para pagado, rojo para vencido, etc.).
- **Fila de totales** al final con fórmula `=SUBTOTAL(9, rango)`. Al aplicar filtros manuales en Excel, los totales se recalculan automáticamente para reflejar solo las filas visibles.
- El archivo viene con **auto-filtro** habilitado en todas las columnas para facilitar el análisis en Excel.

---

## 12. Configuración

### RFCs por Empresa

Esta sección permite mapear los RFCs de emisor a cada empresa para que el sistema detecte automáticamente a qué empresa pertenece cada factura al cargar XMLs.

**Agregar un RFC:**
1. Escribe el RFC en el campo de texto.
2. Selecciona la empresa (DLG o SMGS) en el desplegable.
3. Haz clic en **Agregar**.

**Reasignar facturas:**
- Si modificas los RFCs después de haber cargado facturas, haz clic en **Reasignar facturas** para actualizar la asignación de empresa en las facturas existentes.

**Eliminar un RFC:**
- Haz clic en el icono de basura junto al RFC que deseas eliminar.

### Alias de Clientes

Ver sección [Alias de Clientes](#9-alias-de-clientes).

---

## 13. Atajos de Teclado

| Atajo | Acción | Contexto |
|-------|--------|----------|
| **Ctrl+Enter** / **Cmd+Enter** | Guardar cambios | Edición de Proyecto o Comentarios |
| **Enter** | Guardar cambios | Edición de fecha |
| **Escape** | Cancelar edición | Cualquier campo en edición o modal abierto |
| **Clic en UUID** | Copiar al portapapeles | Columna Folio Fiscal |
