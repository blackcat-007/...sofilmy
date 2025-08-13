import React, { useEffect, useState } from "react";
import {
  getFirestore,
  collection,
  getDocs
} from "firebase/firestore";
import { Link } from "react-router-dom";

const db = getFirestore();

function FindPeople() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchPeople = async (term = "") => {
    setLoading(true);
    try {
      const currentUserId = localStorage.getItem("userId");
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      let userList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      userList = userList.filter((user) => user.uid !== currentUserId);

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

  return (
    <div className="min-h-screen bg-[#121212] text-gray-200 p-6">
      {/* Search Bar */}
      <div className="max-w-3xl mx-auto mb-8">
        <input
          type="text"
          placeholder="Search people..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            fetchPeople(e.target.value);
          }}
          className="w-full p-3 rounded-lg bg-[#1a1a1a] border border-[#ff4d4d] text-white focus:outline-none focus:ring-2 focus:ring-[#00ff99]"
        />
      </div>

      {/* Title */}
      <h2 className="text-3xl font-bold text-center text-[#ff4d4d] mb-8">
        Find People
      </h2>

      {/* Loading State */}
      {loading && <p className="text-center text-[#00ff99]">Loading...</p>}

      {/* Users List */}
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center p-4 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-gray-800 hover:border-[#ff4d4d] hover:scale-105 transition-all duration-300 shadow-lg"
          >
            <img
              src={user.image || "/cinephile.png"}
              alt={user.name || "User"}
              className="w-14 h-14 rounded-full object-cover border-2 border-[#00ff99] mr-4"
            />
            <div className="flex-1">
              <p className="font-semibold text-white text-lg">{user.name}</p>
             
            </div>
            <button
              
              className="bg-[#ff4d4d] hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              Follow
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FindPeople;
