import React, { useState, useEffect, useRef } from "react";
import ReactStars from "react-stars";
import { CircleArrowOutDownRight } from "lucide-react";
import { BallTriangle } from "react-loader-spinner";
import { getDocs } from "firebase/firestore";
import { moviesRef } from "../firebase/firebase";
import { Link } from "react-router-dom";

function Analysis() {
  const [datas, setData] = useState([]);
  const [loading, setLoader] = useState(false);
  const [bgImage, setBgImage] = useState(null);

  const scrollRef = useRef(null);
  const cardRefs = useRef([]); 
  const [isMobile, setIsMobile] = useState(false);
  const [activeIndex, setActiveIndex] = useState(null); // 👈 track visible card for mobile

  // ✅ Detect device size (mobile vs desktop)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);

    const handler = (e) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    async function getData() {
      setLoader(true);
      const movieData = await getDocs(moviesRef);
      movieData.forEach((docs) =>
        setData((prv) => [...prv, { ...(docs.data()), id: docs.id }])
      );
      setLoader(false);
    }
    getData();
  }, []);

  // ✅ Horizontal scroll with mouse wheel
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollBy({ left: e.deltaY, behavior: "smooth" });
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // ✅ For mobile → detect which card is in view
  useEffect(() => {
    if (!isMobile || !cardRefs.current.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = Number(entry.target.getAttribute("data-index"));
          if (entry.isIntersecting) {
            const img = entry.target.getAttribute("data-image");
            if (img) setBgImage(img);
            setActiveIndex(idx); // 👈 apply hover-like effect
          }
        });
      },
      {
        root: scrollRef.current,
        threshold: 0.6, // at least 60% visible to count
      }
    );

    cardRefs.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [isMobile, datas]);

  return (
    <div className="relative px-3 py-8 sm:mt-4 mt-24 -ml-2 sm:mx-8 rounded-xl overflow-hidden">
      {/* ✅ Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-black/30 z-[1]"></div>
        {bgImage && (
          <div
            key={bgImage}
            className="absolute inset-0 bg-cover bg-center blur-xl scale-110 opacity-0 animate-fadeIn"
            style={{ backgroundImage: `url(${bgImage})` }}
          ></div>
        )}
      </div>

      {/* ✅ Content */}
      <div className="relative z-10">
        <div className="flex justify-between -mt-5">
          <h1 className="text-2xl font-bold mb-4 text-left">Top Analysis</h1>
          <button className="bg-gradient-to-r from-red-500 to-red-900 hover:from-red-800 hover:to-red-950 text-white sm:px-4 px-2  sm:h-10 h-7 w-auto sm:text-base text-xs rounded">
            See more
            <CircleArrowOutDownRight className="inline-block ml-2 sm:h-6 sm:w-6 h-4 w-4 bg-transparent" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center min-h-screen">
            <BallTriangle
              height={70}
              width={70}
              radius={5}
              color="#4fa94d"
              ariaLabel="ball-triangle-loading"
            />
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-6 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pb-4 snap-x snap-mandatory"
          >
            {datas.map((e, i) => (
              <Link to={`/details/${e.id}`} key={i} className="shrink-0 snap-start">
                <div
                  ref={(el) => (cardRefs.current[i] = el)} 
                  data-image={e.image}
                  data-index={i}
                  className={`w-64 sm:w-72 md:w-80 card p-4 bg-white rounded shadow-lg transition-transform duration-300 transform h-full
                    ${
                      isMobile
                        ? activeIndex === i
                          ? "translate-y-2 scale-95 shadow-red-500"
                          : ""
                        : "hover:translate-y-2 hover:scale-95 hover:shadow-red-500"
                    }`}
                  onMouseEnter={() => !isMobile && setBgImage(e.image)}
                  onMouseLeave={() => !isMobile && setBgImage(null)}
                >
                  <div className="flex justify-center">
                    <img
                      className="w-full h-72 object-cover mb-3 rounded"
                      src={e.image}
                      alt={e.name}
                    />
                  </div>

                  <div className="border-t-2 border-green-500 border-dashed my-3"></div>

                  <h1 className="truncate">
                    <span className="text-red-400 mr-1">Name:</span>
                    {e.name}
                  </h1>

                  <h2 className="flex items-center">
                    <span className="text-red-400 mr-2">Rating:</span>
                    <ReactStars
                      size={20}
                      half={true}
                      value={e.rating / e.user}
                      edit={false}
                    />
                  </h2>

                  <p className="text-gray-500 line-clamp-2">{e.description}</p>

                  <h3>
                    <span className="text-red-400 mr-2">Year:</span>
                    {e.year}
                  </h3>

                  <div className="mt-3 text-sm text-gray-400">
                    {e.sarcasm && <span>😏 Sarcasm Included </span>}
                    {e.spoilerFree && <span>🚫 Spoiler Free </span>}
                  </div>

                  <span className="text-gray-500 text-left font-thin">
                    {e.postedBy && (
                      <>
                        <span className="inline-block truncate max-w-[150px] align-middle">
                          by {e.postedBy}
                        </span>
                        <img
                          src="/icons/wired-lineal-237-star-rating-hover-pinch.gif"
                          alt="Arrow right"
                          className="inline-block ml-2 h-6 w-6 bg-transparent"
                        />
                      </>
                    )}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Analysis;
