import React, { useState, useEffect,useRef } from "react";
import { addDoc, collection, onSnapshot, query, orderBy, serverTimestamp  } from "firebase/firestore";
import { db } from "../firebase/firebase"; // Adjusted import
import ChatUsers from "./chatusers";

const PersonalChatSection = ({selectedUser}) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState("");
  const bottomRef = useRef(null);

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
    <div className="w-full px-4 py-2 bg-red-700 bg-opacity-80 flex items-center justify-center sticky bottom-0 z-10">
      <input
        className="bg-white text-black h-10 w-[60%] border rounded-2xl px-4"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        placeholder="Type a message"
      />
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
