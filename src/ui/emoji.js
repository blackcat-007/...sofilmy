
import React, { useState, useEffect } from 'react';

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
const EmojiButton = ({onEmojiClick,emojihistory}) => {
    
    
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
    //const [emojiHistory, setEmojiHistory] = useState([]);
    
    
    
    
    
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
          "history": emojihistory || []
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
    return (<>{/* Emoji Button */}
  <button
    onClick={() => setShowEmojiPicker(prev => !prev)}
    className="ml-2 text-white bg-gradient-to-r from-yellow-500 to-red-500 w-10 h-10 flex justify-center items-center rounded-full"
  >
    <AddReactionTwoToneIcon />
  </button>
  {/* Emoji Picker Panel */}
{showEmojiPicker && (
  <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-red-900 via-black to-red-800 p-1 rounded-2xl max-h-[40vh] w-[90vw] md:w-[510px] z-30 shadow-2xl border-2 border-red-600">
    
    {/* Search Box */}
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Search emojis..."
      className="w-full  p-3 rounded-xl border border-red-600 bg-black text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all"
    />

   


    {/* Emojis Section */}
    <div className="overflow-y-auto max-h-[calc(35vh-140px)] mt-1 scrollbar-ultra-thin scrollbar-thumb-red-600 scrollbar-track-red-700 pr-1">
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
                  onClick={() => onEmojiClick(emoji)}
                  className="text-2xl hover:scale-110 transition-transform hover:bg-red-700 hover:text-white p-2 rounded-full"
                >
                  {emoji.character}
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
     {/* Categories */}
   <div className="flex items-center gap-0 p-1 mt-2 rounded-xl bg-red-600/50 overflow-x-auto scrollbar-thin scrollbar-thumb-red-600 scrollbar-track-gray-700">
    <div className="blur"></div>
  {allCategories
    .filter((cat) => cat.slug !== "component")
    .map((cat) => (
      <button
        key={cat.slug}
        onClick={() => setSelectedCategory(cat.slug)}
        className={`flex items-center sm:gap-10 gap-0 md:px-3 px-1 py-1 rounded-2xl whitespace-nowrap text-xs sm:text-sm transition-transform transform hover:scale-105 ${
          selectedCategory === cat.slug
            ? " bg-gradient-to-tr from-green-600 to-green-900 text-white shadow-lg"
            : " text-gray-300 hover:bg-red-950 "
        }`}
      >
        <span className=" text-xs  sm:text-xl">{categoryicons[cat.slug.replace(/-/g, "")]}</span>
      </button>
    ))}
</div>
  </div>
)}
</>
);
};
export default EmojiButton;