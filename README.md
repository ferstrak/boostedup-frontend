# BOOSTED UP! — Frontend

Tienda online de cosplay y coleccionables con estética vaporwave (DSY1104, Evaluación Parcial 3).
Este repositorio es el **frontend en React**; consume la API REST del backend:
👉 [ferstrak/boostedup-backend](https://github.com/ferstrak/boostedup-backend)

## Tecnologías

- React 19 + Vite
- React Router 7
- Bootstrap 5.3 + estilos propios (`src/css/style.css`)
- Vitest + Testing Library (tests)
- Autenticación con **JWT** (lo entrega el backend) y **login con Google**

## Requisitos

- Node.js 20 o superior
- El backend corriendo en `http://localhost:8080` (ver su README)

## Cómo ejecutarlo

```bash
npm install
cp .env.example .env      # en Windows: copy .env.example .env
npm run dev
```

Abrir **http://localhost:5173**

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm test` | Tests (Vitest) |
| `npm run build` | Compila para producción en `dist/` |
| `npm run lint` | Revisa el código |

### Variables de entorno (`.env`)

| Variable | Valor por defecto | Para qué |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080` | Dirección del backend |

### Con Docker (todo el proyecto)

El `docker-compose.yml` está en el repositorio del backend y levanta base de datos, backend y
este frontend (compilado y servido con nginx). Con los dos repos clonados en la misma carpeta:

```bash
cd boostedup-backend
docker compose up --build
```

Abrir **http://localhost:5173**. Ver el README del backend para más detalles.

## Cuentas de prueba

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@gmail.com | admin123 |
| Vendedor | vendedor@gmail.com | vendedor123 |
| Cliente | cliente@gmail.com | cliente123 |

## Roles

| Rol | Qué puede hacer |
|---|---|
| **Cliente** | Tienda, carrito, compra, blogs y comentarios, contacto |
| **Vendedor** | Panel con **solo** productos y boletas (lista y detalle, sin editar) |
| **Administrador** | Panel completo: productos, categorías, usuarios, boletas, reportes, productos críticos, mensajes y perfil |

Las restricciones reales están en el backend (Spring Security responde 401/403); el frontend además oculta lo que cada rol no puede usar.

## Login con Google

El botón abre el selector de cuentas de Google y el ID token se envía a `POST /v1/auth/google`,
donde el backend lo verifica. Para que funcione, en **Google Cloud Console → Credenciales → cliente OAuth**:

- **Orígenes autorizados de JavaScript:** `http://localhost:5173`
- **URI de redireccionamiento autorizados:** `http://localhost:5173/google-callback.html`

Las cuentas nuevas de Google pasan por **"Completa tu perfil"** (dirección, región y comuna).

## Estructura

```
src/
├── services/api.js        # Todas las llamadas a la API (fetch + token JWT)
├── context/               # Sesión (AuthContext) y carrito (CarritoContext)
├── components/            # Navbar, Footer, tarjetas, botón de Google
├── layouts/AdminLayout    # Panel admin/vendedor con menú según el rol
├── views/                 # Páginas de la tienda
│   └── admin/             # Páginas del panel
├── utils/precios.js       # Precio final, ofertas y "Desde" de las colecciones
├── easter-eggs/           # Easter eggs (ver más abajo)
├── musica/                # Reproductor de música
└── test/                  # Tests con Vitest
public/
├── easter-eggs/           # Videos de los easter eggs
├── musica/                # Canciones + canciones.json
└── google-callback.html   # Recibe la respuesta del login con Google
```

## Extras

### Reproductor de música
Flotante en la esquina inferior izquierda; la música no se corta al cambiar de página.
Las canciones están en `public/musica/` y su lista en `public/musica/canciones.json`.

### Easter eggs 🥚
Se activan con **5 clics rápidos en el título** del detalle de ciertos productos (`Esc` los corta):

| Producto | Easter egg |
|---|---|
| Cosplay Dio | **ZA WARUDO!** — el tiempo se detiene y la página queda congelada en blanco y negro |
| Cosplay Heavy | **POW!** — el Heavy tira la página y aparece un error 500… (un clic la arregla) |

Configuración (archivos y tiempos) en `src/easter-eggs/config.js`.
