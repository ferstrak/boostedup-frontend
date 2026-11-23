// =====================================================================
//  EASTER EGGS — configuración
//  Los archivos van en public/easter-eggs/ (no se suben a GitHub, ver LEEME.md).
//  Si falta un archivo, el easter egg igual funciona: se usa un sonido
//  generado por el navegador y solo el efecto visual.
// =====================================================================

const CARPETA = '/easter-eggs/'

// Clics seguidos en el título del producto para activarlo
export const CLICS_NECESARIOS = 5
// Si pasa más de este tiempo entre clics, la cuenta vuelve a cero
export const MS_ENTRE_CLICS = 1500

export const EASTER_EGGS = {
  zawarudo: {
    // Qué productos lo activan (se busca la palabra en el título)
    palabras: ['dio'],
    // Video con fondo verde (se vuelve transparente) o GIF; se usa el primero que exista
    video: CARPETA + 'zawarudo.mp4',
    gif: CARPETA + 'zawarudo.gif',
    // Solo se usa si no hay video (el video trae su propio audio)
    audio: CARPETA + 'zawarudo.mp3',
    usarSonidoDelVideo: true,
    // Texto sincronizado con la voz de Dio en el video: [segundo, texto]
    textoGrito: [[0.25, 'ZA…'], [0.65, 'ZA WA…'], [1.3, 'ZA WARUDO!']],
    // Segundos que el texto sigue en pantalla después de congelarse la página
    segundosTextoTrasCongelar: 1.2,
    // Segundo del video en que sale la esfera y la página se congela
    segundoCongelar: 2.0,
    // Segundo del video en que se pausa (Dio queda suspendido en el aire)
    segundoPausarVideo: 3.6,
    // Cuánto dura el tiempo detenido (desde que se congela)
    segundosCongelado: 5,
    // Al seguir el video, su 2ª esfera tarda esto en aparecer: ahí vuelve el color
    msColorTrasReanudar: 300
  },

  heavy: {
    palabras: ['heavy'],
    video: CARPETA + 'heavy.mp4',
    gif: CARPETA + 'heavy.gif',
    audio: CARPETA + 'heavy.mp3', // solo si no hay video (el video trae el "POW! HAHA")
    usarSonidoDelVideo: true,
    // Segundo del video en que dice "POW!": ahí cae la página de error
    segundoGolpe: 2.05,
    // Segundo del video en que termina la risa: el Heavy se va y queda solo el error
    segundoFinVideo: 3.5,
    // Al volver la página: el Heavy se ríe y explota (video con fondo BLANCO)
    videoVuelta: CARPETA + 'heavy-explota.mp4',
    fondoVuelta: 'blanco',
    // Ahí ya solo queda la minigun en el piso: se corta
    segundoFinVuelta: 5.5,
    // Si nadie hace clic, la página se arregla sola después de estos segundos
    segundosError: 8
  }
}

/** Devuelve el id del easter egg que corresponde a un título, o null. */
export function easterEggDeTitulo(titulo = '') {
  const palabras = titulo
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // sin tildes
    .split(/[^a-z0-9]+/)
  for (const [id, egg] of Object.entries(EASTER_EGGS)) {
    if (egg.palabras.some(p => palabras.includes(p))) return id
  }
  return null
}

/** Descarga de antemano el video del easter egg para que parta sin demora. */
export function precargarEasterEgg(id) {
  const egg = EASTER_EGGS[id]
  if (egg?.video) fetch(egg.video).catch(() => {})
}

/** Lanza un easter egg desde cualquier parte de la app. */
export function lanzarEasterEgg(id, datos = {}) {
  window.dispatchEvent(new CustomEvent('easter-egg', { detail: { id, ...datos } }))
}
