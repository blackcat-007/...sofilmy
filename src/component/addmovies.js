import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { TailSpin } from "react-loader-spinner";
import { addDoc } from "firebase/firestore";
import { moviesRef } from "../firebase/firebase";
import swal from "sweetalert";
import { Appstate } from "../App";
import { useNavigate } from "react-router-dom";

/**
 * ======= TMDB CONFIG =======
 * Uses your env values when available; falls back to the ones you shared.
 * Best practice: keep tokens in env (e.g. VITE_TMDB_ACCESS_TOKEN, REACT_APP_*)
 */
const TMDB_ACCESS_TOKEN = process.env.REACT_APP_TMDB_ACCESS_TOKEN;
const TMDB_API_KEY = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_API_URL = process.env.REACT_APP_TMDB_API_URL || "https://api.themoviedb.org/3";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const OMDB_API="http://www.omdbapi.com/?i=tt3896198&apikey=ebeb521b"

/** Country preference for watch providers (India first, then fallback) */
const PROVIDER_REGIONS = ["IN", "US", "GB"];

/** Analysis sections requested */
const ANALYSIS_SECTIONS = [
  "Story / Plot",
  "Screenplay & Dialogues",
  "Pacing",
  "Themes / Symbolism",
  "Social & Political Commentary",
  "Acting",
  "Direction",
  "Character Development",
  "Background Score",
  "Sound Design",
  "Songs & Lyrics",
  "Emotional Impact",
  "Rewatch Value",
  "Plot Holes",
  "World Building & Setting",
  "Genre Execution",
  "Director's Style",
  "Comparison to Others",
  "Final Verdict",
  "If I Could Change One Thing",
  "Favourite Scene",
];

/** Small helper */
const cls = (...arr) => arr.filter(Boolean).join(" ");

function Addmovies() {
  // ===== Cache (in-memory; can replace with localStorage if you want persistence) =====
const searchCache = new Map();   // query -> results
const detailsCache = new Map();  // id/imdbId -> details
  const app = useContext(Appstate);
  const username=localStorage.getItem("username");
  const isLoggedIn = app?.login || localStorage.getItem("login") === "true";
  const navigate = useNavigate();

  // ----------- Search / Dropdown -----------
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef(null);

  // ----------- Selected Movie + Meta -----------
  const [selected, setSelected] = useState(null); // full TMDB payload
  const [form, setForm] = useState({
    name: "",
    year: "",
    description: "",
    image: "",
    cast: [],
    genres: [],
    tmdbRating: null,
    imdbId: null,
    letterboxdSlug: null, // not in TMDB; we’ll derive a best-effort slug
    watchProviders: { flatrate: [], rent: [], buy: [] },
  });

  // ----------- Toggles & Rating -----------
  const [spoilerFree, setSpoilerFree] = useState(true);
  const [sarcasm, setSarcasm] = useState(false);
  const [stars, setStars] = useState(0); // 0..5

  // ----------- Dynamic Analysis Boxes -----------
  const [openSections, setOpenSections] = useState([]); // array of section names open
  const [analysis, setAnalysis] = useState({}); // { [sectionName]: text }

  // ----------- Submit Loading -----------
  const [loading, setLoading] = useState(false);

  // ====== TMDB helpers ======
  const tmdbFetch = async (path, params = {}) => {
    const url = new URL(`${TMDB_API_URL}${path}`);
    // support either Bearer token header or api_key param
    Object.entries(params).forEach(([k, v]) => url.searchParams.append(k, v));
    // Prefer Bearer; fall back to api_key if needed
    const headers = {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_ACCESS_TOKEN}`,
    };
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error(`TMDB ${path} failed ${res.status}`);
    return res.json();
  };

  const searchMovies = async (q) => {
    if (!q?.trim()) {
      setResults([]);
      return;
    }
     // Check cache first
  if (searchCache.has(q)) {
    setResults(searchCache.get(q));
    return;
  }
    setSearchLoading(true);
    try {
      const data = await tmdbFetch("/search/movie", {
        query: q,
        include_adult: "false",
        language: "en-US",
        page: "1",
      });
      setResults(data.results || []);
      searchCache.set(q, data.results || []);
    } catch (e) {
      console.error(e);
      setResults([]);
      
    } finally {
      setSearchLoading(false);
    }
  };

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchMovies(query);
    }, 350); // debounce
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const pickRegionProviders = (providers) => {
    // providers: results from TMDB watch/providers
    for (const r of PROVIDER_REGIONS) {
      if (providers?.results?.[r]) return providers.results[r];
    }
    // fallback to any region if exists
    const any = providers?.results && Object.values(providers.results)[0];
    return any || null;
  };

  const slugify = (s) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  const selectMovie = async (movie) => {
    setShowDropdown(false);
    setQuery(movie.title || movie.name || "");
     // Check details cache
  if (detailsCache.has(movie.id || movie.imdbID)) {
    const cached = detailsCache.get(movie.id || movie.imdbID);
    setSelected(cached.details);
    setForm(cached.form);
    return;
  }
    try {
      // Fetch full detail with extras
      const details = await tmdbFetch(`/movie/${movie.id}`, {
        language: "en-US",
        append_to_response:
          "credits,external_ids,release_dates,watch/providers,images",
      });

      const year =
        (details.release_date || "").slice(0, 4) ||
        (movie.release_date || "").slice(0, 4) ||
        "";

      const cast =
        details?.credits?.cast?.slice(0, 8)?.map((c) => c.name) || [];

      const genres =
        details?.genres?.map((g) => g.name)?.filter(Boolean) || [];

      // Providers (region-aware)
      const regionBlock = pickRegionProviders(details?.["watch/providers"]);
      const watchProviders = {
        flatrate: regionBlock?.flatrate || [],
        rent: regionBlock?.rent || [],
        buy: regionBlock?.buy || [],
      };

      // External IDs
      const imdbId = details?.external_ids?.imdb_id || null;

      // Best-effort Letterboxd link: no official API; we craft a common slug
      // (Users can click through; rating itself not available via TMDB)
      const letterboxdSlug = details?.title
        ? `${slugify(details.title)}-${year}`
        : null;

      const formObj = {
      name: details.title || movie.title || "",
      year,
      description: details.overview || "",
      image: details.poster_path ? `${TMDB_IMG}${details.poster_path}` : "",
      cast,
      genres,
      tmdbRating: typeof details.vote_average === "number"
        ? Number(details.vote_average.toFixed(1))
        : null,
      imdbId,
      letterboxdSlug,
      watchProviders,
    };

    setSelected(details);
    setForm(formObj);
    detailsCache.set(movie.id, { details, form: formObj });
    } catch (e) {
      console.error("Error loading movie details:", e);
      swal({
        title: "TMDB Error",
        text: "Couldn't fetch full details. Try another title or retry.",
        icon: "error",
        buttons: true,
      });
    }
  };

  // ====== Rating UI ======
  const Star = ({ filled, onClick, onMouseEnter, onMouseLeave }) => (
    <button
      type="button"
      aria-label="star"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cls(
        "text-3xl transition",
        filled ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"
      )}
    >
      ★
    </button>
  );

  // ====== Analysis Buttons Logic ======
  const isOpen = (name) => openSections.includes(name);
  const openSection = (name) => {
    if (!isOpen(name)) setOpenSections((s) => [...s, name]);
  };
  const closeSection = (name) => {
    setOpenSections((s) => s.filter((n) => n !== name));
    setAnalysis((a) => {
      const clone = { ...a };
      delete clone[name];
      return clone;
    });
  };

  // ====== Submit ======
  const addmovies = async () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    const { name, year, description, image } = form;
    if (!name.trim() || !year.trim() || !description.trim() || !image.trim()) {
      swal({
        title: "Incomplete",
        text: "Please select a movie (or fill all required fields).",
        icon: "warning",
        buttons: false,
        timer: 2500,
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        // Movie meta
        postedBy: username,
        name: form.name,
        year: form.year,
        description: form.description,
        image: form.image,
        cast: form.cast,
        genres: form.genres,
        tmdbRating: form.tmdbRating, // from TMDB
        // IMDb / Letterboxd links (ratings require extra API; see note)
        imdb: form.imdbId ? `https://www.imdb.com/title/${form.imdbId}/` : null,
        letterboxd: form.letterboxdSlug
          ? `https://letterboxd.com/film/${form.letterboxdSlug}/`
          : null,

        // Where to watch (provider names & logos)
        watchProviders: form.watchProviders,

        // Post toggles & user rating
        spoilerFree,
        sarcasm,
        userStars: stars,

        // Analysis text blocks
        analysis, // { sectionName: text }

        // Timestamps
        createdAt: new Date().toISOString(),
      };

      await addDoc(moviesRef, payload);

      swal({
        title: "Successfully Added",
        icon: "success",
        buttons: false,
        timer: 2500,
      });

      // reset
      setSelected(null);
      setQuery("");
      setResults([]);
      setForm({
        name: "",
        year: "",
        description: "",
        image: "",
        cast: [],
        genres: [],
        tmdbRating: null,
        imdbId: null,
        letterboxdSlug: null,
        watchProviders: { flatrate: [], rent: [], buy: [] },
      });
      setSpoilerFree(true);
      setSarcasm(false);
      setStars(0);
      setOpenSections([]);
      setAnalysis({});
    } catch (error) {
      console.error("Error adding movie:", error);
      swal({
        title: "Error",
        text: "Something went wrong while adding the movie.",
        icon: "error",
        buttons: true,
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen">
      <section className="text-gray-100 body-font relative">
        <div className="container px-5 py-8 mx-auto">
          {/* ======= Search / Dropdown ======= */}
          <div className="mx-auto lg:w-3/4">
            <label className="block text-sm font-medium text-red-400 mb-1">
              Search a film (TMDB)
            </label>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type to search…"
                className="w-full bg-white text-black rounded border border-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-200 h-12 text-base outline-none py-2 px-3 transition-colors duration-200"
              />
              {searchLoading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <TailSpin height={22} width={22} color="gray" />
                </div>
              )}

              {showDropdown && results.length > 0 && (
                <ul
                  className="absolute z-20 mt-2 w-full max-h-80 overflow-auto rounded-xl bg-white text-black shadow-lg border border-gray-200"
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  {results.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => selectMovie(m)}
                    >
                      {m.poster_path ? (
                        <img
                          src={`${TMDB_IMG}${m.poster_path}`}
                          alt={m.title}
                          className="w-10 h-14 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-14 bg-gray-300 rounded" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">
                          {m.title}{" "}
                          <span className="text-gray-500">
                            ({(m.release_date || "").slice(0, 4)})
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-1">
                          {m.overview}
                        </div>
                      </div>
                      <div className="text-xs bg-gray-200 px-2 py-1 rounded">
                        TMDB {typeof m.vote_average === "number" ? m.vote_average.toFixed(1) : "—"}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* ======= Title ======= */}
          <div className="flex flex-col text-center w-full mt-8 mb-4">
            <h1 className="sm:text-xl text-2xl font-semibold title-font text-red-400">
              Add New Movie Analysis
            </h1>
          </div>

          {/* ======= Poster + Details ======= */}
          <div className="lg:w-3/4 mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Poster */}
            <div className="col-span-1">
              {form.image ? (
                <img
                  src={form.image}
                  alt={form.name}
                  className="w-full rounded-2xl shadow-md object-cover"
                />
              ) : (
                <div className="w-full aspect-[2/3] rounded-2xl bg-gray-800/40 border border-gray-700" />
              )}
            </div>

            {/* Details */}
            <div className="col-span-1 lg:col-span-2 space-y-4">
              {/* Name / Year */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="name" className="leading-7 text-sm text-red-400">
                    Movie Name <span className="text-green-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-white text-black rounded border border-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-200 h-12 text-base outline-none py-2 px-3 transition-colors"
                  />
                </div>

                <div>
                  <label htmlFor="year" className="leading-7 text-sm text-red-400">
                    Year <span className="text-green-400">*</span>
                  </label>
                  <input
                    id="year"
                    type="text"
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full bg-white text-black rounded border border-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-200 h-12 text-base outline-none py-2 px-3 transition-colors"
                  />
                </div>

                {/* Spoiler & Sarcasm toggles */}
                <div className="flex items-end gap-4">
                  <label className="flex items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      checked={spoilerFree}
                      onChange={(e) => setSpoilerFree(e.target.checked)}
                    />
                    <span className="text-sm">Spoiler-free</span>
                  </label>
                  <label className="flex items-center gap-2 select-none">
                    <input
                      type="checkbox"
                      checked={sarcasm}
                      onChange={(e) => setSarcasm(e.target.checked)}
                    />
                    <span className="text-sm">Sarcasm</span>
                  </label>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="leading-7 text-sm text-red-400">
                  Description / Overview <span className="text-green-400">*</span>
                </label>
                <textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-white text-black rounded border border-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-200 h-28 text-base outline-none py-2 px-3 resize-y transition-colors"
                />
              </div>

              {/* Cast & Genres */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-red-400 mb-1">Cast</div>
                  <div className="flex flex-wrap gap-2">
                    {form.cast.length ? (
                      form.cast.map((c) => (
                        <span
                          key={c}
                          className="text-xs bg-gray-700/60 border border-gray-600 px-2 py-1 rounded-full"
                        >
                          {c}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-red-400 mb-1">Genres</div>
                  <div className="flex flex-wrap gap-2">
                    {form.genres.length ? (
                      form.genres.map((g) => (
                        <span
                          key={g}
                          className="text-xs bg-gray-700/60 border border-gray-600 px-2 py-1 rounded-full"
                        >
                          {g}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Ratings row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">TMDB:</span>
                  <span className="text-base">
                    {form.tmdbRating != null ? form.tmdbRating : "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">IMDb:</span>
                  {form.imdbId ? (
                    <a
                      href={`https://www.imdb.com/title/${form.imdbId}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-blue-300"
                      title="Open IMDb (rating not fetched from TMDB)"
                    >
                      View on IMDb
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-400">Letterboxd:</span>
                  {form.letterboxdSlug ? (
                    <a
                      href={`https://letterboxd.com/film/${form.letterboxdSlug}/`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline text-blue-300"
                      title="Open Letterboxd (rating not fetched from TMDB)"
                    >
                      View on Letterboxd
                    </a>
                  ) : (
                    <span>—</span>
                  )}
                </div>
              </div>

              {/* Where to watch */}
              <div>
                <div className="text-sm text-red-400 mb-2">Available On</div>
                {["flatrate", "rent", "buy"].map((k) => (
                  <div key={k} className="mb-2">
                    <div className="text-xs uppercase tracking-wide text-gray-400 mb-1">
                      {k}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {form.watchProviders?.[k]?.length ? (
                        form.watchProviders[k].map((p) => (
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

              {/* 5-Star Rating */}
              <div className="mt-2">
                <div className="text-sm text-red-400 mb-1">Your Rating</div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      filled={i <= stars}
                      onClick={() => setStars(i)}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-300">{stars}/5</span>
                </div>
              </div>
            </div>
          </div>

          {/* ======= Analysis Buttons ======= */}
          <div className="lg:w-3/4 mx-auto mt-8">
            <div className="flex flex-wrap gap-2">
              {ANALYSIS_SECTIONS.map((sec) => {
                const active = isOpen(sec);
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => openSection(sec)}
                    disabled={active}
                    className={cls(
                      "px-3 py-2 rounded-full text-sm border transition",
                      active
                        ? "opacity-40 cursor-not-allowed border-gray-700 bg-gray-800 text-gray-400"
                        : "bg-green-500 hover:bg-green-600 text-white border-green-600"
                    )}
                    title={active ? "Already added" : "Add section"}
                  >
                    {sec}
                  </button>
                );
              })}
            </div>

            {/* Opened Analysis Boxes */}
            <div className="mt-6 space-y-4">
              {openSections.map((sec) => (
                <div
                  key={sec}
                  className="bg-white text-black rounded-xl p-4 border border-gray-300"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{sec}</div>
                    <button
                      type="button"
                      onClick={() => closeSection(sec)}
                      className="text-sm px-3 py-1 rounded bg-red-500 hover:bg-red-600 text-white"
                    >
                      Delete
                    </button>
                  </div>
                  <textarea
                    value={analysis[sec] || ""}
                    onChange={(e) =>
                      setAnalysis((a) => ({ ...a, [sec]: e.target.value }))
                    }
                    placeholder={`Write your thoughts on "${sec}"…`}
                    className="w-full h-28 bg-white text-black rounded border border-gray-300 focus:border-green-400 focus:ring-2 focus:ring-green-200 outline-none p-3"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* ======= Submit ======= */}
          <div className="lg:w-3/4 mx-auto mt-8">
            <button
              onClick={addmovies}
              className="flex mx-auto text-white bg-green-500 border-0 py-3 px-10 focus:outline-none hover:bg-green-600 rounded-lg text-lg"
            >
              {loading ? <TailSpin height={22} color="white" /> : "Submit"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Addmovies;
