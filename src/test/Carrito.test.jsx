import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import { CarritoProvider } from '../context/CarritoContext'
import Carrito from '../views/Carrito'

vi.mock('../services/api', () => ({
  crearOrden: vi.fn(),
  guardarToken: vi.fn()
}))

const renderCarrito = () =>
  render(
    <BrowserRouter>
      <AuthProvider>
        <CarritoProvider>
          <Carrito />
        </CarritoProvider>
      </AuthProvider>
    </BrowserRouter>
  )

describe('Vista Carrito', () => {
  beforeEach(() => localStorage.clear())

  it('muestra el carrito vacío y el total en $0', () => {
    renderCarrito()
    expect(screen.getByText('Mi carrito de compras')).toBeInTheDocument()
    expect(screen.getByText('Tu carrito está vacío.')).toBeInTheDocument()
    expect(screen.getByText('$0')).toBeInTheDocument()
  })

  it('pide iniciar sesión para comprar si no hay sesión', () => {
    renderCarrito()
    expect(screen.getByText('iniciar sesión')).toBeInTheDocument()
  })

  it('muestra los productos guardados y su total', () => {
    localStorage.setItem('carrito', JSON.stringify([
      { id: 3, titulo: 'Figura Satoru Gojo', precio: 5993, img: '', cantidad: 2 }
    ]))
    renderCarrito()
    expect(screen.getByText('Figura Satoru Gojo')).toBeInTheDocument()
    expect(screen.getAllByText('$11986').length).toBeGreaterThan(0)
  })
})
