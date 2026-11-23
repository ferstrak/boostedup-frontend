import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { CarritoProvider } from '../context/CarritoContext'
import ProductoCard from '../components/ProductoCard'

const renderCard = (producto) =>
  render(
    <BrowserRouter>
      <CarritoProvider>
        <ProductoCard producto={producto} />
      </CarritoProvider>
    </BrowserRouter>
  )

describe('ProductoCard', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'alert').mockImplementation(() => {})
  })

  it('muestra el precio con descuento cuando el producto está en oferta', () => {
    renderCard({ id: 3, titulo: 'Figura Satoru Gojo', precio: 7990, img: '/uploads/gojo.jpg', es_oferta: true, descuento: 25, es_portada: false })
    expect(screen.getByText('-25%')).toBeInTheDocument()
    expect(screen.getByText('$5.993')).toBeInTheDocument()
  })

  it('no permite agregar al carrito desde la card: hay que entrar al detalle', () => {
    renderCard({ id: 2, titulo: 'Figura Yujiro Hanma', precio: 70990, img: '/uploads/hanma.jpg', es_oferta: false, descuento: 0 })
    expect(screen.getByText('Ver Detalle')).toBeInTheDocument()
    expect(screen.queryByText('Agregar al carrito')).not.toBeInTheDocument()
  })

  it('muestra "Ver Colección" y no "Agregar al carrito" en una colección de portada', () => {
    renderCard({ id: 4, titulo: 'Colección Jujutsu Kaisen', precio: 20990, img: '/uploads/kaisen.jpg', es_oferta: false, descuento: 0, es_portada: true })
    expect(screen.getByText('Ver Colección')).toBeInTheDocument()
    expect(screen.queryByText('Agregar al carrito')).not.toBeInTheDocument()
  })

  it('completa la URL de la imagen con la dirección del backend', () => {
    renderCard({ id: 2, titulo: 'Figura Yujiro Hanma', precio: 70990, img: '/uploads/hanma.jpg', es_oferta: false, descuento: 0 })
    expect(screen.getByAltText('Figura Yujiro Hanma').getAttribute('src')).toBe('http://localhost:8080/uploads/hanma.jpg')
  })
})
