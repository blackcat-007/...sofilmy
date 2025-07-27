import React,{useState,useEffect} from 'react';
import ReactStars from 'react-stars';
import { BallTriangle } from 'react-loader-spinner';
import {getDocs} from 'firebase/firestore';
import { moviesRef } from '../firebase/firebase';
import {Link} from "react-router-dom";
//import { Movie } from '@mui/icons-material';


function MovieLists() {
    const [datas,setData]=useState([]);
    const[loading , setloader]=useState(false);
    useEffect(()=>{
        async function getData(){
        
            setloader(true);
            const movieData= await getDocs(moviesRef);
            movieData.forEach((docs)=>
                setData((prv)=>[...prv,{...(docs.data()),id:docs.id}])
            )


        setloader(false);
    }
     getData()
    },[])
  return (
    <div className='flex flex-wrap justify-between mt-2 px-3'>
        {loading?<div className='w-full flex justify-center items-center min-h-screen h-94'><BallTriangle height={70} width={70}radius={5} color="#4fa94d" ariaLabel="ball-triangle-loading"/></div>:
           datas.map((e,i)=>{
            return (
        
     <Link to={`/details/${e.id}`}> <div key={i} className=' card  p-3 transform transition-transform duration-300 hover:translate-y-4 hover:scale-105 hover: shadow-lg hover: shadow-red-500 mt-10'><img className="h-25 md:h-72"src={e.image} alt="avengers-endgame"></img>
      <h1><span className='text-red-400 mr-1'>Name:</span>{e.name}</h1>
      <h2 className="flex items-center"><span className='text-red-400 mr-2'>Rating:</span><ReactStars size={20} half={true} value={e.rating/e.user} edit={false}/></h2>
      <h3><span className='text-red-400 mr-2'>Year:</span>{e.year}</h3>
      </div></Link>
            )})}
        
    </div>
    )}


export default MovieLists
