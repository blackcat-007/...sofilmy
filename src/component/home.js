import { Routes, Route } from "react-router-dom";
import React from "react";
import SecondBar from "./secondbar";
import Sidebar from "./sidebar";
import Footer from "./footer";

function Home() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
           
            <SecondBar/>
            <Sidebar/>
            <Footer/>
          </>
        }
      />
      
    </Routes>
  );
}

export default Home;
