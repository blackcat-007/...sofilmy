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
      uid: user.uid,
      displayName: user.displayName,
      text: newMessage,
      timestamp: serverTimestamp(),
    });
    setNewMessage("");
  };

  return (
    <div className="h-[90%] w-full ">
      <div>
      <img className="h-[50%] w-full"src="/images/sofilmywallpaper.jpg"/></div>
      <div className="z-20">
        
        <div className="h-[90%] z-20 w-full">
        {messages.map((msg) => (
          <div key={msg.id}>
            <img src={msg.data.photoURL || ""} alt="User avatar" />
            {msg.data.text}
          </div>
        ))}
      </div >
    <div className="w-full flex justify-center z-20 ">
      <input
        className="bg-white  text-black h-10  w-[50%] border rounded-2xl"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
      />
      <button className="text-white  bg-green-600 w-16 h-10 border rounded-3xl" onClick={sendMessage}>
        Send
      </button>
      </div> 
      
      </div>
    </div>
  );
};

export default ChatSection;
