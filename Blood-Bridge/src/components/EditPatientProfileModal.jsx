import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import '../styles/Modal.css';

function EditPatientProfileModal({ onClose, onSave, patientProfile }) {
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (patientProfile) {
      setName(patientProfile.name || '');
      setPhoneNumber(patientProfile.phoneNumber || '');
      setLocation(patientProfile.location || '');
    }
  }, [patientProfile]);

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          name,
          phoneNumber,
          location,
        });
        onSave(); // This will trigger a re-fetch in the parent component
        onClose();
      } else {
        setError('User not authenticated.');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Profile</h2>
        {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="text"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="location">Location:</label>
          <input
            type="text"
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={loading}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleSave} disabled={loading} className="primary-button">
            {loading ? 'Saving...' : 'Save'}
          </button>
          <button onClick={onClose} disabled={loading} className="secondary-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditPatientProfileModal;
