// =====================================================================
//  Sonido de los easter eggs.
//  Primero intenta el archivo de public/easter-eggs/. Si no existe,
//  genera un efecto con Web Audio (sintetizado, sin archivos).
//  Toda función devuelve detener(): corta el sonido al terminar el efecto.
// =====================================================================

let ctx = null
function contexto() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Reproduce un archivo; si falla, ejecuta respaldo() y devuelve su detener. */
export function reproducirConRespaldo(src, { inicio = 0, volumen = 0.9 } = {}, respaldo) {
  let detenerRespaldo = null
  let detenido = false
  const audio = new Audio(src)
  audio.volume = volumen

  const usarRespaldo = () => {
    if (detenido || detenerRespaldo) return
    detenerRespaldo = respaldo ? respaldo() : null
  }

  audio.addEventListener('error', usarRespaldo, { once: true })
  audio.addEventListener('loadedmetadata', () => { if (inicio) audio.currentTime = inicio }, { once: true })
  audio.play().catch(usarRespaldo)

  return () => {
    detenido = true
    audio.pause()
    if (detenerRespaldo) detenerRespaldo()
  }
}

// ---------- utilidades de síntesis ----------
function ruido(c, segundos) {
  const buffer = c.createBuffer(1, c.sampleRate * segundos, c.sampleRate)
  const datos = buffer.getChannelData(0)
  for (let i = 0; i < datos.length; i++) datos[i] = Math.random() * 2 - 1
  const fuente = c.createBufferSource()
  fuente.buffer = buffer
  return fuente
}

function tono(c, destino, { tipo = 'sine', frec, desde, hasta, t, dur, vol = 0.3 }) {
  const osc = c.createOscillator()
  const g = c.createGain()
  osc.type = tipo
  osc.frequency.setValueAtTime(desde ?? frec, t)
  if (hasta) osc.frequency.exponentialRampToValueAtTime(hasta, t + dur)
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + dur)
  osc.connect(g).connect(destino)
  osc.start(t)
  osc.stop(t + dur + 0.05)
  return osc
}

function salida(c, volumen = 0.6) {
  const g = c.createGain()
  g.gain.value = volumen
  g.connect(c.destination)
  return g
}

// ---------- efectos sintetizados ----------

/** ZA WARUDO: barrido que sube, golpe al detener el tiempo y tic-tac del reloj. */
export function sintetizarZaWarudo(segundoCongelar, segundosCongelado) {
  const c = contexto()
  const out = salida(c)
  const t0 = c.currentTime

  // Barrido de ruido que sube hasta el golpe
  const n = ruido(c, segundoCongelar)
  const filtro = c.createBiquadFilter()
  filtro.type = 'bandpass'
  filtro.frequency.setValueAtTime(200, t0)
  filtro.frequency.exponentialRampToValueAtTime(4000, t0 + segundoCongelar)
  const gn = c.createGain()
  gn.gain.setValueAtTime(0.05, t0)
  gn.gain.linearRampToValueAtTime(0.5, t0 + segundoCongelar)
  n.connect(filtro).connect(gn).connect(out)
  n.start(t0)

  // Golpe grave + campana al detenerse el tiempo
  const tc = t0 + segundoCongelar
  tono(c, out, { tipo: 'sine', desde: 140, hasta: 35, t: tc, dur: 1.4, vol: 0.9 })
  tono(c, out, { tipo: 'triangle', frec: 880, t: tc, dur: 2.5, vol: 0.15 })

  // Tic-tac mientras está congelado
  for (let i = 1; i <= segundosCongelado; i++) {
    tono(c, out, { tipo: 'square', frec: i % 2 ? 1800 : 1400, t: tc + i, dur: 0.05, vol: 0.12 })
  }
  // Barrido de vuelta al reanudar
  tono(c, out, { tipo: 'sawtooth', desde: 60, hasta: 600, t: tc + segundosCongelado, dur: 0.6, vol: 0.12 })

  return () => out.disconnect()
}

/** Heavy sin video: golpe seco y estruendo de la página cayendo. */
export function sintetizarGolpe(segundoGolpe) {
  const c = contexto()
  const out = salida(c, 0.8)
  const t = c.currentTime + segundoGolpe
  tono(c, out, { tipo: 'sine', desde: 180, hasta: 40, t, dur: 0.5, vol: 1 })
  const n = ruido(c, 1.4)
  const lp = c.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.setValueAtTime(3000, t)
  lp.frequency.exponentialRampToValueAtTime(200, t + 1.4)
  const g = c.createGain()
  g.gain.setValueAtTime(0.6, t)
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.4)
  n.connect(lp).connect(g).connect(out)
  n.start(t)
  return () => out.disconnect()
}
