import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import '../styles/Sidebar.css';

function Sidebar({ onSelect, selectedView, menuItems }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // Redirect to login page after logout
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  return (
    <div className="sidebar-container">
      <div className="sidebar-header">
        <h3>Dashboard Menu</h3>
      </div>
      <ul className="sidebar-menu">
        {menuItems.map(item => (
          <li 
            key={item.id}
            className={selectedView === item.id ? 'active' : ''}
            onClick={() => onSelect(item.id)}
          >
            {item.label}
          </li>
        ))}
        <li onClick={handleLogout} className="logout-button">
          Logout
        </li>
      </ul>
    </div>
  );
}

export default Sidebar;
