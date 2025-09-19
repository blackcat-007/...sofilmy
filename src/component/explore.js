import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { BallTriangle } from "react-loader-spinner";
import { Loader, X } from "lucide-react";
import { getFirestore } from "firebase/firestore";
import { arrayRemove, arrayUnion, doc, getDocs, query, setDoc, updateDoc, where, collection } from "firebase/firestore";
import CubeLoader from "../ui/loader";
import SpinLoader from "../ui/loader2";
import GlowLoader from "../ui/loader3";
import AISuggestion from "./aisuggestion";

const IMG_BASE = "https://image.tmdb.org/t/p/w500";

const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w200";

const GRADIENT_ACTIVE = "bg-gradient-to-r from-red-500 to-red-700";
const BTN_INACTIVE = "bg-gray-700 hover:bg-gray-600";
const db = getFirestore();
function Explore() {
  const userId = localStorage.getItem("userId");
  const [watchlist, setWatchlist] = useState([]);
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
  const [personDetails, setPersonDetails] = useState(null);
const [personPopular, setPersonPopular] = useState([]);
const [showPersonModal, setShowPersonModal] = useState(false);
  const [loadingPerson, setLoadingPerson] = useState(false);
  const setCache = (key, data) => {
  const cacheEntry = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(cacheEntry));
};

const getCache = (key, maxAgeMs) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < maxAgeMs) {
      return data;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  } catch {
    return null;
  }
};


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

  const cacheKey = `search-${query.trim().toLowerCase()}`;
  const cached = getCache(cacheKey, 30 * 60 * 1000); // 30 min cache

  if (cached) {
    setSearchResults(cached);
    return;
  }

  try {
    const data = await fetchJson(
      `${TMDB_API_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`
    );
    const results = data.results || [];
    setSearchResults(results);
    setCache(cacheKey, results);
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

    const cacheKey = `trending-${trendingFilter}`;
    const cached = getCache(cacheKey, 60 * 60 * 1000); // 1 hour cache

    if (cached) {
      setTrending(cached);
      return;
    }

    try {
      const movieData = await fetchJson(
        `${TMDB_API_URL}/trending/movie/${trendingFilter}?api_key=${TMDB_API_KEY}`
      );
      const tvData = await fetchJson(
        `${TMDB_API_URL}/trending/tv/${trendingFilter}?api_key=${TMDB_API_KEY}`
      );
      const result = [
        ...(movieData.results || []).map(item => ({ ...item, title: item.title })),
        ...(tvData.results || []).map(item => ({ ...item, title: item.name }))
      ];
      setTrending(result);
      setCache(cacheKey, result);
    } catch (e) {
      setError(e.message);
    }
  })();
}, [trendingFilter]);


 useEffect(() => {
  (async () => {
    if (!guardKey()) return;

    const cacheKey = `trailers-${trailersScope}`;
    const cached = getCache(cacheKey, 60 * 60 * 1000); // 1 hour cache

    if (cached) {
      setTrailers(cached);
      return;
    }

    try {
      let url =
        trailersScope === "popular"
          ? `${TMDB_API_URL}/movie/popular?api_key=${TMDB_API_KEY}`
          : trailersScope === "ontv"
          ? `${TMDB_API_URL}/tv/on_the_air?api_key=${TMDB_API_KEY}`
          : `${TMDB_API_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`;

      const data = await fetchJson(url);
      const result = (data.results || []).map((r) => ({
        ...r,
        media_type: r.first_air_date ? "tv" : "movie",
        title: r.title || r.name
      }));
      setTrailers(result);
      setCache(cacheKey, result);
    } catch (e) {
      setError(e.message);
    }
  })();
}, [trailersScope]);


 useEffect(() => {
  (async () => {
    if (!guardKey()) return;

    const cacheKey = `popular-${popularScope}`;
    const cached = getCache(cacheKey, 60 * 60 * 1000); // 1 hour cache

    if (cached) {
      setPopular(cached);
      return;
    }

    try {
      let url =
        popularScope === "streaming"
          ? `${TMDB_API_URL}/movie/popular?api_key=${TMDB_API_KEY}`
          : popularScope === "ontv"
          ? `${TMDB_API_URL}/tv/popular?api_key=${TMDB_API_KEY}`
          : `${TMDB_API_URL}/movie/now_playing?api_key=${TMDB_API_KEY}`;

      const data = await fetchJson(url);
      const result = (data.results || []).map((r) => ({
        ...r,
        media_type: r.first_air_date ? "tv" : "movie",
        title: r.title || r.name
      }));
      setPopular(result);
      setCache(cacheKey, result);
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

  const type = inferType(item); // "movie" | "tv" | "person"
  const id = item.id;
  const cacheKey = `${type}-details-${id}`;
  const cached = getCache(cacheKey, 24 * 60 * 60 * 1000); // 1 day cache
  setActiveMediaType(type);
  setLoading(true);

  try {
    if (type === "person") {
      // ✅ Fetch person details
     
   
    if (cached) {
      setPersonDetails(cached.personDetails);
      setPersonPopular(cached.personPopular);
      setShowPersonModal(true);
      setLoading(false);
      return;
    }
      const personDetails = await fetchJson(
        `${TMDB_API_URL}/person/${item.id}?api_key=${TMDB_API_KEY}&append_to_response=movie_credits,tv_credits,images`
      );

      setPersonDetails(personDetails);

      // pick top movies (sorted by popularity)
      const popularMovies = (personDetails.movie_credits?.cast || [])
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 12);

      const popularTv = (personDetails.tv_credits?.cast || [])
        .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
        .slice(0, 12);

      setPersonPopular([...popularMovies, ...popularTv]);

      setShowPersonModal(true); // open a dedicated person modal
      setCache(cacheKey, {
        personDetails,
        personPopular: [...popularMovies, ...popularTv]
      });
    } else {
       if (cached) {
    setMovieDetails(cached.details);
    setCrewCore(cached.crewCore);
    setMovieCast(cached.cast);
    setSimilarItems(cached.similarItems);
    setShowMovieModal(true);
    setLoading(false);
    return;
  }
      // ✅ Movie/TV branch (your original code)
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

      // Similar
      const similar = await fetchJson(
        `${TMDB_API_URL}/${type}/${item.id}/similar?api_key=${TMDB_API_KEY}`
      );
      setSimilarItems(similar.results || []);

      setShowMovieModal(true);
      setCache(cacheKey, {
      details,
      crewCore: crew,
      cast,
      similarItems: similar.results || []
    });
    }
  } catch (e) {
    setError(e.message);
  } finally {
    setLoading(false);
  }
};

   // load user’s watchlist
 useEffect(() => {
  const loadUser = async () => {
    if (!userId) return setWatchlist([]);

    const cacheKey = `watchlist-${userId}`;
    const cached = getCache(cacheKey, 5 * 60 * 1000); // 5 min cache

    if (cached) {
      setWatchlist(cached);
      return;
    }

    try {
      const querySnapshot = await getDocs(collection(db, "users"));
      let found = null;
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.uid === userId) {
          found = data;
        }
      });

      const list = found && Array.isArray(found.watchlist) ? found.watchlist : [];
      setWatchlist(list);
      setCache(cacheKey, list);
    } catch (err) {
      console.error("Error fetching user:", err);
      setWatchlist([]);
    }
  };

  loadUser();
}, [userId]);

 const toggleWatchlist = async (id, mediaType) => {
  if (!userId) return;

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("uid", "==", userId));
    const querySnapshot = await getDocs(q);

    let userDocRef = null;
    let userData = null;

    querySnapshot.forEach((docSnap) => {
      userDocRef = docSnap.ref;
      userData = docSnap.data();
    });

    const itemKey = `${mediaType}:${id}`;

    if (userDocRef && userData) {
      const curr = Array.isArray(userData.watchlist) ? userData.watchlist : [];
      const isIn = curr.includes(itemKey);

      await updateDoc(userDocRef, {
        watchlist: isIn ? arrayRemove(itemKey) : arrayUnion(itemKey),
      });

      const newList = isIn ? curr.filter((x) => x !== itemKey) : [...curr, itemKey];
      setWatchlist(newList);
      setCache(`watchlist-${userId}`, newList);

      alert(isIn ? "Removed from Watchlist!" : "Added to Watchlist!");
    } else {
      const newDocRef = userDocRef || doc(usersRef);
      await setDoc(newDocRef, {
        uid: userId,
        watchlist: [itemKey],
      });

      const newList = [itemKey];
      setWatchlist(newList);
      setCache(`watchlist-${userId}`, newList);

      alert("🎉 Added your first title to Watchlist!");
    }
  } catch (err) {
    console.error("toggleWatchlist error:", err);
  }
};

  

 const Card = ({ item, onClick }) => {
  const itemKey = `${item.media_type}:${item.id}`;
  const isInWatchlist = watchlist.includes(itemKey);

  return (
    <div className="relative w-40 flex-shrink-0 cursor-pointer" title={item.title}>
      <img
        src={item.poster_path ? `${TMDB_IMG}${item.poster_path}` : ""}
        alt={item.title}
        className="rounded-xl h-60 w-40 object-cover bg-gray-800"
        loading="lazy"
        onClick={onClick}
      />
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleWatchlist(item.id, item.media_type);
        }}
        className={`absolute top-2 right-2 px-2 py-1 text-xs rounded ${
          isInWatchlist ? "bg-green-600" : "bg-red-600"
        }`}
      >
        {isInWatchlist ? "Added" : "+ Watchlist"}
      </button>
      <p className="mt-2 text-sm line-clamp-2">{item.title}</p>
    </div>
  );
};

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
    <div className="bg-black/15 rounded-lg text-white min-h-screen px-4 py-6 mx-auto max-w-7xl ">
      {/* Search Bar with Dropdown */}
      <h2 className="text-2xl font-bold mb-4 text-center">Explore Movies,TV Shows & People</h2>
      <div className="relative flex justify-center mb-6" ref={searchRef}>
        <input
          type="text"
          placeholder="Search movies..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full md:w-11/12 p-3 rounded-xl bg-gray-800 text-white outline-none"
        />
        

       {showSearchDropdown && searchResults.length > 0 && (
  <div className="absolute top-full mt-2 w-full md:w-4/6 bg-gray-800 rounded-lg shadow-lg max-h-80 overflow-y-auto z-10">
    {searchResults.map((m) => (
      <div
        key={m.id}
        onClick={() => openDetailsModal(m)}
        className="flex items-center p-2 hover:bg-gray-700 transition cursor-pointer"
      >
        <img
          src={m.poster_path ? `${TMDB_IMG}${m.poster_path}` : `${TMDB_IMG}${m.profile_path}`}
          alt={m.title}
          className="w-12 h-16 rounded-md object-cover mr-3"
          loading="lazy"
        />
        <span>{m.title || m.name}</span>
      </div>
    ))}
  </div>
)}

      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}
      {loading && (
        <GlowLoader />
      )}
      {/*suggestions*/}
      <AISuggestion />
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
            <Card key={m.id} item={m} onClick={() => openDetailsModal(m)} />
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
                <div>
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
                </div>
                 <div>
                      <button
                        onClick={() => toggleWatchlist(movieDetails.id, activeMediaType)}
                        className={`px-3 py-1 rounded ${
                          watchlist.includes(`${activeMediaType}:${movieDetails.id}`)
                            ? "bg-green-600"
                            : "bg-gradient-to-r from-red-600 to-red-800"
                        }`}
                      >
                        {watchlist.includes(`${activeMediaType}:${movieDetails.id}`) ? "Added" : "+ Watchlist"}
                      </button>
                    </div>

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
             { /*  {getFirstYoutubeKey(movieDetails.videos) && (
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
                )}*/}
              </div>
            </div>

            {/* Crew Spotlight */}
           {/* Crew Spotlight */}
{!!crewCore.length && (
  <>
    <h3 className="text-xl font-semibold mt-6 mb-3">Director & Producers</h3>
    <div className="flex overflow-x-auto scroll-x space-x-4 pb-3">
      {crewCore.map((c) => (
        <div
          key={c.credit_id}
          className="w-32 flex-shrink-0 text-center cursor-pointer"
          onClick={() => {
            setShowMovieModal(false); // close movie modal
            openDetailsModal({ id: c.id, media_type: "person" });
          }}
        >
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
        <div
          key={c.cast_id || c.credit_id || c.id}
          className="w-28 flex-shrink-0 text-center cursor-pointer"
          onClick={() => {
            setShowMovieModal(false); // close movie modal
            openDetailsModal({ id: c.id, media_type: "person" });
          }}
        >
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
      {/* Person Details Modal */}
    
{showPersonModal && personDetails && (
  <div className="fixed inset-0 bg-black/80 flex items-center  justify-center z-50 p-4 overflow-y-auto">
    <div className="bg-[#1c1c1c] rounded-2xl max-w-4xl w-full p-6 relative shadow-xl max-h-[90vh] overflow-y-auto">
      {/* Close button */}
      <button
        onClick={() => setShowPersonModal(false)}
        className="absolute top-4 right-4 text-gray-400 hover:text-white"
      >
        <X size={24} />
      </button>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Profile image */}
        {personDetails.profile_path ? (
          <img
            src={`${IMG_BASE}${personDetails.profile_path}`}
            alt={personDetails.name}
            className="w-48 h-64 object-cover rounded-2xl shadow-md"
          />
        ) : (
          <div className="w-48 h-64 bg-gray-700 rounded-2xl flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}

        {/* Bio + Info */}
        <div className="flex-1">
  <h2 className="text-2xl font-bold mb-2">{personDetails.name}</h2>

  {personDetails.birthday && (
    <p className="text-sm text-gray-400">
      Born: {personDetails.birthday}{" "}
      {personDetails.place_of_birth ? `• ${personDetails.place_of_birth}` : ""}
    </p>
  )}

  {personDetails.deathday && (
    <p className="text-sm text-gray-400">Died: {personDetails.deathday}</p>
  )}

  {/* Scrollable Biography */}
  <div className="mt-4 max-h-48 overflow-y-auto pr-2 text-gray-300 text-sm whitespace-pre-line custom-scroll">
    {personDetails.biography || "No biography available."}
  </div>
</div>
      </div>

      {/* Popular works */}
      {personPopular?.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Popular Works</h3>
          <div className="flex overflow-x-auto space-x-4 pb-3">
            {personPopular.map((work) => (
              <div
                key={`${work.media_type}:${work.id}`}
                className="w-36 flex-shrink-0 cursor-pointer"
                onClick={() => {
                  setShowPersonModal(false); // close person modal
                  openDetailsModal({ ...work });
                }}
              >
                {work.poster_path ? (
                  <img
                    src={`${IMG_BASE}${work.poster_path}`}
                    alt={work.title || work.name}
                    className="w-full h-52 object-cover rounded-xl mb-2"
                  />
                ) : (
                  <div className="w-full h-52 bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 mb-2">
                    No Poster
                  </div>
                )}
                <p className="text-sm text-gray-300 truncate">
                  {work.title || work.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}

    </div>
  );
}

export default Explore;
