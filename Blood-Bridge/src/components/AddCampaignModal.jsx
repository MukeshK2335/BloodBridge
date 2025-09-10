import React, { useState } from 'react';
import '../styles/Modal.css'; // We'll create this CSS file

function AddCampaignModal({ onClose, onSave }) {
  const [campaignName, setCampaignName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [posterFile, setPosterFile] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ campaignName, date, location, posterFile });
    onClose(); // Close modal after saving
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add New Campaign</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="campaignName">Campaign Title:</label>
            <input
              type="text"
              id="campaignName"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date:</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="location">Location:</label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="poster">Campaign Poster (Optional):</label>
            <input
              type="file"
              id="poster"
              accept="image/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="primary-button">Add Campaign</button>
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddCampaignModal;
