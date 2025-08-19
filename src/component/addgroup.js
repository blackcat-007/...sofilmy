import React, { useState, useEffect } from "react";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

const db = getFirestore();

const AddGroup = ({ onClose }) => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupImage, setGroupImage] = useState(null);
  const [access, setAccess] = useState("public");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const currentUserId = localStorage.getItem("userId");

  // Fetch all users except logged-in user
  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const userList = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((u) => u.uid !== currentUserId); // Exclude logged in user
      setUsers(userList);
    };
    fetchUsers();
  }, [currentUserId]);

  const handleUserSelect = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e) => {
    if (e.target.files[0]) {
      setGroupImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!groupName) return;

    setLoading(true);

    // Always include logged-in user
    const finalMembers = [...new Set([currentUserId, ...selectedUsers])];

    let imageUrl = "";
    if (groupImage) {
      // Replace with Firebase Storage upload if needed
      imageUrl = URL.createObjectURL(groupImage);
    }

    try {
      await addDoc(collection(db, "group"), {
        name: groupName,
        members: finalMembers,
        access,
        image: imageUrl || null,
        createdAt: serverTimestamp(),
      });

      alert("Group created!");
      setGroupName("");
      setSelectedUsers([]);
      setGroupImage(null);
      setAccess("public");
      onClose && onClose();
    } catch (err) {
      console.error("Error creating group:", err);
      alert("Failed to create group.");
    }

    setLoading(false);
  };

  // Filter users with search term
  const filteredUsers = users.filter(
    (u) =>
      (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-20 top-24 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <form
        onSubmit={handleSubmit}
        className="bg-gradient-to-br from-red-900 via-black to-green-900 text-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-red-700"
      >
        <h2 className="text-2xl font-extrabold mb-4 text-center text-green-400">
          🎬Create your group
        </h2>

        {/* Group Name */}
        <div className="mb-3">
          <label className="block text-sm font-semibold text-red-400">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full border border-green-600 bg-black text-green-300 rounded-md p-2 mt-1 focus:ring focus:ring-green-500 outline-none"
            required
          />
        </div>
        {/* Group Description */}
         <div className="mb-3">
          <label className="block text-sm font-semibold text-red-400">
            Group Description
          </label>
          <input
            type="text"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            className="w-full border border-green-600 bg-black text-green-300 rounded-md p-2 mt-1 focus:ring focus:ring-green-500 outline-none"
            required
          />
        </div>
        {/* Group Image */}
        <div className="mb-3">
          <label className="block text-sm font-semibold text-red-400">
            Group Image (optional)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full mt-1 text-green-300"
          />
        </div>

        {/* Search & Members */}
        <div className="mb-3">
          <label className="block text-sm font-semibold text-red-400">
            Select Members
          </label>
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-green-600 bg-black text-green-300 rounded-md p-2 mt-1 focus:ring focus:ring-green-500 outline-none"
          />
          <div className="mt-2 max-h-40 overflow-y-auto border border-red-600 rounded-md bg-black">
            {filteredUsers.length === 0 ? (
              <div className="p-2 text-gray-500">No users found</div>
            ) : (
              filteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleUserSelect(u.uid || u.id)}
                  className={`p-2 cursor-pointer flex justify-between items-center ${
                    selectedUsers.includes(u.uid || u.id)
                      ? "bg-green-800 text-white"
                      : "hover:bg-red-800"
                  }`}
                >
                  <span>{u.name || u.email}</span>
                  {selectedUsers.includes(u.uid || u.id) && (
                    <span className="text-green-400 font-bold">✓</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Access Toggle */}
        <div className="mb-4 flex items-center gap-4">
          <span className="font-semibold text-red-400">Access:</span>
          <button
            type="button"
            onClick={() => setAccess("public")}
            className={`px-3 py-1 rounded-md ${
              access === "public"
                ? "bg-green-600 text-black font-bold"
                : "bg-gray-700 text-white"
            }`}
          >
            Public
          </button>
          <button
            type="button"
            onClick={() => setAccess("private")}
            className={`px-3 py-1 rounded-md ${
              access === "private"
                ? "bg-red-600 text-black font-bold"
                : "bg-gray-700 text-white"
            }`}
          >
            Private
          </button>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-black rounded-md font-bold"
          >
            {loading ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddGroup;
