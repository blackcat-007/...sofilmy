import React, { useState, useEffect } from 'react';
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import PersonalChatSection from './personalchatsection';
import GroupChatSection from './groupchatsection';
import AddGroup from './addgroup';
import GroupDetails from './groupdetails';
import ChatSkeleton from '../ui/chatskeleton';

const db = getFirestore();

const ChatUsers = () => {
  const [mode, setMode] = useState('people');
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserList, setShowUserList] = useState(true);
  const [joinedGroups, setJoinedGroups] = useState(new Set());
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [openGroupDetailsId, setOpenGroupDetailsId] = useState(null);

  const currentUserId = localStorage.getItem("userId");

  /** 🔹 Realtime People listener */
  useEffect(() => {
    if (mode !== "people") return;

    setLoading(true);

    const unsubUsers = onSnapshot(collection(db, "users"), (userSnap) => {
      const userList = userSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(user => user.uid !== currentUserId);

      const unsubChats = onSnapshot(collection(db, "chats"), (chatSnap) => {
        let chatsMap = {};
        chatSnap.docs.forEach(docSnap => {
          chatsMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });

        let enriched = userList.map(user => {
          const chatId = [currentUserId, user.uid].sort().join("_");
          const chatMeta = chatsMap[chatId];
          return {
            ...user,
            lastMessage: chatMeta?.lastMessage || null,
            lastMessageTimestamp: chatMeta?.lastMessageTimestamp || null,
            unread: chatMeta?.unreadCounts?.[currentUserId] || 0,
          };
        });

        enriched.sort((a, b) => {
          if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
          if (!a.lastMessageTimestamp) return 1;
          if (!b.lastMessageTimestamp) return -1;
          return b.lastMessageTimestamp.toMillis() - a.lastMessageTimestamp.toMillis();
        });

        setUsers(enriched);
        setLoading(false);
      });

      return () => unsubChats();
    });

    return () => unsubUsers();
  }, [mode, currentUserId]);

  /** 🔹 Realtime Groups listener */
  useEffect(() => {
    if (mode !== "groups") return;

    setLoading(true);

    const unsubGroups = onSnapshot(collection(db, "group"), (groupSnap) => {
      const groupList = groupSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const visibleGroups = groupList.filter(group => {
        if (group.access === "private") {
          return group.members?.includes(currentUserId);
        }
        return true;
      });

      const unsubChats = onSnapshot(collection(db, "chats"), (chatSnap) => {
        let chatsMap = {};
        chatSnap.docs.forEach(docSnap => {
          chatsMap[docSnap.id] = { id: docSnap.id, ...docSnap.data() };
        });

        let enriched = visibleGroups.map(group => {
          const chatMeta = chatsMap[group.id];
          return {
            ...group,
            lastMessage: chatMeta?.lastMessage || null,
            lastMessageTimestamp: chatMeta?.lastMessageTimestamp || null,
            unread: chatMeta?.unreadCounts?.[currentUserId] || 0,
          };
        });

        enriched.sort((a, b) => {
          if (!a.lastMessageTimestamp && !b.lastMessageTimestamp) return 0;
          if (!a.lastMessageTimestamp) return 1;
          if (!b.lastMessageTimestamp) return -1;
          return b.lastMessageTimestamp.toMillis() - a.lastMessageTimestamp.toMillis();
        });

        setGroups(enriched);
        setLoading(false);
      });

      return () => unsubChats();
    });

    return () => unsubGroups();
  }, [mode, currentUserId]);

  const handleSearch = (e) => {
    e.preventDefault();
    const term = search.toLowerCase();
    if (mode === "people") {
      setUsers(prev => prev.filter(u =>
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      ));
    } else {
      setGroups(prev => prev.filter(g =>
        g.name && g.name.toLowerCase().includes(term)
      ));
    }
  };

  const handleUserSelect = (id, from = 'people') => {
    let data = (from === 'people' ? users : groups).find(u => u.id === id);
    setSelectedUserId(id);
    setSelectedUser(data || null);
    setShowUserList(false); // hide sidebar on small devices
  };

  const handleJoinGroup = async (groupId) => {
    const groupRef = doc(db, 'group', groupId);
    await updateDoc(groupRef, { members: arrayUnion(currentUserId) });
    setJoinedGroups(prev => new Set(prev).add(groupId));
  };

  const handleLeaveGroup = async (groupId) => {
    const groupRef = doc(db, 'group', groupId);
    await updateDoc(groupRef, { members: arrayRemove(currentUserId) });
    setJoinedGroups(prev => {
      const updated = new Set(prev);
      updated.delete(groupId);
      return updated;
    });
  };

  // Back to sidebar (mobile)
  const handleBack = () => {
    setSelectedUserId(null);
    setSelectedUser(null);
    setShowUserList(true);
  };
  // Reset selected chat when mode changes
useEffect(() => {
  setSelectedUser(null);
  setSelectedUserId(null);
  setShowUserList(true); // optional: show the sidebar again
}, [mode]);

  return (
    <div className="sm:w-auto w-full h-full bg-gray-900 text-white flex flex-col md:flex-row">
      {/* Sidebar */}
      <section
        className={`md:block w-full md:max-w-sm p-4 bg-black shadow-lg md:rounded-md transition-all duration-300 ${
          showUserList ? 'block' : 'hidden'
        }`}
      >
        {/* Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            className={`px-3 py-1 rounded-md ${mode === 'people' ? 'bg-green-600' : 'bg-gray-700'}`}
            onClick={() => setMode('people')}
          >
            Filmies
          </button>
          <button
            className={`px-3 py-1 rounded-md ${mode === 'groups' ? 'bg-green-600' : 'bg-gray-700'}`}
            onClick={() => setMode('groups')}
          >
            Groups
          </button>
          <button onClick={() => setAddGroupOpen(true)}>
            <span className="px-3 py-1 rounded-md bg-green-600">+ Create Group</span>
          </button>
          {addGroupOpen && <AddGroup onClose={() => setAddGroupOpen(false)} />}
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
          <div className="space-y-2">
            <ChatSkeleton /><ChatSkeleton /><ChatSkeleton /><ChatSkeleton />
          </div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {(mode === 'people' ? users : groups).length === 0 ? (
              <li className="p-2 text-gray-500 text-center">No {mode} found</li>
            ) : (
              (mode === 'people' ? users : groups).map((item) => {
                const isMember = mode === "people" 
                  ? true
                  : item.members?.includes(currentUserId) || joinedGroups.has(item.id);

                return (
                  <li
                    key={item.id}
                    className={`p-3 transition rounded-md flex justify-between items-center ${
                      selectedUserId === item.id ? 'bg-red-800' : 'hover:bg-gray-700'
                    }`}
                  >
                    <button
                      onClick={() => {
                        if (mode === "people") handleUserSelect(item.id, "people");
                        else if (isMember) handleUserSelect(item.id, "groups");
                        else setOpenGroupDetailsId(openGroupDetailsId === item.id ? null : item.id);
                      }}
                      className="flex flex-col text-left flex-1"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={item.image || (mode === "people" ? '/cinephile.png' : '/cinephile_group.png')}
                          alt={item.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{item.name || item.email}</span>
                          {item.lastMessage && (
                            <span className="text-xs text-gray-400 truncate max-w-[160px]">
                              {item.lastMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>

                    {item.unread > 0 && (
                      <span className="ml-2 bg-green-600 text-xs rounded-full px-2 py-0.5">
                        {item.unread}
                      </span>
                    )}

                    {mode === "groups" && (
                      isMember ? (
                        <button
                          onClick={() => handleLeaveGroup(item.id)}
                          className="ml-2 px-3 py-1 bg-red-500 rounded-md"
                        >
                          Leave
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoinGroup(item.id)}
                          className="ml-2 px-3 py-1 bg-green-500 rounded-md"
                        >
                          Join
                        </button>
                      )
                    )}

                    {mode === "groups" && openGroupDetailsId === item.id && !isMember && (
                      <GroupDetails selected={item.id} onClose={() => setOpenGroupDetailsId(null)} />
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </section>

      {/* Chat Section */}
      <div className={`flex-1 p-0 md:p-1 bg-black relative ${showUserList ? 'hidden md:block' : 'block'}`}>
        
        {selectedUser ? (
          mode === 'groups' ? (
            <GroupChatSection selectedUser={selectedUser} onBack={handleBack} />
          ) : (
            <PersonalChatSection selectedUser={selectedUser} onBack={handleBack} />
          )
        ) : (
          <div>
            {/* Glowing background gradients */}
            <div className="absolute inset-0 bg-black rounded-xl z-0 overflow-hidden">
              {/* Animated gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-red-600 via-red-400 to-red-800 opacity-40 animate-gradientX blur-3xl"></div>
              {/* Glowing highlights */}
              <div className="absolute top-10 left-[-50px] w-72 h-72 rounded-full bg-red-500 opacity-20 animate-pulseSlow"></div>
    <div className="absolute bottom-10 right-[-40px] w-64 h-64 rounded-full bg-red-700 opacity-20 animate-pulseSlow"></div>
  </div>
          <div className="text-gray-300 text-center mt-16 text-lg font-semibold tracking-wider drop-shadow-lg">
            
            Select a {mode === 'people' ? 'user' : 'group'} to start chatting
          </div>
          </div>
        )
        }
      </div>
    </div>
  );
};

export default ChatUsers;
