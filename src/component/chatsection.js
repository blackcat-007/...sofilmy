import React, { useState, useEffect } from "react";
import { addDoc, collection, onSnapshot, query, orderBy, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase"; // Adjusted import

const ChatSection = ({ user }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data(),
        }))
      );
    });
    return unsubscribe;
  }, []);

  const sendMessage = async () => {
    if (newMessage.trim() === "") return; // Prevent empty messages
    await addDoc(collection(db, "messages"), {
     // uid: user.uid,
      from:localStorage.getItem("username"),
      text: newMessage,
      timestamp: serverTimestamp(),
    });
    setNewMessage("");
  };

  return (
   <div className="relative h-screen   w-full *:flex flex-col items-center justify-center bg-black text-white">
  {/* Background Image */}
  <img
    className="absolute top-0 left-0 w-full h-full object-cover z-0"
    src="/images/sofilmywallpaper.jpg"
    alt="Background"
  />

  {/* Overlay for messages */}
  <div className="relative z-0 flex flex-col justify-between h-full w-full">
    {/* Message List */}
    <div className="overflow-y-auto p-4 flex-1">
      {messages.map((msg) => (
        <div key={msg.id} className="mb-2 bg-white bg-opacity-70 p-2 rounded-md max-w-[70%]">
          <img src={msg.data.photoURL || ""} alt="User avatar" className="w-6 h-6 rounded-full inline-block mr-2" />
          <span>{msg.data.text}</span>
        </div>
      ))}
    </div>

    {/* Input Area Fixed at Bottom */}
    <div className="w-full px-4 py-2 bg-white bg-opacity-80 flex items-center justify-center sticky bottom-0 z-10">
      <input
        className="bg-white text-black h-10 w-[60%] border rounded-2xl px-4"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button
        className="ml-2 text-white bg-green-600 w-16 h-10 border rounded-3xl"
        onClick={sendMessage}
      >
        Send
      </button>
    </div>
  </div>
</div>

  );
};

export default ChatSection;
