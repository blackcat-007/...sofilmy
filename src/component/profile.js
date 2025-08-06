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
        <div className="max-w-md mx-auto mt-10 p-6 bg-slate-600 shadow-md rounded-md text-center">
            <img
                src={userData.photoURL}
                alt="Profile"
                className="w-24 h-24 mx-auto rounded-full border border-gray-300 mb-4"
            />
            <h2 className="text-xl font-semibold">{userData.name}</h2>
            <p className="text-gray-600">{userData.email}</p>
            <p className="text-sm text-gray-400 mt-2">Joined on {new Date(userData.createdAt).toLocaleDateString()}</p>
             {/* Logout */}
                        <Logout1 />
        </div>
    );
};

export default Profile;
