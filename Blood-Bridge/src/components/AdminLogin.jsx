import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/Login.css';

function AdminLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);

    // If there are validation errors, stop the submission
    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    try {
      try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // If signInWithEmailAndPassword is successful, it means email and password are correct.
      // Directly navigate to admin dashboard.
      alert('Admin Login successful!');
      navigate('/admin-dashboard');

    } catch (error) {
      console.error("Error during admin login:", error);
      alert(`Admin Login failed: ${error.message}`);
    }
    } catch (error) {
      // 5. Handle and display any errors (e.g., wrong password, user not found)
      console.error('Login error:', error.message);
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-form-container">
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <h2>Admin Login</h2>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>
            
            <div className="form-actions">
              <button type="submit" className="login-submit-btn">Login</button>
              <Link to="/" className="back-link">Back to Home</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;