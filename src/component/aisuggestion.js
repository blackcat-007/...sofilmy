// AISuggestion.js
import React, { useState, useEffect, useRef } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
    setDoc,
    getDocs,
    collection
} from "firebase/firestore";

const TMDB_API = process.env.REACT_APP_TMDB_API_KEY; // TMDB API key
const HG_TOKEN = process.env.REACT_APP_HG_TOKEN; // HuggingFace token
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w185";
const db = getFirestore();

// Hugging Face model endpoint replaced with a stable emotion model
const HF_EMOTION_MODEL =
  "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base";

const moodToGenres = {
  joy: ["35", "10749"], // comedy, romance
  sadness: ["18"], // drama
  anger: ["80", "53"], // crime, thriller
  fear: ["27", "9648"], // horror, mystery
  surprise: ["14", "878"], // fantasy, sci-fi
  love: ["10749"],
  neutral: ["18", "28"],
  thrilled: ["53", "28"], // thriller + action
};

const AISuggestion = () => {
  const [text, setText] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]); // strings of genre ids
  const [selectedMoods, setSelectedMoods] = useState([]); // now array
  const [movies, setMovies] = useState([]);
  const [watchlist, setWatchlist] = useState([]);
  const [movieDetails, setMovieDetails] = useState(null);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userDocLoaded, setUserDocLoaded] = useState(false);

  const userId = localStorage.getItem("userId"); // assume set elsewhere
  const scrollRef = useRef(null);

  // load current user's watchlist from firestore
  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return;
      try {
        const userRef = doc(db, "users", userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data();
          setWatchlist(Array.isArray(data.watchlist) ? data.watchlist : []);
        } else {
          // if doc doesn't exist, keep watchlist empty
          setWatchlist([]);
        }
      } catch (err) {
        console.error("Error loading user doc:", err);
      } finally {
        setUserDocLoaded(true);
      }
    };

    loadUser();
  }, [userId]);

  // analyze mood using Hugging Face inference API
  const analyzeMood = async (inputText) => {
    if (!inputText || !HG_TOKEN) return "neutral";
    try {
      const res = await fetch(HF_EMOTION_MODEL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${HG_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs: inputText }),
      });

      if (!res.ok) {
        // handle non-200 gracefully
        console.warn("HF inference status:", res.status);
        return "neutral";
      }

      const data = await res.json();
      // data should be an array of {label, score}
      if (!Array.isArray(data) || !data.length) return "neutral";

      // choose highest score label
      const top = data.reduce((best, item) =>
        item.score > best.score ? item : best
      , data[0]);

      // normalize label to keys in moodToGenres
      const label = (top.label || "neutral").toLowerCase();
      // some models return e.g. 'joy' or 'happy' -> map unknown to neutral
      return Object.keys(moodToGenres).includes(label) ? label : "neutral";
    } catch (err) {
      console.error("HF analyze error:", err);
      return "neutral";
    }
  };

  // fetch TMDB discover by genres array of strings
const fetchMovies = async (genresArr = [], releaseDateFilter = "") => {
  if (!TMDB_API) { console.error("TMDB API key not set."); return; }
  try {
    const with_genres = genresArr.join(",");
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API}&with_genres=${with_genres}&sort_by=popularity.desc&language=en-US${releaseDateFilter}`;
    const res = await fetch(url);
    const data = await res.json();
    setMovies(data.results || []);
  } catch (err) {
    console.error("Error fetching movies:", err);
    setMovies([]);
  } finally {
    setLoading(false);
  }
};

  // when user clicks Search
  const handleSearch = async () => {
  let genres = [...selectedGenres]; // start with user genre choices
  let releaseDateFilter = "";

  // If text provided, analyze for mood
  if (text && text.trim()) {
    const mood = await analyzeMood(text.trim());
    if (moodToGenres[mood]) {
      genres.push(...moodToGenres[mood]);
    }

    // detect keywords like nostalgia / old / classic
    const lowerText = text.toLowerCase();
    if (lowerText.includes("old") || lowerText.includes("classic") || lowerText.includes("nostalgia")) {
      releaseDateFilter = "&primary_release_date.lte=2010-01-01";
    }
  }

  // add mood dropdown selections
  selectedMoods.forEach((m) => {
    if (moodToGenres[m]) {
      genres.push(...moodToGenres[m]);
    }
  });

  // deduplicate genres
  genres = [...new Set(genres)];

  if (!genres.length) {
    setMovies([]);
    return;
  }

  fetchMovies(genres, releaseDateFilter);
};


  const toggleWatchlist = async (movieId) => {
  if (!userId) return;

  try {
    // 🔍 Fetch all users collection
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    // Find current user doc
    let currentUserDoc = null;
    snapshot.forEach((docSnap) => {
      if (docSnap.id === userId) {
        currentUserDoc = { id: docSnap.id, ...docSnap.data() };
      }
    });

    if (currentUserDoc) {
      // ✅ User doc exists → update watchlist
      const userRef = doc(db, "users", currentUserDoc.id);
      const isIn = (currentUserDoc.watchlist || []).includes(movieId);

      await updateDoc(userRef, {
        watchlist: isIn ? arrayRemove(movieId) : arrayUnion(movieId),
      });

      setWatchlist((prev) =>
        isIn ? prev.filter((id) => id !== movieId) : [...prev, movieId]
      );
    } else {
      // ❌ No user doc → create one with first movie
      const userRef = doc(db, "users", userId);
      await setDoc(userRef, {
        watchlist: [movieId],
      });

      setWatchlist([movieId]);

      // 🎉 Show first-movie popup
      alert("🎉 Congratulations! Great choice for your first movie!");
    }
  } catch (err) {
    console.error("Error toggling watchlist:", err);

    // Local fallback update
    setWatchlist((prev) =>
      prev.includes(movieId)
        ? prev.filter((id) => id !== movieId)
        : [...prev, movieId]
    );
  }
};

  // open details modal and fetch extended info
  const openDetailsModal = async (movieId) => {
    if (!TMDB_API) return;
    setShowMovieModal(true);
    setMovieDetails(null);
    try {
      // append videos, credits, images, similar, watch/providers
      const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${TMDB_API}&append_to_response=videos,credits,images,similar,watch/providers`;
      const res = await fetch(url);
      const data = await res.json();
      setMovieDetails(data);
    } catch (err) {
      console.error("Error fetching movie details:", err);
      setMovieDetails(null);
    }
  };

  // horizontal scroll handler for desktop mouse wheel -> horizontal scroll
  const onWheel = (e) => {
    const el = scrollRef.current;
    if (!el) return;
    // Only convert vertical wheel to horizontal on desktop (touch devices will be natural)
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  // small helper to get director/producer from credits
  const getCrewByJob = (credits = {}, job) => {
    if (!credits || !credits.crew) return [];
    return credits.crew.filter((c) => c.job && c.job.toLowerCase() === job.toLowerCase());
  };

  return (
    <div className="p-4 bg-black text-white min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Text input */}
        <input
          type="text"
          placeholder="Describe the movie you want (tone, era, actors, 'feel-good sci-fi', 'sad romance'...)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-800 placeholder-gray-400"
        />

        <div className="flex gap-4 mb-3">
  {/* Genres multi-select */}
  <div className="flex-1">
    <label className="text-sm text-gray-400">Genres</label>
    <select
      multiple
      value={selectedGenres}
      onChange={(e) =>
        setSelectedGenres([...e.target.selectedOptions].map((o) => o.value))
      }
      className="w-full p-2 rounded bg-gray-800"
    >
      {/* genre options same as before */}
      <option value="28">Action</option>
      <option value="12">Adventure</option>
      <option value="16">Animation</option>
      <option value="35">Comedy</option>
      <option value="80">Crime</option>
      <option value="99">Documentary</option>
      <option value="18">Drama</option>
      <option value="10751">Family</option>
      <option value="14">Fantasy</option>
      <option value="36">History</option>
      <option value="27">Horror</option>
      <option value="10402">Music</option>
      <option value="9648">Mystery</option>
      <option value="10749">Romance</option>
      <option value="878">Sci-Fi</option>
      <option value="10770">TV Movie</option>
      <option value="53">Thriller</option>
      <option value="10752">War</option>
      <option value="37">Western</option>
    </select>
  </div>

  {/* Moods multi-select */}
  <div className="flex-1">
    <label className="text-sm text-gray-400">Moods</label>
    <select
      multiple
      value={selectedMoods}
      onChange={(e) =>
        setSelectedMoods([...e.target.selectedOptions].map((o) => o.value))
      }
      className="w-full p-2 rounded bg-gray-800"
    >
      <option value="joy">Happy</option>
      <option value="sadness">Sad</option>
      <option value="fear">Scared</option>
      <option value="anger">Angry</option>
      <option value="surprise">Surprised</option>
      <option value="love">Romantic</option>
      <option value="neutral">Neutral</option>
      <option value="thrilled">Thrilled</option>
    </select>
  </div>
</div>

        <div className="flex gap-3">
          <button
            onClick={handleSearch}
            className="px-4 py-2 rounded bg-gradient-to-r from-red-600 to-red-800"
          >
            Search
          </button>

          <button
            onClick={() => {
              setText("");
              setSelectedGenres([]);
              setSelectedMoods([]);
              setMovies([]);
            }}
            className="px-4 py-2 rounded bg-gray-700 text-gray-200"
          >
            Clear
          </button>
        </div>

        {/* Results: horizontal scrolling gallery */}
        <div
          className="mt-6 overflow-x-auto overflow-y-hidden py-4 scrollbar-hide"
          ref={scrollRef}
          onWheel={onWheel}
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex space-x-4">
            {loading && <div className="text-gray-400">Loading...</div>}
            {!loading && movies.length === 0 && (
              <div className="text-gray-500">No movies to show. Try searching.</div>
            )}
            {movies.map((movie) => (
              <div key={movie.id} className="relative w-44 flex-shrink-0">
                <img
                  src={
                    movie.poster_path ? `${TMDB_IMG}${movie.poster_path}` : ""
                  }
                  alt={movie.title}
                  className="w-44 h-64 rounded-lg object-cover cursor-pointer"
                  onClick={() => openDetailsModal(movie.id)}
                />
                <button
                  onClick={() => toggleWatchlist(movie.id)}
                  className={`absolute bottom-2 left-2 px-2 py-1 text-sm rounded ${
                    watchlist.includes(movie.id) ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {watchlist.includes(movie.id) ? "Added" : "+ Watchlist"}
                </button>
                <div className="mt-2">
                  <h3 className="text-sm font-semibold line-clamp-2">{movie.title}</h3>
                  <p className="text-xs text-gray-400">{movie.release_date?.slice(0,4)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Movie Modal */}
        {showMovieModal && movieDetails && (
          <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto">
            <div
              className="absolute inset-0 bg-black/80"
              onClick={() => setShowMovieModal(false)}
            />
            <div className="relative z-50 w-11/12 md:w-3/4 lg:w-2/3 bg-gray-900 rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={
                    movieDetails.poster_path
                      ? `${TMDB_IMG}${movieDetails.poster_path}`
                      : ""
                  }
                  alt={movieDetails.title}
                  className="w-44 h-64 rounded-lg object-cover"
                />

                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{movieDetails.title}</h2>
                      <p className="text-sm text-gray-400 mb-2">{movieDetails.tagline}</p>
                      <div className="text-sm text-gray-300 mb-3">
                        Rating: <span className="font-semibold">{movieDetails.vote_average ?? "N/A"}</span>
                        {" • "}
                        Runtime: <span className="font-semibold">{movieDetails.runtime ?? "N/A"} min</span>
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => toggleWatchlist(movieDetails.id)}
                        className={`px-3 py-1 rounded ${
                          watchlist.includes(movieDetails.id) ? "bg-green-600" : "bg-gradient-to-r from-red-600 to-red-800"
                        }`}
                      >
                        {watchlist.includes(movieDetails.id) ? "Added" : "+ Watchlist"}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{movieDetails.overview}</p>

                  {/* Where to watch */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold mb-1">Where to watch</h4>
                    <div className="text-sm text-gray-300">
                      {movieDetails["watch/providers"]?.results?.US ? (
                        <>
                          {movieDetails["watch/providers"].results.US.flatrate ? (
                            <div>On streaming (flatrate)</div>
                          ) : movieDetails["watch/providers"].results.US.buy ? (
                            <div>Available to buy</div>
                          ) : (
                            <div>No provider data for US (check other regions)</div>
                          )}
                        </>
                      ) : (
                        <div className="text-gray-500 text-sm">Provider data not available</div>
                      )}
                    </div>
                  </div>

                  {/* Cast */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold mb-2">Cast</h4>
                    <div className="flex gap-3 overflow-x-auto py-2">
                      {movieDetails.credits?.cast?.slice(0,8).map((c) => (
                        <div key={c.cast_id || c.id} className="w-20 text-center">
                          <img
                            src={c.profile_path ? `${TMDB_PROFILE}${c.profile_path}` : ""}
                            alt={c.name}
                            className="w-20 h-28 rounded object-cover mb-1"
                          />
                          <div className="text-xs">{c.name}</div>
                          <div className="text-xs text-gray-400">{c.character?.split("/")[0]}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Director / Producer */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold mb-2">Director & Producers</h4>
                    <div className="flex gap-4">
                      <div>
                        <div className="text-xs text-gray-400">Director</div>
                        {getCrewByJob(movieDetails.credits, "Director").map((d) => (
                          <div key={d.id} className="flex items-center gap-2">
                            <img
                              src={d.profile_path ? `${TMDB_PROFILE}${d.profile_path}` : ""}
                              alt={d.name}
                              className="w-10 h-12 rounded object-cover"
                            />
                            <div className="text-sm">{d.name}</div>
                          </div>
                        ))}
                      </div>

                      <div>
                        <div className="text-xs text-gray-400">Producers</div>
                        <div className="flex gap-2">
                          {getCrewByJob(movieDetails.credits, "Producer").slice(0,3).map((p) => (
                            <div key={p.credit_id} className="flex items-center gap-2">
                              <img
                                src={p.profile_path ? `${TMDB_PROFILE}${p.profile_path}` : ""}
                                alt={p.name}
                                className="w-10 h-12 rounded object-cover"
                              />
                              <div className="text-sm">{p.name}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Trailers */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold mb-2">Trailers</h4>
                    <div className="flex gap-3 overflow-x-auto py-2">
                      {movieDetails.videos?.results
                        ?.filter((v) => v.site === "YouTube" && v.type === "Trailer")
                        .slice(0, 4)
                        .map((v) => (
                          <a
                            key={v.id}
                            href={`https://www.youtube.com/watch?v=${v.key}`}
                            target="_blank"
                            rel="noreferrer"
                            className="w-56 h-32 bg-gray-800 rounded-lg flex items-center justify-center"
                          >
                            <div className="text-sm">{v.name}</div>
                          </a>
                        ))}
                    </div>
                  </div>

                  {/* Similar */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold mb-2">Similar Movies</h4>
                    <div className="flex gap-3 overflow-x-auto py-2">
                      {movieDetails.similar?.results?.slice(0, 8).map((m) => (
                        <div key={m.id} className="w-28 flex-shrink-0">
                          <img
                            src={m.poster_path ? `${TMDB_IMG}${m.poster_path}` : ""}
                            alt={m.title}
                            className="w-28 h-36 rounded object-cover mb-1"
                          />
                          <div className="text-xs">{m.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-right">
                <button
                  onClick={() => setShowMovieModal(false)}
                  className="px-4 py-2 rounded bg-gradient-to-r from-red-600 to-red-800"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISuggestion;
