// =====================================================================
//  "Tirar la página": cada pieza visible sale volando y cae con gravedad.
//  No toca el contenido ni el estado de React: solo agrega estilos
//  temporales que después se quitan.
// =====================================================================

// Piezas que se desarman (de las grandes a las chicas)
const SELECTOR = [
  'nav', 'footer', '.card', '.vapor-card', 'table', '.carousel',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'img', 'canvas', 'svg',
  'button', '.btn', 'a', 'input', 'textarea', 'select', 'label', 'li', 'hr',
  '.badge', '.tab-vapor', '.subtitulo-vapor', '.titulo-caja-vapor'
].join(',')

let piezas = []

const azar = (min, max) => min + Math.random() * (max - min)

/** Desarma la página. origenX: desde dónde viene el golpe (las piezas cercanas caen primero). */
export function desarmarPagina(origenX = 0) {
  const raiz = document.getElementById('root')
  if (!raiz) return
  const alto = window.innerHeight
  const ancho = window.innerWidth

  piezas = [...raiz.querySelectorAll(SELECTOR)].filter(el => {
    const r = el.getBoundingClientRect()
    return r.width * r.height > 16 && r.bottom > 0 && r.top < alto && r.right > 0 && r.left < ancho
  })

  for (const el of piezas) {
    const r = el.getBoundingClientRect()
    // Onda que avanza desde el puño hacia la derecha
    const retraso = Math.max(0, (r.left - origenX) / ancho) * 0.35 + azar(0, 0.12)
    el.style.setProperty('--ee-dx', `${azar(80, 520).toFixed(0)}px`)
    el.style.setProperty('--ee-rot', `${azar(-40, 110).toFixed(0)}deg`)
    el.style.setProperty('--ee-dur', `${azar(0.9, 1.5).toFixed(2)}s`)
    el.style.setProperty('--ee-delay', `${retraso.toFixed(2)}s`)
    el.classList.add('ee-cae')
  }
}

/** Vuelve a armar la página. animado=false la deja lista al instante. */
export function rearmarPagina(animado = true) {
  const lista = piezas
  piezas = []
  for (const el of lista) {
    el.classList.remove('ee-cae')
    if (animado) el.classList.add('ee-vuelve')
  }
  const limpiar = () => lista.forEach(el => {
    el.classList.remove('ee-vuelve')
    for (const v of ['--ee-dx', '--ee-rot', '--ee-dur', '--ee-delay']) el.style.removeProperty(v)
  })
  if (animado) setTimeout(limpiar, 900)
  else limpiar()
}
