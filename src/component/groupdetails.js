import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection
} from "firebase/firestore";
import { use } from "react";

const db = getFirestore();

const GroupDetails = ({ selected, onClose }) => {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  useEffect(() => {
    if (selected) {
      const fetchGroupDetails = async () => {
        try {
          const ref = doc(db, "group", selected);
          const snapshot = await getDoc(ref);
          if (snapshot.exists()) {
            setGroup({ id: snapshot.id, ...snapshot.data() });
          }
        } catch (err) {
          console.error("Error fetching group:", err);
        } finally {
          setLoading(false);
        }
      };
      fetchGroupDetails();
    }
  }, [selected]);

  useEffect(() => {
  if (group && group.members?.length > 0) {
    const fetchMemberDetails = async () => {
      try {
        const snapshot = await getDocs(collection(db, "users"));

        // Filter only those whose IDs are in group.members
        const users = snapshot.docs
          .filter((doc) => group.members.includes(doc.data().uid))
          .map((doc) => ({
            id: doc.data().uid,
            name: doc.data().name, // assuming user has "name" field
          }));

        setMembers(users);
      } catch (err) {
        console.error("Error fetching group members:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberDetails();
  }
}, [group]);


  if (loading) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="text-green-400 font-bold">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="bg-gradient-to-br from-red-900 via-black to-green-900 text-white p-6 rounded-xl shadow-xl border border-red-600">
          No group found.
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 rounded-md hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-red-900 via-black to-green-900 text-white rounded-2xl shadow-2xl p-6 w-full max-w-lg border border-red-700">
        {/* Group Image */}
        {group.image && (
          <img
            src={group.image}
            alt={group.name}
            className="w-full h-48 object-cover rounded-lg mb-4"
          />
        )}

        {/* Group Info */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-extrabold mb-2 text-green-400">
            {group.name}
          </h2>
          <div className="text-white bg-gradient-to-tr from-green-500 to-green-800  rounded-lg  w-auto h-auto p-2">
            {group.access}
          </div>
        </div>
        {group.about && <p className="mb-4">{group.about}</p>}

        {/* Members */}
        {members?.length > 0 && (
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-red-300">Members:</h4>
            <ul className="list-disc list-inside text-green-300">
              {members.map((m) => (
                <li key={m.id} className="truncate">{m.name}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Created At */}
        {group.createdAt && (
          <p className="text-sm text-gray-300">
            <strong>Created At:</strong>{" "}
            {group.createdAt.toDate
              ? group.createdAt.toDate().toLocaleString()
              : new Date(group.createdAt).toLocaleString()}
          </p>
        )}

        {/* Close */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

GroupDetails.propTypes = {
  selected: PropTypes.string.isRequired, // group doc id
  onClose: PropTypes.func.isRequired,
};

export default GroupDetails;
