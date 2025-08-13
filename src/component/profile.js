import React, { useEffect, useState } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import Logout1 from './logout';
const Profile = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const auth = getAuth();
                const user = auth.currentUser;

                if (!user) {
                    setLoading(false);
                    return;
                }

                const db = getFirestore();
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);

                const userProfile = userSnap.exists() ? userSnap.data() : {};

                // Merge auth data and Firestore profile data
                const fullData = {
                    name: user.displayName || userProfile.name || 'N/A',
                    email: user.email || 'N/A',
                    photoURL: user.photoURL || userProfile.photoURL || 'https://via.placeholder.com/150',
                    createdAt: user.metadata?.creationTime || 'N/A',
                };

                setUserData(fullData);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUserData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;
     if (!userData) return <div className="text-center py-8 text-red-500">User not found.</div>;

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-gradient-to-br from-[#1a1a1a] to-[#141414] border border-gray-800 rounded-xl shadow-lg text-center">
    {/* Profile Image */}
    <img
        src={userData.photoURL || "/default-avatar.png"}
        alt="Profile"
        className="w-24 h-24 mx-auto rounded-full object-cover border-4 border-[#00ff99] shadow-md mb-4"
    />

    {/* Name */}
    <h2 className="text-2xl font-bold text-white">{userData.name}</h2>

    {/* Email */}
    <p className="text-gray-400 text-sm">{userData.email}</p>

    {/* Joined Date */}
    <p className="text-sm text-[#00ff99] mt-2">
        Joined on {new Date(userData.createdAt).toLocaleDateString()}
    </p>

    {/* Divider */}
    <div className="my-4 border-t border-gray-700"></div>

    {/* Logout Button */}
    <div className="flex justify-center">
        <Logout1 className="bg-[#ff4d4d] hover:bg-red-600 text-white px-6 py-2 rounded-lg shadow-md transition-all" />
    </div>
</div>

    );
};

export default Profile;
