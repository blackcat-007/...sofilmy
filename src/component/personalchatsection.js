import React, { useEffect, useState, useRef } from "react";
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
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/firebase"; 
import EmojiButton from "../ui/emoji";
import ArrowBackIosTwoToneIcon from '@mui/icons-material/ArrowBackIosTwoTone';

const PersonalChatSection = ({ selectedUser, onBack }) => {
  const currentUserId = localStorage.getItem("userId");
  const chatId = [currentUserId, selectedUser?.uid].sort().join("_");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const bottomRef = useRef(null);
  const [emojiHistory, setEmojiHistory] = useState([]);
  const [selectedReply, setSelectedReply] = useState(null);

  // track if tab/window is visible (so we only mark seen when user can actually see)
  const [isWindowActive, setIsWindowActive] = useState(
    typeof document !== "undefined" ? document.visibilityState === "visible" : true
  );

  useEffect(() => {
    const onVisibility = () => setIsWindowActive(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("blur", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("blur", onVisibility);
    };
  }, []);

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

  // Helper to format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return "";
    try {
      // Firestore Timestamp has toDate()
      const date = typeof timestamp.toDate === "function" ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  };

  // Fetch messages & update statuses in realtime
  useEffect(() => {
    if (!currentUserId || !selectedUser?.uid) return;

    const q = query(
      collection(db, "messages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // set messages locally
      const msgs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      setMessages(msgs);

      // Batch status updates (minimize writes)
      const batch = writeBatch(db);
      let needCommit = false;

      snapshot.docs.forEach((d) => {
        const data = d.data();
        const id = d.id;

        // we only update status for messages that were sent *to* the current user
        if (data.receiverId === currentUserId) {
          // if chat is open with the sender and window is active => mark seen
          if (selectedUser && selectedUser.uid === data.senderId && isWindowActive) {
            if (data.status !== "seen") {
              batch.update(doc(db, "messages", id), { status: "seen" });
              needCommit = true;
            }
          } else {
            // chat not open or window hidden => mark delivered (only if still 'sent')
            if (!data.status || data.status === "sent") {
              batch.update(doc(db, "messages", id), { status: "delivered" });
              needCommit = true;
            }
          }
        }
      });

      if (needCommit) {
        try {
          await batch.commit();
          
        } catch (err) {
          console.error("Failed to commit status updates:", err);
        }
      }
       // 🔹 Always reset unread count if chat is active
  if (selectedUser && isWindowActive) {
    const chatRef = doc(db, "chats", chatId);
    try {
      await updateDoc(chatRef, {
        [`unreadCounts.${currentUserId}`]: 0,
      });
    } catch (err) {
      console.error("Failed to reset unread count:", err);
    }
  }
    });

    return unsubscribe;
  }, [chatId, selectedUser, currentUserId, isWindowActive]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Reset unread (keeps unreadCounts on chat doc zero)
  useEffect(() => {
    const markAsRead = async () => {
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);
      if (chatSnap.exists()) {
        await updateDoc(chatRef, {
          [`unreadCounts.${currentUserId}`]: 0,
        });
      }
      // this effect is kept but realtime status marking above covers individual messages
    };
    markAsRead();
  }, [chatId, selectedUser]);

  // Send message (include status: 'sent')
  const sendMessage = async () => {
    const text = newMessage.trim();
    if (!text) return;

    const msgDoc = {
      chatId,
      senderId: currentUserId,
      receiverId: selectedUser.uid,
      text,
      createdAt: serverTimestamp(),
      replyTo: selectedReply?.id || null,
      status: "sent",
    };

    await addDoc(collection(db, "messages"), msgDoc);

    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: [currentUserId, selectedUser.uid],
        lastMessage: text,
        lastMessageSender: currentUserId,
        lastMessageTimestamp: serverTimestamp(),
        unreadCounts: {
          [selectedUser.uid]: 1,
          [currentUserId]: 0,
        },
      }, { merge: true });
    } else {
      await updateDoc(chatRef, {
        lastMessage: text,
        lastMessageSender: currentUserId,
        lastMessageTimestamp: serverTimestamp(),
        [`unreadCounts.${selectedUser.uid}`]: increment(1),
      });
    }

    setNewMessage("");
    setSelectedReply(null);
  };

  const getReplyMessage = (replyId) => messages.find((m) => m.id === replyId);
  //const currentUserId = localStorage.getItem("userId");

  useEffect(() => {
    if (!selectedUser) return;

    const chatId = [currentUserId, selectedUser.uid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);

    // Reset unread count for the current user as soon as they view the chat
    updateDoc(chatRef, {
      [`unreadCounts.${currentUserId}`]: 0,
    });
  }, [selectedUser, currentUserId]);

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] bg-black text-white flex flex-col">
      <img
        className="absolute top-0 left-0 w-full h-full object-cover z-0"
        src="/images/sofilmywallpaper.jpg"
        alt="Background"
      />

      <div className="relative z-10 flex flex-col h-full w-full">
        {/* Header */}
        <div className="p-4 border-b border-white bg-red-700 bg-opacity-80 flex items-center">
          <button
            className="md:hidden mr-2 p-1 rounded text-green-950 shadow-inner"
            onClick={onBack}
          >
            <ArrowBackIosTwoToneIcon fontSize="small" />
          </button>
          <img
            src={selectedUser.image || "/cinephile.png"}
            alt="User Avatar"
            className="w-8 h-8 rounded-full mr-2"
          />
          <h2 className="text-lg font-semibold truncate">{selectedUser.name}</h2>
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
                >
                  {/* Reply Preview */}
                  {replyMsg && (
                    <div
                      className={`px-2 py-1 rounded-t-lg text-xs ${
                        isSender ? "bg-gray-400/50 text-gray-800" : "bg-green-900/50 text-gray-200"
                      }`}
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        wordBreak: "break-word",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      <span className="font-semibold">
                        {replyMsg.senderId === currentUserId ? "You" : selectedUser.name}:
                      </span>{" "}
                      <div>{replyMsg.text}</div>
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
                    onClick={() => setSelectedReply(msg)}
                  >
                    {!isSender && (
                      <img
                        src={selectedUser.image || "/cinephile.png"}
                        alt="avatar"
                        className="w-6 h-6 rounded-full mb-1"
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="block text-xs font-semibold">
                        {isSender ? "You" : selectedUser.name}
                      </span>
                      <span className="whitespace-pre-wrap break-words">{msg.text}</span>

                      {/* timestamp + ticks */}
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className={`text-[11px] text-black ${
                      isSender
                        ? " text-white "
                        : " text-black "
                    }`  }>{formatTime(msg.createdAt)}</span>

                        {isSender && (
                          <span className="flex items-center">
                            {/* seen => double blue ticks */}
                            {msg.status === "seen" ? (
                              <span className="flex -space-x-1">
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 6L9 17l-5-5" /></svg>
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M22 6L11 17l-5-5" /></svg>
                              </span>
                            ) : msg.status === "delivered" ? (
                              // delivered => single gray tick
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 6L9 17l-5-5" /></svg>
                            ) : (
                              // sent / pending => small clock or pulse
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-300 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
                            )}
                          </span>
                        )}
                      </div>
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
            <span className="truncate max-w-[70%]">
              Replying to {selectedReply.senderId === currentUserId ? "You" : selectedUser.name}:{" "}
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
        <div className="w-full px-4 py-2 bg-red-700 bg-opacity-80 flex items-center sticky bottom-0 z-10">
          <div className="mx-2">
            <EmojiButton onEmojiClick={handleEmojiClick} emojihistory={emojiHistory} />
          </div>
          <textarea
            className="bg-white text-black flex-1 h-10 resize-none border rounded-2xl px-4 py-2 overflow-hidden"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            style={{ maxHeight: "150px" }}
            rows={1}
            onInput={(e) => {
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
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
  );
};

export default PersonalChatSection;
