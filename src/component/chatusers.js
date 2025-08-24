import React, { useEffect, useState } from 'react';
import { getFirestore, collection, getDocs, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import PersonalChatSection from './personalchatsection';
import GroupChatSection from './groupchatsection';
import AddGroup from './addgroup';
import GroupDetails from './groupdetails';

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
  const [joinedGroups, setJoinedGroups] = useState(new Set()); // ✅ store joined group IDs
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [openGroupDetailsId, setOpenGroupDetailsId] = useState(null); // ✅ per-group details open

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
    const currentUserId = localStorage.getItem("userId");
    const groupRef = collection(db, 'group');
    const snapshot = await getDocs(groupRef);
    let groupList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // ✅ filter public/private groups
    groupList = groupList.filter(group => {
      if (group.access === "private") {
        return group.members?.includes(currentUserId); // only if user is in members
      }
      return true; // public groups always shown
    });

    // ✅ apply search filter
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
   const refreshGroups = () => {
    fetchGroups(search);
  };


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

      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId ? { ...g, members: [...(g.members || []), currentUserId] } : g
        )
      );

      setJoinedGroups((prev) => new Set(prev).add(groupId)); // ✅ mark this group as joined
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

      setGroups((prevGroups) =>
        prevGroups.map((g) =>
          g.id === groupId
            ? { ...g, members: (g.members || []).filter((m) => m !== currentUserId) }
            : g
        )
      );

      setJoinedGroups((prev) => {
        const updated = new Set(prev);
        updated.delete(groupId);
        return updated;
      });
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  return (
    <div className="sm:w-auto w-full h-full bg-gray-900 text-white flex flex-col md:flex-row">
      
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
            <span className="px-3 flex justify-center items-center py-1 rounded-md bg-green-600">+ Create Group</span>
          </button>
          {addGroupOpen && <AddGroup onClose={() => setAddGroupOpen(false)} refreshGroups={refreshGroups} />}
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
              (mode === 'people' ? users : groups).map((item) => {
                const currentUserId = localStorage.getItem("userId");
                const isMember = item.members?.includes(currentUserId) || joinedGroups.has(item.id);

                return (
                <li
  key={item.id}
  className={`p-3 transition rounded-md flex justify-between ${
    selectedUserId === item.id ? 'bg-red-800' : 'hover:bg-gray-700'
  }`}
>
  <div className="flex flex-col w-full">
    <button
      onClick={() => {
        if (mode === "people") {
          // ✅ Directly open personal chat
          handleUserSelect(item.id, "people");
        } else {
          const currentUserId = localStorage.getItem("userId");
          const isMember = item.members?.includes(currentUserId) || joinedGroups.has(item.id);

          if (isMember) {
            // ✅ If joined, open group chat
            handleUserSelect(item.id, "groups");
          } else {
            // ✅ If not joined, open details
            setOpenGroupDetailsId(openGroupDetailsId === item.id ? null : item.id);
          }
        }
      }}
      className="text-left w-full"
    >
      <div className="font-medium">
        {item.name || item.email || item.id}
        {mode === "groups" && (
          <div className="text-sm text-gray-400">
            {item.members?.length || 0} members
          </div>
        )}
      </div>
    </button>

    {/* Group Details - only if not joined */}
    {mode === "groups" &&
      openGroupDetailsId === item.id &&
      !item.members?.includes(localStorage.getItem("userId")) &&
      !joinedGroups.has(item.id) && (
        <GroupDetails
          selected={item.id}
          onClose={() => setOpenGroupDetailsId(null)}
        />
      )}
  </div>

  {/* Join/Leave button (groups only) */}
  {mode === "groups" &&
    (item.members?.includes(localStorage.getItem("userId")) ||
    joinedGroups.has(item.id) ? (
      <button
        onClick={() => handleLeaveGroup(item.id)}
        className="px-6 rounded-md bg-red-500"
      >
        Leave
      </button>
    ) : (
      <button
        onClick={() => handleJoinGroup(item.id)}
        className="px-6 rounded-md bg-green-500"
      >
        Join
      </button>
    ))}
</li>


                );
              })
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
          mode === 'groups' ? (
            selectedUser.members?.includes(localStorage.getItem("userId")) || joinedGroups.has(selectedUser.id) ? (
              <GroupChatSection selectedUser={selectedUser} />
            ) : null
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
