# Música de la tienda

Las canciones (MP3) de esta carpeta se suben al repositorio junto con el resto del proyecto.

## Cómo agregar canciones
1. Copia los MP3 en `public/musica/`.
2. Agrégalos a `canciones.json`, en el orden en que deben sonar:

```json
[
  { "titulo": "Nombre que se muestra", "archivo": "cancion1.mp3" },
  { "titulo": "Otra canción",          "archivo": "cancion2.mp3" }
]
```

- Si la lista está vacía, el reproductor no aparece.
- Si un archivo no existe, el reproductor salta a la siguiente canción.
