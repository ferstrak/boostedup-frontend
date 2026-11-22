// Utilidades de precios compartidas por la tienda

/** Un producto está en oferta si tiene descuento (las colecciones nunca lo están). */
export function estaEnOferta(p) {
  return !p.es_portada && p.es_oferta === true && p.descuento > 0
}

/** Precio que realmente se cobra (aplica el descuento si el producto está en oferta). */
export function precioFinal(p) {
  return estaEnOferta(p) ? Math.round(p.precio * (1 - p.descuento / 100)) : p.precio
}

/** "Colección Destiny" -> "Destiny" (así se llama la colección en sus productos). */
export function nombreColeccion(portada) {
  return portada.titulo.replace('Colección ', '').trim()
}

/**
 * Devuelve { "Destiny": 342891, ... } con el precio más bajo de cada colección.
 * Se consideran solo los productos con stock; si ninguno tiene, se usan todos.
 */
export function preciosDesdePorColeccion(productos) {
  const grupos = {}
  for (const p of productos) {
    if (p.es_portada || !p.coleccion) continue
    ;(grupos[p.coleccion] ||= []).push(p)
  }
  const mapa = {}
  for (const [coleccion, lista] of Object.entries(grupos)) {
    const conStock = lista.filter(p => p.stock > 0)
    const base = conStock.length ? conStock : lista
    mapa[coleccion] = Math.min(...base.map(precioFinal))
  }
  return mapa
}

/** Precio "Desde" de una portada; si su colección no tiene productos, usa su propio precio. */
export function precioDesde(portada, mapa) {
  return mapa[nombreColeccion(portada)] ?? portada.precio
}
