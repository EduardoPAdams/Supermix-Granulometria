/* ── MATERIAIS ── */
export const MATS = [
  { id: 'areia_fina', label: 'AREIA CAVA FINA', short: 'A.C.Fina', sieves: ['6.3', '4.8', '2.4', '1.2', '0.6', '0.3', '0.15'], mfMin: 1.496, mfMax: 1.792, pulvMi: 500 },
  { id: 'areia_media', label: 'AREIA NATURAL MEDIA', short: 'A.N.Méd.', sieves: ['6.3', '4.8', '2.4', '1.2', '0.6', '0.3', '0.15'], mfMin: 2.574, mfMax: 2.845, pulvMi: 500 },
  { id: 'diabasio_0', label: 'DIABASIO 0', short: 'Diab. 0', sieves: ['19', '12.5', '9.5', '6.3', '4.8', '2.4'], mfMin: 5.94, mfMax: 6.56, pulvMi: 1000 },
  { id: 'diabasio_1', label: 'DIABASIO 1', short: 'Diab. 1', sieves: ['25', '19', '12.5', '9.5', '6.3', '4.8'], mfMin: 6.77, mfMax: 7.15, pulvMi: 1000 },
  { id: 'granito_0', label: 'GRANITO 0', short: 'Gran. 0', sieves: ['19', '12.5', '9.5', '6.3', '4.8', '2.4'], mfMin: 5.77, mfMax: 6.15, pulvMi: 1000 },
  { id: 'granito_1', label: 'GRANITO 1', short: 'Gran. 1', sieves: ['32', '25', '19', '12.5', '9.5', '6.3', '4.8'], mfMin: 6.77, mfMax: 7.15, pulvMi: 1000 },
  { id: 'basalto_0', label: 'BASALTO 0', short: 'Basa. 0', sieves: ['19', '12.5', '9.5', '6.3', '4.8', '2.4'], mfMin: 5.94, mfMax: 6.56, pulvMi: 1000 },
]

export const MAT_TABS = [...MATS, { id: 'pulverulento', short: 'Pulv.', label: 'Pulverulento', sieves: [] }]

export const ROW1 = ['areia_fina', 'diabasio_0', 'granito_0', 'basalto_0']
export const ROW2 = ['areia_media', 'diabasio_1', 'granito_1']
export const MF_SIEVES = [76, 38, 19, 9.5, 4.8, 2.4, 1.2, 0.6, 0.3, 0.15]

export const UM_MATS = [
  { id: 'areia_media', label: 'Areia Natural MÉDIA', short: 'A.N. Média' },
  { id: 'areia_fina', label: 'Areia Cava Fina', short: 'A.C. Fina' },
]

/* ── TABELAS DE UMIDADE ── */
export const HUMIDITY_MEDIA = {
  391: 0.1, 392: 0.4, 393: 0.7, 394: 1.0, 395: 1.4, 396: 1.7, 397: 2.0, 398: 2.4, 399: 2.7, 400: 3.1,
  401: 3.4, 402: 3.7, 403: 4.1, 404: 4.4, 405: 4.8, 406: 5.2, 407: 5.5, 408: 5.9, 409: 6.2, 410: 6.6,
  411: 7.0, 412: 7.3, 413: 7.7, 414: 8.1, 415: 8.5, 416: 8.9, 417: 9.2, 418: 9.6, 419: 10.0, 420: 10.4,
  421: 10.8, 422: 11.2, 423: 11.6, 424: 12.0, 425: 12.4, 426: 12.8, 427: 13.2,
}
export const HUMIDITY_FINA = {
  390: 0.0, 391: 0.3, 392: 0.6, 393: 0.9, 394: 1.3, 395: 1.6, 396: 1.9, 397: 2.3, 398: 2.6, 399: 3.0,
  400: 3.3, 401: 3.6, 402: 4.0, 403: 4.3, 404: 4.7, 405: 5.0, 406: 5.4, 407: 5.8, 408: 6.1, 409: 6.5,
  410: 6.9, 411: 7.2, 412: 7.6, 413: 8.0, 414: 8.4, 415: 8.7, 416: 9.1, 417: 9.5, 418: 9.9, 419: 10.3,
  420: 10.7, 421: 11.1, 422: 11.5, 423: 11.9, 424: 12.3, 425: 12.7, 426: 13.1,
}

export function getHumidity(matId, leitura) {
  const t = matId === 'areia_media' ? HUMIDITY_MEDIA : HUMIDITY_FINA
  const n = parseInt(String(leitura).trim())
  if (isNaN(n)) return null
  return t.hasOwnProperty(n) ? t[n] : null
}
