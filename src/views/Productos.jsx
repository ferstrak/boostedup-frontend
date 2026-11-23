import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { getProductos, getProductosPorColeccion, getCategorias } from '../services/api'
import ProductoCard from '../components/ProductoCard'
import { preciosDesdePorColeccion, precioDesde, estaEnOferta } from '../utils/precios'

// "coleccionables" -> "Coleccionables"
const capitalizar = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1)

function Productos() {
  const [searchParams] = useSearchParams()
  const coleccion = searchParams.get('coleccion')
  const categoriaId = searchParams.get('categoria') // viene de las pestañas o del footer
  const soloOfertas = searchParams.get('filtro') === 'ofertas'

  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [preciosDesde, setPreciosDesde] = useState({})
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  // Las pestañas salen de las categorías de la base de datos
  useEffect(() => {
    getCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([]))
  }, [])

  useEffect(() => {
    setCargando(true)
    setError(null)
    setProductos([])

    const promesa = coleccion
      ? getProductosPorColeccion(coleccion)
      : getProductos()

    promesa
      .then(data => {
        if (!coleccion) setPreciosDesde(preciosDesdePorColeccion(data))
        let lista = data
        // Fuera de una colección, sus productos no se muestran sueltos:
        // se ve la card de la colección y al entrar aparecen sus productos.
        // (En Ofertas sí se muestran, para que ningún descuento quede escondido.)
        if (!coleccion && !soloOfertas) lista = lista.filter(p => !p.coleccion)
        if (categoriaId) lista = lista.filter(p => String(p.categoria_id) === categoriaId)
        if (soloOfertas) lista = lista.filter(estaEnOferta)
        setProductos(lista)
      })
      .catch(err => setError(err.message))
      .finally(() => setCargando(false))
  }, [coleccion, categoriaId, soloOfertas])

  const claseTab = (activa) => (activa ? 'tab-vapor activa' : 'tab-vapor')

  return (
    <div className="container my-5">
      <div className="text-center mb-4">
        <h1 className="titulo-caja-vapor">PRODUCTOS</h1>
        {coleccion && <p className="subtitulo-vapor">Colección: {coleccion}</p>}
      </div>

      {/* Pestañas: Todo / una por categoría */}
      {!coleccion && (
        <div className="tabs-vapor mb-5">
          <Link to="/productos" className={claseTab(!categoriaId && !soloOfertas)}>Todo</Link>
          {categorias.map(c => (
            <Link
              key={c.id}
              to={`/productos?categoria=${c.id}`}
              className={claseTab(categoriaId === String(c.id))}
            >
              {capitalizar(c.nombre)}
            </Link>
          ))}
          {/* No es una categoría de la base: junta los productos con descuento */}
          <Link to="/productos?filtro=ofertas" className={claseTab(soloOfertas)}>Ofertas</Link>
        </div>
      )}

      {coleccion && (
        <div className="text-center mb-4">
          <Link to="/productos" className="tab-vapor">← Ver todos los productos</Link>
        </div>
      )}

      {cargando && <p className="text-center">Cargando...</p>}
      {error && <p className="text-center text-danger">Error: {error}</p>}

      {!cargando && !error && (
        productos.length === 0 ? (
          <p className="text-center">
            {soloOfertas
              ? 'No hay productos en oferta por ahora.'
              : categoriaId ? 'No hay productos en esta categoría todavía.' : 'No hay productos para mostrar.'}
          </p>
        ) : (
          <div className="row justify-content-center">
            {productos.map(p => (
              <ProductoCard
                key={p.id}
                producto={p}
                precioColeccion={p.es_portada ? precioDesde(p, preciosDesde) : undefined}
              />
            ))}
          </div>
        )
      )}
    </div>
  )
}

export default Productos
