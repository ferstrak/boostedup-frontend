import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth, rutaInicialPorRol } from '../context/AuthContext'
import { actualizarMiPerfil } from '../services/api'

/**
 * Se muestra después de entrar con Google por primera vez:
 * Google no entrega RUN ni datos de envío, y sin dirección no se puede comprar.
 */
function CompletarPerfil() {
  const { usuario, actualizarPerfil } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [form, setForm] = useState({
    run: usuario?.run || '',
    nombre: usuario?.nombre || '',
    apellido: usuario?.apellido || '',
    fechaNacimiento: usuario?.fecha_nacimiento ? usuario.fecha_nacimiento.substring(0, 10) : '',
    region: usuario?.region || '',
    comuna: usuario?.comuna || '',
    direccion: usuario?.direccion || ''
  })

  if (!usuario) return <Navigate to="/login" replace />

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setGuardando(true)
    try {
      const actualizado = await actualizarMiPerfil({ ...form, correo: usuario.correo })
      actualizarPerfil(actualizado)
      navigate(rutaInicialPorRol(actualizado))
    } catch (err) {
      setError(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="container my-5" style={{ maxWidth: '600px' }}>
      <h2 className="mb-2" style={{ color: 'var(--vw-cyan)' }}>Completa tu perfil</h2>
      <p style={{ opacity: 0.8 }}>
        ¡Bienvenido, {usuario.nombre}! Para poder enviarte tus compras necesitamos algunos datos más.
      </p>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Nombre</label>
            <input name="nombre" className="form-control" value={form.nombre} onChange={handleChange} required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Apellido</label>
            <input name="apellido" className="form-control" value={form.apellido} onChange={handleChange} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">RUN</label>
            <input name="run" className="form-control" value={form.run} onChange={handleChange} placeholder="12.345.678-9" />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Fecha de nacimiento</label>
            <input type="date" name="fechaNacimiento" className="form-control" value={form.fechaNacimiento} onChange={handleChange} />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Región *</label>
            <input name="region" className="form-control" value={form.region} onChange={handleChange} required />
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Comuna *</label>
            <input name="comuna" className="form-control" value={form.comuna} onChange={handleChange} required />
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Dirección *</label>
          <input name="direccion" className="form-control" value={form.direccion} onChange={handleChange} required />
        </div>

        <div className="d-flex gap-2">
          <button type="submit" className="btn btn-primary flex-grow-1" disabled={guardando}>
            {guardando ? 'Guardando...' : 'Guardar y continuar'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
            Más tarde
          </button>
        </div>
      </form>
    </div>
  )
}

export default CompletarPerfil
