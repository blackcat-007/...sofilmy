import { Routes, Route } from "react-router-dom";
import React from "react";
import SecondBar from "./secondbar";
import Sidebar from "./sidebar";

function Home() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <>
            <SecondBar/>
            <Sidebar/>
          </>
        }
      />
    </Routes>
  );
}

export default Home;
