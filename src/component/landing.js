import React, { Suspense, useRef } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, OrbitControls, useGLTF, Sparkles } from "@react-three/drei";
import {
  Film as FilmIcon,
  Users,
  MessageSquareText,
  NotepadText,
  Sparkles as SparklesIcon,
  ListChecks,
  BadgeInfo,
  Popcorn as PopcornIcon,
  Clapperboard,
} from "lucide-react";
import Footer from "./footer";

// ----- 3D ELEMENTS -----
function FilmReel(props) {
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

function PopcornModel(props) {
  // Replace the src below with your hosted GLB path, e.g. "/models/popcorn.glb"
  const { scene } = useGLTF("/models/popcorn.glb", true);
  const ref = useRef();
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();
    ref.current.rotation.y = Math.sin(t * 0.4) * 0.3;
    ref.current.position.y = Math.sin(t * 0.8) * 0.06;
  });
  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
      <primitive ref={ref} object={scene} {...props} />
    </Float>
  );
}

useGLTF.preload && useGLTF.preload("/models/popcorn.glb");

function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.2, 4.2], fov: 45 }}
      className="absolute inset-0 -z-10"
      shadows
    >
      {/* Lights */}
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow color="#34d399" />
      <directionalLight position={[-6, 3, -2]} intensity={0.6} color="#ef4444" />

      {/* Ground subtle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.25} />
      </mesh>

      {/* Elements */}
      <Suspense fallback={null}>
        <group position={[0, -0.2, 0]}> 
          <FilmReel position={[-1.6, 0.1, 0]} />
          <PopcornModel scale={0.9} position={[1.4, -0.1, 0]} />
        </group>
        <Sparkles count={60} scale={[6, 2, 2]} size={1.5} speed={0.25} opacity={0.3} color="#ffffff" />
        <Environment preset="studio" />
      </Suspense>

      {/* For debugging while designing, can toggle controls */}
      {/* <OrbitControls makeDefault /> */}
    </Canvas>
  );
}

// ----- UI ANIM HELPERS -----
const float = {
  animate: {
    y: [0, -12, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.12 * i, duration: 0.6, ease: "easeOut" },
  }),
};

// ----- LANDING PAGE -----
const onLogin = () => console.log("Login clicked");
const onSignup = () => console.log("Sign Up clicked");

const FeatureCard = ({ title, desc, Icon, i }) => (
  <motion.div
    custom={i}
    variants={fadeUp}
    initial="hidden"
    whileInView="show"
    viewport={{ once: true, amount: 0.3 }}
    className="group relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/70 to-black/70 p-[1px] shadow-[0_8px_40px_rgba(0,0,0,0.6)]"
  >
    <div className="relative h-full rounded-2xl bg-black/70 p-6">
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(1200px circle at var(--x,50%) var(--y,50%), rgba(34,197,94,0.15), rgba(239,68,68,0.15) 40%, transparent 60%)",
        }}
      />
      <div className="flex items-start gap-4">
        <div className="rounded-2xl p-3 backdrop-blur-sm bg-gradient-to-br from-red-500/20 to-red-700/20 border border-white/10">
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm text-zinc-300 leading-relaxed">{desc}</p>
        </div>
      </div>
    </div>
  </motion.div>
);

function Landing() {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden bg-[#0b0f0c] text-white "
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        e.currentTarget.style.setProperty("--x", `${x}%`);
        e.currentTarget.style.setProperty("--y", `${y}%`);
      }}
    >
      {/* 3D Canvas Background */}
      <Scene />

      {/* Subtle grid overlay for texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] -z-10"
      />

      {/* Navbar */}
      <header className="relative z-10 top-0">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-b from-green-700 to-green-600 shadow-lg">
              <PopcornIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="block bg-gradient-to-b from-red-400 to-red-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
                ...So<span className=" bg-gradient-to-b from-gray-400 to-white bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">Filmy</span>
              </span>
              <span className="text-xs text-zinc-400">Cinephile Club</span>
            </div>
          </div>

          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-zinc-300 hover:text-white">Features</a>
            <a href="#how" className="text-sm text-zinc-300 hover:text-white">How it works</a>
            <a href="#community" className="text-sm text-zinc-300 hover:text-white">Community</a>
          </div>

          <div className="flex items-center gap-3">
            {/* Monochrome gradients only */}
            <button
              onClick={onLogin}
              className="rounded-xl bg-gradient-to-b from-red-700 to-red-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_24px_rgba(239,68,68,0.35)] hover:from-red-600 hover:to-red-500"
            >
              Log in
            </button>
            <button
              onClick={onSignup}
              className="rounded-xl bg-gradient-to-b from-green-700 to-green-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_6px_24px_rgba(34,197,94,0.35)] hover:from-green-600 hover:to-green-500"
            >
              Sign up
            </button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 md:pt-16">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-balance text-4xl font-extrabold leading-tight md:text-6xl"
            >
              Meet, discuss, and <span className="bg-gradient-to-b from-green-400 to-green-600 bg-clip-text text-transparent">live movies</span>.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.7 }}
              className="mt-4 max-w-xl text-lg text-zinc-300"
            >
              A home for cinephiles: follow folks with the same taste, debate scenes, post structured reviews with images, publish watchlists & diaries, and get film recommendations by <em>mood</em>—not just genre.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="mt-8 flex flex-wrap items-center gap-4"
            >
              <button
                onClick={onSignup}
                className="rounded-2xl bg-gradient-to-b from-green-700 to-green-600 px-6 py-3 text-base font-semibold text-white shadow-[0_10px_40px_rgba(34,197,94,0.35)] hover:from-green-600 hover:to-green-500"
              >
                Join the Club
              </button>
              <button
                onClick={onLogin}
                className="rounded-2xl border border-white/15 bg-gradient-to-b from-red-800/60 to-red-700/60 px-6 py-3 text-base font-medium text-white backdrop-blur hover:from-red-700/60 hover:to-red-600/60"
              >
                I already have an account
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex items-center gap-6 text-sm text-zinc-400"
            >
              <div className="flex items-center gap-2">
                <Clapperboard className="h-4 w-4" />
                <span>"Where every cinephile’s reel meets for real! From mood-based picks to epic debates, lights, camera… connect!"</span>
              </div>
            </motion.div>
          </div>

          {/* Mock preview card stack */}
          <div className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative rounded-3xl border border-white/10 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur-xl"
            >
              <div className="rounded-2xl bg-black/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-600" />
                    <div className="h-2 w-2 rounded-full bg-zinc-500" />
                    <div className="h-2 w-2 rounded-full bg-green-600" />
                  </div>
                  <span className="text-xs text-zinc-400">SoFilmy – Preview</span>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="flex items-start gap-3 rounded-xl border border-white/10 bg-zinc-950/60 p-3">
                      <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-b from-red-700/40 to-red-600/40" />
                      <div className="flex-1">
                        <div className="mb-1 flex items-center gap-2 text-xs text-zinc-400">
                          <span>@cinephile{n}</span>
                          <span>•</span>
                          <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-[10px] text-green-300">spoiler‑free</span>
                          <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] text-red-300">sarcastic</span>
                        </div>
                        <div className="h-3 w-3/4 rounded bg-zinc-700/60" />
                        <div className="mt-2 h-2 w-2/3 rounded bg-zinc-700/40" />
                      </div>
                      <div className="h-14 w-20 shrink-0 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-900" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-red-600 to-green-600" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Built for cinephiles who like to do more than just log films</h2>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            i={0}
            Icon={Users}
            title="Follow, groups & communities"
            desc="Find same‑taste people, follow them, spin up groups, and build niche communities around genres, eras, and filmmakers."
          />
          <FeatureCard
            i={1}
            Icon={MessageSquareText}
            title="Chat that stays on topic"
            desc="Real‑time DMs and threads inside groups so watch parties, scene breakdowns, and hot takes don’t get lost."
          />
          <FeatureCard
            i={2}
            Icon={NotepadText}
            title="Critic‑style posts with templates"
            desc="In‑built review templates for structure (synopsis, craft, themes, verdict) with image blocks—for normies and critics alike."
          />
          <FeatureCard
            i={3}
            Icon={ListChecks}
            title="Watchlists, diaries & tracking"
            desc="Publish your film watchlist, keep a viewing diary, and track progress across challenges, rewatches, and series."
          />
          <FeatureCard
            i={4}
            Icon={SparklesIcon}
            title="Mood‑based recommendations"
            desc="Not just genre. Pick a mood—cozy, chaotic, melancholic—and we’ll surface films that fit tonight’s vibe."
          />
          <FeatureCard
            i={5}
            Icon={BadgeInfo}
            title="Spoiler‑free & tone tags"
            desc="Posts are clearly labeled: spoiler‑free, spoiler‑heavy, sarcastic, deep‑dive. Read at your comfort level."
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="relative z-10 mx-auto max-w-7xl px-6 pb-24">
        <div className="mb-10 flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-red-600 to-green-600" />
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">From popcorn to posted in three steps</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Set your taste",
              desc: "Import watchlist, mark favorites, pick moods. The engine learns your vibe.",
              Icon: FilmIcon,
            },
            {
              title: "Find your people",
              desc: "Follow similar palates, join communities, start a chat or watch party.",
              Icon: Users,
            },
            {
              title: "Post with flair",
              desc: "Use templates to drop clean, structured reviews—images included.",
              Icon: NotepadText,
            },
          ].map((step, idx) => (
            <motion.div
              key={idx}
              custom={idx}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.3 }}
              className="rounded-2xl border border-white/10 bg-zinc-950/60 p-6"
            >
              <div className="mb-3 inline-flex rounded-xl bg-gradient-to-b from-green-700/20 to-green-600/20 p-3">
                <step.Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-zinc-300">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Community CTA */}
      <section id="community" className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-red-600/10 via-black to-green-600/10 p-10"
        >
          <div className="relative z-10 grid items-center gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-2xl font-bold md:text-3xl">Ready for a smarter film club?</h3>
              <p className="mt-3 text-zinc-300">Keep it classy like the golden era, but move fast like a modern feed. Your taste, your tribe, your timeline.</p>
              <div className="mt-6 flex flex-wrap gap-4">
                <button onClick={onSignup} className="rounded-2xl bg-gradient-to-b from-green-700 to-green-600 px-6 py-3 font-semibold text-white shadow-[0_10px_40px_rgba(34,197,94,0.35)] hover:from-green-600 hover:to-green-500">Create account</button>
                <button onClick={onLogin} className="rounded-2xl bg-gradient-to-b from-red-800/70 to-red-700/70 px-6 py-3 font-medium text-white hover:from-red-700/70 hover:to-red-600/70">Explore first</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {["Watchlists", "Mood picks", "Spoiler tags", "Communities", "Diaries", "Templates"].map((tag) => (
                <motion.div
                  key={tag}
                  whileHover={{ scale: 1.03 }}
                  className="rounded-2xl border border-white/10 bg-zinc-950/70 px-4 py-6 text-center text-sm"
                >
                  {tag}
                </motion.div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute -right-40 -top-40 h-80 w-80 rotate-12 rounded-3xl bg-gradient-to-b from-red-600/20 to-green-600/20 blur-2xl" />
        </motion.div>
      </section>

      {/* Footer */}
      
        <Footer />
      
    </div>
  );
}

export default Landing;
