import React from 'react';
import { Link } from 'react-router-dom';
import Profile from './profile'; // Assuming you have a Profile component
import AccountCircleTwoToneIcon from '@mui/icons-material/AccountCircleTwoTone';
const Profileicon = () => (
    <Link to="/profile" className="flex flex-col items-center mb-4">
  <div className="flex flex-col items-center p-3 text-white text-xs">
  <AccountCircleTwoToneIcon className="text-white text-5xl" />
</div>

</Link>
);

const Sidebar = () => {
  return (
    <div className="w-12 h-screen fixed  top-32 left-0 bg-black shadow-lg flex flex-col items-center pt-4 mr-48">
      <Profileicon />
      {/* Add more sidebar components like icons below */}
    </div>
  );
};

export default Sidebar;
