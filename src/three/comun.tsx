import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { azar, limitar, salidaAtras, salidaCubica, useProgreso } from './animacion'

const dummy = new THREE.Object3D()

export type Punto = { x: number; y: number; z: number; ry?: number; rx?: number; rz?: number; s?: number }

/**
 * Muchas piezas iguales (pepperoni, maíz, papitas…) que caen desde arriba una tras otra
 * y se asientan con un leve rebote. Al quitar el ingrediente vuelven a subir.
 */
export function Lluvia({
  activo,
  geometria,
  material,
  puntos,
  altura = 1.4,
  duracion = 1.3,
  escalonado = 0.55,
  rebote = true,
}: {
  activo: boolean
  geometria: THREE.BufferGeometry
  material: THREE.Material
  puntos: Punto[]
  altura?: number
  duracion?: number
  escalonado?: number
  rebote?: boolean
}) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const p = useProgreso(activo, duracion)
  const ultimo = useRef(-1)
  const orden = useMemo(() => {
    const r = azar(puntos.length * 31 + 7)
    return puntos.map(() => r() * escalonado)
  }, [puntos, escalonado])

  useFrame(() => {
    const prog = p.current
    if (prog === ultimo.current) return
    ultimo.current = prog
    const malla = ref.current
    malla.visible = prog > 0
    const tramo = 1 - escalonado
    puntos.forEach((pt, i) => {
      const t = limitar((prog - orden[i]) / tramo)
      const e = rebote ? salidaAtras(t, 1.1) : salidaCubica(t)
      dummy.position.set(pt.x, pt.y + (1 - e) * altura, pt.z)
      dummy.rotation.set(pt.rx ?? 0, (pt.ry ?? 0) + (1 - t) * 1.5, pt.rz ?? 0)
      dummy.scale.setScalar(t <= 0 ? 0.0001 : (pt.s ?? 1) * (0.6 + 0.4 * salidaCubica(t * 2)))
      dummy.updateMatrix()
      malla.setMatrixAt(i, dummy.matrix)
    })
    malla.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geometria, material, puntos.length]} castShadow receiveShadow frustumCulled={false} />
}

/** Desplaza los vértices de una geometría (para bordes irregulares, relieve, ondas). */
export function deformar(g: THREE.BufferGeometry, fn: (v: THREE.Vector3) => void) {
  const pos = g.attributes.position
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    fn(v)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  g.computeVertexNormals()
  return g
}

/** Perfil suavizado para LatheGeometry: los puntos de control pasan por una spline. */
export function perfil(puntos: [number, number][], n = 64) {
  const curva = new THREE.SplineCurve(puntos.map(([x, y]) => new THREE.Vector2(x, y)))
  return curva.getPoints(n)
}
