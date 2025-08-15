import React, { useRef, useState, useEffect,Suspense ,useMemo} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, OrbitControls,Text,useGLTF } from "@react-three/drei";
import { motion } from "framer-motion";
import { EffectComposer, Bloom, Noise, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";


// ---------- Film Reel ----------

function FilmReel({ position, color }) {
  const mesh = useRef();

  useFrame(({ clock }) => {
    if (!mesh.current) return; // mesh not yet mounted
    mesh.current.rotation.y = clock.getElapsedTime() * 0.3;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={mesh} position={position}>
        {/* create geometry once so it's never undefined */}
        <cylinderGeometry args={[1, 1, 0.3, 32]} attach="geometry" />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
          attach="material"
        />
      </mesh>
    </Float>
  );
}

// ---------- Clapperboard ----------
function Clapper({ position, color }) {
  const mesh = useRef();
  useFrame((state) => {
  const meshRef = mesh.current;
  if (!meshRef) return;

  const geom = meshRef.geometry;
  if (!geom) return;

  const posAttr = geom.attributes?.position;
  if (!posAttr?.array) return; // <- 🔒 ultimate guard

  const positions = posAttr.array;
  const time = state.clock.getElapsedTime();

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    positions[i + 2] = Math.sin(time * 2 + x * 2) * 0.2;
  }
  posAttr.needsUpdate = true;
});

  return (
    <Float speed={2} rotationIntensity={0.5}>
      <mesh ref={mesh} position={position}>
        <boxGeometry args={[1.5, 1, 0.1]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
    </Float>
  );
}

// ---------- Ticket ----------
function Ticket({ position, color }) {
  const mesh = useRef();
useFrame((state) => {
  const meshRef = mesh.current;
  if (!meshRef) return;

  const geom = meshRef.geometry;
  if (!geom) return;

  const posAttr = geom.attributes?.position;
  if (!posAttr?.array) return; // <- 🔒 ultimate guard

  const positions = posAttr.array;
  const time = state.clock.getElapsedTime();

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    positions[i + 2] = Math.sin(time * 2 + x * 2) * 0.2;
  }
  posAttr.needsUpdate = true;
});

  return (
    <Float speed={1.5}>
      <mesh ref={mesh} position={position}>
        <boxGeometry args={[2, 1, 0.05]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
    </Float>
  );
}

// ---------- Realistic Film Strip ----------
function FilmStrip({ position, color }) {
  const mesh = useRef();
  const clockRef = useRef(0);
  const positionArrayRef = useRef(null);

  const createFilmTexture = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext("2d");

    // Transparent base
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Film base
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Frames
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    for (let i = 0; i < 8; i++) {
      ctx.fillRect(i * 64 + 4, 4, 56, 120);
    }

    // Sprocket holes
    ctx.clearRect(0, 16, 16, 32);
    ctx.clearRect(0, 80, 16, 32);
    ctx.clearRect(496, 16, 16, 32);
    ctx.clearRect(496, 80, 16, 32);
    for (let i = 0; i < 8; i++) {
      ctx.clearRect(i * 64 + 4, 16, 12, 32);
      ctx.clearRect(i * 64 + 4, 80, 12, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 1);
    return texture;
  };

  const texture = useMemo(() => createFilmTexture(), []);

  useFrame((state) => {
    // If we haven’t grabbed the array yet, try now
    if (!positionArrayRef.current && mesh.current?.geometry?.attributes?.position) {
      positionArrayRef.current = mesh.current.geometry.attributes.position.array;
    }

    // If still no array, skip this frame
    if (!positionArrayRef.current) return;

    clockRef.current += state.clock.getDelta();
    const time = clockRef.current;
    const positions = positionArrayRef.current;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      positions[i + 2] = Math.sin(time * 2 + x * 2) * 0.2;
    }

    mesh.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Float speed={1.5}>
      <mesh ref={mesh} position={position}>
        <planeGeometry args={[4, 1, 20, 1]} />
        <meshStandardMaterial
          map={texture}
          transparent
          side={THREE.DoubleSide}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>
    </Float>
  );
}


// ---------- Projector Dust ----------
function ProjectorDust() {
  const particles = useRef();
  useEffect(() => {
    const geometry = new THREE.BufferGeometry();
    const count = 500;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 2] = Math.random() * -2;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    particles.current.geometry = geometry;
  }, []);
  useFrame((state) => {
  if (!particles.current?.geometry?.attributes?.position?.array) return;

  const positions = particles.current.geometry.attributes.position.array;
  const time = state.clock.getElapsedTime();

  for (let i = 0; i < positions.length; i += 3) {
    const x = positions[i];
    positions[i + 2] += Math.sin(time * 2 + x * 2) * 0.002; // small subtle motion
  }

  particles.current.geometry.attributes.position.needsUpdate = true;
});


 
  return (
    <points ref={particles}>
      <bufferGeometry />
      <pointsMaterial size={0.02} color={"white"} transparent opacity={0.4} />
    </points>
  );
}
// ---------- 3d title ----------
function Title3D() {
  const group = useRef();

  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.2;
      group.current.rotation.x =
        Math.cos(clock.getElapsedTime() * 0.4) * 0.05 - 0.1;
    }
  });

  return (
    <group ref={group} position={[0, 0.9, 0]}>
      {/* "...SO" in red glow */}
      <Text
        font="/fonts/helvetiker_regular.typeface.json"
        fontSize={0.7}
        color="#ff003c"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#ff003c"
      >
        ...So
      </Text>

      {/* Offset "FILMY" slightly to the right */}
      <Text
       font="/fonts/helvetiker_regular.typeface.json"
        fontSize={0.7}
        position={[1.8, 0, 0]} // adjust spacing as needed
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#00ff88" // greenish glow
      >
        Filmy
      </Text>
    </group>
  );
}
// ----- 3D ELEMENTS -----
function FilmReelcircle(props) {
  const group = useRef();
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.2;
  });
  return (
    <group ref={group} {...props}>
      {/* Outer rim */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[1.2, 0.12, 16, 48]} />
        <meshStandardMaterial metalness={0.7} roughness={0.25} color="#d1d5db" />
      </mesh>
      {/* Inner rim */}
      <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
      >
        <cylinderGeometry args={[1, 1, 0.12, 48]} />
        <meshStandardMaterial metalness={0.6} roughness={0.35} color="#9ca3af" />
      </mesh>
      {/* Spokes & holes */}
      {Array.from({ length: 6 }).map((_, i) => {
        const a = (i / 6) * Math.PI * 2;
        const x = Math.cos(a) * 0.65;
        const y = Math.sin(a) * 0.65;
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.14, 24]} />
            <meshStandardMaterial metalness={0.3} roughness={0.6} color="#111827" />
          </mesh>
        );
      })}
      {/* Center hub */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.2, 24]} />
        <meshStandardMaterial color="#e5e7eb" metalness={0.7} roughness={0.3} />
      </mesh>
    </group>
  );
}

function FilmCameraModel(props) {
  // Replace the src below with your hosted GLB path, e.g. "/models/filmclapper.glb"
  const { scene } = useGLTF("/models/filmclapper.glb", true);
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.3;
    ref.current.position.y = Math.sin(t * 0.8) * 0.06;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
  <group ref={ref}>
    <primitive object={scene} {...props} />
  </group>
</Float>

  );
}

useGLTF.preload && useGLTF.preload("/models/filmclapper.glb");
// ---------- Main Component ----------
export default function SoFilmyHero() {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    if (window.innerWidth > 768) {
      setPointer({
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: -(e.clientY / window.innerHeight - 0.5) * 2,
      });
    }
  };

  useEffect(() => {
    const handleOrientation = (event) => {
      if (window.innerWidth <= 768) {
        const tiltX = event.gamma / 45;
        const tiltY = event.beta / 45;
        setPointer({ x: tiltX, y: -tiltY });
      }
    };
    window.addEventListener("deviceorientation", handleOrientation, true);
    return () => window.removeEventListener("deviceorientation", handleOrientation);
  }, []);

  return (
  
    <div className="sticky w-full h-full bg-black text-white  ">
      <section
        className="relative h-screen flex flex-col items-center justify-center"
        onMouseMove={handleMouseMove}
      >
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,136,0.1),transparent)]"></div>
        </div>

        <Canvas camera={{ position: [0, 0, 7], fov: 50 }}>
           
          <ambientLight intensity={0.3} />
          <spotLight
            position={[0, 0, 10]}
            angle={0.4}
            penumbra={1}
            intensity={1.5}
            color={"white"}
            castShadow
          />
          <pointLight position={[5, 5, 5]} color={"#ff003c"} intensity={1.2} />
          <pointLight position={[-5, -5, -5]} color={"#00ff88"} intensity={1.2} />

          <ProjectorDust />
<Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial color="hotpink" /></mesh>}>
          <FilmReel position={[pointer.x * 2, pointer.y * 2, 1]} color="#ff003c" />
          <FilmReelcircle position={[0, 0, -5]} scale={1} />
          <FilmCameraModel position={[0, -1.5, 3]} scale={0.5} />
          <Clapper position={[-2 + pointer.x, 1 + pointer.y, -3]} color="#00ff88" />
          <Ticket position={[2 + pointer.x, -1.5 + pointer.y, 1]} color="#ff003c" />
          <FilmStrip position={[0, 2, -1]} color="#00ff88" />
          <Title3D />
          <OrbitControls enableZoom={false} enablePan={false} />
          <EffectComposer>
            <Bloom luminanceThreshold={0} luminanceSmoothing={0.9} intensity={1.2} />
            <Noise opacity={0.15} />
            <Vignette eskil={false} offset={0.1} darkness={1.1} />
          </EffectComposer>
          </Suspense>
        </Canvas>

       
      </section>
   
      </div>
    
  );
}
