/**
 * Wrappers seguros em torno do localStorage (não há backend — tudo fica no navegador).
 * Cada registro diário é salvo com a chave `smx:AAAA-MM-DD`.
 */

// Lê e faz parse de um valor JSON salvo; retorna null se não existir ou estiver corrompido
export function lsGet(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

// Salva um valor como JSON; retorna false se o navegador recusar (ex: modo privado, quota cheia)
export function lsSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

// Remove uma chave
export function lsDel(key) {
  try {
    localStorage.removeItem(key)
  } catch {
    /* noop */
  }
}

// Lista o "sufixo" (ex: a data) de todas as chaves que começam com um prefixo (ex: 'smx:')
export function lsKeys(prefix) {
  try {
    return Object.keys(localStorage)
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length))
  } catch {
    return []
  }
}
