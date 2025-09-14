import React, { useState, useEffect, useRef } from "react";
import { addDoc, Timestamp } from "firebase/firestore";
import { movielistRef } from "../firebase/firebase";
import { getAuth } from "firebase/auth";
import { Link } from "react-router-dom";

const MovieListCreator = () => {
  const [listName, setListName] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMovies, setSelectedMovies] = useState([]);
  const [showPopup, setShowPopup] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user ? user.uid : "anonymous";

  const tmdbAccessToken = process.env.REACT_APP_TMDB_ACCESS_TOKEN;
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(() => {
      performSearch();
    }, 500);
  }, [searchTerm]);

  const performSearch = async () => {
    try {
      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(
          searchTerm
        )}&api_key=${process.env.REACT_APP_TMDB_API_KEY}&language=en-US&page=1&include_adult=false`,
        {
          headers: {
            Authorization: `Bearer ${tmdbAccessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (data.results) {
        setSearchResults(data.results);
      }
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const addMovie = (movie) => {
    if (selectedMovies.find((m) => m.id === movie.id)) {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 1500);
      return;
    }
    setSelectedMovies([...selectedMovies, movie]);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 1500);
  };

  const removeMovie = (id) => {
    setSelectedMovies(selectedMovies.filter((movie) => movie.id !== id));
  };

  const handleSubmit = async () => {
    if (!listName.trim() || selectedMovies.length === 0) {
      alert("Please provide a list name and select at least one movie.");
      return;
    }
    try {
      await addDoc(movielistRef, {
        createdBy: userId,
        listName: listName,
        movies: selectedMovies.map(
          (movie) => `${movie.media_type}:${movie.id}`
        ),
        upvoted: 0,
        createdAt: Timestamp.now()
      });
      alert("Movie list created!");
      setListName("");
      setSearchTerm("");
      setSearchResults([]);
      setSelectedMovies([]);
    } catch (error) {
      console.error("Error adding document:", error);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-4">
      {/* Top-left button */}
      <div className="flex justify-start mb-8">
        <Link to={'/addmovies'}>
          <button className="rounded-lg px-4 py-2 text-lg text-black font-bold bg-gradient-to-b from-green-900 to-green-500 hover:from-green-800 hover:to-green-400 transition">
            Add New Analysis
          </button>
        </Link>
      </div>

      {/* Centered Form */}
      <div className="flex justify-center">
        <div className="w-full max-w-3xl p-6 rounded-lg shadow-lg">
          <h1 className="text-3xl font-bold text-red-600 mb-6 text-center">Create Movie List</h1>

          <input
            type="text"
            placeholder="List Name (e.g., Top 10 Horror Films)"
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-800 border border-gray-600 rounded text-white"
          />

          <input
            type="text"
            placeholder="Search for movies or TV shows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 mb-4 bg-gray-800 border border-gray-600 rounded text-white"
          />

          {searchResults.length > 0 && (
            <div className="mb-6">
              <h2 className="text-red-600 font-semibold mb-2">Search Results</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {searchResults.map((movie) => (
                  <div key={movie.id} className="bg-gray-800 p-2 rounded text-center hover:scale-105 transition">
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                          : "https://via.placeholder.com/150x225?text=No+Image"
                      }
                      alt={movie.title || movie.name}
                      className="mx-auto rounded mb-2"
                    />
                    <div className="text-sm mb-1">{movie.title || movie.name}</div>
                    <button
                      onClick={() => addMovie(movie)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Add
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedMovies.length > 0 && (
            <div className="mb-6">
              <h2 className="text-red-600 font-semibold mb-2">Selected Movies</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {selectedMovies.map((movie) => (
                  <div key={movie.id} className="bg-gray-800 p-2 rounded relative text-center hover:scale-105 transition">
                    <img
                      src={
                        movie.poster_path
                          ? `https://image.tmdb.org/t/p/w200${movie.poster_path}`
                          : "https://via.placeholder.com/150x225?text=No+Image"
                      }
                      alt={movie.title || movie.name}
                      className="mx-auto rounded mb-2"
                    />
                    <div className="text-sm mb-1">{movie.title || movie.name}</div>
                    <button
                      onClick={() => removeMovie(movie.id)}
                      className="absolute top-1 right-1 bg-red-600 rounded-full p-1 hover:bg-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded w-full"
          >
            Create List
          </button>

          {showPopup && (
            <div className="fixed top-5 right-5 bg-red-600 text-white px-4 py-2 rounded shadow-lg animate-pulse">
              Movie already added!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MovieListCreator;
