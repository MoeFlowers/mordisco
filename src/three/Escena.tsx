import { ContactShadows, Environment, Lightformer, OrbitControls } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Suspense } from 'react'
import * as THREE from 'three'
import type { ProductoId } from '../data/menu'
import { altoHamburguesa, Hamburguesa } from './Hamburguesa'
import { Perro } from './Perro'
import { Pizza } from './Pizza'

const CAMARA: Record<ProductoId, { pos: [number, number, number]; mira: [number, number, number] }> = {
  hamburguesa: { pos: [0, 1.75, 5.4], mira: [0, 0.7, 0] },
  perro: { pos: [0.9, 3.1, 3.7], mira: [0, 0.45, 0] },
  pizza: { pos: [0, 2.9, 3.3], mira: [0, 0.05, 0] },
}

/**
 * Encuadre: aleja o acerca la cámara (sin cambiar el ángulo que eligió el usuario) para que el
 * producto quepa entero según el alto de lo armado y la proporción del espacio.
 */
function Encuadre({ producto, sel }: { producto: ProductoId; sel: Set<string> }) {
  const { camera, size, controls } = useThree() as unknown as { camera: THREE.PerspectiveCamera; size: { width: number; height: number }; controls: { target: THREE.Vector3; update: () => void } | null }
  const dir = new THREE.Vector3()
  useFrame((_, dt) => {
    if (!controls) return
    let ancho = 2.5
    let alto = 0.45
    if (producto === 'hamburguesa') {
      ancho = 2.4
      alto = altoHamburguesa(sel)
    } else if (producto === 'perro') {
      ancho = 2.6
      alto = 1.0
    }
    const centroY = producto === 'pizza' ? 0.08 : alto / 2
    const vfov = THREE.MathUtils.degToRad(camera.fov)
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * (size.width / size.height))
    const radio = 0.5 * Math.hypot(ancho, alto)
    const distancia = (radio / Math.sin(Math.min(vfov, hfov) / 2)) * 0.98
    controls.target.y = THREE.MathUtils.damp(controls.target.y, centroY, 4, dt)
    dir.subVectors(camera.position, controls.target)
    dir.setLength(THREE.MathUtils.damp(dir.length(), distancia, 4, dt))
    camera.position.copy(controls.target).add(dir)
    controls.update()
  })
  return null
}

function Luces() {
  return (
    <>
      {/* Estudio de foto de comida: luz principal cálida, contraluz para el brillo y relleno suave */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3.2} color="#FFE2BE" position={[-3, 3, 2]} scale={[4, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={2.4} color="#FFF4E6" position={[3, 2.5, -3]} scale={[3, 2, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.2} color="#FFD7A8" position={[0, 5, 0]} scale={3} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#B9C6D6" position={[4, 0.5, 3]} scale={[2, 1, 1]} target={[0, 0, 0]} />
      </Environment>
      <directionalLight
        position={[-2.5, 4.5, 2.5]}
        intensity={1.6}
        color="#FFE6C8"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
      />
    </>
  )
}

export function Escena({
  producto,
  sel,
  rotar = true,
  arrastrar = true,
}: {
  producto: ProductoId
  sel: Set<string>
  rotar?: boolean
  arrastrar?: boolean
}) {
  const c = CAMARA[producto]
  return (
    <Canvas
      key={producto}
      shadows
      dpr={[1, 2]}
      camera={{ position: c.pos, fov: 32, near: 0.1, far: 50 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
      onCreated={({ camera }) => camera.lookAt(...c.mira)}
    >
      <Suspense fallback={null}>
        <Luces />
        {producto === 'pizza' && <Pizza sel={sel} />}
        {producto === 'hamburguesa' && <Hamburguesa sel={sel} />}
        {producto === 'perro' && <Perro sel={sel} />}
        <ContactShadows position={[0, -0.002, 0]} opacity={0.65} scale={6} blur={2.6} far={2.5} resolution={1024} color="#000000" />
      </Suspense>
      <Encuadre producto={producto} sel={sel} />
      <OrbitControls
        makeDefault
        target={c.mira}
        enabled={arrastrar}
        enablePan={false}
        enableZoom={false}
        autoRotate={rotar}
        autoRotateSpeed={0.9}
        minPolarAngle={Math.PI * 0.18}
        maxPolarAngle={Math.PI * 0.46}
        enableDamping
      />
    </Canvas>
  )
}
