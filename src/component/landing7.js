import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion } from 'framer-motion';
import * as THREE from 'three';


function FilmStrip() {
  const mesh = useRef();
  useFrame(({ clock }) => {
    mesh.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2;
    mesh.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
  });
  return (
    <mesh ref={mesh}>
      <planeGeometry args={[4, 1.5, 32, 32]} />
      <meshStandardMaterial color="#00ff66" transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  );
}

function Particles({ count }) {
  const mesh = useRef();
  const [positions] = useState(() =>
    new Float32Array(Array.from({ length: count * 3 }, () => (Math.random() - 0.5) * 10))
  );
  useFrame(() => {
    mesh.current.rotation.y += 0.0005;
  });
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#ff3366" size={0.02} />
    </points>
  );
}

function Scene({ lowPerf }) {
  return (
    <>
      <color attach="background" args={["#000"]} />
      <ambientLight intensity={0.5} />
      <spotLight position={[0, 5, 5]} intensity={1.5} color="#00ff66" />
      <spotLight position={[-5, 5, -5]} intensity={1} color="#ff3366" />
      <FilmStrip />
      {!lowPerf && <Particles count={200} />}
      <OrbitControls enableZoom={false} />
    </>
  );
}

export default function SoFilmyLanding7() {
  const [lowPerf, setLowPerf] = useState(false);
  useEffect(() => {
    if (navigator.deviceMemory && navigator.deviceMemory <= 2) {
      setLowPerf(true);
    }
  }, []);

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.2 } }),
  };

  const features = [
    { title: 'Join Cinephile Clubs', desc: 'Connect with like-minded film lovers.' },
    { title: 'Structured Reviews', desc: 'Write like a pro with built-in templates.' },
    { title: 'Mood-Based Recs', desc: 'Get suggestions based on vibe, not just genre.' },
  ];

  return (
    <div className="w-full h-full bg-black text-white overflow-x-hidden">
      <div className="h-screen w-full">
        <Canvas>
          <Scene lowPerf={lowPerf} />
        </Canvas>
        <motion.h1
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ duration: 1 }}
          className="absolute top-10 left-1/2 -translate-x-1/2 text-5xl font-bold text-green-400"
        >
          So Filmy 🎬
        </motion.h1>
      </div>

      <div className="py-20 px-5 grid gap-10 md:grid-cols-3">
        {features.map((f, i) => (
          <motion.div
            key={i}
            custom={i}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={cardVariants}
            className="p-5 rounded-xl bg-gradient-to-br from-green-900 to-black border border-green-500"
          >
            <h2 className="text-2xl font-bold mb-2 text-green-400">{f.title}</h2>
            <p className="text-gray-300">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
