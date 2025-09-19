import React, { useRef, useState, useEffect, Suspense, lazy } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ✅ Lazy imports
const Analysis = lazy(() => import("./analysis"));
const Explore = lazy(() => import("./explore"));
const MovieLists = lazy(() => import("./movielists"));
//const AISuggestion = lazy(() => import("./aisuggestion"));

const options = [
  { label: "Analysis", value: "analysis" },
  { label: "Lists", value: "lists" },
  { label: "Explore", value: "explore" },
 // { label: "AI Suggestion", value: "ai-suggestion" },
];

export default function SecondBar() {
  const [selected, setSelected] = useState("analysis");
  const [loadedSections, setLoadedSections] = useState({}); // ✅ track loaded sections

  const analysisRef = useRef(null);
  const listsRef = useRef(null);
  const exploreRef = useRef(null);
  const aiRef = useRef(null);

  const header = document.querySelector(".header");
  const headerHeight = header ? header.offsetHeight : 170;
  const HEADER_HEIGHT = headerHeight;

  // ✅ Scroll to section when clicking navbar
  const handleScroll = (value) => {
    let sectionRef;
    switch (value) {
      case "analysis":
        sectionRef = analysisRef;
        break;
      case "lists":
        sectionRef = listsRef;
        break;
      case "explore":
        sectionRef = exploreRef;
        break;
      //case "ai-suggestion":
        //sectionRef = aiRef;
        //break;
      default:
        return;
    }
    if (sectionRef && sectionRef.current) {
      const elementTop = sectionRef.current.getBoundingClientRect().top;
      const offsetPosition =
        window.pageYOffset + elementTop - HEADER_HEIGHT;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  // ✅ Scrollspy logic
  useEffect(() => {
    const handleScrollSpy = () => {
      const sections = [
        { id: "analysis", ref: analysisRef },
        { id: "lists", ref: listsRef },
        { id: "explore", ref: exploreRef },
        //{ id: "ai-suggestion", ref: aiRef },
      ];

      const scrollPosition = window.pageYOffset + HEADER_HEIGHT + 1;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section.ref.current) {
          const offsetTop = section.ref.current.offsetTop;
          if (scrollPosition >= offsetTop) {
            setSelected(section.id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScrollSpy);
    return () => {
      window.removeEventListener("scroll", handleScrollSpy);
    };
  }, [HEADER_HEIGHT]);

  // ✅ IntersectionObserver for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const section = entry.target.getAttribute("id");
            setLoadedSections((prev) => ({ ...prev, [section]: true }));
          }
        });
      },
      { threshold: 0.25 } // load when 25% visible
    );

    [analysisRef, listsRef, exploreRef, aiRef].forEach((ref) => {
      if (ref.current) observer.observe(ref.current);
    });

    return () => {
      [analysisRef, listsRef, exploreRef, aiRef].forEach((ref) => {
        if (ref.current) observer.unobserve(ref.current);
      });
    };
  }, []);

  return (
    <div>
      {/* Top Bar */}
      <div className="fixed top-[4.5rem] left-0 w-full z-20 mt-2 sm:mt-7">
        <div className="backdrop-blur bg-black/70 flex items-center justify-between px-6 py-3">
          <div className="flex space-x-8 ml-10">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSelected(option.value);
                  handleScroll(option.value);
                }}
                className={`text-white font-semibold text-lg transition-colors ${
                  selected === option.value
                    ? "text-red-500 border-b-2 border-red-500"
                    : "hover:text-red-400"
                } pb-1`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="mt-20 px-6 space-y-20">
        <section ref={analysisRef} id="analysis" className="min-h-screen">
          {loadedSections.analysis && (
            <Suspense fallback={<div>Loading Analysis...</div>}>
              <Analysis />
            </Suspense>
          )}
        </section>

        <section ref={listsRef} id="lists" className="min-h-screen">
          {loadedSections.lists && (
            <Suspense fallback={<div>Loading Lists...</div>}>
              <MovieLists />
            </Suspense>
          )}
        </section>

        <section ref={exploreRef} id="explore" className="min-h-screen">
          {loadedSections.explore && (
            <Suspense fallback={<div>Loading Explore...</div>}>
              <Explore />
            </Suspense>
          )}
        </section>

        {/*<section ref={aiRef} id="ai-suggestion" className="min-h-screen">
          {loadedSections["ai-suggestion"] && (
            <Suspense fallback={<div>Loading AI Suggestions...</div>}>
              <AISuggestion />
            </Suspense>
          )}
        </section>*/}
      </div>

    
    </div>
  );
}
