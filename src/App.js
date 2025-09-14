import './App.css';
import Header from "./component/header";
import Footer from "./component/footer";
import SecondBar from "./component/secondbar";
import Analysis from "./component/analysis";
import { Routes, Route } from "react-router-dom";
import Addmovies from "./component/addmovies";
import Details from "./component/details";
import { createContext, useState, useEffect } from 'react';
import Login from './component/login';
import Signup from './component/signup';
import ChatUsers from './component/chatusers';
import Profile from './component/profile';
import Home from './component/home';
import FindPeople from './component/findpeople';
import Landing from './component/landing';
import AddList from './component/addlist';
const Appstate = createContext();

function App() {
  const [login, setLogin] = useState(false);
  const [username, setUsername] = useState("");

  // 👇 Keep user logged in based on localStorage
  useEffect(() => {
    const storedLogin = localStorage.getItem("login") === "true";
    const storedUser = localStorage.getItem("username");

    if (storedLogin) {
      setLogin(true);
      setUsername(storedUser || "");
    }
  }, []);

  return (
    <Appstate.Provider value={{ login, username, setLogin, setUsername }}>
      <div className="App relative">
        
        {/* ✅ Header also updates automatically based on login */}
        <Header />

        <Routes>
          {/* 👇 Conditional root route */}
          <Route path="/" element={login ? <Home /> : <Landing />} />

          <Route path="/addmovies" element={<Addmovies />} />
          <Route path="/details/:id" element={<Details />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/filmychat" element={<ChatUsers />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/findpeople" element={<FindPeople />} />
          
          <Route path="/addlist" element={<AddList />} />
          
        </Routes>
      </div>
    </Appstate.Provider>
  );
}

export default App;
export { Appstate };
