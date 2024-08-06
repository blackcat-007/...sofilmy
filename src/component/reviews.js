import React, { useState,useEffect, useContext } from 'react'
import ReactStars from 'react-stars';
import { reviewsRef,db } from '../firebase/firebase';
import { TailSpin, ThreeDots } from 'react-loader-spinner';
import { addDoc,doc,updateDoc,query,where,getDocs} from 'firebase/firestore';
import swal from 'sweetalert';
import { Appstate } from '../App';
import { useNavigate } from 'react-router-dom';

function Reviews({id,prevRating,totalusers}) {
    const useAppstate=useContext(Appstate)
    const navigate = useNavigate();
    const[rating,setRating]=useState(0);
    const[loader,setLoading]=useState(false);
    const[reviewloader,setReviewLoading]=useState(false);
    const[form,setForm]=useState("");
    const[data,setData]=useState([]);
    const [newAdded, setNewAdded] = useState(0);
    const addReviews=async ()=>{
        setLoading(true);
        if(useAppstate.login){
        await addDoc(reviewsRef,{
            movieid:id,
            name:useAppstate.username,
            rating:rating,
            thoughts:form,
            timestamp:new Date().getTime()


        });
        const ref=doc(db,"movies",id);
        await updateDoc(ref,{
            rating:rating+prevRating,
            user:totalusers+1,

        })
        setRating(0);
        setForm("");
        setNewAdded(newAdded + 1);
        swal({
            name:'successfully added',
            icon:'success',
            buttons:false,
            timer:3000


        })
    }
    else{
        navigate('/login')
    }
       
        setLoading(false)
    }
    useEffect(()=>{
        async function getData(){
            setReviewLoading(true);
            setData([]);
            let quer=query(reviewsRef,where('movieid','==',id))
            const querySnap=await getDocs(quer);
            querySnap.forEach((doc)=>{
                setData((prev)=>[...prev,doc.data()])
            })
            setReviewLoading(false);

        };
        getData();
    },[newAdded])
  return (
    

    <div className='mt-4 w-full py-2 border-t-2 border-cyan-100'>
        <ReactStars
        size={40} half={true}
edit={true}  value={rating} onChange={(rate)=>setRating(rate)}
    />
        <input value={form} onChange={((e)=>setForm(e.target.value))} type="text"placeholder="Enter your thoughts here"className='w-full h-12 p-2 outline-none header'/>
        <button onClick={addReviews} className='flex justify-center h-10 bg-green-500 w-full p-2'>{loader? <TailSpin height={20} color='white'/>:"Share"}</button>
        {reviewloader?<div className='mt-6 flex justify-center'> <ThreeDots height={10} color={'white'}/></div>:<div className='mt-3 p-3'>{data.map((e,i)=>{return(<div className='p-2 w-full mt-2 bg-gray-700' key={i}><div className="flex"><p className="text-blue-700">{e.name}</p><p className='ml-2'>{new Date(e.timestamp).toLocaleString()}</p></div><p>{e.thoughts}</p><ReactStars
        size={15} half={true}
edit={false}  value={e.rating} /></div>) })}</div>}
    </div>
  )
}

export default Reviews
