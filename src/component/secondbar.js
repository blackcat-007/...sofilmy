import React, { useState, Suspense, lazy } from "react";

const Analysis = lazy(() => import("./analysis"));
const Explore = lazy(() => import("./explore"));
const MovieLists = lazy(() => import("./movielists"));
const AISuggestion = lazy(() => import("./aisuggestion"));

export default function SecondBar() {
    const [selected, setSelected] = useState("analysis");

    const renderSection = () => {
        switch (selected) {
            case "analysis":
                return <Analysis />;
            case "lists":
                return <MovieLists />;
            case "explore":
                return <Explore />;
            case "ai-suggestion":
                return <AISuggestion />;
            default:
                return null;
        }
    };

    return (
        <div>
            <div className="fixed top-[4.5rem] left-0 w-full z-20 mt-2 sm:mt-7">
                <div className="backdrop-blur bg-black/70 flex items-center justify-between px-6 py-3">
                    <div className="flex space-x-8 ml-10">
                        {["analysis", "lists", "explore", "ai-suggestion"].map((value) => (
                            <button
                                key={value}
                                onClick={() => setSelected(value)}
                                className={`text-white font-semibold text-lg transition-colors ${selected === value ? "text-red-500 border-b-2 border-red-500" : "hover:text-red-400"} pb-1`}
                            >
                                {value.charAt(0).toUpperCase() + value.slice(1).replace("-", " ")}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-20 px-6">
                <Suspense fallback={<div>Loading...</div>}>
                    {renderSection()}
                </Suspense>
            </div>
        </div>
    );
}
