import React, { Suspense, useRef,useState } from "react";
import { motion } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, OrbitControls, useGLTF, Sparkles } from "@react-three/drei";
import { useEffect } from "react";
import * as THREE from "three";
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
import SoFilmyHero from "./sofilmyhero";
import FunkyCursor from "./funkycursor";
import { Link } from "react-router-dom";

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

function PopcornModel(props) {
  const { scene } = useGLTF("/models/popcorn.glb", true);
  const ref = useRef();

  const [hovered, setHovered] = useState(false);
  const pointer = useRef({ x: 0, y: 0 });

  // Track mouse position globally
  const handlePointerMove = (e) => {
    if (!ref.current) return;
    // Normalize X/Y between -1 and 1
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    pointer.current = { x, y };
  };

  useEffect(() => {
    window.addEventListener("mousemove", handlePointerMove);
    return () => window.removeEventListener("mousemove", handlePointerMove);
  }, []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    const t = state.clock.getElapsedTime();

    if (hovered) {
      // Orbit / follow mouse rotation
      const targetRotY = pointer.current.x * Math.PI * 0.5; // rotate left/right
      const targetRotX = pointer.current.y * Math.PI * 0.2; // tilt up/down
      ref.current.rotation.y = THREE.MathUtils.lerp(
        ref.current.rotation.y,
        targetRotY,
        0.1
      );
      ref.current.rotation.x = THREE.MathUtils.lerp(
        ref.current.rotation.x,
        targetRotX,
        0.1
      );
    } else {
      // Idle animation (float + slow spin)
      ref.current.rotation.y += 0.0015;
      ref.current.position.y = Math.sin(t * 0.8) * 0.06;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.6}>
      <group
        ref={ref}
        {...props}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <primitive object={scene} />
      </group>
    </Float>
  );
}


useGLTF.preload && useGLTF.preload("/models/popcorn.glb");



{/*function Scene() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [0, 1.2, 4.2], fov: 45 }}
      className="absolute inset-0 z-10 h-[20rem] w-full bg-black mt-10"
      shadows
    >
      {/* Lights 
      <ambientLight intensity={0.25} />
      <directionalLight position={[4, 6, 3]} intensity={1.2} castShadow color="#34d399" />
      <directionalLight position={[-6, 3, -2]} intensity={0.6} color="#ef4444" />

      {/* Ground subtle 
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.1, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.25} />
      </mesh>

      {/* Elements */
      /*<Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial color="hotpink" /></mesh>} >
        <group position={[0, -0.2, 0]} scale={1.2} >
          <FilmReel scale={1} position={[-1.6, 0.1, 0]} />
          <FilmCameraModel scale={0.5} position={[0.8, 0.1, 1.5]} />
        </group>
        <Sparkles count={3000} scale={[20, 8, 8]} size={4.5} speed={0.25} opacity={0.3} color="#ffffff" />
        <ambientLight intensity={0.5} />
<directionalLight position={[10, 10, 5]} intensity={1.5} />

      </Suspense>

      {/* For debugging while designing, can toggle controls
      {/* <OrbitControls makeDefault /> 
    </Canvas>
  );
}
*/}
function TouchScene() {
  return (
    <div className="w-[100px] aspect-square mx-auto ">
  <Canvas
    dpr={[1, 2]}
    camera={{ position: [0, 1.2, 4.2], fov: 45 }}
    className="absolute inset-0 z-10"
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
      <Suspense fallback={<mesh><boxGeometry /><meshBasicMaterial color="hotpink" /></mesh>} >
        <group position={[0, -0.2, 0]} scale={1.2} >
         
          <PopcornModel scale={5.5} position={[0, -0.1, 0]} />
        </group>
        
        <ambientLight intensity={0.5} />
<directionalLight position={[10, 10, 5]} intensity={1.5} />

      </Suspense>

      {/* For debugging while designing, can toggle controls */}
      {/* <OrbitControls makeDefault /> */}
    </Canvas>
  </div> 
  )
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
    useEffect(() => {
  const cursor = document.createElement("div");
  cursor.style.position = "fixed";
  cursor.style.width = "20px";
  cursor.style.height = "20px";
  cursor.style.borderRadius = "50%";
  cursor.style.pointerEvents = "none";
  cursor.style.zIndex = "9999";
  cursor.style.background = "radial-gradient(circle, #ff007f 0%, #ff0000 70%)";
  cursor.style.transform = "translate(-50%, -50%)";
  document.body.appendChild(cursor);

  const stars = [];

  const moveCursor = (e) => {
    cursor.style.left = e.clientX + "px";
    cursor.style.top = e.clientY + "px";

    // create a star trail
    const star = document.createElement("div");
    star.innerHTML = "★";
    star.style.position = "fixed";
    star.style.left = e.clientX + "px";
    star.style.top = e.clientY + "px";
    star.style.fontSize = Math.random() * 16 + 8 + "px";
    star.style.color = Math.random() > 0.5 ? "#ff4d4d" : "#00ff7f";
    star.style.opacity = 1;
    star.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
    star.style.pointerEvents = "none";
    star.style.zIndex = "9998";
    document.body.appendChild(star);
    stars.push(star);

    // animate star fade & float
    setTimeout(() => {
      star.style.transition = "all 0.8s ease-out";
      star.style.opacity = "0";
      star.style.top = parseFloat(star.style.top) - 30 + "px";
    }, 10);

    // remove star safely
    setTimeout(() => {
      star.remove(); // ✅ safe
      stars.shift();
    }, 1000);
  };

  window.addEventListener("mousemove", moveCursor);

  // Cleanup
  return () => {
    window.removeEventListener("mousemove", moveCursor);
    cursor.remove(); // ✅ safe
    stars.forEach((s) => s.remove()); // ✅ safe
  };
}, []);

    const scrollRef = useRef();

  useEffect(() => {
    const el = scrollRef.current;

    if (!el) return;

    const onWheel = (e) => {
      // Prevent vertical scroll
      e.preventDefault();
      // Scroll horizontally instead
      el.scrollLeft += e.deltaY; // adjust multiplier if needed
    };

    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, []);
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden  text-white  bg-transparent z-10"
      onMouseMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width) * 100;
        const y = ((e.clientY - r.top) / r.height) * 100;
        e.currentTarget.style.setProperty("--x", `${x}%`);
        e.currentTarget.style.setProperty("--y", `${y}%`);
      }}
    >
      
      {/* 3D Canvas Background */}
      <motion.div className="fixed inset-0  ">
      <SoFilmyHero />
      </motion.div>
      {/* <Scene />*/}

    
      {/* Navbar */}
      <section className="relative  mt-96 z-10 bg-gradient-to-b to-black from-transparent bg-opacity-50 ">
          {/* Subtle grid overlay with fade */}
<div
  aria-hidden
  className="pointer-events-none absolute inset-0 
    bg-[linear-gradient(rgba(139,0,0,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(0,100,0,0.6)_1px,transparent_1px)] 
    bg-[size:48px_48px] z-0
    [mask-image:linear-gradient(to_bottom,transparent,black)]
    [mask-repeat:no-repeat] [mask-size:100%_100%]"
/>

     <header className="relative z-10 top-0">
  <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
    <div className="hidden items-center gap-6 md:flex">
      <a href="#features" className="text-sm text-zinc-300 hover:text-white">Features<img src="/icons/wired-lineal-237-star-rating-hover-pinch.gif" alt="Arrow right" className="inline-block ml-2 h-6 w-6 bg-transparent" /></a>
      <a href="#how" className="text-sm text-zinc-300 hover:text-white">How it works<img src="/icons/wired-lineal-237-star-rating-hover-pinch.gif" alt="Arrow right" className="inline-block ml-2 h-6 w-6 bg-transparent" /></a>
      <a href="#community" className="text-sm text-zinc-300 hover:text-white">Community<img src="/icons/wired-lineal-237-star-rating-hover-pinch.gif" alt="Arrow right" className="inline-block ml-2 h-6 w-6 bg-transparent" /></a>
    </div>
  </nav>
</header>

{/* Hero */}
<section className="relative z-10 mx-auto max-w-7xl px-6 pt-12 pb-24 md:pt-16">
  <div className="grid items-center gap-12 md:grid-cols-2">
    {/* Left Column */}
    <div className="flex flex-col gap-4">
     <div className="flex justify-center items-center">
      <div className="flex items-center gap-3 mt-16">
        <TouchScene />
      </div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-3xl font-extrabold leading-tight sm:text-4xl md:text-5xl lg:text-6xl"
      >
       Meet, discuss, and{" "}
        <span className="bg-gradient-to-b from-green-400 to-green-600 bg-clip-text text-transparent">
          live movies
        </span>.
      </motion.h1>
</div>
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.7 }}
        className="mt-4 max-w-full sm:max-w-lg text-base sm:text-lg text-zinc-300"
      >
        A home for cinephiles: follow folks with the same taste, debate scenes, post structured reviews with images, publish watchlists & diaries, and get film recommendations by <em>mood</em>—not just genre.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.7 }}
        className="mt-6 flex flex-wrap items-center gap-3 sm:gap-4"
      >
        <Link to="/signup">
          <button
            onClick={onSignup}
            className="rounded-2xl bg-gradient-to-b items-center flex justify-center from-green-700 to-green-600 px-5 py-3 sm:px-6 sm:py-3 text-base font-semibold text-white shadow-[0_10px_40px_rgba(34,197,94,0.35)] hover:from-green-600 hover:to-green-500"
          >
            Join the Club<img src="/icons/wired-lineal-237-star-rating-hover-pinch.gif" alt="Arrow right" className="inline-block ml-2 h-6 w-6 bg-transparent" />
          </button>
        </Link>
        <Link to="/login">
          <button
            onClick={onLogin}
            className="rounded-2xl border border-white/15 bg-gradient-to-b from-red-800/60 to-red-700/60 px-5 py-3 sm:px-6 sm:py-3 text-base font-medium text-white backdrop-blur hover:from-red-700/60 hover:to-red-600/60"
          >
            I already have an account
          </button>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-zinc-400"
      >
        <div className="flex items-center gap-2">
          <Clapperboard className="h-4 w-4" />
          <span>
            "Where every cinephile’s reel meets for real! From mood-based picks to epic debates, lights, camera… connect!"
          </span>
        </div>
      </motion.div>
    </div>

    {/* Right Column - Mock preview card stack */}
    <div className="relative w-full flex justify-center md:justify-end">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.15 }}
        className="relative w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/60 p-4 shadow-2xl backdrop-blur-xl"
      >
        <div className="rounded-2xl bg-black/60 p-4 space-y-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-600" />
              <div className="h-2 w-2 rounded-full bg-zinc-500" />
              <div className="h-2 w-2 rounded-full bg-green-600" />
            </div>
            <span className="text-xs text-zinc-400">SoFilmy – Preview</span>
          </div>
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/60 p-3">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-gradient-to-b from-red-700/40 to-red-600/40" />
              <div className="flex-1 w-full space-y-1">
                <div className="flex flex-wrap items-center gap-1 text-xs text-zinc-400">
                  <span>@cinephile{n}</span>
                  <span>•</span>
                  <span className="rounded-full bg-green-600/20 px-2 py-0.5 text-[10px] text-green-300">spoiler‑free</span>
                  <span className="rounded-full bg-red-600/20 px-2 py-0.5 text-[10px] text-red-300">sarcastic</span>
                </div>
                <div className="h-3 w-full sm:w-3/4 rounded bg-zinc-700/60" />
                <div className="mt-1 h-2 w-2/3 rounded bg-zinc-700/40" />
              </div>
              <div className="h-14 w-20 shrink-0 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-900 mt-2 sm:mt-0" />
            </div>
          ))}
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
      {/* SCROLL CARDS — cinematic poster peeks */}
<section className="py-16 px-6 *:relative z-10 ">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h3 className="text-2xl font-bold">Spotlight Picks</h3>
          <p className="text-gray-400 mt-2">
           Your top posts will be showcased to the community.
          </p>
        </motion.div>

        <div
          ref={scrollRef}
          className="mt-8 -mx-6 px-6 py-4 overflow-x-auto overflow-y-hidden no-scrollbar"
          style={{
            WebkitOverflowScrolling: "touch",
            scrollSnapType: "x mandatory",
          }}
        >
          <div className="flex gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -8, scale: 1.03 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.06 }}
                className="min-w-[220px] md:min-w-[260px] bg-[#0f0f10] rounded-xl shadow-lg border border-gray-800 overflow-hidden scroll-snap-align-start"
              >
                <div className="h-[320px] md:h-[380px] bg-gradient-to-b from-gray-800 to-black flex items-end">
                  <div className="p-4">
                    <div className="text-sm text-gray-400">2024</div>
                    <div className="text-lg font-semibold mt-1">
                      Cinephile Pick {i + 1}
                    </div>
                  </div>
                </div>

                <div className="p-4 border-t border-gray-800 flex items-center justify-between">
                  <div className="text-sm text-gray-300">by Critic-ish⭐</div>
                  <div className="text-xs text-gray-400">Mood: melancholic</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>

      {/* Community CTA */}
<section id="community" className="relative z-10 mx-auto max-w-7xl px-6 pb-28">
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.5 }}
    className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-red-600/10 via-black to-green-600/10 p-8 md:p-10"
  >
    <div className="relative z-10 grid gap-6 md:grid-cols-2">
      {/* Left Column */}
      <div>
        <h3 className="text-2xl font-bold md:text-3xl">
          Ready for a smarter film club?
        </h3>
        <p className="mt-3 text-zinc-300">
          Keep it classy like the golden era, but move fast like a modern feed. Your taste, your tribe, your timeline.
        </p>
        <div className="mt-6 flex flex-wrap gap-4">
          <Link to="/signup">
            <button
              onClick={onSignup}
              className="rounded-2xl bg-gradient-to-b from-green-700 to-green-600 px-5 py-3 md:px-6 md:py-3 font-semibold  shadow-[0_10px_40px_rgba(34,197,94,0.35)] hover:from-green-600 hover:to-green-500"
            >
              Create account<img src="/icons/wired-lineal-237-star-rating-hover-pinch.gif" alt="Arrow right" className="inline-block ml-2 h-6 w-6 bg-transparent" />
            </button>
          </Link>
          <Link to="/login">
            <button
              onClick={onLogin}
              className="rounded-2xl bg-gradient-to-b from-red-800/70 to-red-700/70 px-5 py-3 md:px-6 md:py-3 font-medium text-white hover:from-red-700/70 hover:to-red-600/70"
            >
            Explore first
          </button>
            </Link>
        </div>
      </div>

      {/* Right Column */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {["Watchlists", "Mood picks", "Spoiler tags", "Communities", "Diaries", "Templates"].map((tag) => (
          <motion.div
            key={tag}
            whileHover={{ scale: 1.03 }}
            className="rounded-2xl border border-white/10 bg-zinc-950/70 px-3 py-4 sm:px-4 sm:py-6 text-center text-xs sm:text-sm"
          >
            {tag}
          </motion.div>
        ))}
      </div>
    </div>

    {/* Decorative Gradient Circle */}
    <div className="pointer-events-none absolute -right-32 -top-32 sm:-right-40 sm:-top-40 h-64 w-64 sm:h-80 sm:w-80 rotate-12 rounded-3xl bg-gradient-to-b from-red-600/20 to-green-600/20 blur-2xl" />
  </motion.div>
</section>

      

</section>
      {/* Footer */}
      
        <Footer />
      
    </div>
  );
}

export default Landing;
