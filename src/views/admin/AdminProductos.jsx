import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import {
  getProductos,
  getCategorias,
  getReportes,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  subirImagen,
  urlImagen
} from '../../services/api'

// El vendedor solo puede ver la lista y el detalle
const TABS_ADMIN = ['Listar', 'Nuevo', 'Editar']
const TABS_VENDEDOR = ['Listar', 'Detalle']

const FORM_VACIO = {
  titulo: '',
  precio: '',
  img: '',
  descripcion: '',
  categoria_id: '',
  coleccion: '',
  stock: 0,
  es_oferta: false,
  descuento: 0,
  es_portada: false,
  destacado: false,
  orden_destacado: ''
}

function formatearPrecio(n) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0
  }).format(n)
}

function AdminProductos() {
  const { esAdmin } = useAuth()
  const TABS = esAdmin ? TABS_ADMIN : TABS_VENDEDOR

  const [tab, setTab] = useState('Listar')
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [vendidos, setVendidos] = useState({})
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')

  const [form, setForm] = useState(FORM_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [productoVisto, setProductoVisto] = useState(null)

  const cargar = async () => {
    setCargando(true)
    setError('')
    try {
      const [prods, cats] = await Promise.all([getProductos(), getCategorias()])
      setProductos(prods)
      setCategorias(cats)

      // Los reportes (unidades vendidas) solo están disponibles para el admin
      if (esAdmin) {
        const reportes = await getReportes()
        const mapa = {}
        reportes.productosMasVendidos?.forEach(p => {
          mapa[p.producto_id] = p.total_vendido
        })
        setVendidos(mapa)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    const nuevo = { ...form, [name]: type === 'checkbox' ? checked : value }
    // Una colección no puede estar en oferta: el descuento va en sus productos
    if (name === 'es_portada' && checked) {
      nuevo.es_oferta = false
      nuevo.descuento = 0
    }
    setForm(nuevo)
  }

  const limpiar = () => {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setError('')
    setExito('')
  }

  const armarPayload = () => ({
    ...form,
    precio: Number(form.precio),
    categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
    stock: Number(form.stock) || 0,
    // Si es colección se manda sin oferta aunque viniera marcada desde la base
    es_oferta: form.es_oferta && !form.es_portada,
    descuento: form.es_oferta && !form.es_portada ? Number(form.descuento) || 0 : 0,
    orden_destacado: form.orden_destacado === '' ? null : Number(form.orden_destacado)
  })

  const handleCrear = async (e) => {
    e.preventDefault()
    setError('')
    setExito('')
    try {
      await crearProducto(armarPayload())
      setExito('Producto creado.')
      limpiar()
      await cargar()
      setTab('Listar')
    } catch (e) {
      setError(e.message)
    }
  }

  const handleActualizar = async (e) => {
    e.preventDefault()
    if (!editandoId) return
    setError('')
    setExito('')
    try {
      await actualizarProducto(editandoId, armarPayload())
      setExito('Producto actualizado.')
      limpiar()
      await cargar()
      setTab('Listar')
    } catch (e) {
      setError(e.message)
    }
  }

  const handleEditar = (p) => {
    setForm({
      titulo: p.titulo || '',
      precio: p.precio ?? '',
      img: p.img || '',
      descripcion: p.descripcion || '',
      categoria_id: p.categoria_id ?? '',
      coleccion: p.coleccion || '',
      stock: p.stock ?? 0,
      es_oferta: !!p.es_oferta,
      descuento: p.descuento ?? 0,
      es_portada: !!p.es_portada,
      destacado: !!p.destacado,
      orden_destacado: p.orden_destacado ?? ''
    })
    setEditandoId(p.id)
    setError('')
    setExito('')
    setTab('Editar')
  }

  const handleVer = (p) => {
    setProductoVisto(p)
    setTab('Detalle')
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este producto?')) return
    setError('')
    setExito('')
    try {
      await eliminarProducto(id)
      setExito('Producto eliminado.')
      await cargar()
    } catch (e) {
      setError(e.message)
    }
  }

  const nombreCategoria = (id) => {
    const c = categorias.find(c => c.id === id)
    return c ? c.nombre : (id ? `#${id}` : '—')
  }

  const formFields = (
    <form onSubmit={editandoId ? handleActualizar : handleCrear}>
      <div className="row">
        <div className="col-md-6 mb-3">
          <label className="form-label">Título</label>
          <input name="titulo" className="form-control" value={form.titulo} onChange={handleChange} required />
        </div>
        <div className="col-md-6 mb-3">
          <label className="form-label">Precio</label>
          <input name="precio" type="number" min="0" className="form-control" value={form.precio} onChange={handleChange} required />
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Imagen</label>
        <input
          type="file"
          accept="image/*"
          className="form-control"
          onChange={async (e) => {
            const archivo = e.target.files?.[0]
            if (!archivo) return
            try {
              const { url } = await subirImagen(archivo)
              setForm({ ...form, img: url })
              setExito('Imagen subida.')
            } catch (err) {
              setError(err.message)
            }
          }}
        />
        {form.img && (
          <div className="mt-2">
            <img
              src={urlImagen(form.img)}
              alt="preview"
              style={{ maxWidth: '200px', maxHeight: '120px', objectFit: 'contain', background: '#000', padding: '4px' }}
            />
          </div>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Descripción</label>
        <textarea name="descripcion" className="form-control" rows="3" value={form.descripcion} onChange={handleChange} />
      </div>

      <div className="row">
        <div className="col-md-4 mb-3">
          <label className="form-label">Categoría</label>
          <select name="categoria_id" className="form-select" value={form.categoria_id} onChange={handleChange}>
            <option value="">— Sin categoría —</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Colección</label>
          <input name="coleccion" className="form-control" value={form.coleccion} onChange={handleChange} />
        </div>
        <div className="col-md-4 mb-3">
          <label className="form-label">Stock</label>
          <input name="stock" type="number" min="0" className="form-control" value={form.stock} onChange={handleChange} />
        </div>
      </div>

      {/* Oferta y portada (antes no se podían editar desde el panel) */}
      <div className="row align-items-end">
        <div className="col-md-3 mb-3">
          <div className="form-check">
            <input type="checkbox" id="es_oferta" name="es_oferta" className="form-check-input" checked={form.es_oferta} onChange={handleChange} disabled={form.es_portada} />
            <label htmlFor="es_oferta" className="form-check-label">En oferta</label>
            {form.es_portada && (
              <div className="form-text">Las colecciones no llevan oferta: aplícala a sus productos.</div>
            )}
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">Descuento (%)</label>
          <input name="descuento" type="number" min="0" max="100" className="form-control" value={form.descuento} onChange={handleChange} disabled={!form.es_oferta || form.es_portada} />
        </div>
        <div className="col-md-3 mb-3">
          <div className="form-check">
            <input type="checkbox" id="es_portada" name="es_portada" className="form-check-input" checked={form.es_portada} onChange={handleChange} />
            <label htmlFor="es_portada" className="form-check-label">Colección en portada</label>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <label className="form-label">Orden en portada</label>
          <input name="orden_destacado" type="number" min="1" className="form-control" value={form.orden_destacado} onChange={handleChange} disabled={!form.es_portada} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary">
        {editandoId ? 'Actualizar' : 'Crear'}
      </button>
      {editandoId && (
        <button type="button" className="btn btn-secondary ms-2" onClick={limpiar}>
          Cancelar
        </button>
      )}
    </form>
  )

  const detalle = productoVisto && (
    <div className="vapor-card p-4">
      <div className="row">
        <div className="col-md-4 mb-3">
          {productoVisto.img && (
            <img src={productoVisto.img} alt={productoVisto.titulo} className="img-fluid"
              style={{ background: '#000', objectFit: 'contain', maxHeight: '260px', width: '100%' }} />
          )}
        </div>
        <div className="col-md-8">
          <h3 style={{ color: 'var(--vw-pink)' }}>{productoVisto.titulo}</h3>
          <p style={{ opacity: 0.8 }}>{productoVisto.descripcion || 'Sin descripción.'}</p>
          <dl className="row mb-0">
            <dt className="col-sm-4">ID</dt>
            <dd className="col-sm-8">{productoVisto.id}</dd>
            <dt className="col-sm-4">Precio</dt>
            <dd className="col-sm-8">{formatearPrecio(productoVisto.precio)}</dd>
            <dt className="col-sm-4">Oferta</dt>
            <dd className="col-sm-8">{productoVisto.es_oferta ? `Sí (-${productoVisto.descuento}%)` : 'No'}</dd>
            <dt className="col-sm-4">Categoría</dt>
            <dd className="col-sm-8">{nombreCategoria(productoVisto.categoria_id)}</dd>
            <dt className="col-sm-4">Colección</dt>
            <dd className="col-sm-8">{productoVisto.coleccion || '—'}</dd>
            <dt className="col-sm-4">Stock</dt>
            <dd className="col-sm-8" style={{ color: productoVisto.stock <= 5 ? 'var(--vw-pink)' : undefined }}>
              {productoVisto.stock ?? 0}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <h2 style={{ color: 'var(--vw-cyan)' }}>Productos</h2>

      <ul className="nav nav-tabs mb-3">
        {TABS.map(t => (
          <li className="nav-item" key={t}>
            <button className={tab === t ? 'nav-link active' : 'nav-link'} onClick={() => setTab(t)} type="button">
              {t}
            </button>
          </li>
        ))}
      </ul>

      {error && <div className="alert alert-danger">{error}</div>}
      {exito && <div className="alert alert-success">{exito}</div>}

      {tab === 'Listar' && (
        <>
          {cargando ? <p>Cargando...</p> : (
            <div className="table-responsive">
              <table className="table tabla-vaporwave">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Img</th>
                    <th>Título</th>
                    <th>Precio</th>
                    <th>Categoría</th>
                    <th>Stock</th>
                    {esAdmin && <th>Vendidos</th>}
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {productos.map(p => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>
                        {p.img && (
                          <img src={p.img} alt={p.titulo} className="img-items" />
                        )}
                      </td>
                      <td>{p.titulo}</td>
                      <td>${p.precio}</td>
                      <td>{nombreCategoria(p.categoria_id)}</td>
                      <td style={{ color: p.stock <= 5 ? 'var(--vw-pink)' : undefined, fontWeight: p.stock <= 5 ? 'bold' : 'normal' }}>
                        {p.stock ?? 0}
                      </td>
                      {esAdmin && <td>{vendidos[p.id] || 0}</td>}
                      <td>
                        {esAdmin ? (
                          <>
                            <button className="btn btn-sm btn-warning me-2" onClick={() => handleEditar(p)}>Editar</button>
                            <button className="btn btn-sm btn-danger" onClick={() => handleEliminar(p.id)}>Eliminar</button>
                          </>
                        ) : (
                          <button className="btn btn-sm btn-warning" onClick={() => handleVer(p)}>Ver</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'Nuevo' && esAdmin && formFields}

      {tab === 'Editar' && esAdmin && (
        editandoId
          ? formFields
          : <p>Selecciona un producto en la pestaña <strong>Listar</strong> y haz clic en Editar.</p>
      )}

      {tab === 'Detalle' && (
        productoVisto
          ? detalle
          : <p>Selecciona un producto en la pestaña <strong>Listar</strong> y haz clic en "Ver".</p>
      )}
    </>
  )
}

export default AdminProductos
