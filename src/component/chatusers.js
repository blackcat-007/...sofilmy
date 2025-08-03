import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import ChatSection from './chatsection';

const db = getFirestore();

const ChatUsers = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserList, setShowUserList] = useState(true); // 👈 collapse toggle

  const fetchUsers = async (searchTerm = '') => {
    setLoading(true);
    try {
      const currentUserId = localStorage.getItem("userId");
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      let userList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));

      userList = userList.filter(user => user.uid !== currentUserId);

      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        userList = userList.filter(user =>
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term))
        );
      }

      setUsers(userList);

      if (selectedUserId) {
        const found = userList.find(u => u.id === selectedUserId);
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
    setShowUserList(false); // 👈 Hide user list on small screen after selecting
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white flex flex-col md:flex-row">
      
      {/* Collapse toggle button for mobile */}
      <div className="md:hidden flex justify-between items-center px-4 py-2 bg-black border-b border-gray-700">
        <h2 className="text-lg font-bold">Filmy Chat</h2>
        {selectedUser && (
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="bg-green-600 px-3 py-1 rounded text-sm"
          >
            {showUserList ? 'Go to Chat' : 'Back to Users'}
          </button>
        )}
      </div>

      {/* User List */}
      <section
        className={`md:block w-full md:max-w-sm p-4 bg-black shadow-lg md:rounded-md transition-all duration-300 ease-in-out ${
          showUserList ? 'block' : 'hidden'
        }`}
      >
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300 text-black "
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
      <div
        className={`flex-1 p-4 ${
          showUserList && !window.matchMedia('(min-width: 768px)').matches ? 'hidden' : 'block'
        }`}
      >
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
