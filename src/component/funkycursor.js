"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function FunkyCursor() {
  const [stars, setStars] = useState([]);

  useEffect(() => {
    const handleMove = (e) => {
      const newStar = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };

      setStars((prev) => [...prev.slice(-20), newStar]); // keep last 20 stars
    };

    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  return (
    <>
      {/* Hide default cursor */}
      <div className="fixed inset-0 z-[9999] pointer-events-none cursor-none">
        <AnimatePresence>
          {stars.map((star) => (
            <motion.div
              key={star.id}
              initial={{ opacity: 1, scale: 1, x: star.x, y: star.y }}
              animate={{ opacity: 0, scale: 0.3, y: star.y - 40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background:
                  Math.random() > 0.5 ? "gold" : "limegreen", // funky star colors
                left: star.x,
                top: star.y,
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
