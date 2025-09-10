import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import './App.css'
import Register from './components/Register'
import Login from './components/Login'
import LandingPage from './components/LandingPage'
import DonorDashboard from './components/DonorDashboard'
import PatientDashboard from './components/PatientDashboard'
import AdminLogin from './components/AdminLogin'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Check if it's the hardcoded admin email
        const TEMP_ADMIN_EMAIL = 'admin@linkeredge.com'; // Must match the one in AdminLogin.jsx
        if (currentUser.email === TEMP_ADMIN_EMAIL) {
          setUserRole('admin'); // Assume admin role for hardcoded admin
        } else {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setUserRole(userDocSnap.data().userType);
          } else {
            console.warn(`User profile for UID: ${currentUser.uid} not found in Firestore. Please ensure the user has a corresponding document in the 'users' collection.`);
            // Optionally, you could force a logout here if a profile is mandatory for app usage
            // signOut(auth);
            // navigate('/register');
            setUserRole(null); // Or a default role
          }
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user) {
        // Only redirect non-admin users based on role
        if (userRole === 'donor') {
          navigate('/donor-dashboard');
        } else if (userRole === 'patient') {
          navigate('/patient-dashboard');
        } else if (userRole !== 'admin') { // If user is logged in but not admin, donor, or patient
          navigate('/login');
        }
        // Admin redirection is handled by AdminLogin.jsx
      }
    }
  }, [loading, user, userRole, navigate]);

  if (loading) {
    return <div className="app-loading">Loading application...</div>;
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<LandingPage />} />

        {/* TEMPORARY: Admin Dashboard accessible without authentication for testing */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        {user && userRole === 'donor' && (
          <Route path="/donor-dashboard" element={<DonorDashboard />} />
        )}
        {user && userRole === 'patient' && (
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
        )}

        {(!user || (user && !userRole)) && (
          <Route path="*" element={<Navigate to="/login" replace />} />
        )}

      </Routes>
    </div>
  )
}

export default App
