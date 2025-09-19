"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export default function AnimatedSubtitle() {
  const phrases = [
    "Discuss Movies",
    "Write Reviews with Ease",
    "Discover Hidden Gems",
    "Join Movie Buffs",
    "Explore Film Genres",
    "Share Movie Lists",
    "Stay Updated",
    "Track Watched Films",
    "Connect with Cinephiles",
    
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 3000); // changes every 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-6 mt-4 ml-1 ">
      <AnimatePresence mode="wait">
        <motion.span
          key={phrases[index]}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.6 }}
          className="absolute sm:text-xs text-[10px]  text-zinc-400"
        >
          {phrases[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
