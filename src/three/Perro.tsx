import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { azar, salidaCubica, useProgreso } from './animacion'
import { Lluvia, type Punto } from './comun'
import { manchas } from './texturas'

const LARGO = 2.1
const ARRIBA = 0.8

function Pan() {
  const geo = useMemo(() => new THREE.CapsuleGeometry(0.34, LARGO - 0.2, 16, 64).rotateZ(Math.PI / 2).scale(1, 1.0, 0.72), [])
  const t = manchas('pan-perro', '#D8A25B', '#C78D45', { escala: 6, contraste: 0.6, semilla: 51 })
  const semillas = useMemo(() => {
    const r = azar(13)
    const pts: Punto[] = []
    for (const lado of [-1, 1]) {
      for (let i = 0; i < 80; i++) {
        const x = (r() - 0.5) * (LARGO - 0.15)
        const th = (r() * 0.85 + 0.05) * (Math.PI / 2)
        const fin = Math.max(0, Math.abs(x) - (LARGO / 2 - 0.35)) / 0.35
        const rad = 0.34 * Math.sqrt(1 - Math.min(1, fin * fin))
        pts.push({
          x,
          y: 0.34 + Math.cos(th) * rad + 0.004,
          z: lado * (0.21 + Math.sin(th) * rad * 0.72),
          rx: lado * th,
          ry: r() * Math.PI,
          s: 0.7 + r() * 0.4,
        })
      }
    }
    return pts
  }, [])
  const semillaGeo = useMemo(() => new THREE.SphereGeometry(0.022, 10, 8).scale(1, 0.42, 0.62), [])
  const semillaMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#F1E4C6', roughness: 0.5 }), [])
  return (
    <group>
      {[-1, 1].map((lado) => (
        <mesh key={lado} geometry={geo} position={[0, 0.34, lado * 0.21]} castShadow receiveShadow>
          <meshPhysicalMaterial map={t.map} bumpMap={t.bumpMap} bumpScale={0.5} roughness={0.55} clearcoat={0.3} />
        </mesh>
      ))}
      <Lluvia activo geometria={semillaGeo} material={semillaMat} puntos={semillas} altura={0} duracion={0.01} escalonado={0} rebote={false} />
    </group>
  )
}

function Salchicha() {
  const geo = useMemo(() => new THREE.CapsuleGeometry(0.2, LARGO + 0.05, 16, 48).rotateZ(Math.PI / 2), [])
  const t = manchas('salchicha', '#A8452B', '#933A22', { escala: 8, contraste: 0.7, semilla: 57 })
  return (
    <mesh geometry={geo} position={[0, ARRIBA - 0.2, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial map={t.map} bumpMap={t.bumpMap} bumpScale={0.4} roughness={0.3} clearcoat={0.9} clearcoatRoughness={0.2} />
    </mesh>
  )
}

/** Hilo de salsa en zigzag que se va dibujando a lo largo del perro, como saliendo del pomo. */
function Hilo({ activo, color, altura, fase, amplitud = 0.15, vueltas = 9, grosor = 0.032 }: { activo: boolean; color: string; altura: number; fase: number; amplitud?: number; vueltas?: number; grosor?: number }) {
  const ref = useRef<THREE.Mesh>(null!)
  const p = useProgreso(activo, 1.3)
  const { geo, total, paso } = useMemo(() => {
    const pts: THREE.Vector3[] = []
    const n = 240
    for (let i = 0; i <= n; i++) {
      const u = i / n
      const x = -LARGO / 2 + 0.1 + u * (LARGO - 0.2)
      pts.push(new THREE.Vector3(x, altura + 0.012 * Math.sin(u * 40), Math.sin(u * Math.PI * 2 * vueltas + fase) * amplitud))
    }
    const radiales = 10
    const segmentos = 600
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segmentos, grosor, radiales, false)
    return { geo: g, total: g.index!.count, paso: radiales * 6 }
  }, [altura, fase, amplitud, vueltas, grosor])
  useFrame(() => {
    const t = salidaCubica(p.current)
    ref.current.visible = t > 0
    geo.setDrawRange(0, Math.floor((total * t) / paso) * paso)
  })
  return (
    <mesh ref={ref} geometry={geo} castShadow>
      <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={1} clearcoatRoughness={0.12} />
    </mesh>
  )
}

function Trocitos({ activo, n, semilla, geo, mat, y, ancho = 0.26, altura = 1.3 }: { activo: boolean; n: number; semilla: number; geo: THREE.BufferGeometry; mat: THREE.Material; y: number; ancho?: number; altura?: number }) {
  const pts = useMemo<Punto[]>(() => {
    const r = azar(semilla)
    return Array.from({ length: n }, () => {
      const x = (r() - 0.5) * (LARGO - 0.3)
      const z = (r() - 0.5) * 2 * ancho
      return { x, y: y + (1 - Math.abs(z) / ancho) * 0.04 + r() * 0.02, z, rx: (r() - 0.5) * 0.6, ry: r() * Math.PI, rz: (r() - 0.5) * 0.6, s: 0.7 + r() * 0.5 }
    })
  }, [n, semilla, y, ancho])
  return <Lluvia activo={activo} geometria={geo} material={mat} puntos={pts} altura={altura} escalonado={0.55} rebote={false} />
}

export function Perro({ sel }: { sel: Set<string> }) {
  const g = useMemo(
    () => ({
      repollo: new THREE.BoxGeometry(0.13, 0.006, 0.012),
      cebolla: new THREE.BoxGeometry(0.026, 0.022, 0.026),
      papitas: new THREE.BoxGeometry(0.12, 0.014, 0.014),
      queso: new THREE.BoxGeometry(0.02, 0.012, 0.014),
      tocineta: new THREE.BoxGeometry(0.06, 0.03, 0.05),
    }),
    [],
  )
  const m = useMemo(
    () => ({
      repollo: new THREE.MeshPhysicalMaterial({ color: '#DCE7C2', roughness: 0.4, clearcoat: 0.4 }),
      cebolla: new THREE.MeshPhysicalMaterial({ color: '#F1EAE0', roughness: 0.3, transmission: 0.3, thickness: 0.03 }),
      papitas: new THREE.MeshPhysicalMaterial({ color: '#E8B64C', roughness: 0.38, clearcoat: 0.5 }),
      queso: new THREE.MeshStandardMaterial({ color: '#FFFDF7', roughness: 0.6, emissive: '#3A3428' }),
      tocineta: new THREE.MeshPhysicalMaterial({ color: '#9A3A25', roughness: 0.45, clearcoat: 0.4 }),
    }),
    [],
  )
  return (
    <group rotation={[0, -0.35, 0]}>
      <Pan />
      <Salchicha />
      <Trocitos activo={sel.has('repollo')} n={110} semilla={3} geo={g.repollo} mat={m.repollo} y={ARRIBA - 0.03} ancho={0.2} />
      <Trocitos activo={sel.has('cebolla')} n={60} semilla={7} geo={g.cebolla} mat={m.cebolla} y={ARRIBA - 0.01} ancho={0.15} />
      <Trocitos activo={sel.has('tocineta')} n={30} semilla={11} geo={g.tocineta} mat={m.tocineta} y={ARRIBA} ancho={0.14} />
      <Hilo activo={sel.has('ketchup')} color="#A82316" altura={ARRIBA + 0.03} fase={0} amplitud={0.13} vueltas={8} />
      <Hilo activo={sel.has('mostaza')} color="#E0A51E" altura={ARRIBA + 0.06} fase={1.6} amplitud={0.16} vueltas={10} />
      <Hilo activo={sel.has('mayonesa')} color="#F3EBD6" altura={ARRIBA + 0.085} fase={3.1} amplitud={0.11} vueltas={12} grosor={0.026} />
      <Trocitos activo={sel.has('papitas')} n={55} semilla={17} geo={g.papitas} mat={m.papitas} y={ARRIBA + 0.09} ancho={0.15} />
      <Trocitos activo={sel.has('queso-rallado')} n={220} semilla={23} geo={g.queso} mat={m.queso} y={ARRIBA + 0.11} ancho={0.14} />
    </group>
  )
}
