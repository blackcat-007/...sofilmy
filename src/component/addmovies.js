import React,{useState,useContext} from 'react';
import { TailSpin } from 'react-loader-spinner';
import {addDoc} from 'firebase/firestore';
import {moviesRef} from '../firebase/firebase';
import swal from 'sweetalert';
import { Appstate } from "../App";
import { useNavigate } from "react-router-dom";

function Addmovies() {
    const useAppstate=useContext(Appstate);
      // Check localStorage along with Appstate
  const isLoggedIn = useAppstate.login || localStorage.getItem("login") === "true";
    const navigate = useNavigate();
    const [form,setForm]=useState({
        name:"",
        year:"",
        description:"",
        image:""
    });
    const [loading,setLoading]=useState(false);
    const addmovies = async () => {
    if (!isLoggedIn) {
        navigate('/login');
        return;
    }

    // Validation: Check all fields
    const { name, year, description, image } = form;
    if (!name.trim() || !year.trim() || !description.trim() || !image.trim()) {
        swal({
            title: "Incomplete Form",
            text: "Please fill out all fields before submitting.",
            icon: "warning",
            buttons: false,
            timer: 3000,
        });
        return;
    }

    setLoading(true);

    try {
        await addDoc(moviesRef, form);
        swal({
            title: "Successfully Added",
            icon: "success",
            buttons: false,
            timer: 3000,
        });

        setForm({
            name: "",
            year: "",
            description: "",
            image: ""
        });
    } catch (error) {
        console.error("Error adding movie:", error);
        swal({
            title: "Error",
            text: "Something went wrong while adding the movie.",
            icon: "error",
            buttons: true,
        });
    }

    setLoading(false);
};

    return (
        <div>
            <section className="text-gray-600 body-font relative">
                <div className="container px-5 py-8 mx-auto">
                    <div className="flex flex-col text-center w-full mb-4">
                        <h1 className="sm:text-xl text-2xl font-medium title-font mb-4 text-red-400">Add New Movie</h1>
                        <p className="lg:w-2/3 mx-auto leading-relaxed text-base"></p>
                    </div>
                    <div className="lg:w-1/2 md:w-2/3 mx-auto">
                        <div className="flex flex-wrap -m-2">
                            <div className="p-2 w-1/2">
                                <div class="relative">
                                    <label for="name" className="leading-7 text-sm text-red-400">Movie Name <span className="text-green-400">*</span></label>
                                    <input type="text" id="name" value={form.name} onChange={(e)=>{
                                        setForm({...form,name:e.target.value})
                                    }} name="Movie name" className="w-full bg-white bg-opacity-100 rounded border border-gray-300 focus:border-green-400 focus:bg-red-300 focus:ring-2 focus:ring-green-200 h-15 text-base outline-none text-black py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out" />
                                </div>
                            </div>
                            <div class="p-2 w-1/2">
                                <div class="relative">
                                    <label for="year" className="leading-7 text-sm text-red-400">Year <span className="text-green-400">*</span></label>
                                    <input type="text" id="email"value={form.year} onChange={(e)=>{
                                        setForm({...form,year:e.target.value})
                                    }} name="Year" className="w-full bg-white bg-opacity-100 rounded border border-gray-300 focus:border-green-400 focus:bg-red-300 focus:ring-2 focus:ring-green-200 h-15 text-base outline-none text-black py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out" />
                                </div>
                            </div>
                            <div class="p-2 w-full">
                               <div className="relative group">
  <label htmlFor="image" className="leading-7 text-sm text-red-400">
    Enter Movie Poster Here <span className="text-green-400">*</span>
  </label>

  <input
    id="image"
    value={form.image}
    onChange={(e) => {
      setForm({ ...form, image: e.target.value });
    }}
    name="image"
    className="w-full bg-white bg-opacity-100 rounded border border-gray-300 focus:border-green-400 focus:bg-red-300 focus:ring-2 focus:ring-green-200 h-15 text-base outline-none text-black py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"
  />

  {/* Tooltip on hover */}
  <div className="absolute top-full left-0 mt-1 w-80 text-sm bg-black text-white p-3 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
  💡 <span className="text-yellow-300 font-semibold">Search</span> your film in Google  
  <span className="mx-1">➡️</span> 
  <span className="text-yellow-300 font-semibold">Right-click</span> on the poster  
  <span className="mx-1">➡️</span> 
  <span className="text-yellow-300 font-semibold">Copy image</span>  
  <span className="mx-1">➡️</span> 
  <span className="text-yellow-300 font-semibold">Paste</span> it here.
</div>

</div>

                            </div>
                            <div class="p-2 w-full">
                                <div class="relative">
                                    <label for="description" className="leading-7 text-sm text-red-400">Write your thoughts here <span className="text-green-400">*</span></label>
                                    <textarea id="message" value={form.description} onChange={(e)=>{
                                        setForm({...form,description:e.target.value})
                                    }} name="message" className="w-full bg-white bg-opacity-100 rounded border border-gray-300 focus:border-green-400 focus:bg-red-300 focus:ring-2 focus:ring-green-200 h-32 text-base outline-none text-black py-1 px-3 resize-none leading-6 transition-colors duration-200 ease-in-out"></textarea>
                                </div>
                            </div>
                            <div className="p-2 w-full">
                                <button onClick={addmovies}className="flex mx-auto text-white bg-green-400 border-0 py-2 px-8 focus:outline-none hover:bg-green-600 rounded text-lg"> {loading? <TailSpin height={20} color="white" />: 'Submit' }</button>

                            </div>

                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Addmovies
