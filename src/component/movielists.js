import React, { useState, useEffect } from "react";
import { getDocs, query, limit, startAfter, orderBy, updateDoc, doc } from "firebase/firestore";
import { movielistRef, usersRef } from "../firebase/firebase";
import { Link } from "react-router-dom";
import { BallTriangle } from "react-loader-spinner";
import ListSkeleton from "../ui/listskeleton";

function MovieLists() {
  const [datas, setDatas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [posters, setPosters] = useState({});
  const tmdbApiKey = process.env.REACT_APP_TMDB_API_KEY;

  useEffect(() => {
    fetchUsers();
    fetchMovieLists();
  }, []);

  useEffect(() => {
    if (datas.length > 0) {
      datas.forEach(list => fetchPostersForList(list));
    }
  }, [datas]);

  const fetchUsers = async () => {
    const allUsers = [];
    const querySnapshot = await getDocs(usersRef);
    querySnapshot.forEach((doc) => {
      allUsers.push({ id: doc.id, ...doc.data() });
    });
    setUsers(allUsers);
  };

  const fetchMovieLists = async () => {
    if (!hasMore) return;
    setLoading(true);
    const q = query(
      movielistRef,
      orderBy("upvoted", "desc"),
      orderBy("createdAt", "asc"),
      limit(4),
      ...(lastDoc ? [startAfter(lastDoc)] : [])
    );
    const querySnapshot = await getDocs(q);
    const newLists = [];
    querySnapshot.forEach((doc) => {
      newLists.push({ id: doc.id, ...doc.data() });
    });
    setDatas((prev) => [...prev, ...newLists]);
    if (querySnapshot.docs.length > 0) {
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
    }
    if (querySnapshot.docs.length < 4) {
      setHasMore(false);
    }
    setLoading(false);
  };

  const fetchPostersForList = async (list) => {
    const listId = list.id;
    const moviePromises = list.movies.map(async (movieStr) => {
      const [type, id] = movieStr.split(":");
      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/${type}/${id}?api_key=${tmdbApiKey}&language=en-US`
        );
        const data = await response.json();
        return data.poster_path 
          ? `https://image.tmdb.org/t/p/w200${data.poster_path}` 
          : "https://via.placeholder.com/200x300?text=No+Image";
      } catch (err) {
        console.error("Failed to fetch poster", err);
        return "https://via.placeholder.com/200x300?text=No+Image";
      }
    });

    const posterUrls = await Promise.all(moviePromises);
    setPosters(prev => ({ ...prev, [listId]: posterUrls }));
  };

  const getUserDetails = (uid) => {
    const user = users.find((u) => u.uid === uid);
    return user || { name: "Unknown", image: "https://via.placeholder.com/40" };
  };

  const handleUpvote = async (listId, currentCount) => {
    const listDoc = doc(movielistRef.firestore, "movielist", listId);
    await updateDoc(listDoc, {
      upvoted: currentCount + 1
    });
    setDatas((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, upvoted: currentCount + 1 } : list
      )
    );
  };

  const handleDownvote = async (listId, currentCount) => {
    const listDoc = doc(movielistRef.firestore, "movielist", listId);
    await updateDoc(listDoc, {
      downvoted: currentCount + 1
    });
    setDatas((prev) =>
      prev.map((list) =>
        list.id === listId ? { ...list, downvoted: (currentCount || 0) + 1 } : list
      )
    );
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Unknown date";
    const date = timestamp.toDate();
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="p-4 bg-black min-h-screen text-white mx-8">
      <h1 className="text-2xl font-bold text-white mb-4 text-left">Featured Lists</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {datas.map((list) => {
          const user = getUserDetails(list.createdBy);
          const posterUrls = posters[list.id] || [];
          return (
            <Link
              to={`/listdetails/${list.id}`}
              key={list.id}
              className="bg-zinc-800 rounded-lg overflow-hidden hover:scale-105 transition-transform"
            >
              <div className="flex flex-wrap gap-2 p-2 bg-gray-900 justify-center">
                {posterUrls.map((url, index) => (
                  <img
                    key={index}
                    src={url}
                    alt={`Poster ${index + 1}`}
                    className="w-32 h-48 object-cover rounded"
                  />
                ))}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">{list.listName}</h2>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={user.image}
                    alt={user.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <span className="text-sm text-gray-300">Created by {user.name}</span>
                </div>
                <div className="text-xs text-gray-400 mb-2">
                  Created at: {formatDate(list.createdAt)}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleUpvote(list.id, list.upvoted);
                    }}
                    className="flex items-center gap-1 text-white hover:text-red-500"
                  >
                    ▲ {list.upvoted}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleDownvote(list.id, list.downvoted || 0);
                    }}
                    className="flex items-center gap-1 text-white hover:text-blue-500"
                  >
                    ▼ {list.downvoted || 0}
                  </button>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <ListSkeleton />
           <ListSkeleton />
           <ListSkeleton />
           <ListSkeleton />
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center mt-6">
          <button onClick={fetchMovieLists} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded">
            Load More
          </button>
        </div>
      )}

      {!hasMore && (
        <div className="text-center text-gray-400 mt-4">
          No more lists to load.
        </div>
      )}
    </div>
  );
}

export default MovieLists;
