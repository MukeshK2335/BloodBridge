import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import '../styles/Login.css';

function Login() {
  const [userType, setUserType] = useState('donor'); // 'donor' or 'patient'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleUserTypeChange = (type) => {
    setUserType(type);
    setFormData({ email: '', password: '' }); // Reset form on type change
    setErrors({});
  };

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
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.userType === userType) {
          alert(`Logged in successfully as a ${userType}!`);
          // No explicit navigation here. App.jsx will handle redirection based on userRole.
        } else {
          await signOut(auth);
          alert(`You are registered as a ${userData.userType}. Please login from the correct page.`);
        }
      } else {
        await signOut(auth);
        alert('No user data found. Please register first.');
      }

    } catch (error) {
      console.error("Error during login:", error);
      alert(`Login failed: ${error.message}`);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="slider-container">
          <div className={`slider-button ${userType === 'donor' ? 'active' : ''}`} onClick={() => handleUserTypeChange('donor')}>
            Donor
          </div>
          <div className={`slider-button ${userType === 'patient' ? 'active' : ''}`} onClick={() => handleUserTypeChange('patient')}>
            Patient
          </div>
          <div className={`slider-indicator ${userType}`}></div>
        </div>

        <div className="login-form-container">
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <h2>{userType === 'donor' ? 'Donor' : 'Patient'} Login</h2>
            
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
              <p className="register-prompt">
                Don't have an account? <Link to="/register" className="register-link">Register here</Link>
              </p>
              <Link to="/" className="back-link">Back to Home</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
