// AISuggestion.js
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  setDoc,
} from "firebase/firestore";

const TMDB_API = process.env.REACT_APP_TMDB_API_KEY; // TMDB API key
const HG_TOKEN = process.env.REACT_APP_HG_TOKEN; // HuggingFace token
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w185";
const db = getFirestore();

// Hugging Face model endpoint
const HF_EMOTION_MODEL =
  "https://api-inference.huggingface.co/models/j-hartmann/emotion-english-distilroberta-base";

/** ------------------ Genre Dictionaries ------------------ */
// TMDB genre id maps (movie + tv). Keywords help to map natural language.
const GENRES_MOVIE = {
  Action: "28",
  Adventure: "12",
  Animation: "16",
  Comedy: "35",
  Crime: "80",
  Documentary: "99",
  Drama: "18",
  Family: "10751",
  Fantasy: "14",
  History: "36",
  Horror: "27",
  Music: "10402",
  Mystery: "9648",
  Romance: "10749",
  "Sci-Fi": "878",
  "TV Movie": "10770",
  Thriller: "53",
  War: "10752",
  Western: "37",
};

const GENRES_TV = {
  "Action & Adventure": "10759",
  Animation: "16",
  Comedy: "35",
  Crime: "80",
  Documentary: "99",
  Drama: "18",
  Family: "10751",
  Kids: "10762",
  Mystery: "9648",
  News: "10763",
  Reality: "10764",
  "Sci-Fi & Fantasy": "10765",
  Soap: "10766",
  "Talk": "10767",
  "War & Politics": "10768",
  Western: "37",
};

const KEYWORD_TO_GENRES = {
  // movies + tv mapping (we’ll add both sides where it makes sense)
  "sci fi": { movie: ["878"], tv: ["10765"] },
  "sci-fi": { movie: ["878"], tv: ["10765"] },
  scifi: { movie: ["878"], tv: ["10765"] },
  science: { movie: ["878"], tv: ["10765"] },
  fantasy: { movie: ["14"], tv: ["10765"] },
  thriller: { movie: ["53"], tv: [] },
  mystery: { movie: ["9648"], tv: ["9648"] },
  horror: { movie: ["27"], tv: [] },
  comedy: { movie: ["35"], tv: ["35"] },
  romantic: { movie: ["10749"], tv: [] },
  romance: { movie: ["10749"], tv: [] },
  drama: { movie: ["18"], tv: ["18"] },
  action: { movie: ["28"], tv: ["10759"] },
  adventure: { movie: ["12"], tv: ["10759"] },
  war: { movie: ["10752"], tv: ["10768"] },
  history: { movie: ["36"], tv: [] },
  family: { movie: ["10751"], tv: ["10751"] },
  animation: { movie: ["16"], tv: ["16"] },
  superhero: { movie: ["28", "12", "878"], tv: ["10759", "10765"] }, // heuristic
  crime: { movie: ["80"], tv: ["80"] },
  documentary: { movie: ["99"], tv: ["99"] },
  western: { movie: ["37"], tv: ["37"] },
};

/** ------------------ Mood Maps ------------------ */
const moodToGenres = {
  joy: ["35", "10751", "10749"],
  sadness: ["18", "10749"],
  anger: ["80", "53", "28"],
  fear: ["27", "9648", "53"],
  surprise: ["14", "878", "53"],
  love: ["10749", "35"],
  neutral: ["18", "28", "10751"],
  thrilled: ["53", "28", "12"],
  calm: ["10751", "99", "16"],
  nostalgic: ["36", "10770", "10402"],
  adventurous: ["12", "28", "14"],
  thoughtful: ["18", "9648", "36"],
  mysterious: ["9648", "53", "878"],
  playful: ["35", "16", "10751"],
  heroic: ["28", "12", "10752"],
  scary: ["27", "53"],
  romantic: ["10749", "35"],
  epic: ["28", "12", "14", "36"],
};

const moodToTvGenres = {
  joy: ["35", "10751", "10764"],
  sadness: ["18", "10766"],
  anger: ["80", "53"],
  fear: ["27", "9648", "10765"],
  surprise: ["14", "878", "10765"],
  love: ["10749", "35"], // TV doesn’t have direct 10749, but we still bias movie side
  neutral: ["18", "10751"],
  thrilled: ["53", "28", "10759"],
  calm: ["10751", "99", "16"],
  nostalgic: ["36", "10768"],
  adventurous: ["10759", "28", "14"],
  thoughtful: ["18", "9648", "36"],
  mysterious: ["9648", "53", "10765"],
  playful: ["35", "16", "10751"],
  heroic: ["28", "10759", "10765"],
  scary: ["27", "53"],
  romantic: ["10749", "35"],
  epic: ["28", "10759", "14", "36"],
  educational: ["99", "10762"],
  informative: ["99", "10763"],
};

/** ------------------ Helpers ------------------ */

// naive proper-name extractor for “Tom Cruise”, “Keanu Reeves”, etc.
const extractProbableNames = (text) => {
  const names = [];
  const re = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/g; // at least two capitalized words
  let m;
  while ((m = re.exec(text)) !== null) {
    names.push(m[1]);
  }
  return [...new Set(names)];
};

// year / date filters from NL
const extractYearFilters = (text) => {
  const lower = text.toLowerCase();
  const years = [...text.matchAll(/\b(19|20)\d{2}\b/g)].map((m) => parseInt(m[0], 10));
  let year = null;
  let gte = null;
  let lte = null;

  if (years.length === 1) {
    year = years[0];
  } else if (years.length >= 2) {
    // e.g., 2018-2021; pick min/max
    gte = Math.min(...years);
    lte = Math.max(...years);
  }

  if (lower.includes("before ") && years.length) {
    lte = Math.min(...years);
    year = null;
  }
  if (lower.includes("after ") && years.length) {
    gte = Math.max(...years);
    year = null;
  }

  // phrases
  if (lower.includes("recent year") || lower.includes("recent years") || lower.includes("latest")) {
    const currentYear = new Date().getFullYear();
    gte = currentYear - 1; // last ~1 year
    lte = null;
    year = null;
  }

  return { year, gte, lte };
};

// pull keyword genres for both movie/tv
const keywordGenresFromText = (text) => {
  const lower = text.toLowerCase();
  const mset = new Set();
  const tvset = new Set();

  Object.keys(KEYWORD_TO_GENRES).forEach((k) => {
    if (lower.includes(k)) {
      KEYWORD_TO_GENRES[k].movie.forEach((id) => mset.add(id));
      KEYWORD_TO_GENRES[k].tv.forEach((id) => tvset.add(id));
    }
  });

  return { movieGenreIds: [...mset], tvGenreIds: [...tvset] };
};

// Hugging Face mood analysis (best-effort)
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
    if (!res.ok) return "neutral";
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return "neutral";
    const top = data.reduce((best, item) => (item.score > best.score ? item : best), data[0]);
    const label = (top.label || "neutral").toLowerCase();
    return Object.keys(moodToGenres).includes(label) ? label : "neutral";
  } catch {
    return "neutral";
  }
};

// Build TMDB discover params for movie/tv
const buildDiscoverQuery = ({ movieGenreIds = [], tvGenreIds = [], yearFilters = {}, castPersonId = null }) => {
  // movies
  const mParams = new URLSearchParams({
    api_key: TMDB_API,
    sort_by: "popularity.desc",
    language: "en-US",
    include_adult: "false",
  });
  if (movieGenreIds.length) mParams.set("with_genres", movieGenreIds.join(","));
  if (castPersonId) mParams.set("with_cast", String(castPersonId));
  if (yearFilters.year) mParams.set("primary_release_year", String(yearFilters.year));
  if (yearFilters.gte) mParams.set("primary_release_date.gte", `${yearFilters.gte}-01-01`);
  if (yearFilters.lte) mParams.set("primary_release_date.lte", `${yearFilters.lte}-12-31`);

  // tv
  const tParams = new URLSearchParams({
    api_key: TMDB_API,
    sort_by: "popularity.desc",
    language: "en-US",
    include_adult: "false",
  });
  if (tvGenreIds.length) tParams.set("with_genres", tvGenreIds.join(","));
  if (castPersonId) tParams.set("with_cast", String(castPersonId));
  if (yearFilters.year) tParams.set("first_air_date_year", String(yearFilters.year));
  if (yearFilters.gte) tParams.set("first_air_date.gte", `${yearFilters.gte}-01-01`);
  if (yearFilters.lte) tParams.set("first_air_date.lte", `${yearFilters.lte}-12-31`);

  return { movieQS: mParams.toString(), tvQS: tParams.toString() };
};

// fetch person id from probable names list (first good hit)
const findPersonId = async (names) => {
  if (!TMDB_API || !names.length) return null;
  for (const name of names) {
    try {
      const url = `https://api.themoviedb.org/3/search/person?api_key=${TMDB_API}&query=${encodeURIComponent(
        name
      )}&include_adult=false&language=en-US&page=1`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && Array.isArray(data.results) && data.results.length) {
        return data.results[0].id;
      }
    } catch {
      // ignore and try next name
    }
  }
  return null;
};

// merge movie/tv results to a single list, tag media_type
const normalizeResults = (arr, type) =>
  (arr || [])
    .filter(Boolean)
    .map((it) => ({
      ...it,
      media_type: type, // "movie" | "tv"
      title: it.title || it.name,
      release_date: it.release_date || it.first_air_date,
    }));

const AISuggestion = () => {
  const [text, setText] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]); // movie-genre ids (we’ll map to tv too)
  const [selectedMoods, setSelectedMoods] = useState([]); // ['joy', 'thrilled', ...]
  const [items, setItems] = useState([]); // combined movies + tv
  const [watchlist, setWatchlist] = useState([]);
  const [details, setDetails] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);

  const userId = localStorage.getItem("userId");
  const scrollRef = useRef(null);

  // Build reverse map: movie id -> tv ids (approx)
  const movieToTvGenre = useMemo(() => {
    // simple heuristic: if a movie genre exists on TV, map it; otherwise leave out
    const reverse = {
      "28": ["10759"], // Action -> Action & Adventure
      "12": ["10759"], // Adventure -> Action & Adventure
      "16": ["16"],
      "35": ["35"],
      "80": ["80"],
      "99": ["99"],
      "18": ["18"],
      "10751": ["10751"],
      "14": ["10765"],
      "36": [], // History (no direct tv history)
      "27": [], // Horror (no direct tv horror)
      "10402": [], // Music
      "9648": ["9648"],
      "10749": [], // Romance (no direct tv romance id)
      "878": ["10765"],
      "10770": [], // TV Movie (not for series)
      "53": [], // Thriller
      "10752": ["10768"], // War -> War & Politics
      "37": ["37"],
    };
    return reverse;
  }, []);

  // load user’s watchlist
  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return setWatchlist([]);
      try {
        const snap = await getDoc(doc(db, "users", userId));
        if (snap.exists()) {
          const data = snap.data();
          setWatchlist(Array.isArray(data.watchlist) ? data.watchlist : []);
        } else {
          setWatchlist([]);
        }
      } catch {
        setWatchlist([]);
      }
    };
    loadUser();
  }, [userId]);

  // Default boot load: trending all + popular all-time movies
  useEffect(() => {
    const boot = async () => {
      if (!TMDB_API) {
        setBootLoading(false);
        return;
      }
      try {
        const [trendingRes, popularMoviesRes] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${TMDB_API}&language=en-US`),
          fetch(
            `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API}&sort_by=popularity.desc&include_adult=false&language=en-US&page=1`
          ),
        ]);

        const trendingData = await trendingRes.json();
        const popularMovies = await popularMoviesRes.json();

        const trend = (trendingData.results || []).map((r) => ({
          ...r,
          media_type: r.media_type, // already contains movie/tv
          title: r.title || r.name,
          release_date: r.release_date || r.first_air_date,
        }));

        const popular = normalizeResults(popularMovies.results, "movie");

        // merge & de-dupe by id+media_type
        const key = (x) => `${x.media_type}:${x.id}`;
        const merged = [...trend, ...popular];
        const uniqMap = new Map();
        merged.forEach((x) => uniqMap.set(key(x), x));

        setItems([...uniqMap.values()]);
      } catch {
        setItems([]);
      } finally {
        setBootLoading(false);
      }
    };
    boot();
  }, []);

  // Horizontal scroll helper
  useEffect(() => {
  const el = scrollRef.current;
  if (!el) return;

  const handleWheel = (e) => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  el.addEventListener("wheel", handleWheel, { passive: false });
  return () => el.removeEventListener("wheel", handleWheel);
}, []);


  const getCrewByJob = (credits = {}, job) => {
    if (!credits || !credits.crew) return [];
    return credits.crew.filter((c) => c.job && c.job.toLowerCase() === job.toLowerCase());
  };

  const toggleWatchlist = async (id, mediaType) => {
    if (!userId) return;
    try {
      const userRef = doc(db, "users", userId);
      const snap = await getDoc(userRef);
      const itemKey = `${mediaType}:${id}`;
      if (snap.exists()) {
        const curr = Array.isArray(snap.data().watchlist) ? snap.data().watchlist : [];
        const isIn = curr.includes(itemKey);
        await updateDoc(userRef, {
          watchlist: isIn ? arrayRemove(itemKey) : arrayUnion(itemKey),
        });
        setWatchlist((prev) => (isIn ? prev.filter((x) => x !== itemKey) : [...prev, itemKey]));
      } else {
        await setDoc(userRef, { watchlist: [`${mediaType}:${id}`] });
        setWatchlist([`${mediaType}:${id}`]);
        alert("🎉 Added your first title to Watchlist!");
      }
    } catch {
      // local optimistic
      const itemKey = `${mediaType}:${id}`;
      setWatchlist((prev) => (prev.includes(itemKey) ? prev.filter((x) => x !== itemKey) : [...prev, itemKey]));
    }
  };

  const openDetailsModal = async (id, mediaType) => {
    if (!TMDB_API) return;
    setShowModal(true);
    setDetails(null);
    try {
      const path = mediaType === "tv" ? "tv" : "movie";
      const url = `https://api.themoviedb.org/3/${path}/${id}?api_key=${TMDB_API}&append_to_response=videos,credits,images,similar,watch/providers&language=en-US`;
      const res = await fetch(url);
      const data = await res.json();
      setDetails({ ...data, media_type: mediaType });
    } catch {
      setDetails(null);
    }
  };

  /** ------------------ Search (Natural Language) ------------------ */
  const handleSearch = async () => {
    if (!TMDB_API) return;
    setLoading(true);

    try {
      const raw = text.trim();
      const lower = raw.toLowerCase();

      // 1) Genres from keywords (movie + tv)
      const { movieGenreIds: kwMovieGenres, tvGenreIds: kwTvGenres } = keywordGenresFromText(raw);

      // 2) Actor / person
      //    - Look for explicitly extracted names; if none, try to guess by passing whole query
      let probableNames = extractProbableNames(raw);
      // Also check phrases like "starring <name>", "with <name>"
      const starringMatch = raw.match(/(?:starring|with|featuring)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)/i);
      if (starringMatch) probableNames = [starringMatch[1], ...probableNames];

      // If query contains a clear name like "Tom Cruise", it will be picked. If not, we still try the whole string last.
      const tryNames = probableNames.length ? probableNames : [];
      if (!tryNames.length && raw.length > 0) tryNames.push(raw); // last-ditch

      const castPersonId = await findPersonId(tryNames);

      // 3) Year / range
      const yearFilters = extractYearFilters(raw);

      // 4) User dropdown selection (movie-genre ids) → map to tv equivalents too
      let movieGenresCombined = new Set(kwMovieGenres);
      let tvGenresCombined = new Set(kwTvGenres);

      selectedGenres.forEach((mg) => {
        movieGenresCombined.add(mg);
        const tvs = movieToTvGenre[mg] || [];
        tvs.forEach((tid) => tvGenresCombined.add(tid));
      });

      // 5) Mood → if text is vague or user picked moods, bias genres
      let selectedMood = null;
      if (raw) {
        selectedMood = await analyzeMood(raw);
      }
      const moodSetMovie = new Set();
      const moodSetTv = new Set();

      if (selectedMood && selectedMood in moodToGenres) {
        moodToGenres[selectedMood].forEach((g) => moodSetMovie.add(g));
      }
      if (selectedMood && selectedMood in moodToTvGenres) {
        moodToTvGenres[selectedMood].forEach((g) => moodSetTv.add(g));
      }
      selectedMoods.forEach((m) => {
        (moodToGenres[m] || []).forEach((g) => moodSetMovie.add(g));
        (moodToTvGenres[m] || []).forEach((g) => moodSetTv.add(g));
      });

      // merge mood genres with keyword + user selections
      moodSetMovie.forEach((g) => movieGenresCombined.add(g));
      moodSetTv.forEach((g) => tvGenresCombined.add(g));

      // If the query explicitly says “film” or “movie” or “series”, we still search both types,
      // but we keep their filters unified. (We *always* combine movies+TV as requested.)
      const { movieQS, tvQS } = buildDiscoverQuery({
        movieGenreIds: [...movieGenresCombined],
        tvGenreIds: [...tvGenresCombined],
        yearFilters,
        castPersonId,
      });

      const [movieRes, tvRes] = await Promise.all([
        fetch(`https://api.themoviedb.org/3/discover/movie?${movieQS}`),
        fetch(`https://api.themoviedb.org/3/discover/tv?${tvQS}`),
      ]);

      const [movieJson, tvJson] = await Promise.all([movieRes.json(), tvRes.json()]);

      const movies = normalizeResults(movieJson.results, "movie");
      const tvs = normalizeResults(tvJson.results, "tv");

      // Merge & sort by popularity (desc). If a query like "Tom Cruise sci-fi 2024", both piles will apply.
      const merged = [...movies, ...tvs].sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
      setItems(merged);
    } catch (e) {
      console.error("Search error:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-black text-white min-h-screen">
      <div className="max-w-5xl mx-auto">
        {/* Text input */}
        {/*<input
          type="text"
          placeholder="Describe what you want: “Tom Cruise sci-fi romantic film released in 2024 with comedy elements”"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-3 mb-3 rounded bg-gray-800 placeholder-gray-400"
        />*/}

        <div className="flex gap-4 mb-3">
          {/* Genres multi-select (movie ids; TV is auto-mapped) */}
          <div className="flex-1">
            <label className="text-sm text-gray-400">Genres</label>
            <select
              multiple
              value={selectedGenres}
              onChange={(e) => setSelectedGenres([...e.target.selectedOptions].map((o) => o.value))}
              className="w-full p-2 rounded bg-gray-800"
            >
              {Object.entries(GENRES_MOVIE).map(([label, id]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              TV equivalents are auto-applied (e.g., Action → Action &amp; Adventure).
            </p>
          </div>

          {/* Moods multi-select */}
          <div className="flex-1">
            <label className="text-sm text-gray-400">Moods</label>
            <select
              multiple
              value={selectedMoods}
              onChange={(e) => setSelectedMoods([...e.target.selectedOptions].map((o) => o.value))}
              className="w-full p-2 rounded bg-gray-800"
            >
              {Object.keys(moodToGenres).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={handleSearch} className="px-4 py-2 rounded bg-gradient-to-r from-red-600 to-red-800">
            Search
          </button>

          <button
            onClick={() => {
              setText("");
              setSelectedGenres([]);
              setSelectedMoods([]);
              // keep items; don’t blank the page — or re-run boot load:
              // window.location.reload(); // optional if you want to reset to default feed
            }}
            className="px-4 py-2 rounded bg-gray-700 text-gray-200"
          >
            Clear
          </button>
        </div>

        {/* Results */}
        <div className="mt-6 overflow-x-auto overflow-y-hidden py-4 scrollbar-hide" ref={scrollRef} >
          <div className="flex space-x-4">
            {(loading || bootLoading) && <div className="text-gray-400">Loading...</div>}
            {!loading && !bootLoading && items.length === 0 && (
              <div className="text-gray-500">No results. Try a broader description.</div>
            )}

            {!loading &&
              !bootLoading &&
              items.map((it) => {
                const poster = it.poster_path ? `${TMDB_IMG}${it.poster_path}` : "";
                const key = `${it.media_type}:${it.id}`;
                const inWatchlist = watchlist.includes(key);
                return (
                  <div key={key} className="relative w-44 flex-shrink-0">
                    <img
                      src={poster}
                      alt={it.title}
                      className="w-44 h-64 rounded-lg object-cover cursor-pointer"
                      onClick={() => openDetailsModal(it.id, it.media_type)}
                    />
                    <div className="absolute top-2 left-2 text-[10px] px-2 py-1 bg-gray-900/80 rounded">
                      {it.media_type === "tv" ? "TV" : "Film"}
                    </div>
                    <button
                      onClick={() => toggleWatchlist(it.id, it.media_type)}
                      className={`absolute bottom-2 left-2 px-2 py-1 text-sm rounded ${
                        inWatchlist ? "bg-green-600" : "bg-red-600"
                      }`}
                    >
                      {inWatchlist ? "Added" : "+ Watchlist"}
                    </button>
                    <div className="mt-2">
                      <h3 className="text-sm font-semibold line-clamp-2">{it.title}</h3>
                      <p className="text-xs text-gray-400">{it.release_date?.slice(0, 4) || "—"}</p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Details Modal */}
        {showModal && details && (
          <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto">
            <div className="absolute inset-0 bg-black/80" onClick={() => setShowModal(false)} />
            <div className="relative z-50 w-11/12 md:w-3/4 lg:w-2/3 bg-gray-900 rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[90vh]">
              <div className="flex flex-col md:flex-row gap-6">
                <img
                  src={details.poster_path ? `${TMDB_IMG}${details.poster_path}` : ""}
                  alt={details.title || details.name}
                  className="w-44 h-64 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold mb-1">{details.title || details.name}</h2>
                      <p className="text-sm text-gray-400 mb-2">{details.tagline}</p>
                      <div className="text-sm text-gray-300 mb-3">
                        Rating: <span className="font-semibold">{details.vote_average ?? "N/A"}</span>
                        {" • "}
                        {details.media_type === "tv" ? (
                          <>
                            Seasons: <span className="font-semibold">{details.number_of_seasons ?? "N/A"}</span>
                          </>
                        ) : (
                          <>
                            Runtime: <span className="font-semibold">{details.runtime ?? "N/A"} min</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => toggleWatchlist(details.id, details.media_type)}
                        className={`px-3 py-1 rounded ${
                          watchlist.includes(`${details.media_type}:${details.id}`)
                            ? "bg-green-600"
                            : "bg-gradient-to-r from-red-600 to-red-800"
                        }`}
                      >
                        {watchlist.includes(`${details.media_type}:${details.id}`) ? "Added" : "+ Watchlist"}
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-gray-400 mb-4">{details.overview}</p>

                  {/* Where to watch (US by default) */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold mb-1">Where to watch</h4>
                    <div className="text-sm text-gray-300">
                      {details["watch/providers"]?.results?.US ? (
                        <>
                          {details["watch/providers"].results.US.flatrate ? (
                            <div>On streaming (flatrate)</div>
                          ) : details["watch/providers"].results.US.buy ? (
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
                      {details.credits?.cast?.slice(0, 10).map((c) => (
                        <div key={c.cast_id || c.credit_id || c.id} className="w-20 text-center">
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

                  {/* Director / Producers */}
                  {details.media_type !== "tv" && (
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold mb-2">Director & Producers</h4>
                      <div className="flex gap-4">
                        <div>
                          <div className="text-xs text-gray-400">Director</div>
                          {getCrewByJob(details.credits, "Director").map((d) => (
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
                            {getCrewByJob(details.credits, "Producer")
                              .slice(0, 3)
                              .map((p) => (
                                <div key={p.credit_id || p.id} className="flex items-center gap-2">
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
                  )}

                  {/* Trailers */}
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold mb-2">Trailers</h4>
                    <div className="flex gap-3 overflow-x-auto py-2">
                      {details.videos?.results
                        ?.filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
                        .slice(0, 6)
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
                    <h4 className="text-sm font-semibold mb-2">Similar</h4>
                    <div className="flex gap-3 overflow-x-auto py-2">
                      {details.similar?.results?.slice(0, 10).map((m) => (
                        <div
                          key={m.id}
                          className="w-28 flex-shrink-0"
                          onClick={() => openDetailsModal(m.id, details.media_type)}
                        >
                          <img
                            src={m.poster_path ? `${TMDB_IMG}${m.poster_path}` : ""}
                            alt={m.title || m.name}
                            className="w-28 h-36 rounded object-cover mb-1"
                          />
                          <div className="text-xs">{m.title || m.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 text-right">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded bg-gradient-to-r from-red-600 to-red-800">
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
