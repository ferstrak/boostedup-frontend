import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGoogleClientId, loginGoogle } from '../services/api'
import { useAuth, rutaInicialPorRol } from '../context/AuthContext'

/*
 * Botón propio "Iniciar sesión con Google".
 *
 * El botón oficial de Google se "personaliza" solo ("Continuar como Juan…") cuando
 * el navegador ya tiene una cuenta de Google abierta. Para mostrar siempre el
 * selector de cuentas de Google, este botón abre la ventana estándar de Google
 * (OpenID Connect, prompt=select_account). Google devuelve un ID token a
 * /google-callback.html, que lo pasa a esta ventana. El token se envía a
 * POST /v1/auth/google igual que antes: el backend no cambia.
 *
 * Requisito en Google Cloud Console → Credenciales → cliente OAuth →
 * "URI de redireccionamiento autorizados": <origen>/google-callback.html
 * (ej. http://localhost:5173/google-callback.html).
 */

const AUTORIZACION_GOOGLE = 'https://accounts.google.com/o/oauth2/v2/auth'

const aleatorio = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2) + Date.now().toString(36)

function GoogleLoginButton({ texto = 'signin_with', onError }) {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [clientId, setClientId] = useState(null)
  const [disponible, setDisponible] = useState(true)
  const [cargando, setCargando] = useState(false)
  const estadoEsperado = useRef(null)

  // El ID de cliente lo entrega el backend
  useEffect(() => {
    getGoogleClientId()
      .then(id => (id ? setClientId(id) : setDisponible(false)))
      .catch(() => setDisponible(false))
  }, [])

  // Recibe el resultado de Google (desde la ventana emergente o tras una redirección)
  const procesar = useCallback(async (datos) => {
    const esperado = estadoEsperado.current ?? sessionStorage.getItem('google-estado')
    sessionStorage.removeItem('google-estado')
    estadoEsperado.current = null
    if (!datos || datos.state !== esperado) return // respuesta que no pedimos: se ignora
    if (datos.error) {
      setCargando(false)
      if (datos.error !== 'access_denied') onError?.('No se pudo iniciar sesión con Google')
      return // access_denied = el usuario cerró o canceló: no es un error
    }
    try {
      const sesion = await loginGoogle(datos.id_token)
      login(sesion)
      const u = sesion.usuario
      // Las cuentas nuevas de Google no traen dirección: se pide completar el perfil
      if (!u.direccion || !u.region || !u.comuna) navigate('/completar-perfil')
      else navigate(rutaInicialPorRol(u))
    } catch (e) {
      onError?.(e.message)
    } finally {
      setCargando(false)
    }
  }, [login, navigate, onError])

  useEffect(() => {
    const alRecibir = (e) => {
      if (e.origin !== window.location.origin || e.data?.tipo !== 'google-login') return
      procesar(e.data)
    }
    window.addEventListener('message', alRecibir)

    // Vuelta de una redirección (si el navegador bloqueó la ventana emergente)
    const guardado = sessionStorage.getItem('google-login')
    if (guardado) {
      sessionStorage.removeItem('google-login')
      procesar(JSON.parse(guardado))
    }
    return () => window.removeEventListener('message', alRecibir)
  }, [procesar])

  const iniciar = () => {
    if (!clientId) return
    const estado = aleatorio()
    estadoEsperado.current = estado
    sessionStorage.setItem('google-estado', estado)
    sessionStorage.setItem('google-volver', window.location.pathname)

    const url = AUTORIZACION_GOOGLE + '?' + new URLSearchParams({
      client_id: clientId,
      redirect_uri: window.location.origin + '/google-callback.html',
      response_type: 'id_token',
      scope: 'openid email profile',
      prompt: 'select_account', // siempre muestra el selector de cuentas
      nonce: aleatorio(),
      state: estado
    })

    // Ventana emergente centrada; si el navegador la bloquea, se usa redirección
    const ancho = 500, alto = 620
    const izq = window.screenX + (window.outerWidth - ancho) / 2
    const arriba = window.screenY + (window.outerHeight - alto) / 2
    const ventana = window.open(url, 'google-login', `width=${ancho},height=${alto},left=${izq},top=${arriba}`)
    if (!ventana) {
      window.location.href = url
      return
    }
    setCargando(true)
    // Si el usuario cierra la ventana sin elegir cuenta, el botón vuelve a quedar disponible
    const vigilar = setInterval(() => {
      if (ventana.closed) { clearInterval(vigilar); setCargando(false) }
    }, 500)
  }

  if (!disponible) {
    return (
      <p className="text-center" style={{ fontSize: '0.9rem', opacity: 0.7 }}>
        El inicio de sesión con Google no está disponible en este momento.
      </p>
    )
  }

  return (
    <div className="d-flex justify-content-center">
      <button
        type="button"
        className="btn-google"
        onClick={iniciar}
        disabled={!clientId || cargando}
      >
        {cargando
          ? 'Esperando a Google…'
          : texto === 'signup_with' ? 'Registrarse con Google' : 'Iniciar sesión con Google'}
      </button>
    </div>
  )
}

/** Línea divisoria "──── o ────" entre el formulario y el botón de Google. */
export function SeparadorO() {
  return (
    <div className="d-flex align-items-center my-4" style={{ gap: '12px' }}>
      <hr style={{ flex: 1, borderColor: 'var(--vw-purple)', opacity: 1, margin: 0 }} />
      <span style={{ color: 'var(--vw-cyan)', fontFamily: "'Press Start 2P'", fontSize: '0.7rem' }}>O</span>
      <hr style={{ flex: 1, borderColor: 'var(--vw-purple)', opacity: 1, margin: 0 }} />
    </div>
  )
}

export default GoogleLoginButton
