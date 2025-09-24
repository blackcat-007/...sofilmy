import React, { useState, useEffect, useRef } from "react";
import { getDocs, query, limit, startAfter, orderBy, updateDoc, doc,where } from "firebase/firestore";
import { movielistRef, usersRef } from "../firebase/firebase";
import { Link } from "react-router-dom";
import { BallTriangle } from "react-loader-spinner";
import ListSkeleton from "../ui/listskeleton";
import { CircleArrowDown } from "lucide-react";
import "../App.css"

function MovieLists({selectedId}) {
  const [datas, setDatas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [posters, setPosters] = useState({});
  const [overlaps, setOverlaps] = useState({}); // To store overlap per list
  const containerRefs = useRef({}); // To hold refs for each list's container

  const tmdbApiKey = process.env.REACT_APP_TMDB_API_KEY;
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
  const cacheKey = "usersData";
  const cachedUsers = getCache(cacheKey, 60 * 60 * 1000); // 1 hour cache

  if (cachedUsers) {
    setUsers(cachedUsers);
    return;
  }

  const allUsers = [];
  const querySnapshot = await getDocs(usersRef);
  querySnapshot.forEach((doc) => {
    allUsers.push({ id: doc.id, ...doc.data() });
  });
  setUsers(allUsers);
  setCache(cacheKey, allUsers);
};


 const fetchMovieLists = async () => {
  if (!hasMore) return;
  setLoading(true);

  try {
    const baseQuery = [
      orderBy("createdBy"),
      orderBy("upvoted", "desc"),
      orderBy("createdAt", "asc"),
      orderBy("__name__"),
      ...(lastDoc ? [startAfter(lastDoc)] : []),
      limit(7), // always overfetch 1
    ];

    if (selectedId) {
      baseQuery.unshift(where("createdBy", "==", selectedId));
    }

    const q = query(movielistRef, ...baseQuery);
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      setHasMore(false);
      setLoading(false);
      return;
    }

    const docs = querySnapshot.docs;
    const mapped = docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // 👉 use first 6 for display
    const newLists = mapped.slice(0, 6);

    setDatas((prev) => [...prev, ...newLists]);

    // 👉 if we got 7, store that last one as cursor
    if (docs.length === 7) {
      setLastDoc(docs[6]); // the 7th
      setHasMore(true);
    } else {
      setLastDoc(null);
      setHasMore(false);
    }

  } catch (err) {
    console.error("Error fetching movie lists:", err);
  } finally {
    setLoading(false);
  }
};


  const fetchPostersForList = async (list) => {
  const listId = list.id;
  const cacheKey = `posters-${listId}`;
  const cachedPosters = getCache(cacheKey, 24*60* 60 * 1000); // 1 day cache

  if (cachedPosters) {
    setPosters(prev => ({ ...prev, [listId]: cachedPosters }));
    return;
  }

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
  setCache(cacheKey, posterUrls);
};


  const getUserDetails = (uid) => {
    const user = users.find((u) => u.uid === uid);
    return user || { name: "Unknown", image: "https://via.placeholder.com/40" };
  };

 const userId = localStorage.getItem("userId"); // Current user ID

const handleUpvote = async (list) => {
  const listDoc = doc(movielistRef.firestore, "movielist", list.id);

  const hasUpvoted = list.upvotedBy?.includes(userId);
  const hasDownvoted = list.downvotedBy?.includes(userId);

  let newUpvotedBy = list.upvotedBy ? [...list.upvotedBy] : [];
  let newDownvotedBy = list.downvotedBy ? [...list.downvotedBy] : [];

  let newUpvotes = list.upvoted || 0;
  let newDownvotes = list.downvoted || 0;

  if (!hasUpvoted) {
    // Remove from downvote if present
    if (hasDownvoted) {
      newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
      newDownvotes = Math.max(newDownvotes - 1, 0);
    }

    // Add to upvote
    newUpvotedBy.push(userId);
    newUpvotes += 1;
  } else {
    // Optional: Remove upvote if clicked again (toggle behavior)
    newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
    newUpvotes = Math.max(newUpvotes - 1, 0);
  }

  await updateDoc(listDoc, {
    upvoted: newUpvotes,
    downvoted: newDownvotes,
    upvotedBy: newUpvotedBy,
    downvotedBy: newDownvotedBy,
  });

  setDatas(prev =>
    prev.map(item =>
      item.id === list.id
        ? { ...item, upvoted: newUpvotes, downvoted: newDownvotes, upvotedBy: newUpvotedBy, downvotedBy: newDownvotedBy }
        : item
    )
  );
};

const handleDownvote = async (list) => {
  const listDoc = doc(movielistRef.firestore, "movielist", list.id);

  const hasDownvoted = list.downvotedBy?.includes(userId);
  const hasUpvoted = list.upvotedBy?.includes(userId);

  let newUpvotedBy = list.upvotedBy ? [...list.upvotedBy] : [];
  let newDownvotedBy = list.downvotedBy ? [...list.downvotedBy] : [];

  let newUpvotes = list.upvoted || 0;
  let newDownvotes = list.downvoted || 0;

  if (!hasDownvoted) {
    // Remove from upvote if present
    if (hasUpvoted) {
      newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
      newUpvotes = Math.max(newUpvotes - 1, 0);
    }

    // Add to downvote
    newDownvotedBy.push(userId);
    newDownvotes += 1;
  } else {
    // Optional: Remove downvote if clicked again (toggle behavior)
    newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
    newDownvotes = Math.max(newDownvotes - 1, 0);
  }

  await updateDoc(listDoc, {
    upvoted: newUpvotes,
    downvoted: newDownvotes,
    upvotedBy: newUpvotedBy,
    downvotedBy: newDownvotedBy,
  });

  setDatas(prev =>
    prev.map(item =>
      item.id === list.id
        ? { ...item, upvoted: newUpvotes, downvoted: newDownvotes, upvotedBy: newUpvotedBy, downvotedBy: newDownvotedBy }
        : item
    )
  );
};


  const formatDate = (timestamp) => {
  if (!timestamp) return "Unknown date";

  let date;

  // If it's a Firestore Timestamp
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } 
  // If it's a string (from cache)
  else {
    date = new Date(timestamp);
  }

  return date.toLocaleDateString() + " " + date.toLocaleTimeString();
};



  return (
   <div className="p-2  h-auto min-w-screen md:mx-14 rounded-lg backdrop-blur-2xl relative overflow-hidden animated-bg">
   

    <h1 className="text-2xl font-bold mt-4 ml-3 text-white mb-4 text-left relative  z-10">Top Featured Lists</h1>

    {/* Scrollable container */}
    <div className="relative z-10 h-[calc(2*14rem)] overflow-y-auto space-y-4 p-0 md:p-8 animated-bg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {datas.map((list) => {
          const user = getUserDetails(list.createdBy);
          const posterUrls = posters[list.id] || [];
          //const overlap = overlaps[list.id] || 0;
          return (
            <Link
              to={`/listdetails/${list.id}`}
              key={list.id}
              className=" rounded-lg overflow-hidden scale-95 hover:scale-100   duration-200 ease-out 
             hover:-rotate-6 hover:-skew-y-3 md:w-96 transition-transform relative hover:bg-gradient-to-tr from-black/60 to-gray-200/60"
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
        className="absolute w-24 h-36 object-cover rounded shadow-md transition-transform duration-300 hover:scale-110"
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
    handleUpvote(list);
  }}
  className={`flex items-center gap-1 ${list.upvotedBy?.includes(userId) ? "text-green-500" : "text-white"} hover:text-red-500`}
>
  ▲ {list.upvoted || 0}
</button>

<button
  onClick={(e) => {
    e.preventDefault();
    handleDownvote(list);
  }}
  className={`flex items-center gap-1 ${list.downvotedBy?.includes(userId) ? "text-red-500" : "text-white"} hover:text-blue-500`}
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
          {[1, 2, 3, 4,5,6].map((_, index) => (
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
        <button onClick={fetchMovieLists} className="bg-gradient-to-r flex items-center justify-center from-red-500 to-red-900 hover:from-red-800 hover:to-red-950 text-white sm:px-4 px-2 sm:h-10 h-7 w-auto sm:text-base text-xs rounded">
          Load More<CircleArrowDown className="ml-2" />
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
