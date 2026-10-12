import * as THREE from 'three'

/** Ruido de valor suave con varias octavas: base de todas las texturas (sin imágenes externas). */
function ruido(semilla: number) {
  const tam = 256
  const tabla = new Float32Array(tam * tam)
  let s = semilla * 9301 + 49297
  for (let i = 0; i < tabla.length; i++) {
    s = (s * 9301 + 49297) % 233280
    tabla[i] = s / 233280
  }
  const v = (x: number, y: number) => tabla[(((y % tam) + tam) % tam) * tam + (((x % tam) + tam) % tam)]
  const suave = (t: number) => t * t * (3 - 2 * t)
  // Periódico: la red se repite cada 'periodo' celdas, así la textura cierra sin costura
  const valor = (x: number, y: number, periodo: number) => {
    const xi = Math.floor(x)
    const yi = Math.floor(y)
    const fx = suave(x - xi)
    const fy = suave(y - yi)
    const w = (k: number) => ((k % periodo) + periodo) % periodo
    const a = v(w(xi), w(yi)) + (v(w(xi + 1), w(yi)) - v(w(xi), w(yi))) * fx
    const b = v(w(xi), w(yi + 1)) + (v(w(xi + 1), w(yi + 1)) - v(w(xi), w(yi + 1))) * fx
    return a + (b - a) * fy
  }
  return (x: number, y: number, periodo: number, octavas = 4) => {
    let total = 0
    let amp = 0.5
    let f = 1
    for (let o = 0; o < octavas; o++) {
      total += valor(x * f, y * f, periodo * f) * amp
      amp *= 0.5
      f *= 2
    }
    return total / (1 - Math.pow(0.5, octavas))
  }
}

function lienzo(ancho: number, alto: number, color: (u: number, v: number) => [number, number, number]) {
  const c = document.createElement('canvas')
  c.width = ancho
  c.height = alto
  const ctx = c.getContext('2d')!
  const img = ctx.createImageData(ancho, alto)
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      const [r, g, b] = color(x / ancho, y / alto)
      const i = (y * ancho + x) * 4
      img.data[i] = r
      img.data[i + 1] = g
      img.data[i + 2] = b
      img.data[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return c
}

function textura(c: HTMLCanvasElement, color = true) {
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.anisotropy = 8
  if (color) t.colorSpace = THREE.SRGBColorSpace
  return t
}

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]
const mezcla = (a: [number, number, number], b: [number, number, number], t: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
]

export type Juego = { map: THREE.Texture; bumpMap: THREE.Texture; roughnessMap?: THREE.Texture }

const cache = new Map<string, Juego>()

/**
 * Textura de manchas entre dos colores (más un tercero opcional en los picos), con mapa de relieve a juego.
 * gradiente: oscurece hacia v=1 (útil en panes: más tostado arriba).
 */
export function manchas(
  clave: string,
  a: string,
  b: string,
  { escala = 8, contraste = 1, c, umbralC = 0.72, gradiente = 0, semilla = 1, tam = 512 }: { escala?: number; contraste?: number; c?: string; umbralC?: number; gradiente?: number; semilla?: number; tam?: number } = {},
): Juego {
  const hit = cache.get(clave)
  if (hit) return hit
  const n = ruido(semilla)
  escala = Math.max(1, Math.round(escala))
  const A = hex(a)
  const B = hex(b)
  const C = c ? hex(c) : null
  const map = lienzo(tam, tam, (u, v) => {
    const k = Math.min(1, Math.max(0, (n(u * escala, v * escala, escala) - 0.5) * contraste * 2 + 0.5))
    let col = mezcla(A, B, k)
    if (C && k > umbralC) col = mezcla(col, C, Math.min(1, (k - umbralC) / (1 - umbralC)))
    if (gradiente) col = mezcla(col, mezcla(col, [40, 20, 8], 0.5), v * gradiente)
    return col
  })
  const bump = lienzo(tam, tam, (u, v) => {
    const k = n(u * escala * 2 + 17, v * escala * 2 + 5, escala * 2) * 255
    return [k, k, k]
  })
  const juego = { map: textura(map), bumpMap: textura(bump, false) }
  cache.set(clave, juego)
  return juego
}

