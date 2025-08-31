import React,{useState,useEffect,useRef} from 'react';
import ReactStars from 'react-stars';
import { BallTriangle } from 'react-loader-spinner';
import {getDocs} from 'firebase/firestore';
import { moviesRef } from '../firebase/firebase';
import {Link} from "react-router-dom";

function Analysis() {
  const [datas,setData]=useState([]);
  const[loading , setloader]=useState(false);

  // reference to the scroll container
  const scrollRef = useRef(null);

  useEffect(()=>{
    async function getData(){
      setloader(true);
      const movieData= await getDocs(moviesRef);
      movieData.forEach((docs)=>
        setData((prv)=>[...prv,{...(docs.data()),id:docs.id}])
      )
      setloader(false);
    }
    getData();
  },[]);

  // ✅ Handle vertical mouse wheel → horizontal scroll
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (e.deltaY !== 0) {
        e.preventDefault(); // stop page scroll
        el.scrollBy({
          left: e.deltaY,
          behavior: "smooth",
        });
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div className="px-3 sm:mt-4 mt-24 sm:mx-5">
      {loading ? (
        <div className="flex justify-center items-center min-h-screen">
          <BallTriangle height={70} width={70} radius={5} color="#4fa94d" ariaLabel="ball-triangle-loading" />
        </div>   
      ) : (
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent pb-4 snap-x snap-mandatory"
        >
          {datas.map((e, i) => (
            <Link to={`/details/${e.id}`} key={i} className="shrink-0 snap-start">
              <div className="w-64 sm:w-72 md:w-80 card p-4 bg-white rounded shadow-md transition-transform duration-300 transform hover:translate-y-2 hover:scale-105 hover:shadow-red-500 h-full">
                
                <div className='flex justify-center'>
                  <img
                    className="w-full h-72 object-cover mb-3 rounded"
                    src={e.image}
                    alt={e.name}
                  />
                </div>

                {/* Divider */}
                <div className="border-t-2 border-green-500 border-dashed my-3"></div>

                {/* ✅ Text clamp so it stays inside card */}
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
  )
}

export default Analysis;
