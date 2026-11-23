# Archivos de los easter eggs

Los videos de esta carpeta se suben al repositorio junto con el resto del proyecto.

| Easter egg | Cómo se activa | Archivos (opcionales) |
|---|---|---|
| ZA WARUDO | 5 clics seguidos en el título de **Cosplay Dio** | `zawarudo.mp4` (pantalla verde) o `zawarudo.gif`, `zawarudo.mp3` |
| POW! (error 500) | 5 clics en el título de **Cosplay Heavy** | `heavy.mp4` (pantalla verde) o `heavy.gif`, `heavy.mp3`, `heavy-explota.mp4` (fondo **blanco**, al volver la página) |

- Si falta un archivo, el easter egg funciona igual: usa un sonido generado por
  el navegador y solo los efectos visuales.
- Los videos de **pantalla verde** (o de **fondo blanco**, según `config.js`) se vuelven transparentes solos.
- Tiempos (segundo del grito, duración, inicio de la canción): `src/easter-eggs/config.js`.
- `Esc` corta cualquier easter egg.
