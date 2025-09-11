import React, { useState } from 'react';
import { db, auth, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import '../styles/Modal.css';

function UploadDetailsModal({ onClose, currentAadhar, currentBloodGroup }) {
  const [aadharDetails, setAadharDetails] = useState(currentAadhar || '');
  const [bloodGroup, setBloodGroup] = useState(currentBloodGroup || '');
  const [aadharFile, setAadharFile] = useState(null);
  const [bloodGroupFile, setBloodGroupFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleAadharFileChange = (e) => {
    if (e.target.files[0]) {
      setAadharFile(e.target.files[0]);
    }
  };

  const handleBloodGroupFileChange = (e) => {
    if (e.target.files[0]) {
      setBloodGroupFile(e.target.files[0]);
    }
  };

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
        let aadharFileURL = '';
        if (aadharFile) {
          const aadharRef = ref(storage, `user_documents/${user.uid}/aadhar_${aadharFile.name}`);
          await uploadBytes(aadharRef, aadharFile);
          aadharFileURL = await getDownloadURL(aadharRef);
        }

        let bloodGroupFileURL = '';
        if (bloodGroupFile) {
          const bloodGroupRef = ref(storage, `user_documents/${user.uid}/bloodGroup_${bloodGroupFile.name}`);
          await uploadBytes(bloodGroupRef, bloodGroupFile);
          bloodGroupFileURL = await getDownloadURL(bloodGroupRef);
        }

        const userDocRef = doc(db, 'users', user.uid);
        const dataToUpdate = {
          aadharNumber: aadharDetails,
          bloodGroup: bloodGroup,
        };

        if (aadharFileURL) {
          dataToUpdate.aadharDocumentUrl = aadharFileURL;
        }

        if (bloodGroupFileURL) {
          dataToUpdate.bloodGroupDocumentUrl = bloodGroupFileURL;
        }

        await updateDoc(userDocRef, dataToUpdate);
        setSuccess(true);
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
          <label htmlFor="aadharFile">Upload Aadhar Document:</label>
          <input
            type="file"
            id="aadharFile"
            onChange={handleAadharFileChange}
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
        <div className="form-group">
          <label htmlFor="bloodGroupFile">Upload Blood Group Document:</label>
          <input
            type="file"
            id="bloodGroupFile"
            onChange={handleBloodGroupFileChange}
            disabled={loading}
          />
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