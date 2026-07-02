export function lsGet(k) {
  try {
    const v = localStorage.getItem(k)
    return v ? JSON.parse(v) : null
  } catch {
    return null
  }
}

export function lsSet(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v))
    return true
  } catch {
    return false
  }
}

export function lsDel(k) {
  try {
    localStorage.removeItem(k)
  } catch {
    /* noop */
  }
}

export function lsKeys(p) {
  try {
    return Object.keys(localStorage)
      .filter((k) => k.startsWith(p))
      .map((k) => k.slice(p.length))
  } catch {
    return []
  }
}
