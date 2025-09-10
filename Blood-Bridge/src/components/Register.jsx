import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import '../styles/Register.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    age: '',
    bloodGroup: '',
    location: '',
    userType: 'donor', // Default to donor
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Phone number must be 10 digits';
    }
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 18) {
      newErrors.age = 'You must be at least 18 years old';
    }
    if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.userType) newErrors.userType = 'Please select a user type';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      const { email, password, ...userData } = formData;
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        ...userData,
        uid: user.uid,
        email: user.email
      });

      alert('Registration successful!');
      setFormData({
        name: '',
        phoneNumber: '',
        age: '',
        bloodGroup: '',
        location: '',
        userType: 'donor',
        email: '',
        password: '',
        confirmPassword: ''
      });
      setErrors({});

    } catch (error) {
      console.error("Error during registration:", error);
      alert(`Registration failed: ${error.message}`);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="register-header">
          <h2>Register</h2>
          <p>Join our community as a donor or patient</p>
        </div>
        
        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {/* Form fields remain the same, just add email */}
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className={errors.name ? 'error' : ''} />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className={errors.email ? 'error' : ''} />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input type="tel" id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className={errors.phoneNumber ? 'error' : ''} />
            {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="age">Age</label>
            <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} className={errors.age ? 'error' : ''} />
            {errors.age && <span className="error-message">{errors.age}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="bloodGroup">Blood Group</label>
            <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className={errors.bloodGroup ? 'error' : ''}>
              <option value="">Select Blood Group</option>
              {bloodGroups.map(group => <option key={group} value={group}>{group}</option>)}
            </select>
            {errors.bloodGroup && <span className="error-message">{errors.bloodGroup}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="location">Location</label>
            <input type="text" id="location" name="location" value={formData.location} onChange={handleChange} className={errors.location ? 'error' : ''} />
            {errors.location && <span className="error-message">{errors.location}</span>}
          </div>
          
          <div className="form-group">
            <label>I am registering as a:</label>
            <div className="radio-group">
              <div className="radio-option">
                <input type="radio" id="donor" name="userType" value="donor" checked={formData.userType === 'donor'} onChange={handleChange} />
                <label htmlFor="donor">Donor</label>
              </div>
              <div className="radio-option">
                <input type="radio" id="patient" name="userType" value="patient" checked={formData.userType === 'patient'} onChange={handleChange} />
                <label htmlFor="patient">Patient</label>
              </div>
            </div>
            {errors.userType && <span className="error-message">{errors.userType}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className={errors.password ? 'error' : ''} />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Re-Enter Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={errors.confirmPassword ? 'error' : ''} />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>
          
          <div className="form-actions">
            <button type="submit" className="register-submit-btn">Register</button>
            <p className="login-prompt">Already registered? <Link to="/login" className="login-link">Login here</Link></p>
            <Link to="/" className="back-link">Back to Home</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;