import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

function AdminDashboard() {
  const { usuario, esAdmin } = useAuth()

  const secciones = [
    { to: '/admin/productos',  titulo: 'Productos',   desc: esAdmin ? 'Administrar los productos disponibles' : 'Ver los productos y su detalle' },
    { to: '/admin/categorias', titulo: 'Categorías',  desc: 'Organizar productos por categoría', soloAdmin: true },
    { to: '/admin/usuarios',   titulo: 'Usuarios',    desc: 'Gestión de usuarios y sus roles', soloAdmin: true },
    { to: '/admin/ordenes',    titulo: 'Órdenes',     desc: 'Seguimiento de las compras realizadas' },
    { to: '/admin/reportes',   titulo: 'Reportes',    desc: 'Información detallada del sistema', soloAdmin: true },
    { to: '/admin/mensajes',   titulo: 'Mensajes',    desc: 'Mensajes recibidos desde Contacto', soloAdmin: true },
    { to: '/admin/perfil',     titulo: 'Perfil',      desc: 'Información personal y configuración', soloAdmin: true },
    { to: '/admin/productos-criticos', titulo: 'Productos críticos', desc: 'Productos con stock bajo', soloAdmin: true },
  ].filter(s => esAdmin || !s.soloAdmin)

  return (
    <>
      <h2 style={{ color: 'var(--vw-cyan)' }}>Dashboard</h2>
      <p>Bienvenido, {usuario.nombre} {usuario.apellido}.</p>
      <hr />

      <div className="row g-3">
        {secciones.map(s => (
          <div className="col-md-6 col-lg-4" key={s.to}>
            <Link to={s.to} className="text-decoration-none">
              <div className="vapor-card p-3 h-100">
                <h4 style={{ color: 'var(--vw-pink)' }}>{s.titulo}</h4>
                <p style={{ opacity: 0.8 }}>{s.desc}</p>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </>
  )
}

export default AdminDashboard