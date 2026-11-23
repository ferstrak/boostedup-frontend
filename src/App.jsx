import { Routes, Route } from 'react-router-dom'
import { CarritoProvider } from './context/CarritoContext'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Index from './views/Index'
import Productos from './views/Productos'
import ProductoDetalle from './views/ProductoDetalle'
import Carrito from './views/Carrito'
import Login from './views/Login'
import Registro from './views/Registro'
import PagoOk from './views/PagoOk'
import PagoError from './views/PagoError'
import Blogs from './views/Blogs'
import BlogDetalle from './views/BlogDetalle'
import BlogForm from './views/blogForm'
import Nosotros from './views/Nosotros'
import Contactos from './views/Contactos'
import Ofertas from './views/Ofertas'
import AdminLayout, { SoloAdmin } from './layouts/AdminLayout'
import CompletarPerfil from './views/CompletarPerfil'
import EasterEggs from './easter-eggs/EasterEggs'
import ReproductorMusica from './musica/ReproductorMusica'
import AdminDashboard from './views/admin/AdminDashboard'
import AdminProductos from './views/admin/AdminProductos'
import AdminProductosCriticos from './views/admin/AdminProductosCriticos'
import AdminCategorias from './views/admin/AdminCategorias'
import AdminUsuarios from './views/admin/AdminUsuarios'
import AdminOrdenes from './views/admin/AdminOrdenes'
import AdminReportes from './views/admin/AdminReportes'
import AdminPerfil from './views/admin/AdminPerfil'
import AdminMensajes from './views/admin/AdminMensajes'

function App() {
  return (
    <AuthProvider>
      <CarritoProvider>
        <Navbar />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Index />} />
          <Route path="/productos" element={<Productos />} />
          <Route path="/producto/:id" element={<ProductoDetalle />} />
          <Route path="/carrito" element={<Carrito />} />
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/completar-perfil" element={<CompletarPerfil />} />
          <Route path="/pago-ok" element={<PagoOk />} />
          <Route path="/pago-error" element={<PagoError />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contactos" element={<Contactos />} />
          <Route path="/ofertas" element={<Ofertas />} />

          {/* Blogs */}
          <Route path="/blogs" element={<Blogs />} />
          <Route path="/blogs/nuevo" element={<BlogForm />} />
          <Route path="/blogs/:id" element={<BlogDetalle />} />
          <Route path="/blogs/:id/editar" element={<BlogForm />} />

          {/* Panel: ADMIN ve todo; VENDEDOR solo productos y boletas */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="productos" element={<AdminProductos />} />
            <Route path="ordenes" element={<AdminOrdenes />} />
            <Route path="perfil" element={<SoloAdmin><AdminPerfil /></SoloAdmin>} />
            <Route path="mensajes" element={<SoloAdmin><AdminMensajes /></SoloAdmin>} />
            <Route path="productos-criticos" element={<SoloAdmin><AdminProductosCriticos /></SoloAdmin>} />
            <Route path="categorias" element={<SoloAdmin><AdminCategorias /></SoloAdmin>} />
            <Route path="usuarios" element={<SoloAdmin><AdminUsuarios /></SoloAdmin>} />
            <Route path="reportes" element={<SoloAdmin><AdminReportes /></SoloAdmin>} />
          </Route>
        </Routes>
        <Footer />
        <EasterEggs />
        <ReproductorMusica />
      </CarritoProvider>
    </AuthProvider>
  )
}

export default App