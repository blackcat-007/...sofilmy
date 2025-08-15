import React, { useRef, useState, useEffect, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import { motion } from "framer-motion";

// Note: Tailwind must be configured in your project. This component assumes global Tailwind CSS.
// Drop this file in your React app and import <SoFilmyLandingPage /> where you want the landing page.

// ---------- 3D Scene objects (hand-made, no external models) ----------
function Reel({ pointer }) {
  const group = useRef();
  useFrame((state, delta) => {
    // smooth follow pointer
    group.current.rotation.y += (pointer.current.x * 0.5 - group.current.rotation.y) * 0.08;
    group.current.rotation.x += (-pointer.current.y * 0.3 - group.current.rotation.x) * 0.08;
    group.current.rotation.z += delta * 0.2; // slow idle spin
  });

  return (
    <group ref={group} scale={[1.2, 1.2, 1.2]}>
      {/* outer ring */}
      <mesh position={[0, 0, 0]}> 
        <torusGeometry args={[1.2, 0.18, 16, 64]} />
        <meshStandardMaterial metalness={0.6} roughness={0.2} emissiveIntensity={0.2} />
      </mesh>

      {/* inner plate */}
      <mesh position={[0, 0, 0.02]}> 
        <cylinderGeometry args={[0.7, 0.7, 0.04, 32]} />
        <meshStandardMaterial metalness={0.3} roughness={0.45} />
      </mesh>

      {/* holes */}
      {new Array(6).fill().map((_, i) => {
        const ang = (i / 6) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(ang) * 0.9, Math.sin(ang) * 0.9, 0.06]}>
            <cylinderGeometry args={[0.12, 0.12, 0.03, 16]} />
            <meshStandardMaterial metalness={0.1} roughness={0.6} color="#0b0b0b" />
          </mesh>
        );
      })}
    </group>
  );
}

function Clapboard({ pointer }) {
  const ref = useRef();
  useFrame(() => {
    ref.current.rotation.y += (pointer.current.x * 0.4 - ref.current.rotation.y) * 0.06;
    ref.current.rotation.x += (-pointer.current.y * 0.25 - ref.current.rotation.x) * 0.06;
  });

  return (
    <group ref={ref} position={[1.6, -0.6, 0]} scale={[0.9, 0.9, 0.9]}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.2, 0.7, 0.06]} />
        <meshStandardMaterial roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[-0.38, 0.18, 0.035]}>
        <boxGeometry args={[0.9, 0.22, 0.02]} />
        <meshStandardMaterial color="#111827" emissive="#0f172a" />
      </mesh>
    </group>
  );
}

function FilmStrip({ pointer }) {
  const ref = useRef();
  useFrame(() => {
    ref.current.rotation.z += 0.003;
    ref.current.rotation.x += (pointer.current.y * 0.25 - ref.current.rotation.x) * 0.02;
  });

  return (
    <group ref={ref} position={[-1.6, -0.6, -0.1]} scale={[1.06, 1.06, 1.06]}>
      <mesh rotation={[0.2, 0.1, 0]}> 
        <planeGeometry args={[2.2, 0.5, 8, 1]} />
        <meshStandardMaterial roughness={0.6} metalness={0.1} />
      </mesh>
      {/* perforation dots */}
      {new Array(8).fill().map((_, i) => (
        <mesh key={i} position={[-0.95 + (i * 0.26), 0.22, 0.01]}> 
          <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
          <meshStandardMaterial color="#0b0b0b" />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ theme = "green", pointer }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[5, 5, 5]} intensity={0.6} />
      <pointLight position={[-5, -3, -2]} intensity={0.3} />

      <Reel pointer={pointer} />
      <Clapboard pointer={pointer} />
      <FilmStrip pointer={pointer} />

      {/* subtle floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.6, 0]}> 
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial roughness={1} metalness={0} />
      </mesh>

      <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
    </>
  );
}

// ---------- React Landing Page ----------
export default function SoFilmyLandingPage3() {
  // pointer state used for 3D gestures
  const pointer = useRef({ x: 0, y: 0 });
  const [themeSeed] = useState(() => Math.random());

  useEffect(() => {
    // no-op placeholder if any future global listeners are needed
    return () => {};
  }, []);

  // pointer handlers
  const handlePointer = (e) => {
    const { clientX, clientY, currentTarget } = e;
    const rect = currentTarget.getBoundingClientRect();
    // normalize -1..1
    pointer.current.x = ((clientX - rect.left) / rect.width - 0.5) * 2;
    pointer.current.y = ((clientY - rect.top) / rect.height - 0.5) * 2;
  };

  // touch swipes
  const lastTouch = useRef(null);
  const handleTouchStart = (e) => (lastTouch.current = e.touches[0]);
  const handleTouchMove = (e) => {
    if (!lastTouch.current) return;
    const t = e.touches[0];
    const dx = (t.clientX - lastTouch.current.clientX) / window.innerWidth;
    const dy = (t.clientY - lastTouch.current.clientY) / window.innerHeight;
    // small scale movement
    pointer.current.x += dx * 2;
    pointer.current.y += dy * 2;
    // clamp for safety
    pointer.current.x = Math.max(-1.2, Math.min(1.2, pointer.current.x));
    pointer.current.y = Math.max(-1.2, Math.min(1.2, pointer.current.y));
    lastTouch.current = t;
  };

  // framer-motion variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] } },
  };

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 select-none">
      {/* HERO - GREEN THEME */}
      <section
        className="relative overflow-hidden"
        onMouseMove={handlePointer}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* gradient background - green */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-emerald-700 to-emerald-600 opacity-95"></div>

        {/* subtle grid overlay (dark green) */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full opacity-10" preserveAspectRatio="none">
            <defs>
              <pattern id="gridG" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M40 0 L0 0 0 40" fill="none" stroke="#052e1f" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridG)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <motion.h1
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                So Filmy — where cinephiles meet.
              </motion.h1>

              <motion.p
                className="mt-6 max-w-xl text-lg text-emerald-50/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.9 }}
              >
                Create clubs, write structured reviews like a critic, keep watchlists, and get mood-based film recommendations. It's Letterboxd vibes, but spicy and a little extra.
              </motion.p>

              <motion.div className="mt-8 flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
                <a href="#signup" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-900 font-semibold shadow-lg hover:scale-[1.02] transition-transform">
                  Join the club
                </a>
                <a href="#features" className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-emerald-200 text-emerald-100 hover:bg-emerald-800/40">
                  Explore features
                </a>
              </motion.div>

              <div className="mt-8 text-sm text-emerald-100/80">
                <strong>Tip:</strong> Swipe on the 3D scene or move your mouse to interact with the cinematic props.
              </div>
            </div>

            {/* 3D canvas */}
            <div className="w-full h-72 sm:h-96 lg:h-96 rounded-2xl ring-1 ring-inset ring-white/5 overflow-hidden bg-transparent">
              <Canvas camera={{ position: [0, 0.6, 4], fov: 40 }}>
                <Suspense fallback={null}>
                  <Scene theme="green" pointer={pointer} />
                </Suspense>
              </Canvas>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES - RED THEME */}
      <section id="features" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-900 via-rose-700 to-rose-600 opacity-95"></div>

        {/* dark red grid */
        }
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full opacity-10" preserveAspectRatio="none">
            <defs>
              <pattern id="gridR" width="36" height="36" patternUnits="userSpaceOnUse">
                <path d="M36 0 L0 0 0 36" fill="none" stroke="#3b0a0a" strokeWidth="0.6" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridR)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center mb-10">
            <motion.h2 className="text-3xl sm:text-4xl font-bold" initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}>
              Features
            </motion.h2>
            <motion.p className="mt-3 max-w-2xl mx-auto text-red-50/80" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              Everything cinephiles need — communities, structured critic-like templates for reviews, watchlists, diaries, and recommendation engines tuned to moods.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "Follow & Discover", desc: "Follow cinephiles with similar tastes, see their diaries and curated lists.", tag: "social" },
              { title: "Structured Reviews", desc: "Write analysis with templates that guide you: context, themes, visuals, verdict.", tag: "writing" },
              { title: "Groups & Communities", desc: "Create clubs, host watch parties, and make private threads for deep dives.", tag: "community" },
              { title: "Mood Recs", desc: "Recommendation engine that understands moods, not just genres.", tag: "ai" },
              { title: "Spoiler Flags", desc: "Tag posts as spoiler-free, sarcastic, or critical — filter them quickly.", tag: "safety" },
              { title: "Watchlist & Diaries", desc: "Track what you watched, make private/public diaries and export entries.", tag: "tracking" },
            ].map((f, i) => (
              <motion.div key={i} className="rounded-2xl p-6 backdrop-blur-sm bg-rose-900/30 border border-rose-800 shadow-inner"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={cardVariants}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-xl">{f.title}</h3>
                  <div className="text-sm text-rose-200/80">#{f.tag}</div>
                </div>
                <p className="mt-3 text-rose-50/85">{f.desc}</p>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-2 rounded-lg bg-rose-50 text-rose-700 font-medium">Try</button>
                  <button className="px-3 py-2 rounded-lg border border-rose-300 text-rose-100">Learn</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ALTERNATING GREEN SECTION - Community Cards */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-emerald-700 to-emerald-600 opacity-95"></div>
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full opacity-8" preserveAspectRatio="none">
            <defs>
              <pattern id="gridG2" width="48" height="48" patternUnits="userSpaceOnUse">
                <path d="M48 0 L0 0 0 48" fill="none" stroke="#032a1a" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#gridG2)" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 py-20 lg:py-28">
          <div className="text-center mb-12">
            <motion.h2 className="text-3xl sm:text-4xl font-bold" initial={{ y: 20, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }}>
              Communities & Clubs
            </motion.h2>
            <motion.p className="mt-3 max-w-2xl mx-auto text-emerald-50/85" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              From arthouse cinephiles to midnight popcorn crowds — find your people or start a club and invite them in.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {new Array(6).fill().map((_, i) => (
              <motion.div key={i} className="rounded-2xl p-5 bg-emerald-900/30 border border-emerald-800"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-600/80 flex items-center justify-center font-bold text-xl">C{i + 1}</div>
                  <div>
                    <div className="font-semibold">Club {i + 1}</div>
                    <div className="text-sm text-emerald-100/80">{["Arthouse", "Noir Lovers", "Cult Classics", "Indie Gems", "World Cinema", "Guilty Pleasures"][i]}</div>
                  </div>
                </div>
                <p className="mt-3 text-emerald-100/85 text-sm">Weekly watch parties, curated lists, and heated debates. Welcoming critics and normies alike.</p>
                <div className="mt-4 flex gap-2">
                  <button className="px-3 py-2 rounded-lg bg-emerald-50 text-emerald-900 font-medium">Join</button>
                  <button className="px-3 py-2 rounded-lg border border-emerald-300 text-emerald-100">View</button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Mixed (but still separate visuals) */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <h3 className="text-2xl font-bold">Ready to make film friends?</h3>
            <p className="mt-2 text-slate-200/80">Start a club, write your first structured review, or just follow someone whose taste you admire.</p>
          </div>

          <div className="flex gap-3">
            <a id="signup" href="#" className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-200 text-emerald-900 font-semibold">Sign up</a>
            <a href="#" className="px-5 py-3 rounded-2xl border border-slate-700">Explore</a>
          </div>
        </div>
      </section>

      {/* FOOTER - dark with small red/green accents */}
      <footer className="border-t border-slate-800 mt-8">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm">© {new Date().getFullYear()} So Filmy — all rights to the films still belong to their makers. We just gossip politely.</div>
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded bg-emerald-600/80 grid place-items-center text-xs">G</div>
            <div className="w-8 h-8 rounded bg-rose-600/80 grid place-items-center text-xs">R</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
