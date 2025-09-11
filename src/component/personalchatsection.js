import React, { useState, useEffect,useRef } from "react";
import { addDoc, collection, onSnapshot, query, orderBy, serverTimestamp  } from "firebase/firestore";
import { db } from "../firebase/firebase"; // Adjusted import
import ChatUsers from "./chatusers";
import AddReactionTwoToneIcon from '@mui/icons-material/AddReactionTwoTone';
import SentimentVerySatisfiedTwoToneIcon from '@mui/icons-material/SentimentVerySatisfiedTwoTone';
import BackHandTwoToneIcon from '@mui/icons-material/BackHandTwoTone';
import PetsIcon from '@mui/icons-material/Pets';
import BrunchDiningTwoToneIcon from '@mui/icons-material/BrunchDiningTwoTone';
import ExploreTwoToneIcon from '@mui/icons-material/ExploreTwoTone';
import LocalActivityTwoToneIcon from '@mui/icons-material/LocalActivityTwoTone';
import EmojiObjectsTwoToneIcon from '@mui/icons-material/EmojiObjectsTwoTone';
import EmojiSymbolsTwoToneIcon from '@mui/icons-material/EmojiSymbolsTwoTone';
import EmojiFlagsTwoToneIcon from '@mui/icons-material/EmojiFlagsTwoTone';
import HistoryTwoToneIcon from '@mui/icons-material/HistoryTwoTone';

const EMOJI_ACCESS_KEY = process.env.REACT_APP_ACCESS_TOKEN_EMOJI;
const categoryicons = {
  history: <HistoryTwoToneIcon titleAccess="history" />,
  smileysemotion: <SentimentVerySatisfiedTwoToneIcon titleAccess="smileys-emotion" />,
  peoplebody: <BackHandTwoToneIcon titleAccess="people-body" />,
  animalsnature: <PetsIcon titleAccess="animals-nature" />,
  fooddrink: <BrunchDiningTwoToneIcon titleAccess="food-drink" />,
  travelplaces: <ExploreTwoToneIcon titleAccess="travel-places" />,
  activities: <LocalActivityTwoToneIcon titleAccess="activities" />,
  objects: <EmojiObjectsTwoToneIcon titleAccess="objects" />,
  symbols: <EmojiSymbolsTwoToneIcon titleAccess="symbols" />,
  flags: <EmojiFlagsTwoToneIcon titleAccess="flags" />,
};
const PersonalChatSection = ({selectedUser}) => {

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState("");
  const bottomRef = useRef(null);
const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const [emojis, setEmojis] = useState([]);
const [categories, setCategories] = useState([]);
const allCategories = [
  { slug: "history", name: "Frequently Used" },
  ...categories
];

const [selectedCategory, setSelectedCategory] = useState("");
const [searchTerm, setSearchTerm] = useState("");
const [emojiCache, setEmojiCache] = useState({});
const [isLoading, setIsLoading] = useState(false);
const [error, setError] = useState(null);
const [emojiHistory, setEmojiHistory] = useState([]);

useEffect(() => {
  const history = JSON.parse(localStorage.getItem("emojiHistory")) || [];
  setEmojiHistory(history);
}, []);
const handleEmojiClick = (emoji) => {
  setNewMessage((prev) => prev + emoji.character);

  setEmojiHistory((prevHistory) => {
    const newHistory = [emoji, ...prevHistory.filter(e => e.slug !== emoji.slug)];
    if (newHistory.length > 20) {
      newHistory.pop();
    }
    localStorage.setItem("emojiHistory", JSON.stringify(newHistory));
    return newHistory;
  });
};



useEffect(() => {
  const fetchEmojisAndCategories = async () => {
    try {
      setIsLoading(true);

      // Fetch categories
      const catRes = await fetch(`https://emoji-api.com/categories?access_key=629ae3a2285e07881e24229a27d33a98291b6c85`);
      const catData = await catRes.json();

      setCategories(catData);

      // Fetch all emojis
      const emojiRes = await fetch(`https://emoji-api.com/emojis?access_key=629ae3a2285e07881e24229a27d33a98291b6c85`);
      const emojiData = await emojiRes.json();

      // Group emojis by category
      const grouped = emojiData.reduce((acc, emoji) => {
        if (!acc[emoji.group]) {
          acc[emoji.group] = [];
        }
        acc[emoji.group].push(emoji);
        return acc;
      }, {});

      setEmojis(grouped);

    } catch (err) {
      setError("Failed to fetch emojis or categories.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  fetchEmojisAndCategories();
}, []);
const getFilteredEmojis = () => {
  if (searchTerm.trim() !== "") {
    // Filter emojis by search term across all categories
    const filtered = {};
    for (let group in emojis) {
      const groupEmojis = emojis[group].filter(emoji =>
        emoji.unicodeName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (groupEmojis.length > 0) {
        filtered[group] = groupEmojis;
      }
    }
    return filtered;
  } else if (selectedCategory === "history") {
    // Show only history
    return {
      "history": emojiHistory
    };
  } else if (selectedCategory) {
    // Show only selected category
    return {
      [selectedCategory]: emojis[selectedCategory] || []
    };
  } else {
    // Show all categories
    return emojis;
  }
};



  useEffect(() => {
    // Fetch user data from localStorage
    const storedUser = localStorage.getItem("userId");
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);
 useEffect(() => {
  if (!user || !selectedUser?.uid) return;

  const q = query(collection(db, "messages"), orderBy("timestamp"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const filteredMessages = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }))
      .filter((msg) => {
        const from = msg.data.fromId;
        const to = msg.data.toId;

        return (
          (from === user && to === selectedUser.uid) ||
          (from === selectedUser.uid && to === user)
        );
      });
  
    setMessages(filteredMessages);
  ;
  });
 
  return unsubscribe;

}, [selectedUser, user]);

useEffect(() => {
  if (bottomRef.current) {
    bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }
}, [messages]);

  const sendMessage = async () => {
   
    if (newMessage.trim() === "") return; // Prevent empty messages
    await addDoc(collection(db, "messages"), {
      fromId: user,
      fromName: localStorage.getItem("username"),
      toId: selectedUser.uid,
      toName: selectedUser.name,
      text: newMessage,
      timestamp: serverTimestamp(),
    });
    setNewMessage("");
  
    
  };  

  return (
    <>

  <div className="relative w-full h-[calc(100vh-8rem)] bg-black text-white flex flex-col">
  {/* Background Image */}
  <img
    className="absolute top-0 left-0 w-full h-full object-cover z-0"
    src="/images/sofilmywallpaper.jpg"
    alt="Background"
  />

  {/* Chat Content */}
  <div className="relative z-10 flex flex-col h-full w-full">
    {/* selectedUser detail */}
    <div className="p-4 border-b border-white bg-red-700 bg-opacity-80 flex">
      <img
        src={selectedUser.image || "/cinephile.png"}
        alt="User Avatar"
        className="w-8 h-8 rounded-full mr-2"
      />
      <h2 className="text-lg font-semibold">{selectedUser.name}</h2>
      
    </div>

    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
      {messages.map((msg) => {
        const isSender = msg.data.fromId === user;


    return (
      <div
        key={msg.id}
        className={`w-full flex ${isSender ? "justify-end" : "justify-start"}`}
      >
        <div className={`flex items-end max-w-full gap-2`}>
          {/* Avatar (only if NOT sender) */}
          {!isSender && (
            <img
              src={selectedUser.image || "/cinephile.png"}
              alt="User avatar"
              className="w-6 h-6 rounded-full"
            />
          )}

          {/* Message Bubble */}
          <div
            className={`p-2 rounded-lg max-w-[60vw] w-fit break-words overflow-wrap break-word ${
              isSender
                ? "bg-green-700 text-white rounded-br-none"
                : "bg-white bg-opacity-80 text-black rounded-bl-none"
            }`}
          >
            <span className="whitespace-pre-line">{msg.data.text}</span>
          </div>

          {/* Avatar (only if sender) */}
          {isSender && (
            <img
              src={localStorage.getItem("userImage") || "/cinephile.png"}
              alt="User avatar"
              className="w-6 h-6 rounded-full"
            />
          )}
        </div>
        {/* Scroll to bottom reference */}
        <div ref={bottomRef}></div>

      </div>
    );
  })}
</div>



    {/* Input Area */}
    <div className="w-full px-4 py-2 bg-red-700 bg-opacity-80 flex items-center justify-center sticky bottom-0 z-10 ">
  <input
    className="bg-white text-black h-10 w-[50%] border rounded-2xl px-4"
    value={newMessage}
    onChange={(e) => setNewMessage(e.target.value)}
    placeholder="Type a message"
  />
  
  {/* Emoji Button */}
  <button
    onClick={() => setShowEmojiPicker(prev => !prev)}
    className="ml-2 text-white bg-gradient-to-r from-yellow-500 to-red-500 w-10 h-10 flex justify-center items-center rounded-full"
  >
    <AddReactionTwoToneIcon />
  </button>
  {/* Emoji Picker Panel */}
{showEmojiPicker && (
  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-900 via-red-800 to-black p-5 rounded-2xl max-h-[40vh] w-[90vw] md:w-[800px] z-30 shadow-2xl border-2 border-red-600">
    
    {/* Search Box */}
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search emojis..."
      className="w-full p-3 rounded-xl border border-red-600 bg-black text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
    />

    {/* Categories */}
    <div className="flex flex-wrap gap-2 p-2 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl mt-4 max-h-20 overflow-y-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-700">
      {allCategories
        .filter((cat) => cat.slug !== "component")
        .map((cat) => (
          <button
            key={cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
            className={`px-4 py-2 rounded-2xl whitespace-nowrap text-sm flex items-center gap-2 transition-transform transform hover:scale-105 ${
              selectedCategory === cat.slug
                ? "bg-red-600 text-white shadow-lg"
                : "bg-gray-700 text-gray-200 hover:bg-gray-600"
            }`}
          >
            {categoryicons[cat.slug.replace(/-/g, "")]}
            
          </button>
      ))}
    </div>

    {/* Emojis Section */}
    <div className="overflow-y-auto max-h-[calc(35vh-140px)] mt-4 scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-700">
      {isLoading ? (
        <p className="text-white text-center animate-pulse">Loading...</p>
      ) : error ? (
        <p className="text-red-400 text-center">{error}</p>
      ) : (
        Object.entries(getFilteredEmojis()).map(([group, emojis]) => (
          <div key={group} className="mb-4">
            <h3 className="text-red-400 font-bold mb-2 uppercase tracking-wide text-sm border-b border-red-600 pb-1">
              {group === "history" ? "Frequently Used" : group.replace(/-/g, " ")}
            </h3>
            <div className="grid grid-cols-8 gap-2 place-items-center">
              {emojis.map((emoji) => (
                <button
                  key={emoji.slug}
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-2xl hover:scale-125 transition-transform hover:bg-red-700 hover:text-white p-2 rounded-full"
                >
                  {emoji.character}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
)}



  <button
    className="ml-2 text-white bg-green-600 w-20 h-10 flex justify-center items-center"
    onClick={sendMessage}
    style={{
      clipPath:
        "polygon(10% 0%, 90% 0%, 100% 16%, 89% 34%, 100% 51%, 89% 70%, 100% 85%, 90% 100%, 10% 100%, 0% 85%, 11% 70%, 0% 51%, 11% 34%, 0% 16%, 10% 0%)",
    }}
  >
    <span className="border-x-2 py-4 px-2 border-white border-dashed flex justify-center items-center">
      Send
    </span>
  </button>
</div>

  </div>
</div>
</>


  );
};

export default PersonalChatSection;
