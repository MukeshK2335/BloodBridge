import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import '../styles/Modal.css'; // Assuming you have a Modal.css for basic modal styling

function UploadDetailsModal({ onClose, currentAadhar, currentBloodGroup }) {
  const [aadharDetails, setAadharDetails] = useState(currentAadhar || '');
  const [bloodGroup, setBloodGroup] = useState(currentBloodGroup || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSaveDetails = async () => {
    if (!aadharDetails || !bloodGroup) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, {
          aadharNumber: aadharDetails,
          bloodGroup: bloodGroup,
        });
        setSuccess(true);
        // Optionally, you can call a prop function here to refresh donor profile in parent
        // For now, just close the modal after a short delay
        setTimeout(onClose, 1500); 
      } else {
        setError('User not authenticated.');
      }
    } catch (err) {
      console.error('Error saving details:', err);
      setError('Failed to save details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upload Aadhar & Blood Group Details</h2>
        {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
        {success && <p className="success-message" style={{ color: 'green' }}>Details saved successfully!</p>}
        <div className="form-group">
          <label htmlFor="aadharNumber">Aadhar Card Number:</label>
          <input
            type="text"
            id="aadharNumber"
            value={aadharDetails}
            onChange={(e) => setAadharDetails(e.target.value)}
            placeholder="Enter Aadhar Card Number"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="bloodGroup">Blood Group:</label>
          <select
            id="bloodGroup"
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            disabled={loading}
          >
            <option value="">Select Blood Group</option>
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
        <div className="modal-actions">
          <button onClick={handleSaveDetails} disabled={loading} className="primary-button">
            {loading ? 'Saving...' : 'Save Details'}
          </button>
          <button onClick={onClose} disabled={loading} className="secondary-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default UploadDetailsModal;
