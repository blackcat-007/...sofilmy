import React, { useEffect, useState } from "react";
import ReactStars from "react-stars";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { MagnifyingGlass } from "react-loader-spinner";
import Reviews from "./reviews";
import { useParams } from "react-router-dom"; // ✅ make sure this is imported
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
function Details() {
  const [loading, setLoader] = useState(false);
  const [movie, setMovie] = useState(null);
  const { id } = useParams();

  useEffect(() => {
    async function getData() {
      setLoader(true);
      try {
        const docRef = doc(db, "movies", id); // fetch by specific id
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setMovie({ id: docSnap.id, ...docSnap.data() });
        } else {
          console.error("Movie not found");
        }
      } catch (error) {
        console.error("Error fetching movie:", error);
      } finally {
        setLoader(false);
      }
    }

    if (id) getData();
  }, [id]);

  if (loading) {
    return (
      <div className="h-96 w-full flex justify-center items-start">
        <MagnifyingGlass
          height={80}
          width={80}
          ariaLabel="magnifying-glass-loading"
          glassColor={"pink"}
          color={"green"}
        />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="p-4 mt-4 text-center text-gray-400">
        Movie not found.
      </div>
    );
  }

  return (
    <div className="p-4 mt-4 flex flex-col items-center w-full">
      <div className="bg-gray-900 rounded-xl p-6 shadow-lg flex flex-col md:flex-row gap-6 w-full md:w-5/6">
        {/* Movie Poster */}
        <img
          className="h-96 w-72 object-cover rounded-lg"
          src={movie.image}
          alt={movie.name}
        />

        {/* Movie Details */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-200">{movie.name}</h2>
          <div className="text-gray-400 mt-1">({movie.year})</div>

          {/* Ratings */}
          <div className="flex items-center gap-4 mt-2">
            <ReactStars
              size={22}
              half={true}
              value={movie.userStars || 0}
              edit={false}
            />
            <span className="text-gray-300">
              ⭐ {movie.tmdbRating} / 10 TMDB
            </span>
          </div>

          {/* Description */}
          <p className="mt-4 text-gray-300 leading-relaxed">
            {movie.description}
          </p>

          {/* Analysis */}
{movie.analysis && (
  <div className="mt-6 bg-gray-800 p-6 rounded-lg">
    <h2 className="text-2xl font-bold text-gray-200 mb-4">Thoughts of {movie.postedBy}<img src="/icons/wired-lineal-237-star-rating-hover-pinch.gif" alt="Arrow right" className="inline-block ml-2 h-6 w-6 bg-transparent" /> </h2>

    {typeof movie.analysis === "string" ? (
      <p className="text-gray-300 text-base leading-relaxed">{movie.analysis}</p>
    ) : (
      <div className="space-y-6">
        {Object.entries(movie.analysis).map(([key, value]) => (
          <div key={key}>
            {/* Sub-heading */}
            <h3 className="text-xl font-semibold text-gray-100 mb-2">
              {key}
            </h3>
            {/* Paragraph */}
            <p className="text-gray-300 text-base leading-relaxed">
              {String(value)}
            </p>
          </div>
        ))}
      </div>
    )}
  </div>
)}


          {/* Cast */}
          {movie.cast?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-200">Cast</h3>
              <ul className="list-disc list-inside text-gray-300 grid grid-cols-2 md:grid-cols-3 gap-1 mt-2">
                {movie.cast.map((actor, i) => (
                  <li key={i}>{actor}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Genres */}
          {movie.genres?.length > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold text-gray-200">Genres</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {movie.genres.map((g, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300"
                  >
                    {g}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Watch Providers */}
           <div>
                <div className="text-lg font-semibold text-gray-200 ">Available On</div>
                {["flatrate", "rent", "buy"].map((k) => (
                  <div key={k} className="mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                      {k}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {movie.watchProviders?.[k]?.length ? (
                        movie.watchProviders[k].map((p) => (
                          <div
                            key={`${k}-${p.provider_id}`}
                            className="flex items-center gap-2 bg-gray-800/50 border border-gray-700 px-2 py-1 rounded-lg"
                          >
                            {p.logo_path ? (
                              <img
                                src={`${TMDB_IMG}${p.logo_path}`}
                                alt={p.provider_name}
                                className="w-6 h-6 rounded"
                              />
                            ) : (
                              <div className="w-6 h-6 bg-gray-600 rounded" />
                            )}
                            <span className="text-xs">{p.provider_name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-sm text-gray-400">—</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

          {/* External Links */}
          <div className="mt-4 flex gap-4">
            {movie.imdb && (
              <a
                href={movie.imdb}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                IMDb
              </a>
            )}
            {movie.letterboxd && (
              <a
                href={movie.letterboxd}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:underline"
              >
                Letterboxd
              </a>
            )}
          </div>

          {/* Flags */}
          <div className="mt-3 text-sm text-gray-400">
            {movie.sarcasm && <span>😏 Sarcasm Included </span>}
            {movie.spoilerFree && <span>🚫 Spoiler Free </span>}
          </div>

          {/* Reviews Section */}
          <div className="mt-6">
            <Reviews
              id={movie.id}
              prevRating={movie.rating || 0}
              totalusers={movie.user || 0}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Details;
