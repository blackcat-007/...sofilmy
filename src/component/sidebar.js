import React from 'react';
import { Link } from 'react-router-dom';
import Profile from './profile'; // Assuming you have a Profile component
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
import PersonAddAltTwoToneIcon from '@mui/icons-material/PersonAddAltTwoTone';
const Profileicon = () => (
  <div className='flex sm:flex-col flex-row items-center p-3 text-white text-xs justify-center top-1'>
    <Link to="/profile" >
  <div className="flex flex-col items-center p-3 text-white text-xs">
  <AccountCircleTwoToneIcon className="text-white text-5xl" />
</div>

</Link>
 <div className="flex flex-col items-center p-3 text-white text-xs">
  <Link to="/findpeople">
    <PersonAddAltTwoToneIcon className="text-white text-5xl" />
</Link>
</div>
</div>
);

const Sidebar = () => {
  return (
    <div className="fixed bg-black shadow-lg flex items-center justify-center z-50 pt-4  sm:top-44 sm:left-0 sm:flex-col sm:w-12 sm:h-screen bottom-0 w-full h-16  sm:border-r-2 border-red-500 border-t-2">
      <Profileicon />
      {/* Add more icons here */}
</div>

  );
};

export default Sidebar;
