
import './App.css';
import Header from "./component/header";
import Footer from "./component/footer";
import SecondBar from "./component/secondbar";
import Cards from "./component/cards";
import {Routes,Route} from "react-router-dom";
import Addmovies from "./component/addmovies";
import Details from "./component/details";
import { createContext,useState } from 'react';
import Login from './component/login';
import Signup from './component/signup';
import ChatSection from './component/chatsection';
import ChatUsers from './component/chatusers';
const Appstate=createContext()
function App() {
  const[login,setLogin]=useState(false)
  const[username,setUsername]=useState("")
  return (
    <Appstate.Provider value={{login,username,setLogin,setUsername}}>
    <div className="App relative">
      
      <Header/>
      <Routes>

        <Route path="/" element={<SecondBar/>}/>
        <Route path="/addmovies" element={<Addmovies/>}/>
        <Route path="/details/:id" element={<Details/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/signup" element={<Signup/>}/>
        <Route path="/filmychat" element={<ChatUsers/>}/>
        
      
      </Routes>
      

    </div>
    </Appstate.Provider>
  );
}

export default App;
export {Appstate};
