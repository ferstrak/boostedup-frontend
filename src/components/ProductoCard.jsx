import React from 'react'
import { useNavigate } from 'react-router-dom'
import { urlImagen } from '../services/api'

// precioColeccion: precio más bajo de la colección (solo para portadas)
function ProductoCard({ producto, precioColeccion }) {
  const navigate = useNavigate()

  // Construye la URL completa de la imagen
  const obtenerUrlImagen = (img) => urlImagen(img)

  // Formatea un número a precio CLP: 15990 → "$15.990"
  const formatearPrecio = (numero) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0
    }).format(numero)
  }

  // Detectar si está en oferta
  // Las colecciones (portadas) nunca se muestran en oferta
  const esOferta = !producto.es_portada && producto.es_oferta === true && producto.descuento > 0
  const precioOriginal = producto.precio
  const precioFinal = esOferta
    ? Math.round(precioOriginal * (1 - producto.descuento / 100))
    : precioOriginal

  const irAColeccion = () => {
    navigate(`/productos?coleccion=${encodeURIComponent(producto.titulo.replace('Colección ', ''))}`)
  }

  const irADetalle = () => {
    navigate(`/producto/${producto.id}`)
  }

  const handleClick = () => {
    if (producto.es_portada) irAColeccion()
    else irADetalle()
  }

  const handleBotonPrincipal = (e) => {
    e.stopPropagation()
    if (producto.es_portada) irAColeccion()
    else irADetalle()
  }

  return (
    <div className="col-6 col-md-4 col-lg-3 mb-4">
      <div
        className="card vapor-card h-100 text-center position-relative"
        style={{ cursor: 'pointer' }}
        onClick={handleClick}
      >
        {/* Etiqueta de descuento (solo si está en oferta) */}
        {esOferta && (
          <span
            className="position-absolute top-0 end-0 m-2"
            style={{
              background: 'var(--vw-pink)',
              color: 'var(--vw-bg)',
              padding: '4px 10px',
              borderRadius: '4px',
              fontFamily: "'Press Start 2P'",
              fontSize: '0.7rem',
              boxShadow: '0 0 10px var(--vw-pink)',
              zIndex: 2
            }}
          >
            -{producto.descuento}%
          </span>
        )}

        <img
          src={obtenerUrlImagen(producto.img)}
          className="card-img-top vapor-img"
          alt={producto.titulo}
        />

        <div className="card-body d-flex flex-column">
          <h5 className="card-title vapor-title">{producto.titulo}</h5>

          {/* Precios: si está en oferta, muestra tachado + descuento */}
          {esOferta ? (
            <>
              <p
                className="mt-auto mb-1"
                style={{
                  color: 'var(--vw-text)',
                  opacity: 0.6,
                  textDecoration: 'line-through',
                  fontSize: '1rem',
                  marginBottom: 0
                }}
              >
                {formatearPrecio(precioOriginal)}
              </p>
              <p
                className="vapor-price mb-2"
                style={{ fontSize: '1.4rem', color: 'var(--vw-green)' }}
              >
                {formatearPrecio(precioFinal)}
              </p>
            </>
          ) : producto.es_portada ? (
            // Colección: se aclara que es el precio más bajo, no el de la colección entera
            <div className="mt-auto">
              <p className="desde-coleccion mb-0">Desde</p>
              <p className="card-text vapor-price">
                {formatearPrecio(precioColeccion ?? precioOriginal)}
              </p>
            </div>
          ) : (
            <p className="card-text vapor-price mt-auto">
              {formatearPrecio(precioOriginal)}
            </p>
          )}

          <button className="btn btn-vapor mt-3" onClick={handleBotonPrincipal}>
            {producto.es_portada ? 'Ver Colección' : 'Ver Detalle'}
          </button>

        </div>
      </div>
    </div>
  )
}

export default ProductoCard