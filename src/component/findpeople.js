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

  const fetchPeople = async (term = "") => {
    setLoading(true);
    try {
      const currentUserId = localStorage.getItem("userId");
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      let userList = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

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
        // Unfollow: remove ids
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
        // Follow: add ids
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
      placeholder="Search people..."
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
          className="flex items-center justify-between p-5 rounded-2xl 
                     bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] 
                     border border-gray-800 hover:border-[#ff4d4d] 
                     hover:shadow-lg hover:shadow-[#ff4d4d33] 
                     transition-all duration-300"
        >
          {/* Left Section (Avatar + Info) */}
          <Link
            to={`/profile/${user.uid}`}
            className="flex items-center space-x-4 flex-1"
          >
            <img
              src={user.image || "/cinephile.png"}
              alt={user.name || "User"}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#00ff99]"
            />
            <div>
              <p className="font-semibold text-white text-lg">{user.name}</p>
              <p className="text-sm text-gray-400">
                {user.email?.slice(0, 22) || "No email"}
              </p>
            </div>
          </Link>

          {/* Right Section (Follow Button) */}
          <button
            onClick={() => handleFollowToggle(user)}
            className={`ml-4 px-5 py-2.5 rounded-xl text-sm font-medium transition-all shadow-md ${
              isFollowing
                ? "bg-gradient-to-r from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700"
                : "bg-[#ff4d4d] hover:bg-red-600 text-white"
            }`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
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
