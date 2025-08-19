import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs,doc,updateDoc,arrayUnion,arrayRemove } from 'firebase/firestore';
import PersonalChatSection from './personalchatsection';
import GroupChatSection from './groupchatsection';
import AddGroup from './addgroup';

const db = getFirestore();

const ChatUsers = () => {
  const [mode, setMode] = useState('people'); // 'people' or 'groups'
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserList, setShowUserList] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const fetchPeople = async (searchTerm = '') => {
    setLoading(true);
    try {
      const currentUserId = localStorage.getItem("userId");
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      let userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      userList = userList.filter(user => user.uid !== currentUserId);

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        userList = userList.filter(user =>
          (user.name && user.name.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term))
        );
      }

      setUsers(userList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
    setLoading(false);
  };

  const fetchGroups = async (searchTerm = '') => {
    setLoading(true);
    try {
      const groupRef = collection(db, 'group');
      const snapshot = await getDocs(groupRef);
      let groupList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        groupList = groupList.filter(group =>
          group.name && group.name.toLowerCase().includes(term)
        );
      }

      setGroups(groupList);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (mode === 'people') fetchPeople();
    else fetchGroups();
  }, [mode]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (mode === 'people') fetchPeople(search);
    else fetchGroups(search);
  };

  const handleUserSelect = (id, from = 'people') => {
    let data = (from === 'people' ? users : groups).find(u => u.id === id);
    setSelectedUserId(id);
    setSelectedUser(data || null);
    setShowUserList(false);
  };
  
  const handleJoinGroup = async (groupId) => {
  const currentUserId = localStorage.getItem("userId");
  const groupRef = doc(db, 'group', groupId);

  try {
    await updateDoc(groupRef, {
      members: arrayUnion(currentUserId)
    });

    // Optimistic update of local state
    setGroups((prevGroups) =>
      prevGroups.map((g) =>
        g.id === groupId ? { ...g, members: [...(g.members || []), currentUserId] } : g
      )
    );

    setIsJoined(true);
  } catch (error) {
    console.error("Error joining group:", error);
  }
};

const handleLeaveGroup = async (groupId) => {
  const currentUserId = localStorage.getItem("userId");
  const groupRef = doc(db, 'group', groupId);

  try {
    await updateDoc(groupRef, {
      members: arrayRemove(currentUserId)
    });

    // Optimistic update of local state
    setGroups((prevGroups) =>
      prevGroups.map((g) =>
        g.id === groupId
          ? { ...g, members: (g.members || []).filter((m) => m !== currentUserId) }
          : g
      )
    );

    setIsJoined(false);
  } catch (error) {
    console.error("Error leaving group:", error);
  }
};

  return (
    <div className="sm:w-auto w-full h-full  bg-gray-900 text-white flex flex-col md:flex-row ">
      
      {/* Mobile Top Bar */}
      <div className="md:hidden flex justify-between items-center px-4 py-2 bg-black border-b border-gray-700">
        <h2 className="text-lg font-bold">Filmy Chat</h2>
        {selectedUser && (
          <button
            onClick={() => setShowUserList(!showUserList)}
            className="bg-green-600 px-3 py-1 rounded text-sm"
          >
            {showUserList ? 'Go to Chat' : 'Back to List'}
          </button>
        )}
      </div>

      {/* User/Group List Panel */}
      <section
        className={`md:block w-full md:max-w-sm p-4 bg-black shadow-lg md:rounded-md transition-all duration-300 ease-in-out ${
          showUserList ? 'block' : 'hidden'
        }`}
      >
        {/* Toggle Buttons */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded-md ${mode === 'people' ? 'bg-green-600' : 'bg-gray-700'}`}
            onClick={() => setMode('people')}
          >
            People
          </button>
          <button
            className={`px-3 py-1 rounded-md ${mode === 'groups' ? 'bg-green-600' : 'bg-gray-700'}`}
            onClick={() => setMode('groups')}
          >
            Groups
          </button>
          <button onClick={() => setAddGroupOpen(true)}>
            {<span className="px-3 flex justify-center items-center py-1 rounded-md bg-green-600">+ Create Group</span>}
            
          </button>
          {addGroupOpen ? ( <AddGroup onClose={() => setAddGroupOpen(false)} />):null}
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 flex gap-2">
          <input
            type="text"
            placeholder={`Search ${mode}...`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-grow px-3 py-2 border rounded-md focus:outline-none focus:ring text-black"
          />
          <button type="submit" className="px-4 py-2 bg-green-600 rounded-md">
            Search
          </button>
        </form>

        {/* List */}
        {loading ? (
          <div className="text-gray-400 text-center">Loading {mode}...</div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {(mode === 'people' ? users : groups).length === 0 ? (
              <li className="p-2 text-gray-500 text-center">No {mode} found</li>
            ) : (
              (mode === 'people' ? users : groups).map((item) => (
                <li
                  key={item.id}
                  onClick={() => handleUserSelect(item.id, mode)}
                  className={`p-3 cursor-pointer transition rounded-md flex justify-between ${
                    selectedUserId === item.id ? 'bg-red-800' : 'hover:bg-gray-700'
                  }`}
                >
                  <div className="font-medium">{item.name || item.email || item.id}
                  {mode === 'groups' && (
                    <div className="text-sm text-gray-400">{item.members.length} members</div>
                  )}
                  </div>
                  {mode === 'groups' && (
                    !item.members?.includes(localStorage.getItem("userId")) && !isJoined ? (
                      <button onClick={() => handleJoinGroup(item.id)} className='px-6 rounded-md bg-green-500 '>Join</button>
                    ) : (
                      <button onClick={() => handleLeaveGroup(item.id)} className='px-6 rounded-md bg-red-500 '>Leave</button>
                    )
                  )}
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
          mode === 'groups' ? ( selectedUser.members?.includes(localStorage.getItem("userId")) || isJoined ? (
            <GroupChatSection selectedUser={selectedUser} />):null
          ) : (
            <PersonalChatSection selectedUser={selectedUser} />
          )
        ) : (
          <div className="text-gray-400 mt-4">
            Select a {mode === 'people' ? 'user' : 'group'} to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatUsers;
