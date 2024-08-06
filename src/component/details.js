import React, { useEffect, useState } from 'react';
import ReactStars from 'react-stars';
import {useParams} from 'react-router-dom';
import {getDoc,doc} from "firebase/firestore";
import {db} from "../firebase/firebase";
import { MagnifyingGlass } from 'react-loader-spinner';
import Reviews from './reviews';



function Details() {
    const{id}=useParams()
    const[loading,setLoader]=useState(false)
    const[data,setData]=useState({
        description:"",
         image:"",
        name:"",
        rating:0,
        user:0,
        year:""
       
       
       
    })
    useEffect(()=>{
        setLoader(true)
       async function getData(){
            const _doc=doc(db,"movies",id)
            const _data= await getDoc(_doc,id)
            setData(_data.data())
            setLoader(false)
       }
       getData();
       
    },[])
  return (
    
    <div className='p-4 mt-4 flex justify-center  flex-col md:flex-row items-center md:items-start w-full '>
    { loading ? <div className='h-96 w-full flex justify-center items-start'><MagnifyingGlass height={80}
  width={80}
  ariaLabel="magnifying-glass-loading"  glassColor={"pink"} color={"green"}/></div>:
   <> <img className='h-96 block md:sticky md:top-24' src={data.image} alt='avengers-endgame'/>
    <div className='mt:5 md:ml-4 ml-0 w-full md:w-1/2'><h2 className='text-2xl font-bold text-gray-300'>{data.name}</h2>
    <span  className='text-xl'>{data.year}</span>
    <ReactStars size={20} half={true} value={data.rating/data.user} edit={false}/>
    <p className="mt-2">{data.description}</p>
    <Reviews id={id} prevRating={data.rating} totalusers={data.user}/>
    </div>
    </>}
    </div>
    
  )
}

export default Details
