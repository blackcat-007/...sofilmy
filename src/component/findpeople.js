import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { Link } from "react-router-dom";
import Sidebar from "./sidebar";
import Loader from "../ui/loader";
const db = getFirestore();

function FindPeople() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
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


 const fetchPeople = async (term = "") => {
  setLoading(true);
  try {
    const currentUserId = localStorage.getItem("userId");
    const cacheKey = "usersCache";
    const cachedData = getCache(cacheKey, 10 * 60 * 1000); // 10 min cache

    let userList = cachedData;
    if (!userList) {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      userList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setCache(cacheKey, userList);
    }

    const loggedInUser = userList.find((u) => u.uid === currentUserId);
    setCurrentUser(loggedInUser);

    // filter out current user from list
    userList = userList.filter((user) => user.uid !== currentUserId);

    // apply search
    if (term.trim()) {
      const lowerTerm = term.toLowerCase();
      userList = userList.filter(
        (user) =>
          (user.name && user.name.toLowerCase().includes(lowerTerm)) ||
          (user.email && user.email.toLowerCase().includes(lowerTerm))
      );
    }

    setUsers(userList);
  } catch (error) {
    console.error("Error fetching users:", error);
  }
  setLoading(false);
};

  useEffect(() => {
    fetchPeople();
  }, []);

  const handleFollowToggle = async (targetUser) => {
  if (!currentUser) return;

  const currentUserRef = doc(db, "users", currentUser.id);
  const targetUserRef = doc(db, "users", targetUser.id);

  const isFollowing = currentUser.following?.includes(targetUser.uid);

  try {
    if (isFollowing) {
      await updateDoc(currentUserRef, {
        following: arrayRemove(targetUser.uid),
      });
      await updateDoc(targetUserRef, {
        followers: arrayRemove(currentUser.uid),
      });

      setCurrentUser((prev) => ({
        ...prev,
        following: prev.following.filter((id) => id !== targetUser.uid),
      }));
    } else {
      await updateDoc(currentUserRef, {
        following: arrayUnion(targetUser.uid),
      });
      await updateDoc(targetUserRef, {
        followers: arrayUnion(currentUser.uid),
      });

      setCurrentUser((prev) => ({
        ...prev,
        following: [...(prev.following || []), targetUser.uid],
      }));
    }

    // ✅ Invalidate the cache after updating follow/unfollow
    localStorage.removeItem("usersCache");

  } catch (error) {
    console.error("Error updating follow status:", error);
  }
};


  return (
    <>
     <div className="min-h-screen text-gray-200 p-6">
  {/* Search Bar */}
  <div className="max-w-3xl mt-16 sm:mx-auto flex items-center mb-10">
    <input
      type="text"
      placeholder="Search Filmies..."
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        fetchPeople(e.target.value);
      }}
      className="w-full p-3 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] text-white 
                 focus:outline-none focus:ring-2 focus:ring-[#00ff99] focus:border-transparent
                 placeholder-gray-400 shadow-md"
    />
  </div>

  {/* Loading State */}
  {loading && <Loader />}

  {/* Users List */}
  <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
    {users.map((user) => {
      const isFollowing = currentUser?.following?.includes(user.uid);

      return (
     <li
  key={user.id}
  className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl 
             bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] 
             border border-gray-800 hover:border-[#ff4d4d] 
             hover:shadow-lg hover:shadow-[#ff4d4d33] 
             transition-all duration-300 w-full max-w-full overflow-hidden gap-3"
>
  {/* Left Section (Avatar + Info) */}
  <Link
    to={`/profile/${user.uid}`}
    className="flex flex-col sm:flex-row items-center sm:items-start flex-1 min-w-0 gap-2 sm:gap-4"
  >
    <img
      src={user.image || "/cinephile.png"}
      alt={user.name || "User"}
      className="w-14 h-14 rounded-full object-cover border-2 border-[#00ff99] flex-shrink-0"
    />
    <div className="text-center sm:text-left min-w-0">
      <p className="font-semibold text-white text-lg truncate">{user.name}</p>
      <p className="text-sm text-gray-400 truncate">{user.email || "No email"}</p>
    </div>
  </Link>

  {/* Right Section (Follow Button) */}
  <div className="mt-2 sm:mt-0 flex-shrink-0">
    <button
      onClick={() => handleFollowToggle(user)}
      className={`px-4 sm:px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md whitespace-nowrap
        ${
          isFollowing
            ? "bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700"
            : "bg-[#ff4d4d] hover:bg-red-600 text-white"
        }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  </div>
</li>




      );
    })}
  </ul>
</div>

      <Sidebar />
    </>
  );
}

export default FindPeople;
