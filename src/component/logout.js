import React from 'react';
import { Logout } from "@mui/icons-material";
import { Button } from '@mui/material';
function Logout1() {
    const handleLogout = () => {
        if (window.confirm('Are you sure you want to log out?')) {
            localStorage.removeItem('username');
            localStorage.setItem('login', 'false');
            // Optionally redirect to login page or home
            window.location.href = '/login';
        }
    };

    return (
       
           <h1 className="text-lg cursor-pointer">
            <Button onClick={handleLogout}>
              <span className="text-green-400">
                Logout
              </span>
              <Logout className="ml-2 text-white" />
            </Button>
          </h1>
        
    );
}

export default Logout1;