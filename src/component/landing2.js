// SoFilmyLandingPage.jsx
// React 18 compatible, using: framer-motion ^12, @react-three/fiber ^8.13.7, @react-three/drei ^9.56.3, @react-three/postprocessing ^2.15.10
// TailwindCSS required in the project. No external 3D assets used.

import React, { useMemo, useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { motion, useScroll, useTransform, useMotionValue, useSpring } from "framer-motion";

// ----------------------
// 3D: Gesture Store
// ----------------------
function useGestureStore() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const vx = useMotionValue(0);
  const vy = useMotionValue(0);
  // Add a light spring for smoothness
  const sx = useSpring(x, { stiffness: 80, damping: 20 });
  const sy = useSpring(y, { stiffness: 80, damping: 20 });
  return { x: sx, y: sy, vx, vy, rawX: x, rawY: y };
}

// Normalize pointer/touch to [-1,1]
function pointerToNorm(e, el) {
  const rect = el.getBoundingClientRect();
  const px = (e.clientX - rect.left) / rect.width;
  const py = (e.clientY - rect.top) / rect.height;
  return { x: px * 2 - 1, y: -(py * 2 - 1) };
}

// ----------------------
// 3D: Custom Film Reel
// ----------------------
function FilmReel({ gesture, color = "#ef4444" }) {
  const group = useRef();

  // Prebuild geometry: disc with holes like a reel
  const geom = useMemo(() => {
    const group = new THREE.Group();
    const main = new THREE.CylinderGeometry(1.1, 1.1, 0.24, 64);
    const center = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 32);

    // Six circular cutouts (fake with black cylinders slightly inset)
    const holes = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const r = 0.6;
      const cyl = new THREE.CylinderGeometry(0.18, 0.18, 0.26, 32);
      cyl.translate(Math.cos(angle) * r, 0, Math.sin(angle) * r);
      holes.push(cyl);
    }

    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.6, roughness: 0.3 });
    const matDark = new THREE.MeshStandardMaterial({ color: "#111" });

    const mainMesh = new THREE.Mesh(main, mat);
    const centerMesh = new THREE.Mesh(center, matDark);
    centerMesh.rotation.x = Math.PI / 2;

    const g = new THREE.Group();
    g.add(mainMesh);
    const holeGroup = new THREE.Group();
    holes.forEach((h) => holeGroup.add(new THREE.Mesh(h, matDark)));
    g.add(holeGroup);
    g.add(centerMesh);

    return g;
  }, [color]);

  useEffect(() => {
    if (geom && group.current) {
      // attach
      group.current.add(geom);
    }
    return () => {
      if (geom && group.current) {
        group.current.remove(geom);
      }
    };
  }, [geom]);

  useFrame((state, dt) => {
    if (!group.current) return;
    const gx = gesture?.y?.get() ?? 0;
    const gy = gesture?.x?.get() ?? 0;
    // Rotate according to gesture, plus a gentle spin
    group.current.rotation.x = gx * 0.6 + Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    group.current.rotation.y = gy * 0.6 + Math.cos(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return <group ref={group} />;
}

// ----------------------
// 3D: Clapper Board (simple)
// ----------------------
function Clapper({ gesture, color = "#16a34a" }) {
  const grp = useRef();
  const board = useMemo(() => {
    const g = new THREE.Group();
    // Base rectangle
    const base = new THREE.BoxGeometry(1.6, 1, 0.12);
    const arm = new THREE.BoxGeometry(1.6, 0.25, 0.12);
    const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.3, roughness: 0.5 });
    const baseMesh = new THREE.Mesh(base, mat);
    const armMesh = new THREE.Mesh(arm, mat);
    baseMesh.position.set(0, -0.2, 0);
    armMesh.position.set(0, 0.6, 0);

    // Diagonal stripes (basic) as thin boxes
    for (let i = -3; i <= 3; i++) {
      const stripe = new THREE.BoxGeometry(0.2, 0.02, 0.13);
      const stripeMesh = new THREE.Mesh(stripe, new THREE.MeshStandardMaterial({ color: "#0b0b0b" }));
      stripeMesh.position.set(i * 0.25, 0.6, 0.07);
      stripeMesh.rotation.z = Math.PI / 6;
      g.add(stripeMesh);
    }

    g.add(baseMesh);
    g.add(armMesh);
    return g;
  }, [color]);

  useEffect(() => {
    if (grp.current) grp.current.add(board);
    return () => {
      if (grp.current) grp.current.remove(board);
    };
  }, [board]);

  useFrame((state) => {
    if (!grp.current) return;
    const gx = gesture?.y?.get() ?? 0;
    const gy = gesture?.x?.get() ?? 0;
    grp.current.rotation.x = gx * 0.5;
    grp.current.rotation.y = gy * 0.5;
    grp.current.position.y = Math.sin(state.clock.elapsedTime * 1.2) * 0.1;
  });

  return <group ref={grp} position={[2, 0.1, 0]} />;
}

// ----------------------
// 3D: Popcorn Particles
// ----------------------
function PopcornField({ color = "#ffd29d" }) {
  const ref = useRef();
  const { positions, scales } = useMemo(() => {
    const positions = new Float32Array(300 * 3);
    const scales = new Float32Array(300);
    for (let i = 0; i < 300; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = Math.random() * 2 - 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      scales[i] = Math.random() * 0.08 + 0.02;
    }
    return { positions, scales };
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    const arr = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < arr.length; i += 3) {
      arr[i + 1] += Math.sin(t + i) * 0.0006; // float gently
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.06} color={color} sizeAttenuation depthWrite={false} />
    </points>
  );
}

// ----------------------
// Scene Wrapper with gesture handlers
// ----------------------
function HeroScene({ gesture }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerMove = (e) => {
      const n = pointerToNorm(e, el);
      gesture.rawX.set(n.x);
      gesture.rawY.set(n.y);
    };
    const onTouchMove = (e) => {
      if (!e.touches || !e.touches[0]) return;
      const touch = e.touches[0];
      const fake = { clientX: touch.clientX, clientY: touch.clientY };
      const n = pointerToNorm(fake, el);
      gesture.rawX.set(n.x);
      gesture.rawY.set(n.y);
    };

    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [gesture]);

  return (
    <div ref={containerRef} className="relative h-[380px] sm:h-[460px] md:h-[520px] lg:h-[620px] w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} dpr={[1, 2]}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} />
        <Suspense fallback={null}>
          <group>
            <FilmReel gesture={gesture} color="#ef4444" />
            <Clapper gesture={gesture} color="#16a34a" />
            <PopcornField />
          </group>
        </Suspense>
        <EffectComposer>
          <Bloom mipmapBlur intensity={0.6} luminanceThreshold={0.2} luminanceSmoothing={0.8} />
        </EffectComposer>
        {/* Keep OrbitControls minimal; gestures already control rotation feel */}
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
      </Canvas>
    </div>
  );
}

// ----------------------
// UI Bits
// ----------------------
const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
};

function FeatureCard({ title, desc, tone, index }) {
  const isGreen = tone === "green";
  return (
    <motion.div
      className={`rounded-2xl p-5 md:p-6 shadow-xl border transition-transform ${
        isGreen
          ? "bg-gradient-to-b from-green-300 to-green-100 text-green-900 border-green-200"
          : "bg-gradient-to-b from-red-300 to-red-100 text-red-900 border-red-200"
      }`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.5 }}
    >
      <h4 className="text-lg md:text-xl font-extrabold mb-2">{title}</h4>
      <p className="text-sm md:text-base opacity-80 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

const StickyHeader = () => {
  return (
    <motion.header
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg bg-black/30"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 60 }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-300">So Filmy</h1>
        <nav className="space-x-6 text-sm md:text-base">
          <a href="#features" className="hover:text-green-400">Features</a>
          <a href="#community" className="hover:text-red-400">Community</a>
          <a href="#join" className="hover:text-green-400">Join</a>
        </nav>
      </div>
    </motion.header>
  );
};

// ----------------------
// Main Page
// ----------------------
export default function SoFilmyLandingPage2() {
  const gesture = useGestureStore();

  return (
    <div id="top" className="min-h-screen w-full text-white bg-black overflow-x-hidden">
      <StickyHeader />

      {/* HERO — Green gradient only */}
      <section className="pt-20 md:pt-28 bg-gradient-to-b from-green-950 via-green-900 to-green-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight"
              >
                So Filmy
                <span className="block text-lg sm:text-xl font-normal text-green-300 mt-3">
                  A Cinephile Club for people who like talking about movies more than sleeping.
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="mt-6 flex flex-col sm:flex-row gap-3"
              >
                <a className="px-6 py-3 rounded-full font-bold text-black bg-gradient-to-r from-green-500 to-green-300 hover:scale-[1.02] active:scale-[0.98] transition-transform" href="#features">
                  Join the Club
                </a>
                <a className="px-6 py-3 rounded-full font-bold text-black bg-gradient-to-r from-green-600 to-green-400 hover:scale-[1.02] active:scale-[0.98] transition-transform" href="#demo">
                  Watch Demo
                </a>
              </motion.div>
            </div>

            {/* 3D Hero Scene */}
            <div>
              <HeroScene gesture={gesture} />
              <p className="text-xs text-green-200/80 mt-2">Move your mouse or swipe to play with the reel & clapper.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features — Red gradient only */}
      <section id="features" className="py-16 md:py-20 bg-gradient-to-b from-red-900 via-red-800 to-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h2 {...fadeUp} className="text-3xl md:text-4xl font-extrabold mb-10">
            Everything a cinephile pretends they don’t need but actually does
          </motion.h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              index={0}
              tone="green"
              title="Mood-based Recommendations"
              desc="Beyond genre—get recs that match your vibe: cozy Sunday, brain-melt, or ‘I need to cry’ night."
            />
            <FeatureCard
              index={1}
              tone="red"
              title="Structured Review Templates"
              desc="Be a critic without the cape. Inbuilt templates guide plot, themes, cinematography, and stills."
            />
            <FeatureCard
              index={2}
              tone="green"
              title="Spoiler & Tone Filters"
              desc="Read comfortably: spoiler-free, sarcastic, long-form, hot takes—clearly labeled and separated."
            />
            <FeatureCard
              index={3}
              tone="red"
              title="Watchlists & Diaries"
              desc="Track what you watched, publish lists, and keep a private diary of midnight rewatches."
            />
            <FeatureCard
              index={4}
              tone="green"
              title="Groups & Communities"
              desc="Find your people by era, director, country, or kink for Kurosawa. Chat, post, and meet IRL."
            />
            <FeatureCard
              index={5}
              tone="red"
              title="Cinephile Social Graph"
              desc="Follow, compare taste profiles, duplicate lists (with credit), and battle test each other's picks."
            />
          </div>
        </div>
      </section>

      {/* Scroll Cards — reveal on scroll (Green) */}
      <section id="demo" className="py-16 md:py-20 bg-gradient-to-b from-green-900 via-green-800 to-green-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.h3 {...fadeUp} className="text-2xl md:text-3xl font-extrabold mb-8">How it feels to use So Filmy</motion.h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {["Browse mood tiles that actually get you.", "Write structured reviews with drop-in stills.", "Publish spoiler-free & sarcastic in parallel.", "Build watchlists, plan marathons, export logs.", "Real-time chat in communities & groups.", "Your taste profile evolves with every watch."].map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 40, rotate: -2 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 120, damping: 16 }}
                className="rounded-2xl p-6 bg-gradient-to-b from-green-300 to-green-100 text-green-900 shadow-xl border border-green-200"
              >
                <p className="font-semibold">{t}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — Red */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-red-900 via-red-800 to-red-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <motion.h3 {...fadeUp} className="text-3xl md:text-4xl font-extrabold mb-4">Make your film brain public (or don’t). Just start.</motion.h3>
          <motion.p {...fadeUp} className="text-red-100/90 max-w-2xl mx-auto mb-8">
            Create a profile, import ratings, craft lists, and argue politely. The algorithm learns your moods, not just your genres.
          </motion.p>
          <motion.a
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            href="#"
            className="inline-block px-8 py-4 rounded-full font-extrabold text-black bg-gradient-to-r from-red-400 to-red-300 shadow-lg"
          >
            Get Started Free
          </motion.a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-black text-white/70 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} So Filmy — Built by cinephiles, for cinephiles.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Usage: import SoFilmyLandingPage from "./SoFilmyLandingPage"; then <SoFilmyLandingPage /> somewhere in your React Router or App.
