import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { guardarToken } from '../services/api'

const AuthContext = createContext()

/** Lee la fecha de vencimiento (exp) del token JWT sin validarlo (eso lo hace el backend). */
function tokenVencido(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.exp ? payload.exp * 1000 < Date.now() : false
  } catch {
    return true
  }
}

function leerSesionGuardada() {
  try {
    const token = localStorage.getItem('token')
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')
    if (!token || !usuario || tokenVencido(token)) return null
    return usuario
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => {
    const guardado = leerSesionGuardada()
    if (!guardado) guardarToken(null)
    return guardado
  })

  useEffect(() => {
    if (usuario) localStorage.setItem('usuario', JSON.stringify(usuario))
    else localStorage.removeItem('usuario')
  }, [usuario])

  /** Recibe la respuesta de /auth/login, /auth/registro o /auth/google: { token, usuario } */
  const login = (respuesta) => {
    guardarToken(respuesta.token)
    setUsuario(respuesta.usuario)
  }

  const logout = useCallback(() => {
    guardarToken(null)
    setUsuario(null)
  }, [])

  // Si la API responde 401 (token vencido o inválido), se cierra la sesión
  useEffect(() => {
    window.addEventListener('sesion-expirada', logout)
    return () => window.removeEventListener('sesion-expirada', logout)
  }, [logout])

  // Actualiza el usuario en memoria (tras editar perfil)
  const actualizarPerfil = (datosNuevos) => {
    setUsuario(prev => (prev ? { ...prev, ...datosNuevos } : prev))
  }

  const rol = usuario?.rol
  const esAdmin = rol === 'admin'
  const esVendedor = rol === 'vendedor'
  const puedeVerPanel = esAdmin || esVendedor
  // Las cuentas creadas con Google llegan sin datos de envío
  const perfilIncompleto = !!usuario && (!usuario.direccion || !usuario.region || !usuario.comuna)

  return (
    <AuthContext.Provider value={{
      usuario, login, logout, actualizarPerfil,
      esAdmin, esVendedor, puedeVerPanel, perfilIncompleto
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

/** Página a la que va cada rol después de iniciar sesión. */
export function rutaInicialPorRol(usuario) {
  if (!usuario) return '/'
  if (usuario.rol === 'admin' || usuario.rol === 'vendedor') return '/admin'
  return '/'
}
