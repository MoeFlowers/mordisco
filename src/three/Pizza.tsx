import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { azar, girasol, salidaAtras, salidaCubica, useProgreso } from './animacion'
import { deformar, Lluvia, perfil, type Punto } from './comun'
import { manchas } from './texturas'

const SUPERFICIE = 0.072

function Masa() {
  const geo = useMemo(() => {
    const pts = perfil([
      [0.0, 0.07], [0.5, 0.07], [0.88, 0.072], [0.95, 0.11], [1.0, 0.18], [1.06, 0.205], [1.12, 0.18],
      [1.15, 0.11], [1.13, 0.035], [1.08, 0.004], [0.6, 0.0], [0.0, 0.0],
    ], 96)
    const g = new THREE.LatheGeometry(pts, 160)
    // Borde ondulado e irregular: la masa hecha a mano nunca es un círculo perfecto
    const r = azar(5)
    const fases = [r() * 6, r() * 6, r() * 6]
    return deformar(g, (v) => {
      const radio = Math.hypot(v.x, v.z)
      if (radio < 0.85) return
      const a = Math.atan2(v.z, v.x)
      const k = 1 + 0.012 * Math.sin(a * 7 + fases[0]) + 0.008 * Math.sin(a * 13 + fases[1]) + 0.006 * Math.sin(a * 23 + fases[2])
      v.x *= k
      v.z *= k
      v.y *= 1 + 0.05 * Math.sin(a * 9 + fases[1])
    })
  }, [])
  const tex = manchas('masa', '#E8BC7C', '#D29855', { escala: 16, contraste: 1.0, c: '#A0612E', umbralC: 0.85, semilla: 3 })
  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial map={tex.map} bumpMap={tex.bumpMap} bumpScale={1.2} roughness={0.78} />
    </mesh>
  )
}

function Salsa({ activo }: { activo: boolean }) {
  const ref = useRef<THREE.Mesh>(null!)
  const p = useProgreso(activo, 1.0)
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(0.89, 160, 0, Math.PI * 2)
    g.rotateX(-Math.PI / 2)
    const r = azar(11)
    const f = [r() * 6, r() * 6]
    return deformar(g, (v) => {
      const radio = Math.hypot(v.x, v.z)
      if (radio < 0.88) return
      const a = Math.atan2(v.z, v.x)
      const k = 1 + 0.012 * Math.sin(a * 5 + f[0]) + 0.006 * Math.sin(a * 11 + f[1])
      v.x *= k
      v.z *= k
    })
  }, [])
  const tex = manchas('salsa', '#B23A22', '#8C2715', { escala: 7, contraste: 1.2, c: '#C9532F', umbralC: 0.7, semilla: 7 })
  useFrame(() => {
    const m = ref.current
    const t = p.current
    m.visible = t > 0
    // Se esparce desde el centro girando, como con la cuchara
    const e = salidaAtras(t, 0.8)
    m.scale.set(Math.max(0.001, e), 1, Math.max(0.001, e))
    m.rotation.y = (1 - t) * 2.4
  })
  return (
    <mesh ref={ref} geometry={geo} position={[0, SUPERFICIE + 0.003, 0]} receiveShadow>
      <meshPhysicalMaterial map={tex.map} bumpMap={tex.bumpMap} bumpScale={0.6} roughness={0.38} clearcoat={0.45} clearcoatRoughness={0.4} />
    </mesh>
  )
}

function Queso({ activo }: { activo: boolean }) {
  const ref = useRef<THREE.Mesh>(null!)
  const mat = useRef<THREE.MeshPhysicalMaterial>(null!)
  const p = useProgreso(activo, 1.6)
  const geo = useMemo(() => {
    const g = new THREE.CircleGeometry(0.87, 128, 0, Math.PI * 2)
    g.rotateX(-Math.PI / 2)
    const r = azar(21)
    const f = [r() * 6, r() * 6, r() * 6]
    return deformar(g, (v) => {
      const radio = Math.hypot(v.x, v.z)
      const a = Math.atan2(v.z, v.x)
      v.y = 0.012 * Math.sin(v.x * 9 + f[0]) * Math.sin(v.z * 8 + f[1]) + 0.006 * Math.sin(v.x * 23 + v.z * 19)
      if (radio > 0.82) {
        const k = 1 + 0.03 * Math.sin(a * 5 + f[2]) + 0.02 * Math.sin(a * 14 + f[0])
        v.x *= k
        v.z *= k
      }
    })
  }, [])
  const tex = manchas('queso', '#F6DE9C', '#EDC46C', { escala: 9, contraste: 1.5, c: '#C88A3C', umbralC: 0.8, semilla: 13 })
  const ralladoGeo = useMemo(() => new THREE.BoxGeometry(0.09, 0.012, 0.016), [])
  const ralladoMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#F4E2A8', roughness: 0.55 }), [])
  const tiras = useMemo<Punto[]>(() => {
    const r = azar(4)
    return girasol(170, 0.82, 9).map((v) => ({ x: v.x, y: SUPERFICIE + 0.02, z: v.y, ry: r() * Math.PI, rz: (r() - 0.5) * 0.4 }))
  }, [])
  const rallado = useRef<THREE.Group>(null!)
  useFrame(() => {
    const t = p.current
    // Primero cae rallado; desde la mitad se funde en una capa que brilla
    const fundido = salidaCubica((t - 0.5) / 0.5)
    ref.current.visible = fundido > 0
    mat.current.opacity = fundido
    ref.current.scale.setScalar(0.92 + 0.08 * fundido)
    rallado.current.visible = t > 0 && fundido < 1
    rallado.current.scale.set(1, 1 - fundido * 0.9, 1)
  })
  return (
    <group>
      <group ref={rallado}>
        <Lluvia activo={activo} geometria={ralladoGeo} material={ralladoMat} puntos={tiras} duracion={0.9} escalonado={0.6} rebote={false} altura={1.1} />
      </group>
      <mesh ref={ref} geometry={geo} position={[0, SUPERFICIE + 0.012, 0]} receiveShadow castShadow>
        <meshPhysicalMaterial ref={mat} map={tex.map} bumpMap={tex.bumpMap} bumpScale={0.8} roughness={0.32} clearcoat={0.6} clearcoatRoughness={0.35} sheen={0.4} sheenColor="#FFE9B0" transparent />
      </mesh>
    </group>
  )
}

function useMaterial(clave: string, a: string, b: string, extra: Partial<THREE.MeshPhysicalMaterialParameters> = {}) {
  return useMemo(() => {
    const t = manchas(clave, a, b, { escala: 6, contraste: 1.3, semilla: clave.length * 3 })
    return new THREE.MeshPhysicalMaterial({ map: t.map, bumpMap: t.bumpMap, bumpScale: 0.5, roughness: 0.45, ...extra })
    // Un material por ingrediente: se crea una vez aunque 'extra' sea un objeto nuevo en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clave])
}

const ALTO_TOPPING = SUPERFICIE + 0.035

export function Pizza({ sel }: { sel: Set<string> }) {
  const r = useMemo(() => azar(77), [])
  const mats = {
    pepperoni: useMaterial('pepperoni', '#A8341F', '#7A1F12', { clearcoat: 0.5, roughness: 0.35 }),
    jamon: useMaterial('jamon', '#EBA6A0', '#D98A84', { roughness: 0.5, sheen: 0.3 }),
    maiz: useMaterial('maiz', '#F4C232', '#E0A21C', { roughness: 0.3, clearcoat: 0.6 }),
    pimenton: useMaterial('pimenton', '#3E8A2E', '#2D6A20', { roughness: 0.25, clearcoat: 0.8 }),
    cebolla: useMaterial('cebolla', '#F1EBDD', '#E2D6C2', { roughness: 0.3, transmission: 0.25, thickness: 0.05 }),
    aceitunas: useMaterial('aceitunas', '#2E2A26', '#1C1915', { roughness: 0.25, clearcoat: 0.9 }),
  }
  const geos = useMemo(
    () => ({
      pepperoni: (() => {
        const g = new THREE.CylinderGeometry(0.105, 0.11, 0.022, 40)
        // Borde un poco curvado hacia arriba, como al hornearse
        return deformar(g, (v) => {
          v.y += Math.pow(Math.hypot(v.x, v.z) / 0.11, 3) * 0.012
        })
      })(),
      jamon: (() => {
        const g = new THREE.BoxGeometry(0.34, 0.012, 0.075, 24, 1, 2)
        return deformar(g, (v) => {
          v.y += Math.sin(v.x * 18) * 0.012
          v.z += Math.sin(v.x * 7) * 0.012
        })
      })(),
      maiz: new THREE.SphereGeometry(0.024, 12, 10),
      pimenton: new THREE.TorusGeometry(0.065, 0.013, 8, 24, Math.PI * 1.25).rotateX(Math.PI / 2),
      cebolla: new THREE.TorusGeometry(0.075, 0.008, 6, 28, Math.PI * 1.5).rotateX(Math.PI / 2),
      aceitunas: new THREE.TorusGeometry(0.03, 0.014, 10, 20).rotateX(Math.PI / 2),
    }),
    [],
  )
  const puntos = useMemo(() => {
    const capa = (n: number, radio: number, semilla: number, extra: (p: Punto) => Punto = (p) => p) =>
      girasol(n, radio, semilla).map((v) => extra({ x: v.x, y: ALTO_TOPPING, z: v.y, ry: r() * Math.PI * 2 }))
    return {
      pepperoni: capa(16, 0.74, 3, (p) => ({ ...p, y: ALTO_TOPPING - 0.006 })),
      jamon: capa(12, 0.72, 8, (p) => ({ ...p, y: ALTO_TOPPING + 0.006 })),
      maiz: capa(55, 0.78, 15),
      pimenton: capa(11, 0.74, 21, (p) => ({ ...p, y: ALTO_TOPPING + 0.01 })),
      cebolla: capa(10, 0.74, 29, (p) => ({ ...p, y: ALTO_TOPPING + 0.012 })),
      aceitunas: capa(14, 0.76, 37, (p) => ({ ...p, y: ALTO_TOPPING + 0.008 })),
    }
  }, [r])
  const quesoActivo = sel.has('queso')
  const desfase = quesoActivo ? 0.012 : 0
  return (
    <group>
      <Masa />
      <Salsa activo={sel.has('salsa')} />
      <Queso activo={quesoActivo} />
      {(Object.keys(geos) as (keyof typeof geos)[]).map((k) => (
        <group key={k} position={[0, desfase, 0]}>
          <Lluvia activo={sel.has(k)} geometria={geos[k]} material={mats[k]} puntos={puntos[k]} />
        </group>
      ))}
    </group>
  )
}
