const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
});

function parseCFDI(xmlContent, filename) {
  const parsed = parser.parse(xmlContent);

  // Navigate to Comprobante - handles both CFDI 3.3 and 4.0
  const comprobante = parsed.Comprobante || parsed['cfdi:Comprobante'];
  if (!comprobante) {
    throw new Error(`No se encontró el nodo Comprobante en ${filename}`);
  }

  // Extract Emisor
  const emisor = comprobante.Emisor || comprobante['cfdi:Emisor'] || {};
  // Extract Receptor
  const receptor = comprobante.Receptor || comprobante['cfdi:Receptor'] || {};

  // Extract Conceptos
  const conceptosNode = comprobante.Conceptos || comprobante['cfdi:Conceptos'] || {};
  let conceptos = conceptosNode.Concepto || conceptosNode['cfdi:Concepto'] || [];
  if (!Array.isArray(conceptos)) conceptos = [conceptos];
  const descripcion = conceptos
    .map((c) => c['@_Descripcion'] || c.Descripcion || '')
    .filter(Boolean)
    .join(' | ');

  // Extract UUID from TimbreFiscalDigital
  let uuid = '';
  const complemento = comprobante.Complemento || comprobante['cfdi:Complemento'] || {};
  const timbre =
    complemento.TimbreFiscalDigital ||
    complemento['tfd:TimbreFiscalDigital'] ||
    {};
  uuid = timbre['@_UUID'] || timbre.UUID || '';

  if (!uuid) {
    throw new Error(`No se encontró UUID en ${filename}`);
  }

  // Extract impuestos
  let iva = 0;
  let ivaRetenido = 0;
  const impuestos = comprobante.Impuestos || comprobante['cfdi:Impuestos'] || {};

  // Traslados (IVA trasladado)
  const traslados = impuestos.Traslados || impuestos['cfdi:Traslados'] || {};
  let trasladoList = traslados.Traslado || traslados['cfdi:Traslado'] || [];
  if (!Array.isArray(trasladoList)) trasladoList = [trasladoList];
  for (const t of trasladoList) {
    const impuesto = t['@_Impuesto'] || '';
    if (impuesto === '002') {
      iva += parseFloat(t['@_Importe'] || 0);
    }
  }

  // Retenciones (IVA retenido)
  const retenciones = impuestos.Retenciones || impuestos['cfdi:Retenciones'] || {};
  let retencionList = retenciones.Retencion || retenciones['cfdi:Retencion'] || [];
  if (!Array.isArray(retencionList)) retencionList = [retencionList];
  for (const r of retencionList) {
    const impuesto = r['@_Impuesto'] || '';
    if (impuesto === '002') {
      ivaRetenido += parseFloat(r['@_Importe'] || 0);
    }
  }

  // If no tax nodes found, try TotalImpuestosTrasladados
  if (iva === 0 && impuestos['@_TotalImpuestosTrasladados']) {
    iva = parseFloat(impuestos['@_TotalImpuestosTrasladados']);
  }
  if (ivaRetenido === 0 && impuestos['@_TotalImpuestosRetenidos']) {
    ivaRetenido = parseFloat(impuestos['@_TotalImpuestosRetenidos']);
  }

  const moneda = comprobante['@_Moneda'] || 'MXN';

  return {
    uuid: uuid.toUpperCase(),
    serie: comprobante['@_Serie'] || null,
    folio: comprobante['@_Folio'] || null,
    fecha_emision: (comprobante['@_Fecha'] || '').substring(0, 10),
    moneda,
    tipo_cambio: comprobante['@_TipoCambio']
      ? parseFloat(comprobante['@_TipoCambio'])
      : moneda === 'MXN'
        ? null
        : null,
    subtotal: parseFloat(comprobante['@_SubTotal'] || 0),
    iva,
    iva_retenido: ivaRetenido,
    total: parseFloat(comprobante['@_Total'] || 0),
    rfc_emisor: emisor['@_Rfc'] || emisor.Rfc || '',
    nombre_emisor: emisor['@_Nombre'] || emisor.Nombre || '',
    rfc_receptor: receptor['@_Rfc'] || receptor.Rfc || '',
    nombre_receptor: receptor['@_Nombre'] || receptor.Nombre || '',
    concepto: descripcion,
    metodo_pago: comprobante['@_MetodoPago'] || null,
    forma_pago: comprobante['@_FormaPago'] || null,
    uso_cfdi: receptor['@_UsoCFDI'] || receptor.UsoCFDI || null,
    xml_filename: filename,
  };
}

module.exports = { parseCFDI };
