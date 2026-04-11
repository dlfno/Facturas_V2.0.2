# Manual de Usuario - Sistema de Cobranza

Sistema de gestión de cobranza y seguimiento de facturas CFDI para **DLG** y **SMGS**.

---

## Tabla de Contenidos

1. [Inicio Rápido](#1-inicio-rápido)
2. [Navegación](#2-navegación)
3. [Dashboard](#3-dashboard)
4. [Carga de Facturas (XML)](#4-carga-de-facturas-xml)
5. [Tabla de Facturas](#5-tabla-de-facturas)
6. [Filtros y Búsqueda](#6-filtros-y-búsqueda)
7. [Edición de Campos](#7-edición-de-campos)
8. [Flujo de Pagos](#8-flujo-de-pagos)
9. [Alertas](#9-alertas)
10. [Alias de Clientes](#10-alias-de-clientes)
11. [Selección Masiva y Eliminación](#11-selección-masiva-y-eliminación)
12. [Exportar a Excel](#12-exportar-a-excel)
13. [Configuración](#13-configuración)
14. [Atajos de Teclado](#14-atajos-de-teclado)
15. [Despliegue con Docker](#15-despliegue-con-docker)

---

## 1. Inicio Rápido

### Requisitos

- Node.js 18 o superior
- npm

### Instalación

```bash
# Instalar dependencias del servidor y cliente
npm install
cd client && npm install && cd ..

# Iniciar en modo desarrollo
npm run dev
```

El sistema estará disponible en `http://localhost:5173` (desarrollo) o `http://localhost:3000` (producción).

### Primeros pasos

1. Ir a **Configuración** y verificar que los RFCs de emisor estén correctos para DLG y SMGS.
2. Ir a la página de **DLG** o **SMGS**.
3. Hacer clic en **Cargar XML** y subir los archivos de facturas.
4. Las facturas aparecerán en la tabla, listas para gestionar.

---

## 2. Navegación

El sistema cuenta con una **barra lateral izquierda** con las siguientes secciones:

| Sección | Descripción |
|---------|-------------|
| **Dashboard** | Vista general con métricas, gráficas y alertas |
| **DLG** | Gestión de facturas de la empresa DLG |
| **SMGS** | Gestión de facturas de la empresa SMGS |
| **Configuración** | Administración de RFCs y alias de clientes |

La barra lateral se puede **colapsar** haciendo clic en el botón de menú en la parte superior, mostrando solo los iconos. Al pasar el cursor sobre un icono se muestra el nombre de la sección.

---

## 3. Dashboard

El Dashboard presenta un resumen ejecutivo de la cobranza. En la parte superior derecha se puede alternar entre tres vistas:

- **Consolidado**: Datos de ambas empresas combinados.
- **DLG**: Solo datos de DLG.
- **SMGS**: Solo datos de SMGS.

### Indicadores (KPIs)

| Indicador | Descripción |
|-----------|-------------|
| **Total Facturado** | Suma de todos los totales (USD convertido a MXN) |
| **Total Cobrado** | Suma de facturas marcadas como PAGADO |
| **Pendiente de Cobro** | Diferencia entre facturado y cobrado |
| **Total Facturas** | Cantidad total de facturas |
| **Sin Fecha Tentativa** | Facturas sin fecha tentativa de pago asignada |
| **Vencidas** | Facturas cuya fecha tentativa ya pasó sin haberse cobrado |

### Gráficas

- **Distribución por Estado**: Gráfica de dona que muestra la proporción de facturas por estado.
- **Facturación Mensual**: Gráfica de barras con el monto facturado por mes (últimos 12 meses).
- **Top 10 Clientes por Monto Pendiente**: Gráfica horizontal mostrando los clientes con mayor deuda.

### Tablas de Alerta

- **Próximas a Vencer**: Facturas que vencen dentro de los próximos 7 días.
- **Sin Fecha de Pago**: Facturas que necesitan asignación de fecha tentativa. Se puede asignar la fecha directamente desde esta tabla haciendo clic en el campo de fecha y presionando el botón **OK**.

---

## 4. Carga de Facturas (XML)

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

## 5. Tabla de Facturas

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

Haz clic en el encabezado de cualquier columna que tenga la opción de ordenar (se indica con una flecha) para alternar entre orden ascendente y descendente.

### Paginación

La tabla muestra 50 facturas por página. En la parte inferior se encuentran los controles de paginación con los botones **Anterior**, páginas numéricas y **Siguiente**.

### Columna CFDI fija

Al desplazarse horizontalmente, la columna **CFDI** (junto con el checkbox de selección) permanece fija en el lado izquierdo para facilitar la identificación de cada factura.

### Filas alternadas

Las filas alternan entre blanco y gris claro para facilitar la lectura.

---

## 6. Filtros y Búsqueda

La barra de filtros se encuentra encima de la tabla de facturas.

### Barra de búsqueda

Escribe en el campo de búsqueda para filtrar por:
- Nombre del cliente o alias
- RFC del receptor
- Concepto
- Proyecto
- Folio o serie
- Comentarios

La búsqueda se aplica en tiempo real conforme se escribe.

### Filtros disponibles

| Filtro | Opciones |
|--------|----------|
| **Estado** | Todos, Pendiente, On Track, Próximo a Vencer, Vencido, Pagado, Cancelada, Sin Fecha |
| **Moneda** | Todas, MXN, USD |
| **Fecha emisión desde/hasta** | Selector de fecha |
| **Fecha tentativa desde/hasta** | Selector de fecha |
| **Cliente** | Lista desplegable con todos los clientes |

Todos los filtros son combinables entre sí. Para restablecer todos los filtros, haz clic en el botón **Limpiar**.

---

## 7. Edición de Campos

Los siguientes campos se pueden editar directamente haciendo clic sobre ellos en la tabla:

### Proyecto y Comentarios

1. Haz clic sobre el texto (o donde dice "Vacío") para entrar en modo de edición.
2. Se abrirá un área de texto donde puedes escribir libremente.
3. Presiona **Ctrl+Enter** (o **Cmd+Enter** en Mac) para guardar.
4. Presiona **Escape** para cancelar.

### Expandir contenido

Cuando el texto de **Proyecto** o **Comentarios** es largo y aparece truncado:

1. Haz clic en el icono **>** (flecha) a la izquierda del texto para expandir y ver el contenido completo.
2. Haz clic nuevamente en el icono **v** para colapsar.

### Fecha Tentativa de Pago

1. Haz clic sobre la fecha (o donde dice "Sin fecha") para abrir el selector de fecha.
2. Selecciona la fecha deseada.
3. Presiona **Enter** o haz clic fuera del campo para guardar.
4. Presiona **Escape** para cancelar.

### Estado

1. Haz clic sobre la etiqueta de estado para abrir el selector.
2. Selecciona el nuevo estado: **Pendiente**, **Pagado** o **Cancelada**.
3. Si seleccionas **Pagado**, se abrirá el modal de pago (ver [Flujo de Pagos](#8-flujo-de-pagos)).

---

## 8. Flujo de Pagos

### Marcar como Pagado

Existen dos formas:

1. **Botón de acción**: Haz clic en el icono verde de palomita (check) en la columna de Acciones.
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

## 9. Alertas

En las páginas de empresa (DLG/SMGS), se muestra un panel de alertas con tres secciones:

### Estados de las facturas

| Estado | Color | Descripción |
|--------|-------|-------------|
| **Pagado** | Verde | Factura cobrada |
| **On Track** | Verde esmeralda | Fecha tentativa a más de 7 días |
| **Pendiente** | Amarillo | Sin fecha tentativa, creada hace menos de 7 días |
| **Próximo a Vencer** | Naranja | Fecha tentativa dentro de los próximos 7 días |
| **Vencido** | Rojo | Fecha tentativa ya pasó y no se ha cobrado |
| **Sin Fecha** | Rojo oscuro | Sin fecha tentativa, creada hace más de 7 días |
| **Cancelada** | Gris | Factura cancelada |

### Secciones de alerta

- **Sin Fecha Tentativa**: Facturas que llevan más de 7 días sin fecha tentativa asignada.
- **Próximas a Vencer**: Facturas que vencen en los próximos 7 días.
- **Vencidas**: Facturas cuya fecha tentativa ya pasó.

Cada sección se puede expandir o colapsar haciendo clic sobre ella. Muestra el detalle de cada factura incluyendo folio, cliente, monto y fecha.

---

## 10. Alias de Clientes

Los alias permiten asignar nombres cortos y legibles a los clientes, reemplazando los nombres largos que vienen en el XML.

### Asignar un alias desde la tabla

1. En la columna **Cliente**, haz clic en el icono de etiqueta junto al nombre.
2. En el modal, escribe el alias deseado (por ejemplo: "Citibanamex").
3. Haz clic en **Guardar**.

El alias se aplica automáticamente a **todas las facturas** del mismo RFC receptor, incluyendo facturas futuras.

### Administrar alias desde Configuración

1. Ve a **Configuración** > sección **Alias de Clientes**.
2. Aquí puedes ver todos los alias configurados con su RFC y nombre original del XML.
3. Haz clic en el icono de lápiz para editar un alias existente.
4. Haz clic en el icono de basura para eliminar un alias.

---

## 11. Selección Masiva y Eliminación

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

## 12. Exportar a Excel

Desde las páginas de empresa (DLG/SMGS):

1. Haz clic en el botón **Exportar a Excel**.
2. Se descargará un archivo `.xlsx` con el nombre `Cobranza_{Empresa}_{Fecha}.xlsx`.

### Contenido del archivo

- Todas las facturas que coincidan con los **filtros activos** al momento de exportar.
- Columnas: CFDI, Folio Fiscal, Fecha Emisión, RFC, Cliente, Concepto, Proyecto, Moneda, T.C., Subtotal, IVA, IVA Retenido, Total, Fecha Tent. Pago, Estado, Fecha Pago, Comentarios.
- La columna de Estado muestra colores según el tipo (verde para pagado, rojo para vencido, etc.).
- Incluye una **fila de totales** al final con la suma de Subtotal, IVA, IVA Retenido y Total.
- El archivo viene con **auto-filtro** habilitado en todas las columnas para facilitar el análisis en Excel.

---

## 13. Configuración

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

Ver sección [Alias de Clientes](#10-alias-de-clientes).

---

## 14. Atajos de Teclado

| Atajo | Acción | Contexto |
|-------|--------|----------|
| **Ctrl+Enter** / **Cmd+Enter** | Guardar cambios | Edición de Proyecto o Comentarios |
| **Enter** | Guardar cambios | Edición de fecha o campo de configuración |
| **Escape** | Cancelar edición | Cualquier campo en edición o modal abierto |
| **Clic en UUID** | Copiar al portapapeles | Columna Folio Fiscal |

---

## 15. Despliegue con Docker

El sistema incluye archivos de configuración para despliegue con Docker.

### Levantar el sistema

```bash
docker-compose up -d
```

El sistema estará disponible en `http://localhost:3000`.

### Detener el sistema

```bash
docker-compose down
```

### Datos persistentes

La base de datos SQLite se almacena en un volumen de Docker (`cobranza-data`), por lo que los datos se conservan aunque se reinicie o actualice el contenedor.

### Reconstruir después de cambios

```bash
docker-compose up -d --build
```
