import React, { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { motion, useInView } from "framer-motion";
import { Canvas, useFrame, useThree,extend } from "@react-three/fiber";
import { OrbitControls, Float, Points, PointMaterial, Text, shaderMaterial } from "@react-three/drei";
import * as THREE from "three";
import { EffectComposer, Noise, Vignette } from "@react-three/postprocessing";

/**
 * SoFilmy — Cinematic Landing Page
 * React 18 + Tailwind + Framer Motion + @react-three/fiber/drei + @react-three/postprocessing
 *
 * Notes:
 * - No navbar/footer per user request. Pure landing sections with strong hero.
 * - Dark base with minimal green/red accents and separate gradients (no mixed gradients).
 * - Background has subtle dark red & green grid overlays.
 * - 3D scene: projector light cone, dust particles, floating film strip (custom shader), rotating 3D title.
 * - Interactions: desktop tilt with mouse; mobile swipe/OrbitControls.
 * - Scroll-based reveals for 3D props & sections. Postprocessing film grain & vignette.
 * - Performance: reduces particles/animations on low-memory devices.
 */

/* ----------------------------- Utilities ------------------------------ */
const isLowPower = () => {
  if (typeof navigator === "undefined") return false;
  const anyNav = navigator;
  const dm = anyNav.deviceMemory || 8; // assume decent if unknown
  const conn = anyNav.connection?.effectiveType;
  return dm <= 4 || conn === "2g" || conn === "slow-2g";
};

const useIsMobile = () => {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const onChange = () => setMobile(mq.matches);
    onChange();
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return mobile;
};

/* ----------------------------- Shaders -------------------------------- */
// Film strip shader: draws sprocket holes + semi-transparent frames; waves like a ribbon and scrolls frames.
const FilmStripMaterial = shaderMaterial(
  {
    uTime: 0,
    uOpacity: 0.9,
    uScroll: 0.0, // 0..1 vertical scroll
    uTint: new THREE.Color(0.95, 0.95, 0.95),
  },
  // vertex
  /* glsl */ `
  uniform float uTime;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    // wave in y with x-based amplitude
    float wave = sin((uv.x * 6.2831) + uTime * 0.8) * 0.12; // amplitude
    vec3 pos = position;
    pos.y += wave;
    // slight twist
    float twist = (uv.x - 0.5) * 0.6;
    mat3 rot = mat3(
      cos(twist), 0.0, sin(twist),
      0.0,        1.0, 0.0,
      -sin(twist),0.0, cos(twist)
    );
    pos = rot * pos;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`,
  // fragment
  /* glsl */ `
  uniform float uTime;
  uniform float uOpacity;
  uniform float uScroll;
  uniform vec3 uTint;
  varying vec2 vUv;

  // draw repeating frames & sprocket holes procedurally
  float rect(vec2 uv, vec2 pos, vec2 size) {
    vec2 d = abs(uv - pos) - size;
    return step(0.0, max(d.x, d.y)); // 0 inside, 1 outside
  }

  void main() {
    // base color slightly off-white
    vec3 base = uTint;
    float alpha = uOpacity;

    // vertical tiling for frames
    float tiles = 6.0;
    float y = fract(vUv.y * tiles + uScroll);
    // frame window area (semi-transparent)
    float frame = rect(vec2(vUv.x, y), vec2(0.5, 0.5), vec2(0.36, 0.28));
    float frameBorder = rect(vec2(vUv.x, y), vec2(0.5, 0.5), vec2(0.38, 0.30));

    // sprocket holes on left & right (make them transparent)
    float sprocketRepeat = step(0.0, sin((y - 0.1) * 6.2831 * 1.0)); // repeat every tile visually
    float leftHole = smoothstep(0.0, 0.02, abs(vUv.x - 0.07) - 0.03);
    float rightHole = smoothstep(0.0, 0.02, abs(vUv.x - 0.93) - 0.03);
    float holesMask = min(leftHole, rightHole);

    // borders darker
    float edge = smoothstep(0.0, 0.02, min(vUv.x, 1.0 - vUv.x));
    vec3 color = base * (0.7 + 0.3 * edge);

    // frame area slightly transparent, with subtle green/red tint alternate by tile index
    float row = floor((vUv.y * tiles + uScroll));
    float alt = mod(row, 2.0);
    vec3 frameTint = mix(vec3(0.8, 0.95, 0.85), vec3(0.95, 0.8, 0.85), alt); // greenish vs reddish

    // blend frame window
    color = mix(color, frameTint, 1.0 - frame);
    alpha *= mix(0.55, 0.85, frame); // transparent in window, opaque elsewhere

    // punch out sprocket holes
    alpha *= smoothstep(0.35, 0.0, holesMask);

    // slight vignette on strip
    float vig = smoothstep(0.0, 0.7, vUv.x) * smoothstep(0.0, 0.7, 1.0 - vUv.x);
    color *= mix(0.7, 1.0, vig);

    gl_FragColor = vec4(color, alpha);
    #ifdef OPAQUE
      gl_FragColor.a = 1.0;
    #endif
    #ifdef ALPHATEST
      if (gl_FragColor.a < ALPHATEST) discard;
    #endif
  }
`
);

/* ----------------------------- 3D Parts ------------------------------- */
function CameraRig({ enableTilt }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3(0, 0, 0));
  const rot = useRef({ x: -0.15, y: 0.15 });

  useEffect(() => {
    camera.position.set(0, 0.8, 5.2);
  }, [camera]);

  useEffect(() => {
    if (!enableTilt) return;
    const onMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      rot.current.y = x * 0.25;
      rot.current.x = -0.1 - y * 0.2;
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [enableTilt]);

  // touch swipe to rotate
  useEffect(() => {
    let startX = 0, startY = 0;
    const onStart = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
    };
    const onMove = (e) => {
      const t = e.touches?.[0];
      if (!t) return;
      const dx = (t.clientX - startX) / window.innerWidth;
      const dy = (t.clientY - startY) / window.innerHeight;
      rot.current.y = THREE.MathUtils.clamp(rot.current.y + dx * 0.6, -0.5, 0.5);
      rot.current.x = THREE.MathUtils.clamp(rot.current.x + dy * 0.5, -0.5, 0.2);
      startX = t.clientX; startY = t.clientY;
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
    };
  }, []);

  useFrame(() => {
    camera.rotation.x = THREE.MathUtils.lerp(camera.rotation.x, rot.current.x, 0.05);
    camera.rotation.y = THREE.MathUtils.lerp(camera.rotation.y, rot.current.y, 0.05);
    camera.lookAt(target.current);
  });
  return null;
}

function ProjectorCone({ color = new THREE.Color(0.9, 0.4, 0.45), intensity = 1 }) {
  const mat = useRef();
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (mat.current) {
      mat.current.opacity = 0.25 + Math.sin(clock.getElapsedTime() * 2.0) * 0.03;
    }
    if (meshRef.current) {
      meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * 0.05;
    }
  });
  return (
    <mesh ref={meshRef} position={[0, 0.2, 0]} rotation={[-0.2, 0, 0]}>
      <coneGeometry args={[1.6, 4.0, 64, 1, true]} />
      <meshBasicMaterial ref={mat} color={color} transparent opacity={0.28} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
    </mesh>
  );
}

function DustParticles({ count = 1000, spread = [1.0, 3.5, 3.0] }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // position within projector cone-like bounds
      const x = (Math.random() - 0.5) * spread[0];
      const z = -Math.random() * spread[1];
      const y = (Math.random() - 0.2) * spread[2];
      arr[i * 3 + 0] = x * (1.0 + Math.abs(z) * 0.2);
      arr[i * 3 + 1] = y;
      arr[i * 3 + 2] = z;
    }
    return arr;
  }, [count, spread]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const a = ref.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      const idx = i * 3 + 2;
      a[idx] += 0.002 + Math.sin(t * 0.5 + i) * 0.0006; // slowly drift towards camera
      if (a[idx] > 0.5) a[idx] = -Math.random() * spread[1];
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.015} sizeAttenuation color={0xffffff} transparent opacity={0.75} />
    </points>
  );
}

function FilmStrip({ visible = true }) {
  const matRef = useRef();
  const meshRef = useRef();
  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uTime = clock.getElapsedTime();
      matRef.current.uScroll = (clock.getElapsedTime() * 0.15) % 1.0; // frame scroll
    }
    if (meshRef.current) {
      meshRef.current.position.y = 0.2 + Math.sin(clock.getElapsedTime() * 0.9) * 0.1;
    }
  });
  return (
    <Float floatIntensity={0.6} rotationIntensity={0.25} speed={0.6}>
      <mesh ref={meshRef} position={[0.6, 0.4, -0.6]} rotation={[0, -0.3, 0]}
        visible={visible}>
        <planeGeometry args={[1.8, 2.8, 64, 64]} />
        <filmStripMaterial ref={matRef} transparent depthWrite={false} />
      </mesh>
    </Float>
  );
}

function Title3D({ text = "...So Filmy", color = "#e11d48" /* red-600 */ }) {
  const group = useRef();
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.2;
      group.current.rotation.x = Math.cos(clock.getElapsedTime() * 0.4) * 0.05 - 0.1;
    }
  });
  return (
    <group ref={group} position={[0, 0.9, 0]} className="relative z-20">
      <Text
        fontSize={0.7}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.02}
        outlineColor="#16a34a" // green-600 outline
      >
        {text}
      </Text>
    </group>
  );
}

function Scene({ showPropsA, showPropsB }) {
  const low = isLowPower();
  const mobile = useIsMobile();
  return (
    <>
      {/* Key light simulating projector source */}
      <spotLight position={[0.2, 1.2, 2.5]} angle={0.6} penumbra={0.6} intensity={2.2} color={new THREE.Color(1.0, 0.8, 0.85)} />
      <ambientLight intensity={0.25} />

      {/* Projector cone & dust */}
      {/*<ProjectorCone color={new THREE.Color(0.9, 0.2, 0.25)}  />
      {!low && <DustParticles count={mobile ? 600 : 1200} />}
      {low && <DustParticles count={mobile ? 200 : 400} />}*/}

      {/* Title */}
      <Title3D />

      {/* Floating film strip (reveals with scroll) */}
     
      {/* Another subtle prop: a film reel disc appearing later */}
      <Float floatIntensity={0.5} speed={0.8}>
        <mesh position={[-1.0, -0.1, -0.8]} rotation={[0.3, 0.2, 0]} visible={showPropsB}>
          <cylinderGeometry args={[0.6, 0.6, 0.08, 48]} />
          <meshStandardMaterial color={new THREE.Color(0.2, 0.2, 0.2)} metalness={0.8} roughness={0.35} />
        </mesh>
      </Float>

      {/* Postprocessing: film grain + vignette for cinema look */}
      <EffectComposer>
        <Noise premultiply blendFunction={THREE.AdditiveBlending} opacity={0.25} />
        <Vignette eskil={false} offset={0.25} darkness={0.8} />
      </EffectComposer>

      {/* Controls: on mobile allow swipe orbit; desktop handled by CameraRig tilt */}
      {useIsMobile() && (
        <OrbitControls enableZoom={false} enablePan={false} maxPolarAngle={Math.PI / 2.2} minPolarAngle={Math.PI / 3.0} />
      )}
      <CameraRig enableTilt={!useIsMobile()} />
    </>
  );
}

// Register custom material
// @ts-ignore
extend({ FilmStripMaterial });

/* --------------------------- React Sections --------------------------- */
const Section = ({ children, className = "", id }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.2, once: false });
  return (
    <section id={id} ref={ref} className={`relative w-full ${className}`}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: inView ? 1 : 0.4, y: inView ? 0 : 20 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </section>
  );
};

function Hero({ onRevealChange }) {
  const [showA, setShowA] = useState(false);
  const [showB, setShowB] = useState(false);
  const heroRef = useRef(null);
  const inView = useInView(heroRef, { amount: 0.6, once: false });

  useEffect(() => {
    // As hero is in view, start revealing props gradually
    if (inView) {
      const t1 = setTimeout(() => setShowA(true), 600);
      const t2 = setTimeout(() => setShowB(true), 1600);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    } else {
      setShowA(false); setShowB(false);
    }
  }, [inView]);

  useEffect(() => { onRevealChange?.({ a: showA, b: showB }); }, [showA, showB, onRevealChange]);

  return (
    <div ref={heroRef} className="relative h-[90vh] w-full overflow-hidden">
      {/* Dark base with subtle film grain background via CSS + grid overlays */}
      <div className="absolute inset-0 bg-black" />
      {/* green grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: `linear-gradient(rgba(16,185,129,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.15) 1px, transparent 1px)`,
          backgroundSize: "40px 40px, 40px 40px",
          backgroundPosition: "-1px -1px, -1px -1px",
          mixBlendMode: "screen",
        }}
      />
      {/* red grid */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `linear-gradient(rgba(239,68,68,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(239,68,68,0.12) 1px, transparent 1px)`,
          backgroundSize: "60px 60px, 60px 60px",
          backgroundPosition: "-1px -1px, -1px -1px",
          mixBlendMode: "screen",
        }}
      />

      {/* Canvas */}
      <Canvas shadows camera={{ fov: 42, position: [0, 0.8, 5.2] }}>
        <Suspense fallback={null}>
          <Scene showPropsA={showA} showPropsB={showB} />
        </Suspense>
      </Canvas>

      {/* Hero Copy */}
      <div className="pointer-events-none absolute inset-0 flex items-end md:items-center justify-center">
        <motion.div
          className="pointer-events-auto max-w-3xl text-center p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          
        </motion.div>
      </div>
    </div>
  );
}

function FeatureCard({ title, desc, accent = "green" }) {
  const isGreen = accent === "green";
  const grad = isGreen
    ? "from-green-500 to-green-700"
    : "from-red-500 to-red-800";
  const ring = isGreen ? "ring-green-700/40" : "ring-red-700/40";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      className={`relative rounded-2xl p-6 bg-zinc-900/60 border border-zinc-800/80 ring-1 ${ring} shadow-xl`}
    >
      <div className={`absolute -top-4 left-6 h-8 w-8 rounded-full bg-gradient-to-b ${grad} blur-[2px]`} />
      <h3 className="text-white font-bold text-lg">{title}</h3>
      <p className="text-zinc-400 mt-2 text-sm">{desc}</p>
    </motion.div>
  );
}

function Features() {
  return (
    <Section className="px-6 py-16 md:py-24 bg-black">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white text-center">
          Built for Cinephiles
        </h2>
        <p className="text-zinc-400 text-center mt-2 max-w-3xl mx-auto">
          Discover like Letterboxd, vibe like Zun Creative — but in So Filmy’s red/green noir.
        </p>
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            accent="green"
            title="Mood-based Recos"
            desc="Not just genre. Get picks for ‘cozy rainy night’, ‘thrill me’, or ‘feel-good Sunday’."
          />
          <FeatureCard
            accent="red"
            title="Spoiler Labels"
            desc="Posts clearly marked: spoiler-free, sarcastic, deep-dive — browse with confidence."
          />
          <FeatureCard
            accent="green"
            title="Structured Reviews"
            desc="Inbuilt critic templates with sections & images — be a pro without the pressure."
          />
          <FeatureCard
            accent="red"
            title="Communities & Groups"
            desc="Find same-taste folks, join watch parties, and keep themed clubs thriving."
          />
          <FeatureCard
            accent="green"
            title="Watchlists & Diaries"
            desc="Track what you’ve seen and what’s next. Maintain a living cine-diary."
          />
          <FeatureCard
            accent="red"
            title="Cinematic Profiles"
            desc="Public lists, follow system, and taste-matching badges to discover new friends."
          />
        </div>
      </div>
    </Section>
  );
}

function Communities() {
  return (
    <Section className="px-6 py-16 md:py-24 relative overflow-hidden" id="communities">
      {/* dark background with diagonal green/red grids */}
      <div className="absolute inset-0 -z-10"
        style={{
          backgroundColor: "#000",
          backgroundImage:
            `
            linear-gradient(135deg, rgba(16,185,129,0.08) 1px, transparent 1px),
            linear-gradient(45deg, rgba(239,68,68,0.08) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px, 70px 70px",
        }}
      />

      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white text-center">Communities</h2>
        <p className="text-zinc-400 text-center mt-2 max-w-3xl mx-auto">
          Create topic-based clubs, city meetups, and marathon groups. Follow threads or jump into voice watch-alongs.
        </p>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { title: "Auteur Club", desc: "Kubrick, Wong Kar-wai, PTA. Directors, dissected." },
            { title: "Horror Horde", desc: "Giallo nights, A24 chills, and midnight screamers." },
            { title: "Comfort Corner", desc: "Studio Ghibli, romcoms, and cozy classics for soul-reset." },
          ].map((c, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-2xl p-6 bg-zinc-900/60 border border-zinc-800 ring-1 ring-red-800/30 shadow-2xl"
            >
              <h3 className="text-white font-bold">{c.title}</h3>
              <p className="text-zinc-400 mt-2 text-sm">{c.desc}</p>
              <div className="mt-4 flex gap-2">
                <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-green-500 to-green-700 text-black">Join</span>
                <span className="text-xs px-2 py-1 rounded-full bg-gradient-to-r from-red-500 to-red-800 text-white">Explore</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function HowItWorks() {
  const steps = [
    { t: "Create your profile", a: "Tell us your vibes & favs." },
    { t: "Build your lists", a: "Watchlist, diary, and themed collections." },
    { t: "Post like a critic", a: "Use the structured template and add stills." },
    { t: "Find your crowd", a: "Communities, follows, and mood recos." },
  ];
  return (
    <Section className="px-6 py-16 md:py-24 bg-black" id="how">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-extrabold text-white text-center">How it works</h2>
        <div className="mt-10 grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-2xl p-6 bg-zinc-900/60 border border-zinc-800 ring-1 ring-green-800/30 shadow-xl"
            >
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-b from-red-500 to-red-800 mb-4" />
              <h4 className="text-white font-semibold">{s.t}</h4>
              <p className="text-zinc-400 text-sm mt-2">{s.a}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ----------------------------- Main Page ------------------------------ */
export default function SoFilmyLanding6() {
  const [reveal, setReveal] = useState({ a: false, b: false });
  return (
    <div className="min-h-screen w-full bg-black text-white">
      <Hero onRevealChange={setReveal} />
      <Features />
      <Communities />
      <HowItWorks />

      {/* CTA strip */}
      <Section className="px-6 py-16 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold">Lights. Camera. Community.</h2>
          <p className="text-zinc-400 mt-2">Join So Filmy — where taste finds its tribe.</p>
          <div className="mt-6 flex justify-center gap-4">
            <button className="px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-green-500 to-green-700 text-black shadow-[0_0_18px_rgba(16,185,129,0.55)] hover:shadow-[0_0_28px_rgba(16,185,129,0.75)] transition">
              Sign Up Free
            </button>
            <button className="px-6 py-3 rounded-2xl font-semibold bg-gradient-to-r from-red-500 to-red-800 text-white shadow-[0_0_18px_rgba(239,68,68,0.55)] hover:shadow-[0_0_28px_rgba(239,68,68,0.75)] transition">
              Browse Public Lists
            </button>
          </div>
        </div>
      </Section>

      {/* tiny footer note without a real footer layout */}
      <div className="px-6 pb-10 text-center text-xs text-zinc-600">© {new Date().getFullYear()} So Filmy</div>
    </div>
  );
}

/* ----------------------------- Tailwind Tips -------------------------- */
// Ensure Tailwind is configured and the page is wrapped with <div className="bg-black"> as used above.
// The gradients are used on buttons and accents only; background stays mostly black.

/* ------------------------------ Usage --------------------------------- */
// 1) Drop this file as `SoFilmyLanding.jsx` inside your React 18 app.
// 2) Make sure you have these deps (versions per your request):
//    "@react-three/drei": "^9.56.3",
//    "@react-three/fiber": "^8.13.7",
//    "@react-three/postprocessing": "^2.15.10",
//    "framer-motion": "^12.23.12",
//    "react": "18.2.0", "react-dom": "18.2.0",
//    Tailwind CSS configured.
// 3) Use: <SoFilmyLanding /> in your route. No navbar/footer included by design.
// 4) For best visuals, ensure your canvas container is not overlapped by other fixed elements.
