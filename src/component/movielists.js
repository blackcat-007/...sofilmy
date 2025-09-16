import React, { useState, useEffect, useRef } from "react";
import { getDocs, query, limit, startAfter, orderBy, updateDoc, doc } from "firebase/firestore";
import { movielistRef, usersRef } from "../firebase/firebase";
import { Link } from "react-router-dom";
import { BallTriangle } from "react-loader-spinner";
import ListSkeleton from "../ui/listskeleton";
import ExpandCircleDownOneToneIcon from '@mui/icons-material/ExpandCircleDownTwoTone';
import "../App.css"

function MovieLists() {
  const [datas, setDatas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [posters, setPosters] = useState({});
  const [overlaps, setOverlaps] = useState({}); // To store overlap per list
  const containerRefs = useRef({}); // To hold refs for each list's container

  const tmdbApiKey = process.env.REACT_APP_TMDB_API_KEY;

  useEffect(() => {
    fetchUsers();
    fetchMovieLists();
  }, []);

  useEffect(() => {
    if (datas.length > 0) {
      datas.forEach(list => {
        fetchPostersForList(list);
      });
    }
  }, [datas]);

  useEffect(() => {
    // After posters are set, calculate overlaps
    Object.keys(posters).forEach(listId => {
      calculateOverlap(listId);
    });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [posters]);

  const handleResize = () => {
    Object.keys(posters).forEach(listId => {
      calculateOverlap(listId);
    });
  };

  const calculateOverlap = (listId) => {
  const container = containerRefs.current[listId];
  if (!container) return;
  const containerWidth = container.offsetWidth;
  const imgWidth = 80; // Tailwind w-20 = 80px
  const count = posters[listId]?.length || 0;

  if (count <= 1) {
    setOverlaps(prev => ({ ...prev, [listId]: 0, [`${listId}-offset`]: (containerWidth - imgWidth) / 2 }));
  } else {
    const maxOverlap = imgWidth * 0.8;
    const totalNeededWidth = imgWidth + (count - 1) * maxOverlap;

    let overlap;
    if (totalNeededWidth <= containerWidth) {
      overlap = maxOverlap;
    } else {
      overlap = (containerWidth - imgWidth) / (count - 1);
    }

    const totalStackWidth = imgWidth + (count - 1) * overlap;
    const offset = (containerWidth - totalStackWidth) / 2;

    setOverlaps(prev => ({ ...prev, [listId]: overlap, [`${listId}-offset`]: offset }));
  }
};



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
      limit(6),
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
    if (querySnapshot.docs.length < 6) {
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
   <div className="p-2 min-h-screen min-w-screen md:mx-14 rounded-lg backdrop-blur-2xl relative overflow-hidden animated-bg">
   

    <h1 className="text-2xl font-bold mt-4 ml-3 text-white mb-4 text-left relative  z-10">Top Featured Lists</h1>

    {/* Scrollable container */}
    <div className="relative z-10 h-[calc(2*20rem)] overflow-y-auto space-y-4 p-0 md:p-8 animated-bg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {datas.map((list) => {
          const user = getUserDetails(list.createdBy);
          const posterUrls = posters[list.id] || [];
          //const overlap = overlaps[list.id] || 0;
          return (
            <Link
              to={`/listdetails/${list.id}`}
              key={list.id}
              className=" rounded-lg overflow-hidden scale-90 hover:scale-100  md:w-96 transition-transform relative"
            >
              <div
  ref={el => containerRefs.current[list.id] = el}
  className="relative w-full h-40 p-2 flex items-center justify-center"
>
  {posterUrls.map((url, index) => {
    const offset = overlaps[`${list.id}-offset`] || 0;
    const overlap = overlaps[list.id] || 0;
    return (
      <img
        key={index}
        src={url}
        alt={`Poster ${index + 1}`}
        className="absolute w-20 h-32 object-cover rounded shadow-md transition-transform duration-300 hover:scale-110"
        style={{
          left: `${offset + index * overlap}px`,
          zIndex: posterUrls.length - index,
        }}
      />
    );
  })}
</div>


              <div className="p-4">
                <h2 className="text-lg font-semibold mb-2">{list.listName}</h2>
                <div className="flex items-center gap-3 mb-2">
                  <img
                    src={user.image}
                    alt={user.name}
                    className="md:w-8 md:h-8 w-4 h-4 rounded-full object-cover"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3, 4].map((_, index) => (
            <div
              key={index}
              className=" rounded-lg overflow-hidden hover:scale-100 transition-transform"
            >
              <ListSkeleton />
            </div>
          ))}
        </div>
      )}
    </div>

    {!loading && hasMore && (
      <div className="flex justify-center mt-4 relative z-10">
        <button onClick={fetchMovieLists} className="bg-gradient-to-r from-red-500 to-red-900 hover:from-red-800 hover:to-red-950 text-white sm:px-4 px-2 sm:h-10 h-7 w-auto sm:text-base text-xs rounded">
          Load More<ExpandCircleDownOneToneIcon className="ml-2" />
        </button>
      </div>
    )}

    {!hasMore && (
      <div className="text-center text-gray-400 mt-4 relative z-10">
        No more lists to load.
      </div>
    )}
  </div>
  );
}

export default MovieLists;
