import React, { useState } from "react";
import Cards from "./cards";
import MovieLists from "./movielists";
import NewReleases from "./newreleases";

const options = [
    { label: "Analysis", value: "analysis" },
    { label: "Movie Lists", value: "movielists" },
    { label: "New Releases", value: "newreleases" },
];

export default function SecondBar() {
    const [selected, setSelected] = useState("analysis");

    const renderComponent = () => {
        switch (selected) {
            case "analysis":
                return <Cards />;
            case "movielists":
                return <MovieLists />;
            case "newreleases":
                return <NewReleases />;
            default:
                return null;
        }
    };

    return (
        <div>
        <div className="fixed top-[4.5rem] left-0 w-full z-50">
            <div className="backdrop-blur bg-black/70 flex items-center px-6 py-3">
                <div className="flex space-x-8">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => setSelected(option.value)}
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
            <div className="mt-16 px-6">
                {/* {renderComponent()} */}
                <Cards />
            </div>
        </div>
    );
}