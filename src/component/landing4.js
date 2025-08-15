import React, { Suspense, useRef, useState, useEffect, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

/*
  LandingPage.jsx
  - One-file landing page component using React 18, Tailwind CSS, Framer Motion and Three.js (@react-three/fiber + drei)
  - Theme: dark, minimal green & red gradients, glowing accents, responsive, gesture-driven 3D
  - No navbar/footer (as requested)

  Drop this file into your React app (e.g. src/components/LandingPage.jsx) and import it into a page.
  Make sure Tailwind CSS is already set up and your project has these deps (versions you provided are compatible).
*/

// ---------------------
// 3D Helpers & Objects
// ---------------------

// A gentle wavy curve used to create a "ribbon" TubeGeometry
class WavyCurve extends THREE.Curve {
  constructor(scale = 1) {
    super();
    this.scale = scale;
  }
  getPoint(t) {
    const x = (t - 0.5) * 6;
    const y = Math.sin(t * Math.PI * 3) * 0.25;
    const z = Math.cos(t * Math.PI * 2) * 0.2;
    return new THREE.Vector3(x * this.scale, y * this.scale, z * this.scale);
  }
}

function FilmReel({ color = new THREE.Color("#00ff77"), hover = false }) {
  const ref = useRef();
  useFrame((state, delta) => {
    ref.current.rotation.y += 0.2 * delta;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime / 3) * 0.1;
  });

  return (
    <group ref={ref} scale={[0.9, 0.9, 0.9]}>
      <mesh>
        <torusKnotGeometry args={[1, 0.25, 160, 24, 2, 3]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.9}
          metalness={0.6}
          roughness={0.2}
        />
      </mesh>

      {/* inner ring */}
      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[0.35, 0.55, 64]} />
        <meshStandardMaterial
          color={new THREE.Color("#0b0b0b")}
          emissive={color}
          emissiveIntensity={0.06}
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
    </group>
  );
}

function Ribbon({ color = new THREE.Color("#ff3b3b") }) {
  const mesh = useRef();
  const curve = useMemo(() => new WavyCurve(0.9), []);
  useFrame((state) => {
    mesh.current.rotation.z = Math.sin(state.clock.elapsedTime / 2) * 0.1;
    mesh.current.rotation.x = Math.cos(state.clock.elapsedTime / 3) * 0.06;
  });

  return (
    <group ref={mesh} position={[0, -0.6, 0]} scale={[0.9, 0.9, 0.9]}>
      <mesh>
        <tubeGeometry args={[curve, 120, 0.08, 8, false]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          metalness={0.2}
          roughness={0.3}
        />
      </mesh>
    </group>
  );
}

// A small manager that orients the 3D group based on pointer/touch gestures
function InteractiveGroup({ children, sensitivity = 0.6 }) {
  const group = useRef();
  const { size, camera } = useThree();
  const [target, setTarget] = useState([0, 0]);

  useFrame((state, delta) => {
    if (!group.current) return;
    // smooth lerp to target
    group.current.rotation.x += (target[1] - group.current.rotation.x) * 2 * delta;
    group.current.rotation.y += (target[0] - group.current.rotation.y) * 2 * delta;
  });

  useEffect(() => {
    function onMove(e) {
      const x = (e.clientX ?? e.touches?.[0]?.clientX ?? size.width / 2) / size.width;
      const y = (e.clientY ?? e.touches?.[0]?.clientY ?? size.height / 2) / size.height;
      const nx = (x - 0.5) * Math.PI * sensitivity;
      const ny = (y - 0.5) * Math.PI * -sensitivity;
      setTarget([nx, ny]);
    }

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, [size, sensitivity]);

  return <group ref={group}>{children}</group>;
}

// ---------------------
// React UI Component
// ---------------------

export default function LandingPage() {
  // small state for toggling which accent is active (green or red) — we'll default to green for hero
  const [accent, setAccent] = useState("green");

  // quick helper to return gradient classes
  const gradient = (tone) =>
    tone === "green"
      ? "bg-gradient-to-br from-green-500 to-green-700"
      : "bg-gradient-to-br from-red-600 to-red-800";

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden relative">
      {/* subtle background grid layers: one green, one red, both very faint and offset to never fully overlap */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ mixBlendMode: "screen" }}
      >
        <div className="absolute inset-0 opacity-6 bg-[radial-gradient(ellipse_at_top_left,_rgba(0,255,120,0.03),transparent_25%),radial-gradient(ellipse_at_bottom_right,_rgba(255,60,60,0.02),transparent_30%)]" />

        {/* textured lines grid (green) */}
        <div className="absolute inset-0 " style={{ backgroundImage: `linear-gradient(90deg, rgba(0,255,120,0.02) 1px, transparent 1px), linear-gradient(rgba(0,255,120,0.02) 1px, transparent 1px)` , backgroundSize: '24px 24px'}} />

        {/* faint red grid, offset */}
        <div className="absolute inset-0 transform translate-x-6 translate-y-12" style={{ backgroundImage: `linear-gradient(90deg, rgba(255,60,60,0.01) 1px, transparent 1px), linear-gradient(rgba(255,60,60,0.01) 1px, transparent 1px)` , backgroundSize: '36px 36px'}} />
      </div>

      {/* HERO */}
      <section className="relative min-h-[80vh] flex flex-col md:flex-row items-center justify-center px-6 py-16">
        <div className="z-10 max-w-2xl md:flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-extrabold leading-tight"
          >
            So <span className="bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-green-600">Filmy</span>
            <span className="ml-3 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Club</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-gray-300 text-lg md:text-xl max-w-xl"
          >
            A cinephile playground — follow fellow critics & normies, post structured reviews, create watchlists,
            join communities, and discover films by mood. Minimal neon, maximum vibes.
          </motion.p>

          <div className="mt-8 flex gap-4">
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 6px 28px rgba(0,255,120,0.12)" }}
              onClick={() => setAccent("green")}
              className={`px-6 py-2 rounded-full font-semibold ${gradient("green")} text-black`}
            >
              Join the Watchparty
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.04, boxShadow: "0 6px 28px rgba(255,60,60,0.12)" }}
              onClick={() => setAccent("red")}
              className={`px-6 py-2 rounded-full font-semibold ${gradient("red")} text-black`}
            >
              Start a Community
            </motion.button>
          </div>

          <div className="mt-6 text-sm text-gray-500 max-w-md">
            <strong className="text-gray-200">Spoiler tags</strong> • {" "}
            <span className="px-2 py-1 rounded-md text-xs bg-gray-800 border border-gray-700">Spoiler-free</span>
            <span className="ml-2 px-2 py-1 rounded-md text-xs bg-gray-800 border border-gray-700">Sarcastic</span>
            <span className="ml-2 px-2 py-1 rounded-md text-xs bg-gray-800 border border-gray-700">Deep analysis</span>
          </div>
        </div>

        {/* 3D canvas column */}
        <div className="w-full md:w-1/2 h-[420px] md:h-[520px] mt-12 md:mt-0 md:flex-1 z-10">
          <Canvas
            camera={{ position: [0, 0, 6], fov: 50 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ambientLight intensity={0.25} />
            <pointLight position={[4, 4, 6]} intensity={0.7} />
            <pointLight position={[-6, -3, -4]} intensity={0.3} />

            <Suspense fallback={null}>
              <InteractiveGroup>
                <Float speed={1.8} rotationIntensity={0.6} floatIntensity={1}>
                  {/* switch accent color */}
                  {accent === "green" ? (
                    <group>
                      <FilmReel color={new THREE.Color("#00ff88")} />
                      <Ribbon color={new THREE.Color("#00ff88")} />
                    </group>
                  ) : (
                    <group>
                      <FilmReel color={new THREE.Color("#ff6b6b")} />
                      <Ribbon color={new THREE.Color("#ff6b6b")} />
                    </group>
                  )}
                </Float>
              </InteractiveGroup>
            </Suspense>

            <mesh position={[0, -2.6, -2]}>
              <planeGeometry args={[12, 6]} />
              <meshStandardMaterial color="#000000" transparent opacity={0.0} />
            </mesh>

            {/* Keep controls disabled so touch/mouse gesture handling remains smooth */}
          </Canvas>
        </div>
      </section>

      {/* FEATURES — scroll-triggered cards */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold"
          >
            Built for every kind of cinephile
          </motion.h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Structured Analysis Templates",
                body:
                  "Start with pre-built templates — intro, context, themes, technical notes, and final verdict. Attach images and timestamps.",
                accent: "green",
              },
              {
                title: "Mood-based Recs",
                body: "Create & receive recommendations based on mood tags (e.g., ‘melancholic rain’, ‘feel-good brunch’).",
                accent: "red",
              },
              {
                title: "Watchlists & Diaries",
                body: "Keep a public or private watchlist, add notes per watch, and maintain a chronological diary.",
                accent: "green",
              },
            ].map((f, i) => (
              <motion.article
                key={i}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="p-6 rounded-2xl bg-[#0b0b0b] border border-gray-800 shadow-md"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{f.title}</h3>
                  <div className={`px-3 py-1 rounded-full text-xs text-black ${f.accent === "green" ? "bg-green-400" : "bg-red-500"}`}>
                    {f.accent === "green" ? "Green" : "Red"}
                  </div>
                </div>
                <p className="mt-3 text-gray-300">{f.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

    
      {/* CTA BANNER */}
      <section className="py-12 px-6">
        <div className="max-w-4xl mx-auto rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between bg-gradient-to-r from-[#050505] to-[#0b0b0b] border border-gray-800">
          <div>
            <h4 className="text-xl font-bold">Ready to start your cinephile journey?</h4>
            <p className="text-gray-400 mt-2">Create a profile, publish a review, or just lurk — we won’t tell.</p>
          </div>

          <div className="mt-6 md:mt-0 flex gap-4">
            <motion.button whileHover={{ scale: 1.03 }} className="px-5 py-2 rounded-full bg-white text-black font-semibold">
              Get Started
            </motion.button>
            <motion.button whileHover={{ scale: 1.03 }} className="px-5 py-2 rounded-full border border-gray-700 text-gray-200">
              Explore Picks
            </motion.button>
          </div>
        </div>
      </section>

      {/* small footer-like note (not a real footer) */}
      <div className="text-center text-xs text-gray-600 py-6">Made with 🎬 · Minimal neon accents · No nav or footer as requested</div>
    </div>
  );
}
