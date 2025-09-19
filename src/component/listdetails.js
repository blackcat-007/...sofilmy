// src/pages/ListDetails.js
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { movielistRef, usersRef } from "../firebase/firebase";
import { BallTriangle } from "react-loader-spinner";

const TMDB_API = process.env.REACT_APP_TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
const TMDB_PROFILE = "https://image.tmdb.org/t/p/w200";

function ListDetails() {
  const { listId } = useParams();
  const [listData, setListData] = useState(null);
  const [moviesData, setMoviesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [movieDetails, setMovieDetails] = useState(null);
  const [activeMediaType, setActiveMediaType] = useState("movie");

  const user = localStorage.getItem("userId");

  // ✅ Fetch current user
  const fetchUserData = async () => {
    const querySnapshot = await getDocs(usersRef);
    const usersArray = [];
    querySnapshot.forEach((docSnap) => {
      usersArray.push({ id: docSnap.id, ...docSnap.data() });
    });
    const currentUser = usersArray.find((u) => u.uid === user);
    if (currentUser) setUserData(currentUser);
  };

  // ✅ Fetch list
  const fetchList = async () => {
    const listDoc = await getDoc(doc(movielistRef, listId));
    if (listDoc.exists()) {
      const data = { id: listDoc.id, ...listDoc.data() };
      setListData(data);
      fetchMoviesDetails(data.movies);
    }
  };

  // ✅ Fetch posters only (for grid)
  const fetchMoviesDetails = async (moviesArray) => {
    const posters = await Promise.all(
      moviesArray.map(async (movieStr) => {
        const [type, id] = movieStr.split(":");
        try {
          const res = await fetch(
            `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API}&language=en-US`
          );
          return { ...(await res.json()), type, id };
        } catch {
          return null;
        }
      })
    );
    setMoviesData(posters.filter(Boolean));
    setLoading(false);
  };

  // ✅ Open modal & fetch full details
  const openMovieModal = async (id, type) => {
    setActiveMediaType(type);
    try {
      const detailRes = await fetch(
        `https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API}&language=en-US&append_to_response=videos,credits,similar`
      );
      const details = await detailRes.json();
      setMovieDetails(details);
      setShowMovieModal(true);
    } catch (err) {
      console.error("Failed to fetch movie details", err);
    }
  };

  // ✅ Toggle Watchlist
  const toggleWatchlist = async (id, type) => {
    if (!userData) return;
    const movieKey = `${type}:${id}`;
    const isAdded = userData.watchlist?.includes(movieKey);

    if (isAdded) {
      if (!window.confirm("Remove from watchlist?")) return;
    }

    const updatedList = isAdded
      ? userData.watchlist.filter((item) => item !== movieKey)
      : [...(userData.watchlist || []), movieKey];

    await updateDoc(doc(usersRef, userData.id), { watchlist: updatedList });
    setUserData((prev) => ({ ...prev, watchlist: updatedList }));
  };

  // ✅ Voting (like/dislike system)
  const handleVote = async (voteType) => {
    if (!listData || !user) return;
    const listRef = doc(movielistRef, listId);

    const upvotedBy = listData.upvotedBy || [];
    const downvotedBy = listData.downvotedBy || [];

    let newUp = [...upvotedBy];
    let newDown = [...downvotedBy];

    if (voteType === "up") {
      if (upvotedBy.includes(user)) return;
      newUp = [...newUp.filter((u) => u !== user), user];
      newDown = newDown.filter((u) => u !== user);
    } else {
      if (downvotedBy.includes(user)) return;
      newDown = [...newDown.filter((u) => u !== user), user];
      newUp = newUp.filter((u) => u !== user);
    }

    await updateDoc(listRef, {
      upvotedBy: newUp,
      downvotedBy: newDown,
      upvoted: newUp.length,
      downvoted: newDown.length,
    });

    setListData((prev) => ({
      ...prev,
      upvotedBy: newUp,
      downvotedBy: newDown,
      upvoted: newUp.length,
      downvoted: newDown.length,
    }));
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
      fetchList();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black text-white">
        <BallTriangle height={80} width={80} color="#FF0000" ariaLabel="loading" />
      </div>
    );
  }

  return (
    <div className="md:p-10 p-2 bg-black min-h-screen  text-white md:mx-20">
      {/* Header */}
      <h1 className="text-3xl font-bold text-red-600 mb-2">{listData.listName}</h1>
     <p className="text-sm text-gray-400 flex items-center gap-2">
  
  <span className="text-sm text-gray-300">
    Created by</span> <img
    src={userData.image}
    alt={userData.name}
    className="md:w-8 md:h-8 w-4 h-4 rounded-full object-cover"
  />{userData.name}
  
  <span className="text-gray-500">
    • {listData.createdAt?.toDate().toDateString()}
  </span>
</p>


      {/* Voting */}
      <div className="flex gap-4 my-4">
        <button
          onClick={() => handleVote("up")}
          className={`px-4 py-2 rounded hover:text-green-500/60 ${
            listData.upvotedBy?.includes(user) ? "text-green-600" : "text-gray-700"
          }`}
        >
         ▲ {listData.upvoted || 0}
        </button>
        <button
          onClick={() => handleVote("down")}
          className={`px-4 py-2 rounded hover:text-red-500/60 ${
            listData.downvotedBy?.includes(user) ? "text-red-600" : "text-gray-700"
          }`}
        >
           ▼ {listData.downvoted || 0}
        </button>
      </div>

   {/* Movies Grid */}
<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-6 px-6">
  {moviesData.map((m, i) => (
    <div
      key={`${m.type}:${m.id}`}
      className="cursor-pointer group"
      onClick={() => openMovieModal(m.id, m.type)}
    >
      {/* Poster */}
      <div className="overflow-hidden rounded-lg shadow-lg">
        <img
          src={
            m.poster_path
              ? `${TMDB_IMG}${m.poster_path}`
              : "https://via.placeholder.com/300x450?text=No+Image"
          }
          alt={m.title || m.name}
          className="w-full  h-auto object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/* Label */}
      <p className="mt-2 text-center text-sm text-gray-300 font-medium">
        {i + 1}
      </p>
    </div>
  ))}
</div>



      {/* Modal */}
      {showMovieModal && movieDetails && (
        <div className="fixed inset-0 z-30 flex items-center justify-center overflow-y-auto">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowMovieModal(false)}
          />
          <div className="relative z-50 w-11/12 md:w-3/4 lg:w-2/3 bg-gray-900 rounded-2xl shadow-xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={movieDetails.poster_path ? `${TMDB_IMG}${movieDetails.poster_path}` : ""}
                alt={movieDetails.title || movieDetails.name}
                className="w-44 h-64 rounded-lg object-cover bg-gray-800"
              />
              <div className="flex-1">
                <h2 className="text-3xl font-bold mb-2">
                  {movieDetails.title || movieDetails.name}
                </h2>
                <p className="text-sm text-gray-400 mb-3">
                  {(movieDetails.release_date || movieDetails.first_air_date || "").slice(0, 10)}
                  {" • "}
                  {movieDetails.genres?.map((g) => g.name).join(", ")}
                </p>
                <p className="mb-4">{movieDetails.overview}</p>
                <button
                  onClick={() => toggleWatchlist(movieDetails.id, activeMediaType)}
                  className={`px-3 py-1 rounded ${
                    userData?.watchlist?.includes(`${activeMediaType}:${movieDetails.id}`)
                      ? "bg-green-600"
                      : "bg-gradient-to-r from-red-600 to-red-800"
                  }`}
                >
                  {userData?.watchlist?.includes(`${activeMediaType}:${movieDetails.id}`)
                    ? "Added"
                    : "+ Watchlist"}
                </button>
              </div>
            </div>

            {/* Trailer */}
            {movieDetails.videos?.results?.length > 0 && (
              <iframe
                title="Trailer"
                className="w-full aspect-video rounded-xl mt-4"
                src={`https://www.youtube.com/embed/${
                  movieDetails.videos.results.find((v) => v.type === "Trailer")?.key
                }`}
                allowFullScreen
              />
            )}

            {/* Cast */}
            {movieDetails.credits?.cast?.length > 0 && (
              <>
                <h3 className="text-xl font-semibold mt-6 mb-3">Cast</h3>
                <div className="flex overflow-x-auto space-x-4 pb-3">
                  {movieDetails.credits.cast.slice(0, 10).map((c) => (
                    <div key={c.id} className="w-24 flex-shrink-0 text-center">
                      <img
                        src={c.profile_path ? `${TMDB_PROFILE}${c.profile_path}` : ""}
                        alt={c.name}
                        className="w-20 h-20 object-cover rounded-full mx-auto"
                      />
                      <p className="mt-2 text-xs">{c.name}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Similar */}
            {movieDetails.similar?.results?.length > 0 && (
              <>
                <h3 className="text-xl font-semibold mt-6 mb-3">Similar</h3>
                <div className="flex overflow-x-auto space-x-4 pb-3">
                  {movieDetails.similar.results.map((sm) => (
                    <img
                      key={sm.id}
                      src={sm.poster_path ? `${TMDB_IMG}${sm.poster_path}` : ""}
                      alt={sm.title || sm.name}
                      className="w-28 rounded"
                      onClick={() => openMovieModal(sm.id, activeMediaType)} // ✅ pass current type
                    />
                  ))}
                </div>
              </>
            )}

            <button
              onClick={() => setShowMovieModal(false)}
              className="mt-6 px-4 py-2 rounded-lg bg-red-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ListDetails;
