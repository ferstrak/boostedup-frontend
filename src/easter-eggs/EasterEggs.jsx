import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EASTER_EGGS } from './config'
import VideoTransparente from './VideoTransparente'
import { reproducirConRespaldo, sintetizarZaWarudo, sintetizarGolpe } from './sonidos'
import { desarmarPagina, rearmarPagina } from './caida'
import './easter-eggs.css'

/** Programa varios setTimeout y devuelve una función que los cancela todos. */
function programar(pasos) {
  const ids = pasos.map(([ms, fn]) => setTimeout(fn, ms))
  return () => ids.forEach(clearTimeout)
}

/* =====================================================================
   ZA WARUDO — Dio grita y el tiempo se detiene: la página queda congelada
   y en blanco y negro. Solo Dio sigue a color.

   Con video: todo se sincroniza con el video (su propio audio y esferas).
     · segundoCongelar      → la página se congela (sale la esfera del video)
     · segundoPausarVideo   → el video se pausa con Dio en el aire
     · al cumplirse segundosCongelado el video sigue; su segunda esfera
       coincide con el regreso del color.
   Sin video: mismos pasos con tiempos fijos y sonido generado.
   ===================================================================== */
function ZaWarudo({ alTerminar }) {
  const cfg = EASTER_EGGS.zawarudo
  const [modo, setModo] = useState('cargando') // cargando | video | respaldo
  const [fase, setFase] = useState('grito')    // grito → congelado → reanudando
  const [segundos, setSegundos] = useState(0)
  const [verVideo, setVerVideo] = useState(true)
  const [textoGrito, setTextoGrito] = useState('') // texto sincronizado con la voz del video
  const modoRef = useRef('cargando')
  const limpiezas = useRef([])

  // --- acciones comunes ---
  const congelar = useCallback(() => {
    document.documentElement.classList.add('tiempo-detenido')
    setFase('congelado')
    const ids = []
    for (let s = 1; s < cfg.segundosCongelado; s++) ids.push(setTimeout(() => setSegundos(s), s * 1000))
    limpiezas.current.push(() => ids.forEach(clearTimeout))
  }, [cfg])

  const descongelar = useCallback(() => {
    document.documentElement.classList.remove('tiempo-detenido')
    setFase('reanudando')
  }, [])

  const despuesDe = (ms, fn) => {
    const id = setTimeout(fn, ms)
    limpiezas.current.push(() => clearTimeout(id))
  }

  // Limpieza general al desmontar (Esc o fin)
  useEffect(() => {
    const raiz = document.documentElement
    const lista = limpiezas.current
    // Seguro: si algo se traba, el efecto termina igual
    const seguro = setTimeout(alTerminar, (cfg.segundoCongelar + cfg.segundosCongelado + 6) * 1000)
    return () => {
      clearTimeout(seguro)
      lista.forEach(fn => fn())
      raiz.classList.remove('tiempo-detenido')
    }
  }, [alTerminar, cfg])

  // Si el video no empieza en 2,5 s, se usa el modo de respaldo
  useEffect(() => {
    const id = setTimeout(() => { if (modoRef.current === 'cargando') usarRespaldo() }, 2500)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- modo respaldo: tiempos fijos + sonido (archivo o generado) ---
  function usarRespaldo() {
    if (modoRef.current !== 'cargando') return
    modoRef.current = 'respaldo'
    setModo('respaldo')
    const detenerSonido = reproducirConRespaldo(cfg.audio, {}, () =>
      sintetizarZaWarudo(cfg.segundoCongelar, cfg.segundosCongelado))
    limpiezas.current.push(detenerSonido)
    const msCongelar = cfg.segundoCongelar * 1000
    const msCongelado = cfg.segundosCongelado * 1000
    despuesDe(msCongelar, congelar)
    despuesDe(msCongelar + msCongelado, descongelar)
    despuesDe(msCongelar + msCongelado + 1800, alTerminar)
  }

  // --- modo video: se sigue el tiempo del propio video ---
  function usarVideo(v) {
    if (modoRef.current !== 'cargando') return
    modoRef.current = 'video'
    setModo('video')
    let congelado = false
    let pausado = false
    let silaba = 0
    let tCongelar = 0
    let frame = 0

    const vigilar = () => {
      // El texto aparece sílaba por sílaba, cuando Dio lo dice
      while (silaba < cfg.textoGrito.length && v.currentTime >= cfg.textoGrito[silaba][0]) {
        setTextoGrito(cfg.textoGrito[silaba][1])
        silaba++
      }
      if (!congelado && v.currentTime >= cfg.segundoCongelar) {
        congelado = true
        tCongelar = Date.now()
        congelar()
        despuesDe(cfg.segundosTextoTrasCongelar * 1000, () => setTextoGrito(''))
      }
      if (congelado && !pausado && v.currentTime >= cfg.segundoPausarVideo) {
        pausado = true
        v.pause()
        const restante = Math.max(0, cfg.segundosCongelado * 1000 - (Date.now() - tCongelar))
        despuesDe(restante, () => {
          v.play().catch(() => {})
          despuesDe(cfg.msColorTrasReanudar, descongelar)
        })
      }
      if (!pausado) frame = requestAnimationFrame(vigilar)
    }
    frame = requestAnimationFrame(vigilar)
    limpiezas.current.push(() => cancelAnimationFrame(frame))
  }

  const alFinVideo = () => {
    if (modoRef.current !== 'video') return
    setVerVideo(false)
    descongelar()
    despuesDe(1800, alTerminar)
  }

  return (
    <div className="ee-capa ee-bloquea">
      {verVideo && modo !== 'respaldo' && (
        <VideoTransparente
          video={cfg.video}
          gif={cfg.gif}
          conSonido={cfg.usarSonidoDelVideo}
          className="ee-video-completo ee-video-llena"
          alListo={usarVideo}
          alFallar={usarRespaldo}
          alTerminar={alFinVideo}
        />
      )}
      {/* Sin video: se intenta el GIF como personaje */}
      {modo === 'respaldo' && fase !== 'reanudando' && (
        <VideoTransparente gif={cfg.gif} className="ee-personaje ee-personaje-dio" />
      )}

      {/* Con video: el texto sigue a la voz de Dio */}
      {modo === 'video' && textoGrito && (
        <div key={textoGrito} className="ee-texto ee-zawarudo-grito ee-arriba">{textoGrito}</div>
      )}

      {modo === 'respaldo' && fase === 'grito' && (
        <div className="ee-texto ee-zawarudo-grito">ZA WARUDO!</div>
      )}

      {fase === 'reanudando' && (
        <div className="ee-texto ee-zawarudo-fin">El tiempo vuelve a moverse</div>
      )}

      {fase === 'congelado' && (
        <>
          {modo === 'respaldo' && <div className="ee-esfera" />}
          {modo === 'respaldo' && <div className="ee-texto ee-zawarudo-grito ee-grande">ZA WARUDO!</div>}
          {segundos > 0 && (
            <div className="ee-contador">{segundos} {segundos === 1 ? 'segundo' : 'segundos'}…</div>
          )}
        </>
      )}

    </div>
  )
}

/* =====================================================================
   HEAVY — "POW!": el Heavy da un puñetazo, la página se desarma y cae,
   y queda una página de error 500 de Spring Boot, como si el servidor
   se hubiera caído de verdad. Un clic (o esperar) la arregla.
   ===================================================================== */

/** Fecha con el formato de Java (Date.toString), como la muestra Spring Boot. */
function fechaJava() {
  const d = new Date()
  const dia = d.toLocaleString('en-US', { weekday: 'short' })
  const mes = d.toLocaleString('en-US', { month: 'short' })
  const hora = d.toLocaleTimeString('en-GB', { hour12: false })
  const zona = d.toLocaleString('en-US', { timeZoneName: 'short' }).split(' ').pop()
  return `${dia} ${mes} ${String(d.getDate()).padStart(2, '0')} ${hora} ${zona} ${d.getFullYear()}`
}

function Heavy({ alTerminar }) {
  const cfg = EASTER_EGGS.heavy
  const [modo, setModo] = useState('cargando') // cargando | video | respaldo
  const [verVideo, setVerVideo] = useState(true)   // Heavy dando el golpe
  const [heavyOculto, setHeavyOculto] = useState(false) // tras el POW solo se oye la risa
  const [error, setError] = useState(false)        // página de error 500
  const [vuelta, setVuelta] = useState(false)      // Heavy riéndose y explotando al volver
  const modoRef = useRef('cargando')
  const estado = useRef({ golpe: false, puedeArreglar: false, arreglando: false })
  const limpiezas = useRef([])
  const tituloOriginal = useRef(document.title)

  const despuesDe = (ms, fn) => {
    const id = setTimeout(fn, ms)
    limpiezas.current.push(() => clearTimeout(id))
  }

  // "POW!": cae la página de error de golpe (detrás, la página se desarma)
  const golpear = () => {
    if (estado.current.golpe) return
    estado.current.golpe = true
    desarmarPagina(window.innerWidth * 0.35)
    setError(true)
    // El Heavy desaparece con el golpe, pero el video sigue sonando: queda solo el "HA HA HA"
    setHeavyOculto(true)
    // Spring no pone <title>: el navegador muestra la dirección
    document.title = window.location.host + window.location.pathname
  }

  // Termina la risa: el Heavy se va y queda solo el error
  const quedarEnError = () => {
    if (estado.current.puedeArreglar) return
    golpear()
    estado.current.puedeArreglar = true
    setVerVideo(false)
    despuesDe(cfg.segundosError * 1000, arreglar)
  }

  // Un clic, una tecla o esperar: vuelve la página y el Heavy explota encima
  const arreglar = () => {
    if (!estado.current.puedeArreglar || estado.current.arreglando) return
    estado.current.arreglando = true
    setError(false)
    document.title = tituloOriginal.current
    rearmarPagina(true)
    setVuelta(true)
    // Seguro por si el video de la explosión no carga o se traba
    despuesDe((cfg.segundoFinVuelta + 3) * 1000, alTerminar)
  }

  useEffect(() => {
    const lista = limpiezas.current
    const titulo = tituloOriginal.current
    const alTeclear = (e) => { if (e.key !== 'Escape') arreglar() }
    window.addEventListener('keydown', alTeclear)
    const id = setTimeout(() => { if (modoRef.current === 'cargando') usarRespaldo() }, 2500)
    return () => {
      clearTimeout(id)
      window.removeEventListener('keydown', alTeclear)
      lista.forEach(fn => fn())
      // Si se corta con Esc, la página vuelve a quedar armada al instante
      if (!estado.current.arreglando) rearmarPagina(false)
      document.title = titulo
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function usarRespaldo() {
    if (modoRef.current !== 'cargando') return
    modoRef.current = 'respaldo'
    setModo('respaldo')
    const golpeRespaldo = 0.6
    limpiezas.current.push(reproducirConRespaldo(cfg.audio, {}, () => sintetizarGolpe(golpeRespaldo)))
    despuesDe(golpeRespaldo * 1000, golpear)
    despuesDe(golpeRespaldo * 1000 + 1500, quedarEnError)
  }

  function usarVideo(v) {
    if (modoRef.current !== 'cargando') return
    modoRef.current = 'video'
    setModo('video')
    let frame = 0
    const vigilar = () => {
      if (v.currentTime >= cfg.segundoGolpe) golpear()
      if (v.currentTime >= cfg.segundoFinVideo) { quedarEnError(); return }
      frame = requestAnimationFrame(vigilar)
    }
    frame = requestAnimationFrame(vigilar)
    limpiezas.current.push(() => cancelAnimationFrame(frame))
  }

  // Video de la vuelta: se corta cuando ya solo queda la minigun en el piso
  function vigilarVuelta(v) {
    let frame = 0
    const vigilar = () => {
      if (v.currentTime >= cfg.segundoFinVuelta) { alTerminar(); return }
      frame = requestAnimationFrame(vigilar)
    }
    frame = requestAnimationFrame(vigilar)
    limpiezas.current.push(() => cancelAnimationFrame(frame))
  }

  return (
    <div className="ee-capa ee-bloquea" onClick={arreglar}>
      {/* El error va debajo: el Heavy se ríe encima de él */}
      {error && (
        <div className="ee-whitelabel">
          <h1>Whitelabel Error Page</h1>
          <p>This application has no explicit mapping for /error, so you are seeing this as a fallback.</p>
          <div>{fechaJava()}</div>
          <div>There was an unexpected error (type=Internal Server Error, status=500).</div>
        </div>
      )}

      {verVideo && modo !== 'respaldo' && (
        <VideoTransparente
          video={cfg.video}
          gif={cfg.gif}
          conSonido={cfg.usarSonidoDelVideo}
          className={`ee-video-completo ${heavyOculto ? 'ee-oculto' : ''}`}
          alListo={usarVideo}
          alFallar={usarRespaldo}
          alTerminar={quedarEnError}
        />
      )}
      {modo === 'respaldo' && verVideo && (
        <VideoTransparente gif={cfg.gif} className="ee-personaje ee-personaje-heavy" />
      )}

      {vuelta && (
        <VideoTransparente
          video={cfg.videoVuelta}
          fondo={cfg.fondoVuelta}
          conSonido
          className="ee-video-completo"
          alListo={vigilarVuelta}
          alFallar={() => despuesDe(900, alTerminar)}
          alTerminar={alTerminar}
        />
      )}
    </div>
  )
}

const EFECTOS = { zawarudo: ZaWarudo, heavy: Heavy }

/** Escucha los eventos "easter-egg" y muestra el efecto encima de toda la página. */
function EasterEggs() {
  const [activo, setActivo] = useState(null)
  const terminar = useCallback(() => setActivo(null), [])

  useEffect(() => {
    const alLanzar = (e) => setActivo(actual => actual ?? { ...e.detail, clave: Date.now() })
    const alTeclear = (e) => { if (e.key === 'Escape') setActivo(null) }
    window.addEventListener('easter-egg', alLanzar)
    window.addEventListener('keydown', alTeclear)
    return () => {
      window.removeEventListener('easter-egg', alLanzar)
      window.removeEventListener('keydown', alTeclear)
    }
  }, [])

  // Mientras dura un efecto no se puede hacer scroll; al terminar se avisa (el reproductor retoma la música)
  const huboEfecto = useRef(false)
  useEffect(() => {
    document.body.classList.toggle('ee-sin-scroll', !!activo)
    if (activo) huboEfecto.current = true
    else if (huboEfecto.current) {
      huboEfecto.current = false
      window.dispatchEvent(new Event('easter-egg-fin'))
    }
  }, [activo])

  if (!activo) return null
  const Efecto = EFECTOS[activo.id]
  if (!Efecto) return null

  return createPortal(
    <Efecto key={activo.clave} datos={activo} alTerminar={terminar} />,
    document.body
  )
}

export default EasterEggs
