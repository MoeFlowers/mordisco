import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { azar, girasol, salidaAtras, salidaCubica, useProgreso } from './animacion'
import { deformar, Lluvia, perfil, type Punto } from './comun'
import { manchas } from './texturas'

/** Una capa de la pila: cae desde arriba al activarse y se desliza si cambia lo que tiene debajo. */
function Capa({ activo, y, children, caida = 1.9 }: { activo: boolean; y: number; children: ReactNode; caida?: number }) {
  const g = useRef<THREE.Group>(null!)
  const p = useProgreso(activo, 0.75)
  const yAct = useRef(y)
  useFrame((_, dt) => {
    yAct.current = THREE.MathUtils.damp(yAct.current, y, 9, dt)
    const t = p.current
    const e = salidaAtras(t, 1.0)
    g.current.position.y = yAct.current + (1 - e) * caida
    g.current.rotation.y = (1 - salidaCubica(t)) * 0.9
    g.current.visible = t > 0
  })
  return <group ref={g}>{children}</group>
}

function pan(claro = false) {
  return manchas(claro ? 'miga' : 'pan', claro ? '#EAC98E' : '#D1883A', claro ? '#D9AE6B' : '#C67C31', {
    escala: claro ? 14 : 6,
    contraste: claro ? 1.6 : 0.6,
    c: claro ? '#B97C3E' : undefined,
    umbralC: 0.8,
    gradiente: claro ? 0 : 0.18,
    semilla: claro ? 41 : 43,
  })
}

function PanAbajo() {
  const geo = useMemo(() => {
    const pts = perfil([[0, 0], [0.86, 0], [0.99, 0.03], [1.05, 0.11], [1.06, 0.2], [1.03, 0.29], [0.97, 0.335], [0.6, 0.34], [0, 0.34]], 64)
    return new THREE.LatheGeometry(pts, 128)
  }, [])
  const corte = useMemo(() => new THREE.CircleGeometry(0.97, 96).rotateX(-Math.PI / 2), [])
  const t = pan()
  const m = pan(true)
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial map={t.map} bumpMap={t.bumpMap} bumpScale={0.6} roughness={0.55} clearcoat={0.25} />
      </mesh>
      <mesh geometry={corte} position={[0, 0.342, 0]} receiveShadow>
        <meshStandardMaterial map={m.map} bumpMap={m.bumpMap} bumpScale={1.5} roughness={0.85} />
      </mesh>
    </group>
  )
}

const PERFIL_TAPA = perfil([[0, 0], [0.98, 0], [1.06, 0.06], [1.09, 0.17], [1.03, 0.33], [0.88, 0.48], [0.6, 0.6], [0.3, 0.655], [0, 0.665]], 80)

function PanArriba() {
  const geo = useMemo(() => new THREE.LatheGeometry(PERFIL_TAPA, 128), [])
  const t = pan()
  // Ajonjolí blanco y negro repartido por la cúpula, orientado según la superficie
  const semillas = useMemo(() => {
    const r = azar(91)
    const blancas: Punto[] = []
    const negras: Punto[] = []
    // Altura real de la cúpula en cada radio, leída del mismo perfil del pan
    const perfilTapa = PERFIL_TAPA.filter((q) => q.y > 0.05).sort((a, b) => a.x - b.x)
    const altura = (rho: number) => {
      for (let i = 1; i < perfilTapa.length; i++) {
        const a = perfilTapa[i - 1]
        const b = perfilTapa[i]
        if (rho <= b.x) return a.y + ((b.y - a.y) * (rho - a.x)) / Math.max(1e-6, b.x - a.x)
      }
      return perfilTapa[perfilTapa.length - 1].y
    }
    girasol(230, 0.95, 5).forEach((v) => {
      const rho = v.length()
      const y = altura(rho) + 0.004
      const inclinacion = Math.atan2(rho, 0.9) * 0.9
      const a = Math.atan2(v.y, v.x)
      const p: Punto = { x: v.x, y, z: v.y, ry: -a + r() * 1.2, rx: 0, rz: inclinacion, s: 0.8 + r() * 0.4 }
      ;(r() < 0.3 ? negras : blancas).push(p)
    })
    return { blancas, negras }
  }, [])
  const semillaGeo = useMemo(() => new THREE.SphereGeometry(0.026, 10, 8).scale(1, 0.42, 0.62), [])
  const blanca = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#F3E7CC', roughness: 0.45, clearcoat: 0.3 }), [])
  const negra = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#1E1A17', roughness: 0.4, clearcoat: 0.3 }), [])
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow>
        <meshPhysicalMaterial map={t.map} bumpMap={t.bumpMap} bumpScale={0.5} roughness={0.4} clearcoat={0.7} clearcoatRoughness={0.25} />
      </mesh>
      <Lluvia activo geometria={semillaGeo} material={blanca} puntos={semillas.blancas} altura={0} duracion={0.01} escalonado={0} rebote={false} />
      <Lluvia activo geometria={semillaGeo} material={negra} puntos={semillas.negras} altura={0} duracion={0.01} escalonado={0} rebote={false} />
    </group>
  )
}

function Salsa({ color, semilla }: { color: string; semilla: number }) {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.9, 0.9, 0.016, 128, 1)
    const r = azar(semilla)
    const f = [r() * 6, r() * 6]
    return deformar(g, (v) => {
      const radio = Math.hypot(v.x, v.z)
      if (radio < 0.85) return
      const a = Math.atan2(v.z, v.x)
      const k = 1 + 0.06 * Math.sin(a * 5 + f[0]) + 0.03 * Math.sin(a * 13 + f[1])
      v.x *= k
      v.z *= k
    })
  }, [semilla])
  return (
    <mesh geometry={geo} position={[0, 0.008, 0]} receiveShadow>
      <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={0.8} clearcoatRoughness={0.2} />
    </mesh>
  )
}

function Lechuga() {
  const geo = useMemo(() => {
    const g = new THREE.RingGeometry(0.05, 1.12, 256, 16)
    g.rotateX(-Math.PI / 2)
    const colores: number[] = []
    const claro = new THREE.Color('#C9E08A')
    const oscuro = new THREE.Color('#4F8B2E')
    const c = new THREE.Color()
    deformar(g, (v) => {
      const radio = Math.hypot(v.x, v.z)
      const a = Math.atan2(v.z, v.x)
      const borde = Math.pow(radio / 1.12, 2)
      // Ondas del borde (lechuga crespa) y un poco de volumen hacia el centro
      v.y = borde * (0.045 * Math.sin(a * 14) + 0.015 * Math.sin(a * 31 + 1.3) - 0.025) + 0.03 * (1 - borde)
      const k = 1 + borde * (0.03 * Math.sin(a * 7) + 0.012 * Math.sin(a * 19))
      v.x *= k
      v.z *= k
    })
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const radio = Math.hypot(pos.getX(i), pos.getZ(i)) / 1.25
      c.copy(claro).lerp(oscuro, Math.pow(radio, 1.4))
      colores.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(colores, 3))
    return g
  }, [])
  return (
    <mesh geometry={geo} position={[0, 0.03, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial vertexColors roughness={0.45} clearcoat={0.4} sheen={0.5} sheenColor="#E8F5C0" side={THREE.DoubleSide} />
    </mesh>
  )
}

function rodajaTomate() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const x = c.getContext('2d')!
  x.fillStyle = '#B4261A'
  x.fillRect(0, 0, 512, 512)
  const g = x.createRadialGradient(256, 256, 30, 256, 256, 240)
  g.addColorStop(0, '#E9776A')
  g.addColorStop(0.75, '#D2412F')
  g.addColorStop(0.93, '#B42519')
  g.addColorStop(1, '#8E1B12')
  x.fillStyle = g
  x.beginPath()
  x.arc(256, 256, 250, 0, Math.PI * 2)
  x.fill()
  // Cavidades con gel y semillas
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2 + 0.4
    x.save()
    x.translate(256 + Math.cos(a) * 120, 256 + Math.sin(a) * 120)
    x.rotate(a)
    x.fillStyle = 'rgba(245,150,110,0.9)'
    x.beginPath()
    x.ellipse(0, 0, 78, 52, 0, 0, Math.PI * 2)
    x.fill()
    x.fillStyle = '#F2D29A'
    for (let s = 0; s < 7; s++) {
      x.beginPath()
      x.ellipse(-40 + s * 13, Math.sin(s) * 14, 7, 4, s, 0, Math.PI * 2)
      x.fill()
    }
    x.restore()
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 8
  return t
}

function Tomate() {
  const tex = useMemo(rodajaTomate, [])
  const geo = useMemo(() => new THREE.CylinderGeometry(0.36, 0.36, 0.07, 64), [])
  const mats = useMemo(
    () => [
      new THREE.MeshPhysicalMaterial({ color: '#B3241A', roughness: 0.25, clearcoat: 0.8 }),
      new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.15 }),
      new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.3 }),
    ],
    [tex],
  )
  return (
    <group position={[0, 0.035, 0]}>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + 0.5
        return <mesh key={i} geometry={geo} material={mats} position={[Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5]} rotation={[0, a, 0]} castShadow receiveShadow />
      })}
    </group>
  )
}

function Carne() {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(1.0, 1.02, 0.24, 128, 8)
    const r = azar(61)
    const f = [r() * 6, r() * 6, r() * 6]
    return deformar(g, (v) => {
      const a = Math.atan2(v.z, v.x)
      const rel = Math.abs(v.y) / 0.12
      // Bordes redondeados y superficie irregular de carne a la brasa
      const redondeo = 1 - 0.07 * Math.pow(rel, 4)
      const k = redondeo * (1 + 0.025 * Math.sin(a * 6 + f[0]) + 0.015 * Math.sin(a * 15 + f[1]) + 0.01 * Math.sin(v.y * 40 + a * 3))
      v.x *= k
      v.z *= k
      v.y += 0.012 * Math.sin(v.x * 11 + f[2]) * Math.sin(v.z * 9)
    })
  }, [])
  const mats = useMemo(() => {
    const t = manchas('carne', '#5B3421', '#3A2012', { escala: 12, contraste: 1.2, c: '#1E0F07', umbralC: 0.78, semilla: 17 })
    // El costado mide ~6,3 de ancho por 0,24 de alto: se usa solo una franja de la textura para no estirarla
    const lado = t.map.clone()
    const ladoRelieve = t.bumpMap.clone()
    lado.repeat.set(1, 0.04)
    ladoRelieve.repeat.set(1, 0.04)
    const comun = { roughness: 0.6, clearcoat: 0.3, clearcoatRoughness: 0.5, bumpScale: 1.2 }
    const tapa = new THREE.MeshPhysicalMaterial({ map: t.map, bumpMap: t.bumpMap, ...comun })
    return [new THREE.MeshPhysicalMaterial({ map: lado, bumpMap: ladoRelieve, ...comun }), tapa, tapa]
  }, [])
  return <mesh geometry={geo} material={mats} position={[0, 0.12, 0]} castShadow receiveShadow />
}

function Queso() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.8, 1.8, 60, 60)
    g.rotateX(-Math.PI / 2)
    g.rotateY(Math.PI / 4)
    return deformar(g, (v) => {
      const radio = Math.hypot(v.x, v.z)
      // Las puntas cuelgan por fuera de la carne, como queso derretido
      if (radio > 0.92) v.y -= Math.pow(radio - 0.92, 1.6) * 0.75
      v.y += 0.006 * Math.sin(v.x * 9) * Math.sin(v.z * 7)
    })
  }, [])
  return (
    <mesh geometry={geo} position={[0, 0.012, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial color="#F2AE36" roughness={0.3} clearcoat={0.6} clearcoatRoughness={0.3} sheen={0.5} sheenColor="#FFD98A" side={THREE.DoubleSide} />
    </mesh>
  )
}

function rayasTocineta() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const x = c.getContext('2d')!
  const r = azar(33)
  for (let y = 0; y < 128; y += 4) {
    const grasa = Math.sin(y / 9 + r()) > 0.35
    x.fillStyle = grasa ? '#E9C2A6' : ['#9E3A26', '#8A2E1E', '#B24A31'][Math.floor(r() * 3)]
    x.fillRect(0, y, 512, 4)
  }
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

function Tocineta() {
  const tex = useMemo(rayasTocineta, [])
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(1.7, 0.022, 0.24, 80, 1, 4)
    return deformar(g, (v) => {
      v.y += Math.sin(v.x * 9) * 0.035
      v.z += Math.sin(v.x * 3) * 0.03
    })
  }, [])
  return (
    <group position={[0, 0.04, 0]}>
      {[-0.32, 0, 0.32].map((z, i) => (
        <mesh key={i} geometry={geo} position={[0, i * 0.012, z]} rotation={[0, i * 0.35 - 0.3, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial map={tex} roughness={0.4} clearcoat={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Jamon() {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.88, 0.88, 0.02, 96)
    return deformar(g, (v) => {
      const a = Math.atan2(v.z, v.x)
      v.y += Math.pow(Math.hypot(v.x, v.z) / 0.88, 2) * 0.05 * Math.sin(a * 5)
    })
  }, [])
  return (
    <group position={[0, 0.02, 0]}>
      {[0, 1].map((i) => (
        <mesh key={i} geometry={geo} position={[0, i * 0.022, 0]} rotation={[0, i * 0.7, 0]} castShadow receiveShadow>
          <meshPhysicalMaterial color={i ? '#EDB0A8' : '#E39E95'} roughness={0.45} sheen={0.4} sheenColor="#FFE1DC" />
        </mesh>
      ))}
    </group>
  )
}

function Huevo() {
  const clara = useMemo(() => {
    const g = new THREE.CircleGeometry(0.9, 160, 0, Math.PI * 2)
    g.rotateX(-Math.PI / 2)
    const r = azar(71)
    const f = [r() * 6, r() * 6, r() * 6]
    deformar(g, (v) => {
      const radio = Math.hypot(v.x, v.z) / 0.9
      const a = Math.atan2(v.z, v.x)
      const k = 1 + 0.09 * Math.sin(a * 3 + f[0]) + 0.05 * Math.sin(a * 7 + f[1]) + 0.025 * Math.sin(a * 15 + f[2])
      v.x *= k
      v.z *= k
      // Clara abombada al centro y borde fino y ondulado
      v.y = 0.05 * (1 - Math.pow(radio, 3)) + 0.01 * Math.sin(v.x * 11) * Math.sin(v.z * 9) * radio
    })
    // Borde dorado y crocante, centro blanco
    const blanco = new THREE.Color('#FBF7EE')
    const dorado = new THREE.Color('#D79A45')
    const c = new THREE.Color()
    const pos = g.attributes.position
    const cols: number[] = []
    for (let i = 0; i < pos.count; i++) {
      const radio = Math.hypot(pos.getX(i), pos.getZ(i)) / 0.95
      c.copy(blanco).lerp(dorado, Math.max(0, (radio - 0.72) / 0.3))
      cols.push(c.r, c.g, c.b)
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3))
    return g
  }, [])
  const yema = useMemo(() => new THREE.SphereGeometry(0.34, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2).scale(1, 0.48, 1), [])
  return (
    <group position={[0, 0.025, 0]}>
      <mesh geometry={clara} castShadow receiveShadow>
        <meshPhysicalMaterial vertexColors roughness={0.28} clearcoat={0.6} side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={yema} position={[0.12, 0.024, -0.05]} castShadow>
        <meshPhysicalMaterial color="#F0A01C" roughness={0.15} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
    </group>
  )
}

function Cebolla() {
  const geo = useMemo(() => new THREE.TorusGeometry(0.22, 0.022, 10, 48).rotateX(Math.PI / 2), [])
  return (
    <group position={[0, 0.025, 0]}>
      {[[-0.35, 0.2], [0.3, 0.3], [0.05, -0.38], [0.45, -0.25], [-0.4, -0.3]].map(([x, z], i) => (
        <mesh key={i} geometry={geo} position={[x, i * 0.006, z]} scale={0.8 + (i % 3) * 0.15} castShadow>
          <meshPhysicalMaterial color="#F0E6EE" roughness={0.3} transmission={0.3} thickness={0.05} clearcoat={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function Papitas({ activo }: { activo: boolean }) {
  const geo = useMemo(() => new THREE.BoxGeometry(0.2, 0.022, 0.022), [])
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#E7B54A', roughness: 0.4, clearcoat: 0.5 }), [])
  const pts = useMemo<Punto[]>(() => {
    const r = azar(19)
    return girasol(90, 0.95, 4).map((v) => ({ x: v.x, y: 0.02 + r() * 0.04, z: v.y, ry: r() * Math.PI, rz: (r() - 0.5) * 0.3 }))
  }, [])
  return <Lluvia activo={activo} geometria={geo} material={mat} puntos={pts} altura={1.2} escalonado={0.5} rebote={false} />
}

type Def = { id: string; alto: number; nodo: ReactNode }

const ALTOS: Record<string, number> = {
  'salsa-casa': 0.016, ketchup: 0.016, mostaza: 0.016, lechuga: 0.09, tomate: 0.07, cebolla: 0.05,
  carne: 0.24, queso: 0.025, 'carne-extra': 0.24, tocineta: 0.08, jamon: 0.07, huevo: 0.1,
}

/** Alto total de la hamburguesa armada (para que la cámara la encuadre entera). */
export function altoHamburguesa(sel: Set<string>) {
  let y = 0.34 + 0.665
  for (const [id, alto] of Object.entries(ALTOS)) if (sel.has(id)) y += alto
  return y
}

export function Hamburguesa({ sel }: { sel: Set<string> }) {
  const capas: Def[] = [
    { id: 'salsa-casa', alto: ALTOS['salsa-casa'], nodo: <Salsa color="#E6A486" semilla={3} /> },
    { id: 'ketchup', alto: ALTOS['ketchup'], nodo: <Salsa color="#A82316" semilla={5} /> },
    { id: 'mostaza', alto: ALTOS['mostaza'], nodo: <Salsa color="#D89B17" semilla={9} /> },
    { id: 'lechuga', alto: ALTOS['lechuga'], nodo: <Lechuga /> },
    { id: 'tomate', alto: ALTOS['tomate'], nodo: <Tomate /> },
    { id: 'cebolla', alto: ALTOS['cebolla'], nodo: <Cebolla /> },
    { id: 'carne', alto: ALTOS['carne'], nodo: <Carne /> },
    { id: 'queso', alto: ALTOS['queso'], nodo: <Queso /> },
    { id: 'carne-extra', alto: ALTOS['carne-extra'], nodo: <Carne /> },
    { id: 'tocineta', alto: ALTOS['tocineta'], nodo: <Tocineta /> },
    { id: 'jamon', alto: ALTOS['jamon'], nodo: <Jamon /> },
    { id: 'huevo', alto: ALTOS['huevo'], nodo: <Huevo /> },
  ]
  let y = 0.34
  const destinos = capas.map((c) => {
    const base = y
    if (sel.has(c.id)) y += c.alto
    return base
  })
  const tope = y

  // Al cambiar algo, la tapa sube un momento para dejar caer la capa y luego cierra
  const tapa = useRef<THREE.Group>(null!)
  const ultimo = useRef(0)
  const clave = [...sel].sort().join(',')
  useEffect(() => {
    ultimo.current = performance.now()
  }, [clave])
  const yTapa = useRef(tope)
  useFrame((_, dt) => {
    const abierta = performance.now() - ultimo.current < 900 ? 1 : 0
    yTapa.current = THREE.MathUtils.damp(yTapa.current, tope + abierta * 1.1, abierta ? 10 : 5, dt)
    tapa.current.position.y = yTapa.current
  })

  return (
    <group position={[0, 0, 0]}>
      <PanAbajo />
      {capas.map((c, i) => (
        <Capa key={c.id} activo={sel.has(c.id)} y={destinos[i]}>
          {c.nodo}
        </Capa>
      ))}
      <group position={[0, tope, 0]}>
        <Papitas activo={sel.has('papitas')} />
      </group>
      <group ref={tapa}>
        <PanArriba />
      </group>
    </group>
  )
}
