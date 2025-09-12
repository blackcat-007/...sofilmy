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
import Logout1 from "./logout";
import Sidebar from "./sidebar";
import DoneOutlineTwoToneIcon from '@mui/icons-material/DoneOutlineTwoTone';

const TMDB_API = process.env.REACT_APP_TMDB_API_KEY;
const db = getFirestore();

const defaultUser = (uid, data = {}) => ({
  uid,
  name: data.name || "Anonymous",
  email: data.email || "",
  photoURL: data.photoURL || "https://via.placeholder.com/150",
  createdAt: data.createdAt
    ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
    : "N/A",
  followers: data.followers || [],
  following: data.following || [],
  watchlist: data.watchlist || [],
});

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

  // 🔹 find user doc by UID
  const findUserDoc = async (uid) => {
    const qs = await getDocs(collection(db, "users"));
    for (const s of qs.docs) {
      if (s.data()?.uid === uid) return { id: s.id, data: s.data() };
    }
    return null;
  };

  // 🔹 fetch both profile + current user
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = await getDocs(collection(db, "users"));
        let profile, current;
        qs.forEach((s) => {
          const d = s.data();
          if (d.uid === id) profile = { id: s.id, data: d };
          if (d.uid === currentUserId) current = { id: s.id, data: d };
        });

        if (!cancelled) {
          setUserData(profile ? defaultUser(id, profile.data) : null);
          setCurrentUserData(current ? defaultUser(currentUserId, current.data) : null);
          setDocIds({ profile: profile?.id || null, current: current?.id || null });
        }

        // fetch watchlist only for self
        if (!cancelled && currentUserId === id && current?.data?.watchlist?.length) {
          const items = await Promise.all(
            current.data.watchlist.map(async (entry) => {
              const [type, mediaId] = entry.split(":");
              const res = await fetch(`https://api.themoviedb.org/3/${type}/${mediaId}?api_key=${TMDB_API}`);
              return res.ok ? res.json() : null;
            })
          );
          setWatchlistItems(items.filter(Boolean));
        } else if (!cancelled) setWatchlistItems([]);
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
    return () => (cancelled = true);
  }, [id, currentUserId]);

  // 🔹 remove from watchlist
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

    if (!userSnap.exists()) throw new Error("User document not found");

    const data = userSnap.data();
    const watchlist = data.watchlist || [];
    const watched = data.watched || [];

    // ✅ Remove from watchlist
    const watchlistKey = `${type}:${mediaId}`;
    const newWatchlist = watchlist.filter((x) => x !== watchlistKey);

    // ✅ Find or add to watched list
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

    // ✅ Update the Firestore document
    await updateDoc(userRef, {
      watchlist: newWatchlist,
      watched: newWatched
    });

    // ✅ Update watchlist locally
    setWatchlistItems((prev) => prev.filter((x) => String(x.id) !== String(mediaId)));

    // ✅ Fetch the updated watched list from Firestore
    const updatedSnap = await getDoc(userRef);
    if (updatedSnap.exists()) {
      const updatedData = updatedSnap.data();
      const updatedWatched = updatedData.watched || [];
      const items = await Promise.all(
        updatedWatched.map(async (entry) => {
          const { id, type, counter } = entry;
          const res = await fetch(`https://api.themoviedb.org/3/${type}/${id}?api_key=${TMDB_API}`);
          if (!res.ok) return null;
          const details = await res.json();
          return { ...details, counter };
        })
      );
      setWatchedItems(items.filter(Boolean));
    }

  } catch (e) {
    console.error(e);
  }
};


useEffect(() => {
  if (!docIds.profile) return;
  (async () => {
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
              return { ...details, counter };
            })
          );
          setWatchedItems(items.filter(Boolean));
        } else {
          setWatchedItems([]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  })();
}, [docIds.profile]);


  


  // 🔹 follow/unfollow
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
    } catch (e) {
      console.error(e);
    }
  };

  // 🔹 fetch item details
  useEffect(() => {
    if (!selectedItem) return;
    let cancel = false;
    (async () => {
      try {
        const type = selectedItem.title ? "movie" : "tv";
        const res = await fetch(
          `https://api.themoviedb.org/3/${type}/${selectedItem.id}?api_key=${TMDB_API}&append_to_response=videos,credits`
        );
        if (!cancel) setSelectedItemDetails(await res.json());
      } catch (e) {
        console.error(e);
      }
    })();
    return () => (cancel = true);
  }, [selectedItem]);

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;
  if (!userData) return <div className="text-center py-8 text-red-500">User not found.</div>;

  const isSelf = currentUserId === id;
  const isFollowing = userData.followers.includes(currentUserId);

  return (
    <>
      {/* Profile Card */}
      <div className="max-w-sm mx-auto mt-20 p-6 bg-gradient-to-br from-[#1a1a1a] to-[#141414] rounded-xl text-center">
        <img src={userData.photoURL} alt="" className="w-24 h-24 mx-auto rounded-full mb-4 border-4 border-[#00ff99]" />
        <h2 className="text-2xl font-bold text-white">{userData.name}</h2>
        <p className="text-gray-400 text-sm">{userData.email}</p>
        <p className="text-sm text-[#00ff99] mt-2">Joined {userData.createdAt}</p>

        <div className="flex justify-center gap-6 mt-3 text-sm text-gray-300">
          <div><b>{userData.followers.length}</b> Followers</div>
          <div><b>{userData.following.length}</b> Following</div>
        </div>

        <div className="my-4 border-t border-gray-700" />

        {isSelf ? (
          <Logout1 className="bg-[#ff4d4d] px-6 py-2 rounded-lg text-white" />
        ) : (
          <button
            onClick={handleFollowToggle}
            className={`px-4 py-2 rounded-lg text-sm text-white ${isFollowing ? "bg-green-600" : "bg-[#ff4d4d]"}`}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
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
                  src={`https://image.tmdb.org/t/p/w200${it.poster_path}`}
                  alt={it.title || it.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedItem(it)}
                />
                <button onClick={() => handleRemove(it.title ? "movie" : "tv", it.id)}
                  className="absolute top-2 right-2 bg-black/60 p-1 rounded-full"><DoneOutlineTwoToneIcon /></button>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Watched Items */}
      { watchedItems.length > 0 && (
        <div className="mt-10 px-6 sm:mx-40">
          <h3 className="text-xl font-bold text-white mb-4">Watched Films</h3>
          <div className="flex overflow-x-auto space-x-4 pb-4">
            {watchedItems.map((it) => (
              <div key={it.id} className="relative min-w-[150px] bg-gray-800 rounded-lg">
                <img
                  src={`https://image.tmdb.org/t/p/w200${it.poster_path}`}
                  alt={it.title || it.name}
                  className="w-full h-48 object-cover cursor-pointer"
                  onClick={() => setSelectedItem(it)}
                />
               <button 
                  className="absolute top-2 right-2 bg-black/60 p-1 rounded-full">Watched {it.counter} times</button>
              </div>
            ))}
          </div>
        </div>
      )}
      { watchedItems.length === 0 && (
        <div className="mt-10 px-6 sm:mx-40 text-center text-gray-400">Your watched items list is empty.</div>
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
                    alt={a.name} className="w-20 h-20 rounded-full mx-auto mb-1" />
                  <p className="text-xs">{a.name}</p>
                </div>
              ))}
            </div>
            <h3 className="text-lg font-semibold mb-2">Crew</h3>
            <div className="flex flex-wrap gap-2">
              {selectedItemDetails.credits?.crew?.slice(0, 8).map((c) => (
                <div key={c.credit_id} className="text-xs text-gray-300">{c.job}: <span className="text-white">{c.name}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Sidebar />
    </>
  );
}
