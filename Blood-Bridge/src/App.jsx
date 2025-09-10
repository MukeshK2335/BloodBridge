import { Routes, Route, useNavigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

import './App.css'
import Register from './components/Register'
import Login from '././components/Login'
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
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserRole(userDocSnap.data().userType);
        } else {
          // Handle case where user exists in auth but not in Firestore (e.g., new registration)
          console.warn("User profile not found in Firestore.");
          setUserRole(null); // Or a default role
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
        // User is logged in, redirect based on role
        if (userRole === 'admin') {
          navigate('/admin-dashboard');
        } else if (userRole === 'donor') {
          navigate('/donor-dashboard');
        } else if (userRole === 'patient') {
          navigate('/patient-dashboard');
        } else {
          // If user has no specific role or an unknown role, redirect to login
          navigate('/login');
        }
      } else {
        // No user logged in, allow access to public routes
        // If current path is a dashboard, redirect to login
        const publicPaths = ['/', '/login', '/register', '/admin-login'];
        if (!publicPaths.includes(window.location.pathname)) {
          navigate('/login');
        }
      }
    }
  }, [loading, user, userRole, navigate]);

  if (loading) {
    return <div className="app-loading">Loading application...</div>; // Simple loading indicator
  }

  return (
    <div className="app-container">
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/" element={<LandingPage />} />

        {/* Protected Routes */}
        {user && userRole === 'admin' && (
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        )}
        {user && userRole === 'donor' && (
          <Route path="/donor-dashboard" element={<DonorDashboard />} />
        )}
        {user && userRole === 'patient' && (
          <Route path="/patient-dashboard" element={<PatientDashboard />} />
        )}

        {/* Fallback for unauthenticated or unauthorized access to protected routes */}
        {/* This route will catch any path not matched by the above and redirect to login if user is not authenticated */}
        {!user && <Route path="*" element={<Login />} />}
        {user && !userRole && <Route path="*" element={<Login />} />}

      </Routes>
    </div>
  )
}

export default App
