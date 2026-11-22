/* ============================================================
   Conexión con la API de BOOSTED UP! (Spring Boot)
   - Todas las rutas usan la versión /v1 (el catálogo también tiene /v2).
   - Si hay sesión, cada petición lleva el token JWT:
       Authorization: Bearer <token>
   - Los errores de la API llegan como { "error": "mensaje" }.
   ============================================================ */

// URL del backend. Se cambia con la variable VITE_API_URL (archivo .env)
export const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080').replace(/\/$/, '')
const BASE_URL = `${API_URL}/v1`

const CLAVE_TOKEN = 'token'

export function guardarToken(token) {
  if (token) localStorage.setItem(CLAVE_TOKEN, token)
  else localStorage.removeItem(CLAVE_TOKEN)
}

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN)
}

/**
 * Hace una petición a la API.
 * - Agrega el token si existe.
 * - Convierte la respuesta a JSON.
 * - Si falla, lanza un Error con el mensaje que envió el backend.
 */
async function pedir(ruta, { method = 'GET', body, mensajeError = 'Error en la petición' } = {}) {
  const headers = {}
  const token = obtenerToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const opciones = { method, headers }
  if (body instanceof FormData) {
    opciones.body = body
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    opciones.body = JSON.stringify(body)
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${ruta}`, opciones)
  } catch {
    throw new Error('No se pudo conectar con el servidor. ¿Está encendido el backend?')
  }

  if (res.status === 401 && token) {
    // El token venció o es inválido: se cierra la sesión
    window.dispatchEvent(new Event('sesion-expirada'))
  }

  if (!res.ok) {
    const datos = await res.json().catch(() => ({}))
    throw new Error(datos.error || mensajeError)
  }

  if (res.status === 204) return null
  const texto = await res.text()
  return texto ? JSON.parse(texto) : null
}

/* ---------- Imágenes ---------- */

// Las imágenes vienen como "/uploads/archivo.jpg": se completa con la URL del backend
export function urlImagen(img) {
  if (!img) return ''
  if (img.startsWith('http') || img.startsWith('data:')) return img
  return `${API_URL}${img.startsWith('/') ? '' : '/'}${img}`
}

function normalizarImg(item) {
  if (!item || !item.img) return item
  return { ...item, img: urlImagen(item.img) }
}

function normalizarImgs(lista) {
  return Array.isArray(lista) ? lista.map(normalizarImg) : lista
}

function normalizarOrden(orden) {
  if (!orden || !Array.isArray(orden.items)) return orden
  return { ...orden, items: orden.items.map(normalizarImg) }
}

/* ============================================================
   AUTENTICACIÓN
   Las tres devuelven { token, tipo, expiraEnSegundos, usuario }
   ============================================================ */

// Una fecha vacía ("") no se puede convertir a LocalDate en el backend: se manda null
function limpiarUsuario(datos) {
  const copia = { ...datos }
  for (const campo of ['fechaNacimiento', 'fecha_nacimiento']) {
    if (campo in copia && !copia[campo]) copia[campo] = null
  }
  return copia
}

export function login(correo, clave) {
  return pedir('/auth/login', {
    method: 'POST',
    body: { correo, clave },
    mensajeError: 'Correo o contraseña incorrectos'
  })
}

export function registrar(datos) {
  return pedir('/auth/registro', { method: 'POST', body: limpiarUsuario(datos), mensajeError: 'Error al registrar' })
}

export function loginGoogle(credential) {
  return pedir('/auth/google', {
    method: 'POST',
    body: { credential },
    mensajeError: 'No se pudo iniciar sesión con Google'
  })
}

export async function getGoogleClientId() {
  const datos = await pedir('/auth/google/client-id')
  return datos?.clientId
}

export function getMiUsuario() {
  return pedir('/auth/me')
}

/* ============================================================
   PRODUCTOS
   ============================================================ */

export async function getProductos() {
  return normalizarImgs(await pedir('/productos', { mensajeError: 'Error al obtener productos' }))
}

export async function getProducto(id) {
  return normalizarImg(await pedir(`/productos/${id}`, { mensajeError: 'Producto no encontrado' }))
}

export async function crearProducto(datos) {
  return normalizarImg(await pedir('/productos', { method: 'POST', body: datos, mensajeError: 'Error al crear producto' }))
}

export async function actualizarProducto(id, datos) {
  return normalizarImg(await pedir(`/productos/${id}`, { method: 'PUT', body: datos, mensajeError: 'Error al actualizar producto' }))
}

export function eliminarProducto(id) {
  return pedir(`/productos/${id}`, { method: 'DELETE', mensajeError: 'Error al eliminar producto' })
}

export function getColecciones() {
  return pedir('/productos/colecciones', { mensajeError: 'Error al obtener colecciones' })
}

export async function getDestacados() {
  return normalizarImgs(await pedir('/productos/destacados', { mensajeError: 'Error al obtener destacados' }))
}

export async function getProductosPorColeccion(nombre) {
  return normalizarImgs(await pedir(`/productos?coleccion=${encodeURIComponent(nombre)}`, {
    mensajeError: 'Error al obtener productos de la colección'
  }))
}

/* ============================================================
   CATEGORÍAS
   ============================================================ */

export function getCategorias() {
  return pedir('/categorias', { mensajeError: 'Error al obtener categorías' })
}

export function getCategoria(id) {
  return pedir(`/categorias/${id}`, { mensajeError: 'Categoría no encontrada' })
}

export function crearCategoria(datos) {
  return pedir('/categorias', { method: 'POST', body: datos, mensajeError: 'Error al crear categoría' })
}

export function actualizarCategoria(id, datos) {
  return pedir(`/categorias/${id}`, { method: 'PUT', body: datos, mensajeError: 'Error al actualizar categoría' })
}

export function eliminarCategoria(id) {
  return pedir(`/categorias/${id}`, { method: 'DELETE', mensajeError: 'Error al eliminar categoría' })
}

/* ============================================================
   USUARIOS
   ============================================================ */

export function getUsuarios() {
  return pedir('/usuarios', { mensajeError: 'Error al obtener usuarios' })
}

export function getUsuario(id) {
  return pedir(`/usuarios/${id}`, { mensajeError: 'Usuario no encontrado' })
}

/** Creación desde el panel admin (puede elegir el rol). */
export function crearUsuario(datos) {
  return pedir('/usuarios', { method: 'POST', body: limpiarUsuario(datos), mensajeError: 'Error al crear usuario' })
}

export function actualizarUsuario(id, datos) {
  return pedir(`/usuarios/${id}`, { method: 'PUT', body: limpiarUsuario(datos), mensajeError: 'Error al actualizar usuario' })
}

/** El usuario con sesión edita sus propios datos (no puede cambiar su rol). */
export function actualizarMiPerfil(datos) {
  return pedir('/usuarios/me', { method: 'PUT', body: limpiarUsuario(datos), mensajeError: 'Error al actualizar perfil' })
}

export function eliminarUsuario(id) {
  return pedir(`/usuarios/${id}`, { method: 'DELETE', mensajeError: 'Error al eliminar usuario' })
}

/* ============================================================
   BOLETAS (órdenes de compra)
   ============================================================ */

export function getOrdenes() {
  return pedir('/boletas', { mensajeError: 'Error al obtener boletas' })
}

export async function getOrden(id) {
  return normalizarOrden(await pedir(`/boletas/${id}`, { mensajeError: 'Boleta no encontrada' }))
}

export function getMisOrdenes() {
  return pedir('/boletas/mias', { mensajeError: 'Error al obtener tu historial' })
}

/** El total lo calcula el servidor (ofertas, cupón y stock). */
export async function crearOrden(datos) {
  return normalizarOrden(await pedir('/boletas', { method: 'POST', body: datos, mensajeError: 'Error al crear la boleta' }))
}

export function actualizarEstadoOrden(id, estado) {
  return pedir(`/boletas/${id}/estado`, { method: 'PUT', body: { estado }, mensajeError: 'Error al actualizar estado' })
}

/* ============================================================
   REPORTES E IMÁGENES (admin)
   ============================================================ */

export function getReportes() {
  return pedir('/reportes', { mensajeError: 'Error al obtener reportes' })
}

/** Sube una imagen y devuelve { url: "/uploads/..." } */
export function subirImagen(archivo) {
  const formData = new FormData()
  formData.append('archivo', archivo)
  return pedir('/uploads', { method: 'POST', body: formData, mensajeError: 'Error al subir imagen' })
}

/* ============================================================
   BLOGS Y COMENTARIOS
   ============================================================ */

export async function getBlogs() {
  return normalizarImgs(await pedir('/blogs', { mensajeError: 'Error al obtener blogs' }))
}

export async function getBlog(id) {
  return normalizarImg(await pedir(`/blogs/${id}`, { mensajeError: 'Blog no encontrado' }))
}

export async function crearBlog(datos) {
  return normalizarImg(await pedir('/blogs', { method: 'POST', body: datos, mensajeError: 'Error al crear blog' }))
}

export async function actualizarBlog(id, datos) {
  return normalizarImg(await pedir(`/blogs/${id}`, { method: 'PUT', body: datos, mensajeError: 'Error al actualizar blog' }))
}

export function eliminarBlog(id) {
  return pedir(`/blogs/${id}`, { method: 'DELETE', mensajeError: 'Error al eliminar blog' })
}

export function crearComentario(blogId, datos) {
  return pedir(`/blogs/${blogId}/comentarios`, { method: 'POST', body: datos, mensajeError: 'Error al crear comentario' })
}

export function editarComentario(comentarioId, comentario) {
  return pedir(`/blogs/comentarios/${comentarioId}`, {
    method: 'PUT',
    body: { comentario },
    mensajeError: 'Error al editar comentario'
  })
}

export function eliminarComentario(comentarioId) {
  return pedir(`/blogs/comentarios/${comentarioId}`, { method: 'DELETE', mensajeError: 'Error al eliminar comentario' })
}

/* ============================================================
   CONTACTO
   ============================================================ */

export function getContactos() {
  return pedir('/contactos', { mensajeError: 'Error al obtener mensajes' })
}

export function eliminarContacto(id) {
  return pedir(`/contactos/${id}`, { method: 'DELETE', mensajeError: 'Error al eliminar mensaje' })
}

export function enviarContacto(datos) {
  return pedir('/contactos', { method: 'POST', body: datos, mensajeError: 'Error al enviar mensaje' })
}
