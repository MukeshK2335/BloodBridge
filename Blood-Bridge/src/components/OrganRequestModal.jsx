import React, { useState } from 'react';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import '../styles/Modal.css';

function OrganRequestModal({ onClose }) {
  const [organ, setOrgan] = useState('');
  const [hospital, setHospital] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleRequestOrgan = async () => {
    if (!organ || !hospital || !hospitalNumber) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const user = auth.currentUser;
      if (user) {
        await addDoc(collection(db, 'organRequests'), {
          userId: user.uid,
          organ,
          hospital,
          hospitalNumber,
          status: 'pending',
          createdAt: serverTimestamp(),
        });
        setSuccess(true);
        setTimeout(onClose, 1500);
      } else {
        setError('User not authenticated.');
      }
    } catch (err) {
      console.error('Error requesting organ:', err);
      setError('Failed to request organ. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Request an Organ</h2>
        {error && <p className="error-message" style={{ color: 'red' }}>{error}</p>}
        {success && <p className="success-message" style={{ color: 'green' }}>Organ request submitted successfully!</p>}
        <div className="form-group">
          <label htmlFor="organ">Organ:</label>
          <input
            type="text"
            id="organ"
            value={organ}
            onChange={(e) => setOrgan(e.target.value)}
            placeholder="e.g., Kidney, Liver"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="hospital">Hospital:</label>
          <input
            type="text"
            id="hospital"
            value={hospital}
            onChange={(e) => setHospital(e.target.value)}
            placeholder="Enter hospital name"
            disabled={loading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="hospitalNumber">Hospital Contact Number:</label>
          <input
            type="text"
            id="hospitalNumber"
            value={hospitalNumber}
            onChange={(e) => setHospitalNumber(e.target.value)}
            placeholder="Enter hospital contact number"
            disabled={loading}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handleRequestOrgan} disabled={loading} className="primary-button">
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button onClick={onClose} disabled={loading} className="secondary-button">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrganRequestModal;
