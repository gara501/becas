import { useEffect, useState } from 'react'

const KEY = 'atlas-becas:favoritas:v1'

function read() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '[]')
    if (!Array.isArray(saved)) return []
    const ids = new Set()
    return saved.filter((entry) => {
      if (!entry || typeof entry.id !== 'string' || !entry.id || ids.has(entry.id)) return false
      ids.add(entry.id)
      return true
    }).map((entry) => ({ id: entry.id, nombre: String(entry.nombre || entry.id), pais_destino: String(entry.pais_destino || 'No verificado') }))
  } catch { return [] }
}

export function useFavoritas() {
  const [favoritas, setFavoritas] = useState(read)
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(favoritas)) } catch { /* La navegación sigue funcionando sin almacenamiento. */ }
  }, [favoritas])
  useEffect(() => {
    const sync = (event) => { if (event.key === KEY) setFavoritas(read()) }
    window.addEventListener('storage', sync)
    return () => window.removeEventListener('storage', sync)
  }, [])
  function toggle(item) {
    setFavoritas((current) => current.some((entry) => entry.id === item.id)
      ? current.filter((entry) => entry.id !== item.id)
      : [...current, { id: item.id, nombre: item.nombre, pais_destino: item.pais_destino }])
  }
  return [favoritas, toggle]
}
