import { useEffect, useRef, useState } from 'react'

// Máximo de píxeles por cuadro al recortar (más chico = más rápido). ~960×540
const PIXELES_MAX = 960 * 540

/**
 * Muestra un video con el fondo transparente (chroma key en un canvas).
 * fondo: 'verde' (pantalla verde) o 'blanco' (fondo blanco).
 * Si el video no existe intenta el GIF; si tampoco existe no muestra nada.
 *
 * Avisos al componente padre:
 *  - alListo(video): el video ya se está reproduciendo (recibe el <video> para pausarlo, etc.)
 *  - alFallar():     no hay video (se usa el GIF o nada)
 *  - alTerminar():   el video llegó al final
 */
function VideoTransparente({ video, gif, className, conSonido = false, fondo = 'verde', alListo, alFallar, alTerminar }) {
  const [modo, setModo] = useState(video ? 'video' : gif ? 'gif' : 'nada')
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  // Los avisos se guardan en una ref para no reiniciar el efecto si cambian
  const avisos = useRef({})
  avisos.current = { alListo, alFallar, alTerminar }

  useEffect(() => {
    if (modo !== 'video') return
    const v = videoRef.current
    const canvas = canvasRef.current
    const g = canvas.getContext('2d', { willReadFrequently: true })
    let frame = 0

    const dibujar = () => {
      if (v.readyState >= 2 && v.videoWidth) {
        const escala = Math.min(1, Math.sqrt(PIXELES_MAX / (v.videoWidth * v.videoHeight)))
        const w = Math.round(v.videoWidth * escala)
        const h = Math.round(v.videoHeight * escala)
        if (canvas.width !== w) { canvas.width = w; canvas.height = h }
        g.drawImage(v, 0, 0, w, h)
        const img = g.getImageData(0, 0, w, h)
        const d = img.data
        if (fondo === 'blanco') {
          for (let i = 0; i < d.length; i += 4) {
            const min = Math.min(d[i], d[i + 1], d[i + 2])
            const gris = Math.max(d[i], d[i + 1], d[i + 2]) - min < 28 // sin color
            if (gris && min > 238) d[i + 3] = 0 // blanco de fondo: transparente
            else if (gris && min > 210) d[i + 3] = 255 * (238 - min) / 28 // borde suave
          }
        } else {
          for (let i = 0; i < d.length; i += 4) {
            const r = d[i], gr = d[i + 1], b = d[i + 2]
            const exceso = gr - Math.max(r, b) // cuánto más verde que rojo/azul
            if (gr > 80 && exceso > 40) {
              d[i + 3] = 0 // verde de fondo: transparente
            } else if (gr > 60 && exceso > 15) {
              d[i + 3] = 255 * (1 - (exceso - 15) / 25) // borde: semitransparente
              d[i + 1] = Math.max(r, b) // y sin tinte verde
            }
          }
        }
        g.putImageData(img, 0, 0)
      }
      frame = requestAnimationFrame(dibujar)
    }

    const alReproducir = () => avisos.current.alListo?.(v)
    const alFin = () => avisos.current.alTerminar?.()
    v.addEventListener('playing', alReproducir, { once: true })
    v.addEventListener('ended', alFin)

    let activo = true
    v.muted = !conSonido
    v.play().catch(err => {
      // Solo si el navegador BLOQUEA el sonido se reproduce en silencio.
      // (Un AbortError aparece cuando React reinicia el efecto: no hay que silenciar.)
      if (activo && err?.name === 'NotAllowedError') {
        v.muted = true
        v.play().catch(() => {})
      }
    })
    frame = requestAnimationFrame(dibujar)

    return () => {
      activo = false
      cancelAnimationFrame(frame)
      v.removeEventListener('playing', alReproducir)
      v.removeEventListener('ended', alFin)
      v.pause()
    }
  }, [modo, conSonido, fondo])

  const fallar = () => {
    avisos.current.alFallar?.()
    setModo(gif ? 'gif' : 'nada')
  }

  if (modo === 'nada') return null

  if (modo === 'gif') {
    return <img src={gif} alt="" className={className} onError={() => setModo('nada')} />
  }

  return (
    <>
      <video
        ref={videoRef}
        src={video}
        playsInline
        preload="auto"
        style={{ display: 'none' }}
        onError={fallar}
      />
      <canvas ref={canvasRef} className={className} />
    </>
  )
}

export default VideoTransparente
