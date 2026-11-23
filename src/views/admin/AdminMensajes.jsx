import { useEffect, useState } from 'react'
import { getContactos, eliminarContacto } from '../../services/api'

/** Mensajes que los clientes envían desde la página Contacto (solo ADMIN). */
function AdminMensajes() {
  const [mensajes, setMensajes] = useState([])
  const [abierto, setAbierto] = useState(null) // id del mensaje que se está leyendo
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const cargar = () => {
    setCargando(true)
    getContactos()
      // Los más recientes primero
      .then(data => setMensajes([...data].sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)))))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false))
  }

  useEffect(cargar, [])

  const formatearFecha = (f) =>
    f ? new Date(f).toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' }) : '—'

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Eliminar este mensaje?')) return
    setError('')
    setExito('')
    try {
      await eliminarContacto(id)
      setExito('Mensaje eliminado.')
      if (abierto === id) setAbierto(null)
      cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  return (
    <>
      <h2 style={{ color: 'var(--vw-cyan)' }}>Mensajes</h2>
      <p style={{ opacity: 0.8 }}>Mensajes enviados desde el formulario de Contacto.</p>

      {error && <div className="alert alert-danger">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      {cargando ? <p>Cargando...</p> : mensajes.length === 0 ? (
        <p>No hay mensajes todavía.</p>
      ) : (
        <div className="table-responsive">
          <table className="table tabla-vaporwave">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Asunto</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {mensajes.map(m => (
                <FilaMensaje
                  key={m.id}
                  m={m}
                  fecha={formatearFecha(m.fecha)}
                  abierto={abierto === m.id}
                  alAlternar={() => setAbierto(abierto === m.id ? null : m.id)}
                  alEliminar={() => handleEliminar(m.id)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function FilaMensaje({ m, fecha, abierto, alAlternar, alEliminar }) {
  return (
    <>
      <tr>
        <td style={{ whiteSpace: 'nowrap' }}>{fecha}</td>
        <td>{m.nombre}</td>
        <td><a href={`mailto:${m.email}`} style={{ color: 'var(--vw-cyan)' }}>{m.email}</a></td>
        <td>{m.asunto}</td>
        <td style={{ whiteSpace: 'nowrap' }}>
          <button className="btn btn-sm btn-warning me-2" onClick={alAlternar}>
            {abierto ? 'Cerrar' : 'Leer'}
          </button>
          <button className="btn btn-sm btn-danger" onClick={alEliminar}>Eliminar</button>
        </td>
      </tr>
      {abierto && (
        <tr>
          <td colSpan={5} style={{ whiteSpace: 'pre-wrap' }}>{m.mensaje}</td>
        </tr>
      )}
    </>
  )
}

export default AdminMensajes
