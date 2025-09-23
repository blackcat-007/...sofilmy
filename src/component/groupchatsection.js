import React, { useState, useEffect, useRef } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  increment,
  getDoc,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import EmojiButton from "../ui/emoji";
import GroupDetails from "./groupdetails";
import ArrowBackIosTwoToneIcon from '@mui/icons-material/ArrowBackIosTwoTone';
import InfoIcon from '@mui/icons-material/Info';
const GroupChatSection = ({ selectedUser, onBack }) => {
  const currentUserId = localStorage.getItem("userId");
  const groupId = selectedUser?.id;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [emojiHistory, setEmojiHistory] = useState([]);
  const [selectedReply, setSelectedReply] = useState(null);
  const [groupDetailsOpen, setGroupDetailsOpen] = useState(false);
  const bottomRef = useRef(null);

  // Load emoji history
  useEffect(() => {
    const history = JSON.parse(localStorage.getItem("emojiHistory")) || [];
    setEmojiHistory(history);
  }, []);

  const handleEmojiClick = (emoji) => {
    setNewMessage((prev) => prev + emoji.character);
    setEmojiHistory((prevHistory) => {
      const newHistory = [emoji, ...prevHistory.filter((e) => e.slug !== emoji.slug)];
      if (newHistory.length > 20) newHistory.pop();
      localStorage.setItem("emojiHistory", JSON.stringify(newHistory));
      return newHistory;
    });
  };

  // Load messages
  useEffect(() => {
    if (!currentUserId || !groupId) return;

    const q = query(
      collection(db, "groupmessages"),
      where("groupId", "==", groupId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });

    return unsubscribe;
  }, [groupId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset unread
  useEffect(() => {
    if (!groupId || !currentUserId) return;
    const markAsRead = async () => {
      const chatRef = doc(db, "chats", groupId);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        await updateDoc(chatRef, { [`unreadCounts.${currentUserId}`]: 0 });
      }
    };
    markAsRead();
  }, [groupId, currentUserId]);

  // Send message
  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text || !groupId) return;

    const msgDoc = {
      groupId,
      senderId: currentUserId,
      senderName: localStorage.getItem("username") || "Unknown",
      senderImage: localStorage.getItem("userImage") || "/cinephile.png",
      text,
      createdAt: serverTimestamp(),
      replyTo: selectedReply?.id || null,
    };

    await addDoc(collection(db, "groupmessages"), msgDoc);

    // Update chat metadata
    const chatRef = doc(db, "chats", groupId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      const unreadCounts = {};
      (selectedUser.members || []).forEach((uid) => {
        unreadCounts[uid] = uid === currentUserId ? 0 : 1;
      });

      await setDoc(chatRef, {
        groupId,
        groupName: selectedUser.name,
        groupImage: selectedUser.image || "/cinephile_group.png",
        lastMessage: text,
        lastMessageSender: currentUserId,
        lastMessageTimestamp: serverTimestamp(),
        unreadCounts,
      });
    } else {
      const updates = {
        lastMessage: text,
        lastMessageSender: currentUserId,
        lastMessageTimestamp: serverTimestamp(),
      };
      (selectedUser.members || []).forEach((uid) => {
        if (uid !== currentUserId) updates[`unreadCounts.${uid}`] = increment(1);
      });
      await updateDoc(chatRef, updates);
    }

    setNewMessage("");
    setSelectedReply(null);
  };

  const getReplyMessage = (replyId) => messages.find((m) => m.id === replyId);

  return (
    <div className="relative w-full h-[calc(100vh-8rem)] bg-black text-white flex flex-col">
      <img
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="/images/sofilmywallpaper.jpg"
        alt="Background"
      />

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Header with back button for small devices */}
        <div className="p-4 border-b border-white bg-red-700 bg-opacity-80 flex items-center">
          <button
            className="md:hidden mr-2 p-1 rounded text-green-950 shadow-inner"
            onClick={onBack}
          >
            <ArrowBackIosTwoToneIcon fontSize="small" />
          </button>
          <button  onClick={() => setGroupDetailsOpen(true)} className="flex items-center max-w-[70%] sm:max-w-[60%] gap-2">
          <img
            src={selectedUser.image || "/cinephile_group.png"}
            alt="Group Avatar"
            className="w-8 h-8 rounded-full mr-2"
          />
          <h2 className="text-lg font-semibold truncate">{selectedUser.name}</h2>
          </button>
         
          {groupDetailsOpen && <GroupDetails selected={groupId} onClose={() => setGroupDetailsOpen(false)} />}
        </div>

      
 {/* Messages */} 
<div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
  {messages.map((msg) => {
    const isSender = msg.senderId === currentUserId;
    const replyMsg = msg.replyTo ? getReplyMessage(msg.replyTo) : null;

    return (
      <div
        key={msg.id}
        className={`flex ${isSender ? "justify-end" : "justify-start"}`}
      >
        <div
          className="flex flex-col max-w-[70%] sm:max-w-[60%] gap-1 cursor-pointer"
          onClick={() => setSelectedReply(msg)}
        >
         {/* Reply Preview */}
{replyMsg && (
  <div
    className={`px-2 py-1 rounded-t-lg text-xs max-w-full ${
      isSender
        ? "bg-gray-400/50 text-gray-800"
        : "bg-green-900/50 text-gray-200"
    }`}
    style={{
      display: "-webkit-box",
      WebkitLineClamp: 3,   // show max 3 lines
      WebkitBoxOrient: "vertical",
      overflow: "hidden",
      textOverflow: "ellipsis",
      wordBreak: "break-word",
      whiteSpace: "pre-wrap",
    }}
  >
    <span className="font-semibold">
      {replyMsg.senderId === currentUserId ? "You" : replyMsg.senderName}:
    </span>{" "}
   <div> {replyMsg.text}</div>
  </div>
)}

          {/* Message Bubble */}
          <div
            className={`p-2 rounded-lg break-words whitespace-pre-wrap ${
              isSender
                ? "bg-green-700 text-white rounded-br-none ml-auto"
                : "bg-white bg-opacity-80 text-black rounded-bl-none"
            }`}
            style={{ wordBreak: "break-word" }}
          >
            {!isSender && (
              <img
                src={msg.senderImage || "/cinephile.png"}
                alt="avatar"
                className="w-6 h-6 rounded-full mb-1"
              />
            )}
            <div className="flex flex-col">
              <span className="block text-xs font-semibold">
                {isSender ? "You" : msg.senderName}
              </span>
              <span className="whitespace-pre-wrap break-words">
                {msg.text}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  })}
  <div ref={bottomRef}></div>
</div>
        
         {/* Reply banner */}
        {selectedReply && (
  <div className="px-4 py-2 bg-yellow-600 text-black text-sm flex justify-between items-center  max-w-lg">
    <span className="truncate max-w-[70%] line-clamp-6">
      Replying to {selectedReply.senderId === currentUserId ? "You" : selectedReply.senderName}:{" "}
      {selectedReply.text}
    </span>
    <button
      className="ml-2 text-red-700 font-bold"
      onClick={() => setSelectedReply(null)}
    >
      ✕
    </button>
  </div>
)}
        {/* Input */}
        <div className="w-full px-4 py-2  bg-red-700 bg-opacity-80 flex items-center sticky bottom-0 z-10">
          <div className="flex mx-auto w-[70%]">
          <div className="mx-2">
            <EmojiButton onEmojiClick={handleEmojiClick} emojihistory={emojiHistory} />
          </div>
          <input
            className="bg-white text-black h-10 flex-1 w-[60%]  border rounded-2xl px-4"
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
            <span className="border-x-2 py-4 px-2 border-white border-dashed">Send</span>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default GroupChatSection;
