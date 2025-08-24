import React, { useState, useEffect, useRef } from "react";
import { addDoc, collection, onSnapshot, query, orderBy, serverTimestamp, where, getDoc, doc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import GroupDetails from "./groupdetails";

const GroupChatSection = ({ selectedUser }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState("");
  const [username, setUsername] = useState("");
  const [userImage, setUserImage] = useState("");
  const [selectedRecipient, setSelectedRecipient] = useState(null); // for reply/direct message
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);

  const bottomRef = useRef(null);

  // Load current user
  useEffect(() => {
    const storedUser = localStorage.getItem("userId");
    const storedName = localStorage.getItem("username");
    const storedImage = localStorage.getItem("userImage");

    if (storedUser) {
      setUser(storedUser);
      setUsername(storedName || "Unknown");
      setUserImage(storedImage || "/cinephile.png");
    }
  }, []);

  // Load messages in group
  useEffect(() => {
    if (!user || !selectedUser?.id) return;

    const q = query(
      collection(db, "groupmessages"),
      where("groupid", "==", selectedUser.id),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [selectedUser, user]);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);


  // Fetch user image from "users" collection
  const getUserImage = async (uid) => {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) {
        return snap.data().image || "/cinephile.png";
      }
    } catch (err) {
      console.error("Error fetching user image:", err);
    }
    return "/cinephile.png";
  };

  // Send message
  const sendMessage = async () => {
    if (newMessage.trim() === "") return;

    let toId = "";
    let toName = "";
    let toImage = "";

    if (selectedRecipient) {
      toId = selectedRecipient.fromId;
      toName = selectedRecipient.fromName;
      toImage = selectedRecipient.fromImage;
    }

    await addDoc(collection(db, "groupmessages"), {
      fromId: user,
      fromName: username,
      fromImage: userImage,
      groupid: selectedUser.id,
      toId,
      toName,
      toImage,
      text: newMessage,
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
    setSelectedRecipient(null);
  };

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] bg-black text-white flex flex-col">
      {/* Background Image */}
      <img
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="/images/sofilmywallpaper.jpg"
        alt="Background"
      />

      {/* Chat Content */}
      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Header */}
        <div className="p-4 border-b border-white bg-red-700 bg-opacity-80 flex">
          <button className="flex items-center" onClick={() => setGroupDetailsOpen(true)}>
          <img
            src={selectedUser.image || "/cinephile.png"}
            alt="Group Avatar"
            className="w-8 h-8 rounded-full mr-2"
          />
          <h2 className="text-lg font-semibold">{selectedUser.name}</h2>
          </button>
          {groupDetailsOpen && <GroupDetails selected={selectedUser.id} onClose={() => setGroupDetailsOpen(false)} />}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {messages.map((msg) => {
            const isSender = msg.fromId === user;

            return (
              <div
                key={msg.id}
                className={`w-full flex ${isSender ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="flex items-end max-w-full gap-2 cursor-pointer"
                  onClick={() => setSelectedRecipient(msg)} // select msg
                >
                  {/* Avatar */}
                  {!isSender && (
                    <img
                      src={msg.fromImage || "/cinephile.png"}
                      alt="User avatar"
                      className="w-6 h-6 rounded-full"
                    />
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`p-2 rounded-lg max-w-[60vw] w-fit break-words ${
                      isSender
                        ? "bg-green-700 text-white rounded-br-none"
                        : "bg-white bg-opacity-80 text-black rounded-bl-none"
                    }`}
                  >
                    <span className="block text-xs font-semibold">
                      {msg.fromName}
                      {msg.toId && (
                        <span className={` ml-1 ${
                      isSender
                        ? "text-red-200"
                        : "text-green-800 "
                    }`}>
                          → @{msg.toName}
                        </span>
                      )}
                    </span>
                    <span className="whitespace-pre-line">{msg.text}</span>
                  </div>

                  {isSender && (
                    <img
                      src={msg.fromImage || "/cinephile.png"}
                      alt="Your avatar"
                      className="w-6 h-6 rounded-full"
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef}></div>
        </div>

        {/* Reply/Direct banner */}
        {selectedRecipient && (
          <div className="px-4 py-2 bg-yellow-600 text-black text-sm flex justify-between items-center">
            Replying to {selectedRecipient.fromName}
            <button
              className="ml-2 text-red-700 font-bold"
              onClick={() => setSelectedRecipient(null)}
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Area */}
        <div className="w-full px-4 py-2 bg-red-700 bg-opacity-80 flex items-center justify-center sticky bottom-0 z-10">
          <input
            className="bg-white text-black h-10 w-[60%] border rounded-2xl px-4"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
          />
          <button
            className="ml-2 text-white bg-green-600 w-20 h-10"
            onClick={sendMessage}
            style={{
              clipPath:
                "polygon(10% 0%, 90% 0%, 100% 16%, 89% 34%, 100% 51%, 89% 70%, 100% 85%, 90% 100%, 10% 100%, 0% 85%, 11% 70%, 0% 51%, 11% 34%, 0% 16%, 10% 0%)",
            }}
          >
            <span className="border-x-2 border-white py-4 px-2">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupChatSection;
