import { NavLink, Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Panel de administración.
 * - ADMIN: acceso a todo.
 * - VENDEDOR: solo productos y boletas (lista y detalle). Lo demás no aparece (Anexo 1).
 */
function AdminLayout() {
  const { usuario, esAdmin, puedeVerPanel } = useAuth()

  if (!usuario || !puedeVerPanel) {
    return <Navigate to="/" replace />
  }

  const linkClass = ({ isActive }) =>
    isActive ? 'sidebar-link active' : 'sidebar-link'

  return (
    <div className="admin-wrapper">
      <aside className="admin-sidebar">
        <div className="sidebar-titulo">{esAdmin ? 'Panel Admin' : 'Panel Vendedor'}</div>
        <nav>
          <NavLink to="/admin" end className={linkClass}>Dashboard</NavLink>
          <NavLink to="/admin/productos" className={linkClass}>Productos</NavLink>
          {esAdmin && <NavLink to="/admin/categorias" className={linkClass}>Categorías</NavLink>}
          {esAdmin && <NavLink to="/admin/usuarios" className={linkClass}>Usuarios</NavLink>}
          <NavLink to="/admin/ordenes" className={linkClass}>Boletas</NavLink>
          {esAdmin && <NavLink to="/admin/reportes" className={linkClass}>Reportes</NavLink>}
          {esAdmin && <NavLink to="/admin/mensajes" className={linkClass}>Mensajes</NavLink>}
          {esAdmin && <NavLink to="/admin/perfil" className={linkClass}>Perfil</NavLink>}
          {esAdmin && <NavLink to="/admin/productos-criticos" className={linkClass}>Productos críticos</NavLink>}
        </nav>
      </aside>

      <main className="admin-content">
        <Outlet />
      </main>
    </div>
  )
}

/** Protege las secciones que solo puede ver el ADMIN (el vendedor vuelve al dashboard). */
export function SoloAdmin({ children }) {
  const { esAdmin } = useAuth()
  if (!esAdmin) return <Navigate to="/admin" replace />
  return children
}

export default AdminLayout
