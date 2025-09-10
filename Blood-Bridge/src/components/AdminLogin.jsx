import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import '../styles/Login.css'; // Reusing login styles

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
    n}
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      // For admin login, we'll assume a specific admin email/password or a role check
      // For now, let's just sign in and then you'd typically check a user's role in Firestore
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      
      // In a real application, you would fetch the user's role from Firestore
      // and only navigate to admin dashboard if they have admin privileges.
      // For this example, we'll assume anyone logging in via this form is an admin.
      alert('Admin Login successful!');
      navigate('/admin-dashboard'); // Navigate to a new admin dashboard route

    } catch (error) {
      console.error("Error during admin login:", error);
      alert(`Admin Login failed: ${error.message}`);
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
