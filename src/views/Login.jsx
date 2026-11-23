import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as apiLogin } from '../services/api'
import { useAuth, rutaInicialPorRol } from '../context/AuthContext'
import GoogleLoginButton, { SeparadorO } from '../components/GoogleLoginButton'

function Login() {
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const sesion = await apiLogin(correo, clave)
      login(sesion)
      // Sin nickname (cuenta antigua): primero lo completa. Si no, admin y vendedor van al panel y el cliente a la tienda
      if (!sesion.usuario.nickname) navigate('/completar-perfil')
      else navigate(rutaInicialPorRol(sesion.usuario))
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="container my-5" style={{ maxWidth: '480px' }}>
      <h2 className="mb-4" style={{ color: 'var(--vw-cyan)' }}>Iniciar sesión</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Correo</label>
          <input
            type="email"
            className="form-control"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input
            type="password"
            className="form-control"
            value={clave}
            onChange={(e) => setClave(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <SeparadorO />
      <GoogleLoginButton texto="signin_with" onError={setError} />

      <p className="mt-4 text-center">
        ¿No tienes cuenta? <Link to="/registro">Regístrate</Link>
      </p>
    </div>
  )
}

export default Login