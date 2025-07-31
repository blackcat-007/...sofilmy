import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import ChatSection from './chatsection';

const db = getFirestore();

const ChatUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null); // ✅ You forgot this
  const [selectedUser, setSelectedUser] = useState(null);

  const fetchUsers = async (searchTerm = '') => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      let q = usersRef;

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        q = query(usersRef, where('name', '>=', term), where('name', '<=', term + '\uf8ff'));
      }

      const snapshot = await getDocs(q);
      const userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(userList);

      // Update selectedUser if user list changes
      if (selectedUserId) {
        const found = userList.find(u => u.name === selectedUserId);
        setSelectedUser(found || null);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(search);
  };

  const handleUserSelect = (id) => {
    const user = users.find(u => u.id === id);
    setSelectedUserId(id);
    setSelectedUser(user || null);
  };

  return (
    <div className="flex flex-row items-start justify-center w-full h-full bg-gray-900 text-white p-4 gap-4">
      {/* User List */}
      <section className="p-4 w-full max-w-sm bg-black rounded-md shadow-lg">
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-gray-400 text-center">Loading users...</div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {users.length === 0 ? (
              <li className="p-2 text-gray-500 text-center">No users found</li>
            ) : (
              users.map((user) => (
                <li
                  key={user.id}
                  onClick={() => handleUserSelect(user.id)}
                  className={`p-3 cursor-pointer transition rounded-md ${
                    selectedUserId === user.id ? 'bg-red-800' : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{user.name || user.email || user.id}</div>
                </li>
              ))
            )}
          </ul>
        )}
      </section>

      {/* Chat Section */}
      <div className="flex-1">
        {selectedUser ? (
          <ChatSection selectedUser={selectedUser} />
        ) : (
          <div className="text-gray-400 mt-4">Select a user to start chatting</div>
        )}
      </div>
    </div>
  );
};

export default ChatUsers;
