import React, { useRef,useState} from "react";
import Analysis from "./analysis";
import MovieLists from "./movielists";
import Explore from "./explore";
import AISuggestion from "./aisuggestion";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

const options = [
    { label: "Analysis", value: "analysis" },
    { label: "Lists", value: "lists" },
    { label: "Explore", value: "explore" },
    { label: "AI Suggestion", value: "ai-suggestion" }
];

export default function SecondBar() {
  const [selected, setSelected] = useState("analysis");
    const analysisRef = useRef(null);
    const listsRef = useRef(null);
    const exploreRef = useRef(null);
    const aiRef = useRef(null);

    const notify = () => toast("Feature coming soon!🍿🎞️ 🎥");

   const header = document.querySelector('.header');
const headerHeight = header ? header.offsetHeight : 160;
    const HEADER_HEIGHT = headerHeight; // Adjust this value based on your actual header height

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
            case "ai-suggestion":
                sectionRef = aiRef;
                break;
            default:
                return;
        }

        if (sectionRef && sectionRef.current) {
            const elementTop = sectionRef.current.getBoundingClientRect().top;
            const offsetPosition = window.pageYOffset + elementTop - HEADER_HEIGHT;

            window.scrollTo({
                top: offsetPosition,
                behavior: "smooth"
            });
        }
    };

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
                                    if (option.value === "lists") {
                                        notify();
                                    } else {
                                        handleScroll(option.value);
                                    }
                                }}
                                className={`text-white font-semibold text-lg transition-colors ${ selected === option.value ? "text-red-500 border-b-2 border-red-500" : "hover:text-red-400" } pb-1`}
                            >
                                {option.label}
                            </button>
                        ))}
                        <ToastContainer
                            position="top-right"
                            autoClose={3000}
                            hideProgressBar={false}
                            newestOnTop={false}
                            closeOnClick
                            rtl={false}
                            pauseOnFocusLoss
                            draggable
                            pauseOnHover
                            toastStyle={{ backgroundColor: "black", color: "white" }}
                            progressStyle={{ background: "linear-gradient(to right, red, green)" }}
                        />
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="mt-20 px-6 space-y-20">
                <section ref={analysisRef} id="analysis">
                    <Analysis />
                </section>

               {/* <section ref={listsRef} id="lists">
                    <MovieLists />
                </section>*/}

                <section ref={exploreRef} id="explore">
                    <Explore />
                </section>

                <section ref={aiRef} id="ai-suggestion">
                    <AISuggestion />
                </section>
            </div>
        </div>
    );
}
