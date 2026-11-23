import { useCallback, useEffect, useRef, useState } from 'react'
import './reproductor.css'

/*
 * Reproductor de música flotante (esquina inferior izquierda).
 * - Las canciones están en public/musica/ y la lista en public/musica/canciones.json:
 *     [{ "titulo": "Nombre que se muestra", "archivo": "cancion.mp3" }, ...]
 * - Está fuera de las rutas: la música no se corta al cambiar de página.
 * - Recuerda volumen, canción y si estaba minimizado.
 * - Se pausa sola durante los easter eggs (tienen su propio audio) y luego sigue.
 * - Si no hay canciones, no se muestra.
 */

const CARPETA = '/musica/'
const GUARDADO = 'reproductor'

function leerGuardado() {
  try { return JSON.parse(localStorage.getItem(GUARDADO)) || {} } catch { return {} }
}
function guardar(datos) {
  try { localStorage.setItem(GUARDADO, JSON.stringify(datos)) } catch { /* modo privado: no se guarda */ }
}

const formatoTiempo = (s) => {
  if (!Number.isFinite(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function ReproductorMusica() {
  const inicial = useRef(leerGuardado()).current
  const [canciones, setCanciones] = useState([])
  const [indice, setIndice] = useState(inicial.indice ?? 0)
  const [sonando, setSonando] = useState(false)
  const [volumen, setVolumen] = useState(inicial.volumen ?? 0.5)
  const [minimizado, setMinimizado] = useState(
    inicial.minimizado ?? window.matchMedia?.('(max-width: 576px)').matches ?? false
  )
  const [tiempo, setTiempo] = useState(0)
  const [duracion, setDuracion] = useState(0)
  const audioRef = useRef(null)
  const pausadoPorEasterEgg = useRef(false)
  const fallosSeguidos = useRef(0)
  const quiereSonar = useRef(false) // intención del usuario (no cambia si un archivo falla)
  const direccion = useRef(1)       // hacia dónde saltar si un archivo no existe

  // Lista de canciones
  useEffect(() => {
    fetch(CARPETA + 'canciones.json')
      .then(r => (r.ok ? r.json() : []))
      .then(lista => {
        const validas = Array.isArray(lista) ? lista.filter(c => c?.archivo) : []
        setCanciones(validas)
        setIndice(i => (i < validas.length ? i : 0))
      })
      .catch(() => setCanciones([])) // sin lista (o el servidor devolvió otra cosa): no se muestra
  }, [])

  // Guardar preferencias
  useEffect(() => { guardar({ indice, volumen, minimizado }) }, [indice, volumen, minimizado])
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volumen }, [volumen])

  const cancion = canciones[indice]

  // Solo un bloqueo del navegador (sin interacción previa) cancela la intención de sonar.
  // Un archivo que falla no: el reproductor salta a la siguiente y sigue.
  const intentarSonar = useCallback(() => {
    const a = audioRef.current
    if (!a) return
    a.play()
      .then(() => setSonando(true))
      .catch(err => {
        if (err?.name === 'NotAllowedError') { quiereSonar.current = false; setSonando(false) }
      })
  }, [])

  const reproducir = useCallback(() => {
    quiereSonar.current = true
    intentarSonar()
  }, [intentarSonar])

  const pausar = useCallback(() => {
    quiereSonar.current = false
    audioRef.current?.pause()
    setSonando(false)
  }, [])

  const cambiar = useCallback((paso) => {
    direccion.current = paso
    setIndice(i => (i + paso + canciones.length) % canciones.length)
    setTiempo(0)
    setDuracion(0)
  }, [canciones.length])

  // Al cambiar de canción: si se quería escuchar música, sigue sonando
  useEffect(() => {
    const a = audioRef.current
    if (!a || !cancion) return
    a.volume = volumen
    if (quiereSonar.current) intentarSonar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancion])

  // Los easter eggs pausan la música y al terminar la retoman
  useEffect(() => {
    const alEmpezar = () => {
      if (quiereSonar.current) {
        pausadoPorEasterEgg.current = true
        pausar()
      }
    }
    const alTerminar = () => {
      if (pausadoPorEasterEgg.current) {
        pausadoPorEasterEgg.current = false
        reproducir()
      }
    }
    window.addEventListener('easter-egg', alEmpezar)
    window.addEventListener('easter-egg-fin', alTerminar)
    return () => {
      window.removeEventListener('easter-egg', alEmpezar)
      window.removeEventListener('easter-egg-fin', alTerminar)
    }
  }, [pausar, reproducir])

  if (canciones.length === 0) return null

  const alFallar = () => {
    // Si un archivo no existe se salta al siguiente (sin quedar en un ciclo infinito)
    fallosSeguidos.current += 1
    if (fallosSeguidos.current < canciones.length) cambiar(direccion.current)
    else { quiereSonar.current = false; setSonando(false) }
  }

  const audio = (
    <audio
      ref={audioRef}
      src={CARPETA + encodeURIComponent(cancion.archivo)}
      preload="none" // la canción solo se descarga al apretar play
      onTimeUpdate={e => setTiempo(e.currentTarget.currentTime)}
      onLoadedMetadata={e => { setDuracion(e.currentTarget.duration); fallosSeguidos.current = 0 }}
      onEnded={() => cambiar(1)}
      onPause={() => { if (!quiereSonar.current) setSonando(false) }}
      onError={alFallar}
    />
  )

  const titulo = cancion.titulo || cancion.archivo

  // El <audio> va siempre en el mismo lugar: así minimizar/abrir no corta la música
  return (
    <div
      className={`reproductor ${minimizado ? 'reproductor-mini' : ''}`}
      role="region"
      aria-label="Reproductor de música"
    >
      {audio}

      {minimizado ? (
        <button
          className={`reproductor-boton-mini ${sonando ? 'sonando' : ''}`}
          onClick={() => setMinimizado(false)}
          aria-label="Abrir reproductor de música"
          title={sonando ? `Sonando: ${titulo}` : 'Música'}
        >
          ♪
        </button>
      ) : (
        <>
          <div className="reproductor-cabecera">
            <span className="reproductor-etiqueta">{sonando ? '♪ Sonando' : '♪ Música'}</span>
            <button className="reproductor-cerrar" onClick={() => setMinimizado(true)} aria-label="Minimizar reproductor">—</button>
          </div>

          <div className="reproductor-titulo" title={titulo}>
            <span className={titulo.length > 24 ? 'desliza' : ''}>{titulo}</span>
          </div>

          <input
            type="range"
            className="reproductor-barra"
            min="0"
            max={duracion || 0}
            step="0.1"
            value={tiempo}
            onChange={e => { audioRef.current.currentTime = Number(e.target.value); setTiempo(Number(e.target.value)) }}
            aria-label="Avance de la canción"
          />
          <div className="reproductor-tiempos">
            <span>{formatoTiempo(tiempo)}</span>
            <span>{formatoTiempo(duracion)}</span>
          </div>

          <div className="reproductor-controles">
            <button onClick={() => cambiar(-1)} aria-label="Canción anterior">⏮</button>
            <button className="reproductor-play" onClick={sonando ? pausar : reproducir} aria-label={sonando ? 'Pausar' : 'Reproducir'}>
              {sonando ? '❚❚' : '▶'}
            </button>
            <button onClick={() => cambiar(1)} aria-label="Siguiente canción">⏭</button>
          </div>

          <div className="reproductor-volumen">
            <span aria-hidden="true">{volumen === 0 ? '🔇' : '🔊'}</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volumen}
              onChange={e => setVolumen(Number(e.target.value))}
              aria-label="Volumen"
            />
          </div>
          <div className="reproductor-pista">{indice + 1} / {canciones.length}</div>
        </>
      )}
    </div>
  )
}

export default ReproductorMusica
