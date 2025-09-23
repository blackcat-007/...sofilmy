import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  doc,
  arrayRemove,
  arrayUnion,
} from "firebase/firestore";
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Box,
  TextField,
  Button,
  Autocomplete,
  Paper,
  
} from "@mui/material";
import Logout1 from "./logout";
import Sidebar from "./sidebar";
import DoneOutlineTwoToneIcon from '@mui/icons-material/DoneOutlineTwoTone';
import Loader from "../ui/loader";
import ModeEditTwoToneIcon from '@mui/icons-material/ModeEditTwoTone';
import { Edit } from "lucide-react";
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import "../App.css";
const TMDB_API = process.env.REACT_APP_TMDB_API_KEY;
const db = getFirestore();

const defaultUser = (uid, data = {}) => ({
  uid,
  name: data.name || "Anonymous",
  email: data.email || "",
  image: data.image || "https://via.placeholder.com/150",
  bio: data.bio || "",
  tags: data.tags || [],

  createdAt: data.createdAt
    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
    : "N/A",
  followers: data.followers || [],
  following: data.following || [],
  watchlist: data.watchlist || [],
  watched: data.watched || [],
});

// ✅ Cache helpers
const setCache = (key, data) => {
  const cacheEntry = {
    data,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(cacheEntry));
};

const getCache = (key, maxAgeMs) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < maxAgeMs) {
      return data;
    } else {
      localStorage.removeItem(key);
      return null;
    }
  } catch {
    return null;
  }
};

export default function Profile() {
  const { id } = useParams();
  const currentUserId = localStorage.getItem("userId");

  const [userData, setUserData] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [docIds, setDocIds] = useState({ profile: null, current: null });
  const [watchlistItems, setWatchlistItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedItemDetails, setSelectedItemDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [watchedItems, setWatchedItems] = useState([]);
  const [shareModal, setShareModal] = useState(false);
  const profileLink = `${window.location.origin}/profile/${id}`;

  const copyLink = () => {
    navigator.clipboard.writeText(profileLink);
    alert("Profile link copied!");
  };

  // ✅ Find user document by UID
  const findUserDoc = async (uid) => {
    const qs = await getDocs(collection(db, "users"));
    for (const s of qs.docs) {
      if (s.data()?.uid === uid) return { id: s.id, data: s.data() };
    }
    return null;
  };

  // ✅ Fetch both profile and current user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const profileCacheKey = `profile-${id}`;
        const currentCacheKey = `current-${currentUserId}`;

        const cachedProfile = getCache(profileCacheKey, 0 * 60 * 1000);
        const cachedCurrent = getCache(currentCacheKey, 0 * 60 * 1000);

        let profile = cachedProfile;
        let current = cachedCurrent;

        if (!profile || !current) {
          const qs = await getDocs(collection(db, "users"));
          qs.forEach((s) => {
            const d = s.data();
            if (!profile && d.uid === id) profile = { id: s.id, data: d };
            if (!current && d.uid === currentUserId) current = { id: s.id, data: d };
          });

          if (!profile) profile = { id: null, data: { uid: id, name: "Unknown", followers: [], watched: [], watchlist: [] } };
          if (!current) current = { id: null, data: { uid: currentUserId, name: "You", following: [], watched: [], watchlist: [] } };

          if (profile.id) setCache(profileCacheKey, profile);
          if (current.id) setCache(currentCacheKey, current);
        }

        if (!cancelled) {
          setUserData(defaultUser(id, profile.data));
          setCurrentUserData(defaultUser(currentUserId, current.data));
          setDocIds({ profile: profile.id, current: current.id });
        }

        if (!cancelled && currentUserId === id && current.data.watchlist?.length) {
          const watchlistCacheKey = `watchlist-${currentUserId}`;
          const cachedWatchlist = getCache(watchlistCacheKey, 0 * 60 * 1000);

          if (cachedWatchlist) {
            setWatchlistItems(cachedWatchlist);
          } else {
            const items = await Promise.all(
              current.data.watchlist.map(async (entry) => {
                const [type, mediaId] = entry.split(":");
                const res = await fetch(`https://api.themoviedb.org/3/${type}/${mediaId}?api_key=${TMDB_API}`);
                if (!res.ok) return null;
                const data = await res.json();
                return {
                  id: data.id,
                  title: data.title || data.name,
                  type,
                  poster: data.poster_path ? `https://image.tmdb.org/t/p/w200${data.poster_path}` : "https://via.placeholder.com/200x300?text=No+Image",
                  overview: data.overview,
                  releaseDate: data.release_date || data.first_air_date || "Unknown"
                };
              })
            );
            const filtered = items.filter(Boolean);
            setWatchlistItems(filtered);
            setCache(watchlistCacheKey, filtered);
          }
        } else if (!cancelled) {
          setWatchlistItems([]);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setUserData(null);
          setCurrentUserData(null);
          setDocIds({ profile: null, current: null });
          setWatchlistItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true };
  }, [id, currentUserId]);

  // ✅ Remove from watchlist
  const handleRemove = async (type, mediaId) => {
    if (!window.confirm("Remove from watchlist?")) return;

    try {
      let { current } = docIds;
      if (!current) {
        const found = await findUserDoc(currentUserId);
        current = found?.id || currentUserId;
        if (!found) await setDoc(doc(db, "users", current), defaultUser(currentUserId));
        setDocIds((d) => ({ ...d, current }));
      }

      const userRef = doc(db, "users", current);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) throw new Error("User not found");

      const data = userSnap.data();
      const watchlist = data.watchlist || [];
      const watched = data.watched || [];

      const watchlistKey = `${type}:${mediaId}`;
      const newWatchlist = watchlist.filter((x) => x !== watchlistKey);

      let found = false;
      const newWatched = watched.map((entry) => {
        if (entry.id === mediaId && entry.type === type) {
          found = true;
          return { ...entry, counter: entry.counter + 1 };
        }
        return entry;
      });

      if (!found) {
        newWatched.push({ id: mediaId, type, counter: 1 });
      }

      await updateDoc(userRef, {
        watchlist: newWatchlist,
        watched: newWatched
      });

      // ✅ Clear related caches
      localStorage.removeItem(`watchlist-${currentUserId}`);
      localStorage.removeItem(`watched-${docIds.profile}`);

      setWatchlistItems((prev) => prev.filter((x) => String(x.id) !== String(mediaId)));
      fetchWatchedItems();

    } catch (e) {
      console.error(e);
    }
  };

  // ✅ Fetch watched items
  const fetchWatchedItems = async () => {
    if (!docIds.profile) return;
    const watchedCacheKey = `watched-${docIds.profile}`;
    localStorage.removeItem(watchedCacheKey); // Clear cache to force fresh fetch
    try {
      const userRef = doc(db, "users", docIds.profile);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        if (data.watched?.length) {
          const items = await Promise.all(
            data.watched.map(async (entry) => {
              const { id, type, counter } = entry;
              const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API}`);
              if (!res.ok) return null;
              const details = await res.json();
              return {
                ...details,
                type,
                counter,
                poster: details.poster_path ? `https://image.tmdb.org/t/p/w200${details.poster_path}` : "https://via.placeholder.com/200x300?text=No+Image"
              };
            })
          );
          const filtered = items.filter(Boolean);
          setWatchedItems(filtered);
          setCache(watchedCacheKey, filtered);
        } else {
          setWatchedItems([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };
  const tagsOptions = [
  "Action", "Comedy", "Drama", "Horror", "Romance", "Sci-Fi", "Thriller", "Documentary", "Animation",
  "Adventure", "Fantasy", "Mystery", "Crime", "Biography", "Family", "Musical", "War", "Western",
  "History", "Sport", "Hollywood", "Bollywood", "Tollywood", "Kollywood", "Indie", "Classic", "Foreign",
  "French", "German", "Spanish", "Italian", "Japanese", "Korean", "Chinese", "Russian", "Superhero",
  "Anime", "Experimental", "Psychological", "Satire", "Parody", "Slasher", "Zombie", "Vampire", "Werewolf",
  "Monster", "Disaster", "Heist", "Road Movie", "Coming-of-Age", "Mockumentary", "Bengali", "Punjabi",
  "Gujarati", "Marathi", "Telugu", "Tamil", "Kannada", "Malayalam", "Hindi", "English"
];
const [editing, setEditing] = useState(false);

const EditProfile = ({ currentUserData,setUserData, docIds, setEditing, setCurrentUserData }) => {
  const [name, setName] = useState(currentUserData?.name || "");
  const [bio, setBio] = useState(currentUserData?.bio || "");
  const [tags, setTags] = useState(currentUserData?.tags || []);

  const closeEdit = () => setEditing(false);

  const updateDetails = async (e) => {
    e.preventDefault();
    if (!docIds?.current) return;

    try {
      const docRef = doc(db, "users", docIds.current);
      await updateDoc(docRef, { name, bio, tags });
      // update current user state
setCurrentUserData((prev) => ({ ...prev, name, bio, tags }));

if (currentUserData.uid === id) {
  setUserData((prev) => ({ ...prev, name, bio, tags }));
}
      closeEdit();
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  return (
    <div className="flex items-center justify-center fixed inset-0 z-30 bg-black bg-opacity-80 px-4">
  <form
    onSubmit={updateDetails}
    className="flex flex-col gap-6 p-6 md:p-8 rounded-2xl bg-neutral-900 w-full max-w-md shadow-2xl border border-gray-700 overflow-hidden"
  >
    <h2 className="text-2xl font-semibold text-center text-white">
      Edit Profile
    </h2>

    {/* Name */}
    <TextField
      label="Name"
      variant="outlined"
      fullWidth
      value={name}
      onChange={(e) => setName(e.target.value)}
      InputLabelProps={{ style: { color: "#9CA3AF" } }}
      InputProps={{ style: { color: "white" } }}
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "red" },
          "&:hover fieldset": { borderColor: "darkred" },
          "&.Mui-focused fieldset": { borderColor: "red" },
        },
      }}
    />

    {/* Bio */}
    <TextField
      label="Bio"
      variant="outlined"
      fullWidth
      multiline
      rows={3}
      value={bio}
      onChange={(e) => setBio(e.target.value)}
      InputLabelProps={{ style: { color: "#9CA3AF" } }}
      InputProps={{ style: { color: "white" } }}
      sx={{
        "& .MuiOutlinedInput-root": {
          "& fieldset": { borderColor: "red" },
          "&:hover fieldset": { borderColor: "darkred" },
          "&.Mui-focused fieldset": { borderColor: "red" },
        },
      }}
    />

    {/* Tags Multi-Select */}
    <Autocomplete
      multiple
      disableCloseOnSelect
      options={tagsOptions}
      value={tags}
      onChange={(e, newValue) => setTags(newValue)}
      renderTags={(value, getTagProps) => (
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 0.5,
            maxHeight: 100, // max height of tags section
            overflowY: "auto", // scroll if overflow
            pr: 0.5,
          }}
        >
          {value.map((option, index) => (
            <Chip
              key={option}
              variant="outlined"
              label={option}
              {...getTagProps({ index })}
              sx={{
                color: "white",
                borderColor: "red",
                "& .MuiChip-deleteIcon": {
                  color: "red",
                  "&:hover": { color: "darkred" },
                },
              }}
            />
          ))}
        </Box>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Tags"
          placeholder="Search & select tags"
          InputLabelProps={{ style: { color: "#9CA3AF" } }}
          InputProps={{
            ...params.InputProps,
            style: { color: "white" },
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              "& fieldset": { borderColor: "red" },
              "&:hover fieldset": { borderColor: "darkred" },
              "&.Mui-focused fieldset": { borderColor: "red" },
            },
          }}
        />
      )}
      PaperComponent={(props) => (
        <Paper
          {...props}
          sx={{
            bgcolor: "#111",
            color: "white",
            "& .MuiAutocomplete-option": {
              "&[aria-selected='true']": { backgroundColor: "#7f1d1d" },
              "&:hover": { backgroundColor: "#dc2626" },
            },
          }}
        />
      )}
    />

    {/* Buttons */}
    <div className="flex flex-col md:flex-row justify-between mt-4 gap-2">
      <Button
        variant="contained"
        type="submit"
        sx={{
          borderRadius: "20px",
          px: 4,
          bgcolor: "green",
          "&:hover": { bgcolor: "darkgreen" },
          flex: 1,
        }}
      >
        Save
      </Button>
      <Button
        variant="outlined"
        onClick={closeEdit}
        sx={{
          borderRadius: "20px",
          px: 4,
          borderColor: "red",
          color: "red",
          "&:hover": { borderColor: "darkred", color: "darkred" },
          flex: 1,
        }}
      >
        Cancel
      </Button>
    </div>
  </form>
</div>



  );
}

// ✅ Load watched items
useEffect(() => {
  fetchWatchedItems();
  }, [docIds.profile]);

  // ✅ Follow/unfollow handler
  const handleFollowToggle = async () => {
    try {
      let { current, profile } = docIds;
      let curr = currentUserData, prof = userData;

      if (!curr) {
        const found = await findUserDoc(currentUserId);
        current = found?.id || currentUserId;
        if (!found) await setDoc(doc(db, "users", current), defaultUser(currentUserId));
        curr = defaultUser(currentUserId, found?.data);
        setCurrentUserData(curr);
      }
      if (!prof) {
        const found = await findUserDoc(id);
        profile = found?.id || id;
        if (!found) await setDoc(doc(db, "users", profile), defaultUser(id));
        prof = defaultUser(id, found?.data);
        setUserData(prof);
      }

      const currentRef = doc(db, "users", current);
      const profileRef = doc(db, "users", profile);
      const following = prof.followers.includes(currentUserId);

      if (following) {
        if (!window.confirm(`Unfollow ${prof.name}?`)) return;
        await updateDoc(currentRef, { following: arrayRemove(id) });
        await updateDoc(profileRef, { followers: arrayRemove(currentUserId) });
        setUserData({ ...prof, followers: prof.followers.filter((u) => u !== currentUserId) });
        setCurrentUserData({ ...curr, following: curr.following.filter((u) => u !== id) });
      } else {
        await updateDoc(currentRef, { following: arrayUnion(id) });
        await updateDoc(profileRef, { followers: arrayUnion(currentUserId) });
        setUserData({ ...prof, followers: [...prof.followers, currentUserId] });
        setCurrentUserData({ ...curr, following: [...curr.following, id] });
      }

      setDocIds({ current, profile });

      // ✅ Clear caches after follow/unfollow
      localStorage.removeItem(`profile-${id}`);
      localStorage.removeItem(`current-${currentUserId}`);

    } catch (e) {
      console.error(e);
    }
  };

  // ✅ Fetch item details for modal
  useEffect(() => {
    if (!selectedItem) return;
    let cancel = false;
    (async () => {
      const type = selectedItem.type || (selectedItem.title ? "movie" : "tv");
      const detailsCacheKey = `details-${type}-${selectedItem.id}`;
      const cachedDetails = getCache(detailsCacheKey, 0 * 60 * 1000);

      if (cachedDetails) {
        if (!cancel) setSelectedItemDetails(cachedDetails);
        return;
      }

      try {
        const res = await fetch(
          `https://api.themoviedb.org/3/${type}/${selectedItem.id}?api_key=${TMDB_API}&append_to_response=videos,credits`
        );
        const data = await res.json();
        if (!cancel) {
          setSelectedItemDetails(data);
          setCache(detailsCacheKey, data);
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { cancel = true };
  }, [selectedItem]);

  if (loading) return <div className="flex items-center justify-center mt-80"><Loader /></div>;
  if (!userData) return <div className="text-center py-8 text-red-500">User not found.</div>;

  const isSelf = currentUserId === id;
  const isFollowing = userData.followers.includes(currentUserId);

  return (
    <>
      {/* Profile Card */}
      <Sidebar />
      <div className="max-w-screen-md md:mx-auto  mx-4 flex md:flex-col md:items-center mt-10 p-6 bg-gradient-to-b from-gray-950 via-gray-700 to-gray-950 rounded-2xl shadow-lg text-center relative">
        {/* Profile Image */}
      
  {/* Avatar Image */}
  <img
    src={userData.image}
    alt={`Avatar of ${userData.name}`}
    className="md:w-28 md:h-28 h-20 w-20 rounded-full object-cover relative z-10 gradspin"
  />



        {/* Edit Icon */}
        {isSelf && (
          <button
            className="absolute top-6 right-6 text-gray-400 hover:text-white p-1 rounded-full bg-black/50"
            onClick={() => setEditing(true)}
          >
            <ModeEditTwoToneIcon />
          </button>
        )}
        {editing && (<EditProfile currentUserData={currentUserData} setUserData={setUserData} docIds={docIds} setEditing={setEditing} setCurrentUserData={setCurrentUserData} />)}
        <div className="mt-24 md:mt-0 -translate-x-14 md:translate-x-0 mr-0     flex flex-col items-center justify-center">
        {/* Name */}
        <h2 className="md:text-2xl text-xl font-bold text-white truncate">{userData.name}</h2>

       {/* Tags */}
       
{userData.tags && userData.tags.length > 0 && (
  <div className="flex flex-wrap justify-center md:justify-start gap-2 my-2 max-w-[280px] md:max-w-[400px] mx-auto md:mx-0">
    {userData.tags.map((tag) => (
      <span
        key={tag}
        className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-xs"
      >
        #{tag}
      </span>
    ))}
  </div>
)}


        {/* Bio */}
        {userData.bio && <p className="text-gray-300 text-sm mb-2">{userData.bio}</p>}

        {/* Email & Joined */}
        <p className="text-gray-400 text-sm">{userData.email}</p>
        <p className="text-sm text-green-400 mt-1">Joined {userData.createdAt}</p>

        {/* Followers / Following */}
        <div className="flex justify-center gap-6 mt-3 text-sm text-gray-300">
          <div><b>{userData.followers.length}</b> Followers</div>
          <div><b>{userData.following.length}</b> Following</div>
        </div>

        <div className="my-4 border-t border-gray-700" />

        {/* Action Buttons */}
        <div className="flex justify-center gap-3">
          {isSelf ? (
            <>
              <Logout1 className="bg-red-500 px-4 py-2 rounded-lg text-white hover:bg-red-600 transition-colors" />
              <button
                onClick={() => setShareModal(true)}
                className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-500 text-gray-300 hover:bg-gray-700 transition-colors"
              >
                <ShareIcon fontSize="small" /> Share
              </button>
            </>
          ) : (
            <button
              onClick={handleFollowToggle}
              className={`px-6 py-2 rounded-lg text-white text-sm font-medium ${
                isFollowing ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"
              } transition-colors`}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-xl w-[90%] max-w-sm text-center">
            <h3 className="text-lg font-semibold text-white mb-4">Share Profile</h3>
            <p className="text-gray-300 text-sm mb-4">Copy the link below to share this profile:</p>
            <div className="flex items-center gap-2 mb-4 bg-gray-800 px-4 py-2 rounded-lg">
              <input
                type="text"
                value={profileLink}
                readOnly
                className="bg-transparent text-gray-200 w-full outline-none truncate"
              />
              <button onClick={copyLink} className="text-green-400 hover:text-green-500">
                <ContentCopyIcon />
              </button>
            </div>
            <button
              onClick={() => setShareModal(false)}
              className="mt-2 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
      </div>
      
      {/* Watchlist */}
      {isSelf && watchlistItems.length > 0 && (
        <div className="mt-10 px-6 *:max-w-full sm:mx-40">
          <h3 className="text-xl font-bold text-white mb-4">My Watchlist</h3>
          <div className="flex overflow-x-auto space-x-4 pb-4">
            {watchlistItems.map((it) => (
              <div key={it.id} className="relative min-w-[150px] bg-gray-800 rounded-lg">
                <img
                  src={it.poster}
                  alt={it.title || it.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedItem(it)}
                />
                <button onClick={() => handleRemove(it.type, it.id)}
                  className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"><DoneOutlineTwoToneIcon /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Watched Items */}
      {watchedItems.length > 0 ? (
        <div className="mt-10 px-6 sm:mx-40">
          <h3 className="text-xl font-bold text-white mb-4">Watched Films</h3>
          <div className="flex overflow-x-auto space-x-4 pb-4">
            {watchedItems.map((it) => (
              <div key={it.id} className="relative min-w-[150px] bg-gray-800 rounded-lg">
                <img
                  src={it.poster}
                  alt={it.title || it.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedItem(it)}
                />
                <button className="absolute top-2 right-2 bg-black/60 p-1 rounded-full">Watched {it.counter} times</button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-10 px-6 sm:mx-40 text-center text-gray-400">Watched items list is empty.</div>
      )}

      {/* Modal */}
      {selectedItemDetails && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#1c1c1c] p-6 rounded-lg max-w-2xl w-full relative">
            <button className="absolute top-2 right-2" onClick={() => { setSelectedItem(null); setSelectedItemDetails(null); }}>✖</button>
            <h2 className="text-2xl font-bold mb-2">{selectedItemDetails.title || selectedItemDetails.name}</h2>
            <p className="text-sm text-gray-400">⭐ {selectedItemDetails.vote_average?.toFixed(1)} / 10</p>
            <p className="text-sm mb-4">{selectedItemDetails.overview}</p>
            {selectedItemDetails.videos?.results?.length > 0 && (
              <iframe className="w-full h-64 rounded-lg mb-4"
                src={`https://www.youtube.com/embed/${selectedItemDetails.videos.results.find((v) => v.type === "Trailer")?.key}`}
                allowFullScreen />
            )}
            <h3 className="text-lg font-semibold mb-2">Top Cast</h3>
            <div className="flex overflow-x-auto space-x-3 mb-4">
              {selectedItemDetails.credits?.cast?.slice(0, 10).map((a) => (
                <div key={a.id} className="w-24 text-center">
                  <img src={a.profile_path ? `https://image.tmdb.org/t/p/w200${a.profile_path}` : "https://via.placeholder.com/100"}
                    alt={a.name} className="w-full h-24 object-cover rounded-lg" />
                  <p className="text-xs mt-1">{a.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
