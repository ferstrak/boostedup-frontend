import { useRef } from 'react'
import { CLICS_NECESARIOS, MS_ENTRE_CLICS } from './config'

/**
 * Cuenta clics seguidos. Al llegar a CLICS_NECESARIOS llama a alActivar().
 * Si el usuario se demora más de MS_ENTRE_CLICS entre clics, vuelve a cero.
 */
export default function useClicsSecretos(alActivar) {
  const clics = useRef(0)
  const ultimo = useRef(0)

  return () => {
    const ahora = Date.now()
    clics.current = ahora - ultimo.current > MS_ENTRE_CLICS ? 1 : clics.current + 1
    ultimo.current = ahora
    if (clics.current >= CLICS_NECESARIOS) {
      clics.current = 0
      alActivar()
    }
  }
}
