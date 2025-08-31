import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';  
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import Logout1 from './logout';
import Sidebar from './sidebar';

const Profile = () => {
  const user=localStorage.getItem("userId");
  const { id } = useParams(); // ✅ fetch userId from URL
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        console.log("Current User:", user?.uid);

        const db = getFirestore();
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);

        let foundUser = null;
        querySnapshot.forEach((doc) => {
          if (doc.data().uid === id) {   // ✅ filtering by doc.id
            const data = doc.data();
            foundUser = {
              name: data.name || 'N/A',
              email: data.email || 'N/A',
              photoURL: data.photoURL || 'https://via.placeholder.com/150',
              createdAt: data.createdAt 
                ? new Date(data.createdAt.seconds * 1000).toLocaleDateString()
                : 'N/A',
            };
          }
        });

        setUserData(foundUser);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [id]);

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;
  if (!userData) return <div className="text-center py-8 text-red-500">User not found.</div>;

  return (
    <>
      <div className="max-w-md w-80  sm:w-auto ml-14 sm:mx-auto mt-10 p-6 bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-gray-800 rounded-xl shadow-lg text-center">
        <img 
          src={userData.photoURL} 
          alt="Profile" 
          className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-[#00ff99] shadow-md mb-4"
        />
        <h2 className="text-2xl font-bold text-white">{userData.name}</h2>
        <p className="text-gray-400 text-sm text-wrap">{userData.email}</p>
        <p className="text-sm text-[#00ff99] mt-2">Joined on {userData.createdAt}</p>
        <div className="my-4 border-t border-gray-700"></div>
        <div className="flex justify-center">
          {user === id ? (
            <Logout1 className="bg-[#ff4d4d] hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-md transition-all" />
          ) : (
            <div className='flex gap-2'>
              <button
                className="bg-[#ff4d4d] hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm transition-all"
              >
                Follow
            </button>
              <button className="bg-[#10a268] hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm transition-all">
                Message
              </button>
            </div>
          )}
        </div>
      </div>
      <Sidebar />
    </>
  );
};

export default Profile;
