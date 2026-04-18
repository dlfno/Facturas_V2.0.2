// Detección de folios CFDI rezagados (faltantes en la secuencia numérica).
//
// Entrada: filas [{ empresa, serie, folio, estado }] — sólo filas con folio no nulo.
// Agrupa por (empresa, serie, prefix_alfa) y detecta huecos en la parte numérica.
// Las facturas canceladas cuentan como folio presente (el folio fue consumido ante el SAT).

const FOLIO_REGEX = /^(.*?)(\d+)$/;

function detectRezagadas(rows) {
  // groups[empresa][serieKey][prefix] = { numbers: Set<int>, maxLen: int }
  const groups = {};
  for (const row of rows) {
    const m = String(row.folio || '').match(FOLIO_REGEX);
    if (!m) continue;
    const prefix = m[1];
    const digits = m[2];
    const num = parseInt(digits, 10);
    if (Number.isNaN(num)) continue;

    const empresa = row.empresa || '';
    const serie = row.serie || '';
    if (!groups[empresa]) groups[empresa] = {};
    if (!groups[empresa][serie]) groups[empresa][serie] = {};
    const bucket = groups[empresa][serie];
    if (!bucket[prefix]) bucket[prefix] = { numbers: new Set(), maxLen: 0 };
    bucket[prefix].numbers.add(num);
    if (digits.length > bucket[prefix].maxLen) bucket[prefix].maxLen = digits.length;
  }

  const result = [];
  for (const [empresa, seriesMap] of Object.entries(groups)) {
    for (const [serie, prefixMap] of Object.entries(seriesMap)) {
      for (const [prefix, { numbers, maxLen }] of Object.entries(prefixMap)) {
        if (numbers.size === 0) continue;
        const sorted = [...numbers].sort((a, b) => a - b);
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const missing = [];
        for (let n = min; n <= max; n += 1) {
          if (!numbers.has(n)) {
            missing.push(prefix + String(n).padStart(maxLen, '0'));
          }
        }
        result.push({
          empresa,
          serie: serie || null,
          prefix,
          rangeMin: min,
          rangeMax: max,
          foundCount: numbers.size,
          expectedCount: max - min + 1,
          missingCount: missing.length,
          missing,
        });
      }
    }
  }

  // Ordenar por empresa luego serie para presentación consistente.
  result.sort((a, b) => {
    const e = (a.empresa || '').localeCompare(b.empresa || '');
    if (e !== 0) return e;
    return (a.serie || '').localeCompare(b.serie || '');
  });

  return result;
}

module.exports = { detectRezagadas };
