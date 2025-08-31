import React,{useState,useEffect} from 'react';
import ReactStars from 'react-stars';
import { BallTriangle } from 'react-loader-spinner';
import {getDocs} from 'firebase/firestore';
import { moviesRef } from '../firebase/firebase';
import {Link} from "react-router-dom";


function Analysis() {
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
   <div className="grid grid-cols-1 md:grid-cols-4 gap-10 px-3 sm:mt-4 mt-24 sm:mx-5">
  {loading ? (
    <div className="col-span-full flex justify-center items-center min-h-screen">
      <BallTriangle height={70} width={70} radius={5} color="#4fa94d" ariaLabel="ball-triangle-loading" />
    </div>   
  ) : (
    datas.map((e, i) => (
      <Link to={`/details/${e.id}`} key={i}>
       <div className="card p-4 bg-white rounded shadow-md transition-transform duration-300 transform hover:translate-y-2 hover:scale-105 hover:shadow-red-500 h-full">
  <div className='flex justify-center'>
    <img
      className="w-56 h-72 object-cover mb-3 rounded"
      src={e.image}
      alt={e.name}
    />
  </div>

  {/* Green dashed divider */}
  <div className="border-t-2 border-green-500 border-dashed my-3"></div>

  <h1>
    <span className="text-red-400 mr-1">Name:</span>
    {e.name}
  </h1>

  <h2 className="flex items-center">
    <span className="text-red-400 mr-2">Rating:</span>
    <div className="flex items-center">
      <ReactStars
        size={20}
        half={true}
        value={e.rating / e.user}
        edit={false}
      />
    </div>
  </h2>

  <p className="text-gray-500 truncate overflow-hidden whitespace-nowrap">
    {e.description}
  </p>

  <h3>
    <span className="text-red-400 mr-2">Year:</span>
    {e.year}
  </h3>
  <div className="mt-3 text-sm text-gray-400">
            {e.sarcasm && <span>😏 Sarcasm Included </span>}
            {e.spoilerFree && <span>🚫 Spoiler Free </span>}
          </div>
</div>

      </Link>
    ))
  )}
</div>

    )}


export default Analysis;
