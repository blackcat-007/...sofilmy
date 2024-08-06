 import React, { useContext } from "react";
 import AddCircleIcon from '@mui/icons-material/AddCircle';
 import {Button} from '@mui/material';
 import {Link} from 'react-router-dom';
 import { Appstate } from "../App";
 
 function Header(){
     const useAppstate=useContext(Appstate);
    return(
      <div className="sticky top-0 z-10 header text-3xl text-red-500 font-bold p-3 border-b-2 flex justify-between items-center border-cyan-100"> <Link to={'/'}><sapn>...So<span className="text-white">Filmy</span></sapn></Link>
     
     
     { useAppstate.login? <Link to={'/addmovies'}><h1 className="text-lg cursor-pointer"><Button><span className="text-green-400">Add New</span><AddCircleIcon className="ml-2 text-white"/></Button></h1></Link>:<Link to={'/login'}><h1 className="text-lg cursor-pointer"><Button><span className="text-green-400">Login</span></Button></h1></Link>}
        </div>
    )
 }
 export default Header