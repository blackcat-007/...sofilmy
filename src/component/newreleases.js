import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { BallTriangle } from "react-loader-spinner";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w200";

const GRADIENT_ACTIVE = "bg-gradient-to-r from-red-500 to-red-700";
const BTN_INACTIVE = "bg-gray-700 hover:bg-gray-600";

function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [trending, setTrending] = useState([]);
  const [trendingFilter, setTrendingFilter] = useState("day");

  const [trailers, setTrailers] = useState([]);
  const [trailersScope, setTrailersScope] = useState("popular");

  const [popular, setPopular] = useState([]);
  const [popularScope, setPopularScope] = useState("streaming");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // YouTube trailer modal (global)
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);

  // Movie/TV details modal
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieDetails, setMovieDetails] = useState(null);
  const [movieCast, setMovieCast] = useState([]);
  const [crewCore, setCrewCore] = useState([]); // Director/Producer(s)
  const [similarItems, setSimilarItems] = useState([]);
  const [activeMediaType, setActiveMediaType] = useState("movie"); // "movie" | "tv"

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // ---- Utilities ----
  const guardKey = () => {
    if (!TMDB_API_KEY) {
      setError("TMDB API key is missing. Set REACT_APP_TMDB_API_KEY in your env.");
      return false;
    }
    return true;
  };

  const fetchJson = async (url) => {
    const res = await fetch(url, { headers: { accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  };

  const inferType = (item) =>
    item?.media_type ? item.media_type : item?.first_air_date ? "tv" : "movie";

  // ---- Search with Debounce ----
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowSearchDropdown(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSearch(value);
    }, 400);
  };

  const fetchSearch = async (query) => {
    if (!query?.trim()) {
      setSearchResults([]);
      return;
    }
    if (!guardKey()) return;
    try {
      const data = await fetchJson(
        `${TMDB_API_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
      );
      setSearchResults(data.results || []);
    } catch (e) {
      setError(e.message);
    }
  };

  // ---- Close dropdown on outside click ----
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ---- Horizontal scroll with wheel ----
  useEffect(() => {
    const scrollContainers = document.querySelectorAll(".scroll-x");
    scrollContainers.forEach((container) => {
      const onWheel = (e) => {
        if (window.innerWidth > 768) {
          e.preventDefault();
          container.scrollBy({ left: e.deltaY < 0 ? -120 : 120, behavior: "smooth" });
        }
      };
      container.addEventListener("wheel", onWheel, { passive: false });
      return () => container.removeEventListener("wheel", onWheel);
    });
  }, []);

  // ---- Fetch sections ----
  useEffect(() => {
    (async () => {
      if (!guardKey()) return;
      try {
        const data = await fetchJson(
          `${TMDB_API_URL}/trending/movie/${trendingFilter}?api_key=${TMDB_API_KEY}`
        );
        setTrending(data.results || []);
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [trendingFilter]);

  useEffect(() => {
    (async () => {
      if (!guardKey()) return;
      try {
        let url =
          trailersScope === "popular"
            ? `${TMDB_API_URL}/movie/popular?api_key=${TMDB_API_KEY}`
            : trailersScope === "ontv"
            ? `${TMDB_API_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}`
            : `${TMDB_API_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`;
        const data = await fetchJson(url);
        setTrailers(
          (data.results || []).map((r) => ({
            ...r,
            media_type: r.first_air_date ? "tv" : "movie",
            title: r.title || r.name,
          }))
        );
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [trailersScope]);

  useEffect(() => {
    (async () => {
      if (!guardKey()) return;
      try {
        let url =
          popularScope === "streaming"
            ? `${TMDB_API_URL}/movie/popular?api_key=${TMDB_API_KEY}`
            : popularScope === "ontv"
            ? `${TMDB_API_URL}/tv/popular?api_key=${TMDB_API_KEY}`
            : `${TMDB_API_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`;
        const data = await fetchJson(url);
        setPopular(
          (data.results || []).map((r) => ({
            ...r,
            media_type: r.first_air_date ? "tv" : "movie",
            title: r.title || r.name,
          }))
        );
      } catch (e) {
        setError(e.message);
      }
    })();
  }, [popularScope]);

  // ---- Trailer Modal ----
  const openTrailer = async (item) => {
    if (!guardKey()) return;
    try {
      const type = inferType(item);
      const data = await fetchJson(`${TMDB_API_URL}/${type}/${item.id}/videos?api_key=${TMDB_API_KEY}`);
      const vids = data.results || [];
      const y =
        vids.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
        vids.find((v) => v.site === "YouTube" && v.type === "Teaser");
      if (y) {
        setTrailerKey(y.key);
        setShowTrailer(true);
      } else {
        setError("No trailer available.");
      }
    } catch (e) {
      setError(e.message);
    }
  };

  // ---- Movie/TV Details Modal ----
  const openDetailsModal = async (item) => {
    if (!guardKey()) return;
    const type = inferType(item); // movie or tv (safe if user clicks TV in Popular->ontv)
    setActiveMediaType(type);
    setLoading(true);
    try {
      // append videos + credits in a single call
      const details = await fetchJson(
        `${TMDB_API_URL}/${type}/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits`
      );

      setMovieDetails(details);

      // Core crew (Director/Producer/Executive Producer) + Top cast
      const coreJobs = new Set(["Director", "Producer", "Executive Producer"]);
      const crew = (details.credits?.crew || []).filter((c) => coreJobs.has(c.job));
      const cast = (details.credits?.cast || []).slice(0, 12);
      setCrewCore(crew);
      setMovieCast(cast);

      // Similar (movie or tv)
      const similar = await fetchJson(
        `${TMDB_API_URL}/${type}/${item.id}/similar?api_key=${TMDB_API_KEY}`
      );
      setSimilarItems(similar.results || []);

      setShowMovieModal(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ item, onClick }) => (
    <div className="w-40 flex-shrink-0 cursor-pointer" onClick={onClick} title={item.title}>
      <img
        src={item.poster_path ? `${TMDB_IMG}${item.poster_path}` : ""}
        alt={item.title}
        className="rounded-xl h-60 w-40 object-cover bg-gray-800"
        loading="lazy"
      />
      <p className="mt-2 text-sm line-clamp-2">{item.title}</p>
    </div>
  );

  // Helpers for details
  const readableRuntime = (d) => {
    if (!d) return "";
    const h = Math.floor(d / 60);
    const m = d % 60;
    return h ? `${h}h ${m}m` : `${m}m`;
  };

  const getFirstYoutubeKey = (videos) => {
    if (!videos) return null;
    const arr = videos.results || [];
    const t =
      arr.find((v) => v.site === "YouTube" && v.type === "Trailer") ||
      arr.find((v) => v.site === "YouTube");
    return t?.key || null;
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen px-4 py-6">
      {/* Search Bar with Dropdown */}
      <div className="relative flex justify-center mb-6" ref={searchRef}>
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full md:w-2/3 p-3 rounded-l-xl bg-gray-800 text-white outline-none"
        />
        <button className={`px-6 rounded-r-xl ${GRADIENT_ACTIVE}`}>Search</button>

       {showSearchDropdown && searchResults.length > 0 && (
  <div className="absolute top-full mt-2 w-full md:w-2/3 bg-gray-800 rounded-lg shadow-lg max-h-80 overflow-y-auto z-50">
    {searchResults.map((m) => (
      <div
        key={m.id}
        onClick={() => openDetailsModal({ ...m, media_type: "movie" })}
        className="flex items-center p-2 hover:bg-gray-700 transition cursor-pointer"
      >
        <img
          src={m.poster_path ? `${TMDB_IMG}${m.poster_path}` : ""}
          alt={m.title}
          className="w-12 h-16 rounded-md object-cover mr-3"
          loading="lazy"
        />
        <span>{m.title}</span>
      </div>
    ))}
  </div>
)}

      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}
      {loading && (
        <div className="flex justify-center items-center py-10">
          <BallTriangle height={70} width={70} color="#ef4444" />
        </div>
      )}

      {/* Trending */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">Trending</h2>
        <div className="flex space-x-2">
            <button
              onClick={() => setTrendingFilter("day")}
              className={`px-4 py-1 rounded-xl ${
                trendingFilter === "day" ? GRADIENT_ACTIVE : BTN_INACTIVE
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTrendingFilter("week")}
              className={`px-4 py-1 rounded-xl ${
                trendingFilter === "week" ? GRADIENT_ACTIVE : BTN_INACTIVE
              }`}
            >
              This Week
            </button>
          </div>
        </div>
        <div className="flex overflow-x-auto scroll-x space-x-4 pb-3">
          {trending.map((m) => (
            <Card key={m.id} item={{ ...m, media_type: "movie" }} onClick={() => openDetailsModal({ ...m, media_type: "movie" })} />
          ))}
        </div>
      </div>

      {/* Latest Trailers */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">Latest Trailers</h2>
          <div className="flex flex-wrap justify-center gap-2">
  {["popular", "ontv", "intheaters"].map((scope) => (
    <button
      key={scope}
      onClick={() => setTrailersScope(scope)}
      className={`px-4 py-1 rounded-xl text-sm sm:text-base ${
        trailersScope === scope ? GRADIENT_ACTIVE : BTN_INACTIVE
      }`}
    >
      {scope}
    </button>
  ))}
</div>

        </div>
        <div className="flex overflow-x-auto scroll-x space-x-4 pb-3">
          {trailers.map((m) => (
            <Card key={`${m.media_type}-${m.id}`} item={m} onClick={() => openTrailer(m)} />
          ))}
        </div>
      </div>

      {/* What's Popular */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-2xl font-bold">What's Popular</h2>
          <div className="flex flex-wrap justify-center gap-2">
            {["streaming", "ontv", "intheaters"].map((scope) => (
              <button
                key={scope}
                onClick={() => setPopularScope(scope)}
                className={`px-4 py-1 rounded-xl text-sm sm:text-base ${
                  popularScope === scope ? GRADIENT_ACTIVE : BTN_INACTIVE
                }`}
              >
                {scope}
              </button>
            ))}
          </div>
        </div>
        <div className="flex overflow-x-auto scroll-x space-x-4 pb-3">
          {popular.map((m) => (
            <Card key={m.id} item={m} onClick={() => openDetailsModal(m)} />
          ))}
        </div>
      </div>

      {/* Trailer Modal */}
      {showTrailer && trailerKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => {
              setShowTrailer(false);
              setTrailerKey(null);
            }}
          />
          <div className="relative z-50 w-11/12 md:w-3/4 lg:w-1/2 aspect-video bg-black rounded-2xl shadow-xl overflow-hidden">
            <iframe
              title="Trailer"
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
            <button
              onClick={() => {
                setShowTrailer(false);
                setTrailerKey(null);
              }}
              className={`absolute top-3 right-3 px-3 py-1 rounded-lg ${GRADIENT_ACTIVE}`}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Movie/TV Details Modal */}
      {showMovieModal && movieDetails && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowMovieModal(false)}
          />
          <div className="relative z-50 w-11/12 md:w-3/4 lg:w-2/3 bg-gray-900 rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[90vh]">
            {/* Header: Poster + Info */}
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={movieDetails.poster_path ? `${TMDB_IMG}${movieDetails.poster_path}` : ""}
                alt={movieDetails.title || movieDetails.name}
                className="w-44 h-64 rounded-lg object-cover bg-gray-800"
                loading="lazy"
              />
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {movieDetails.title || movieDetails.name}
                </h2>
                <p className="text-sm text-gray-400 mb-3">
                  {(movieDetails.release_date || movieDetails.first_air_date || "").slice(0, 10)}
                  {activeMediaType === "movie" && movieDetails.runtime
                    ? ` • ${readableRuntime(movieDetails.runtime)}`
                    : activeMediaType === "tv" && movieDetails.episode_run_time?.length
                    ? ` • ${movieDetails.episode_run_time[0]}m/ep`
                    : ""}
                  {movieDetails.genres?.length ? ` • ${movieDetails.genres.map((g) => g.name).join(", ")}` : ""}
                </p>
                <p className="mb-4 leading-relaxed">
                  {movieDetails.overview || "No description available."}
                </p>

                {/* Trailer embed (if available) */}
{getFirstYoutubeKey(movieDetails.videos) && (
  <div className="mt-4">
    <iframe
      title="Trailer"
      className="w-full aspect-video rounded-xl"
      src={`https://www.youtube.com/embed/${getFirstYoutubeKey(movieDetails.videos)}?autoplay=0`}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  </div>
)}
{/* Trailer button */}
                {getFirstYoutubeKey(movieDetails.videos) && (
                  <button
                    onClick={() => {
                      const key = getFirstYoutubeKey(movieDetails.videos);
                      if (key) {
                        setTrailerKey(key);
                        setShowTrailer(true);
                      }
                    }}
                    className={`px-4 py-2 mt-2 rounded-lg ${GRADIENT_ACTIVE}`}
                  >
                    Watch Trailer
                  </button>
                )}
              </div>
            </div>

            {/* Crew Spotlight */}
            {!!crewCore.length && (
              <>
                <h3 className="text-xl font-semibold mt-6 mb-3">Director & Producers</h3>
                <div className="flex overflow-x-auto scroll-x space-x-4 pb-3">
                  {crewCore.map((c) => (
                    <div key={`${c.credit_id}`} className="w-32 flex-shrink-0 text-center">
                      <img
                        src={c.profile_path ? `${TMDB_PROFILE}${c.profile_path}` : ""}
                        alt={c.name}
                        className="w-24 h-24 object-cover rounded-full mx-auto bg-gray-700"
                        loading="lazy"
                      />
                      <p className="mt-2 text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.job}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Cast */}
            {!!movieCast.length && (
              <>
                <h3 className="text-xl font-semibold mt-6 mb-3">Cast</h3>
                <div className="flex overflow-x-auto scroll-x space-x-4 pb-3">
                  {movieCast.map((c) => (
                    <div key={`${c.cast_id || c.credit_id || c.id}`} className="w-28 flex-shrink-0 text-center">
                      <img
                        src={c.profile_path ? `${TMDB_PROFILE}${c.profile_path}` : ""}
                        alt={c.name}
                        className="w-24 h-24 object-cover rounded-full mx-auto bg-gray-700"
                        loading="lazy"
                      />
                      <p className="mt-2 text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.character}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Similar */}
            <h3 className="text-xl font-semibold mt-6 mb-3">
              {activeMediaType === "movie" ? "Similar Movies" : "Similar Shows"}
            </h3>
            <div className="flex overflow-x-auto scroll-x space-x-4 pb-3">
              {similarItems.map((sm) => (
                <Card
                  key={`${activeMediaType}-similar-${sm.id}`}
                  item={{
                    ...sm,
                    media_type: activeMediaType,
                    title: sm.title || sm.name,
                  }}
                  onClick={() => openDetailsModal({ ...sm, media_type: activeMediaType })}
                />
              ))}
            </div>

            <button
              onClick={() => setShowMovieModal(false)}
              className={`mt-6 px-4 py-2 rounded-lg ${GRADIENT_ACTIVE}`}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Explore;
