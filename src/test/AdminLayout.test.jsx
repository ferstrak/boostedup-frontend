import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import AdminLayout from '../layouts/AdminLayout'

vi.mock('../services/api', () => ({ guardarToken: vi.fn() }))

// Token falso con vencimiento en el futuro (el front solo lee "exp")
const tokenValido = () => {
  const payload = btoa(JSON.stringify({ sub: '1', exp: Math.floor(Date.now() / 1000) + 3600 }))
  return `x.${payload}.y`
}

const iniciarSesionComo = (rol) => {
  localStorage.setItem('token', tokenValido())
  localStorage.setItem('usuario', JSON.stringify({ id: 1, nombre: 'Prueba', rol }))
}

const renderPanel = () =>
  render(
    <MemoryRouter initialEntries={['/admin']}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<p>Tienda</p>} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<p>Contenido</p>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  )

describe('Panel por rol', () => {
  beforeEach(() => localStorage.clear())

  it('el admin ve todas las secciones', () => {
    iniciarSesionComo('admin')
    renderPanel()
    expect(screen.getByText('Panel Admin')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Reportes')).toBeInTheDocument()
    expect(screen.getByText('Mensajes')).toBeInTheDocument()
    expect(screen.getByText('Perfil')).toBeInTheDocument()
  })

  it('el vendedor solo ve productos y boletas (Anexo 1)', () => {
    iniciarSesionComo('vendedor')
    renderPanel()
    expect(screen.getByText('Panel Vendedor')).toBeInTheDocument()
    expect(screen.getByText('Productos')).toBeInTheDocument()
    expect(screen.getByText('Boletas')).toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Reportes')).not.toBeInTheDocument()
    expect(screen.queryByText('Mensajes')).not.toBeInTheDocument()
    expect(screen.queryByText('Perfil')).not.toBeInTheDocument()
  })

  it('el cliente no puede entrar al panel', () => {
    iniciarSesionComo('cliente')
    renderPanel()
    expect(screen.getByText('Tienda')).toBeInTheDocument()
  })
})
