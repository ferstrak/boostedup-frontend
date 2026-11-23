import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrar } from '../services/api'
import GoogleLoginButton, { SeparadorO } from '../components/GoogleLoginButton'
import { useAuth } from '../context/AuthContext'

function Registro() {
  const [form, setForm] = useState({
    run: '',
    nombre: '',
    apellido: '',
    correo: '',
    nickname: '',
    clave: '',
    fechaNacimiento: '',
    region: '',
    comuna: '',
    direccion: ''
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      // El backend siempre crea la cuenta como cliente y devuelve el token
      const sesion = await registrar(form)
      login(sesion)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Error al registrar')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="container my-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-4" style={{ color: 'var(--vw-cyan)' }}>Crear cuenta</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">RUN</label>
            <input name="run" className="form-control" value={form.run} onChange={handleChange} required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Fecha de nacimiento</label>
            <input type="date" name="fechaNacimiento" className="form-control" value={form.fechaNacimiento} onChange={handleChange} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Nombre</label>
            <input name="nombre" className="form-control" value={form.nombre} onChange={handleChange} required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Apellido</label>
            <input name="apellido" className="form-control" value={form.apellido} onChange={handleChange} required />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Nickname *</label>
          <input
            name="nickname"
            className="form-control"
            value={form.nickname}
            onChange={handleChange}
            placeholder="Ej: Vapor_Fan92"
            pattern="[A-Za-z0-9._\-]{3,20}"
            title="Entre 3 y 20 caracteres: letras, números, punto, guion o guion bajo"
            required
          />
          <div className="form-text ayuda-campo">
            Es el nombre que se verá en los blogs y comentarios. Entre 3 y 20 caracteres, sin espacios.
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Correo</label>
          <input type="email" name="correo" className="form-control" value={form.correo} onChange={handleChange} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input type="password" name="clave" className="form-control" value={form.clave} onChange={handleChange} required />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Región</label>
            <input name="region" className="form-control" value={form.region} onChange={handleChange} />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Comuna</label>
            <input name="comuna" className="form-control" value={form.comuna} onChange={handleChange} />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Dirección</label>
          <input name="direccion" className="form-control" value={form.direccion} onChange={handleChange} />
        </div>

        <button type="submit" className="btn btn-primary w-100" disabled={cargando}>
          {cargando ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <SeparadorO />
      <GoogleLoginButton texto="signup_with" onError={setError} />

      <p className="mt-4 text-center">
        ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  )
}

export default Registro