import React, { useState, useEffect } from 'react';
import '../styles/Modal.css';

function EditCampaignModal({ onClose, onSave, campaign }) {
  const [campaignName, setCampaignName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [posterFile, setPosterFile] = useState(null);
  const [existingPosterUrl, setExistingPosterUrl] = useState('');

  useEffect(() => {
    if (campaign) {
      setCampaignName(campaign.name || '');
      setDate(campaign.date || '');
      setLocation(campaign.location || '');
      setExistingPosterUrl(campaign.posterURL || '');
    }
  }, [campaign]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      campaignId: campaign.id,
      campaignName,
      date,
      location,
      posterFile,
    });
    onClose();
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setPosterFile(e.target.files[0]);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Campaign</h2>
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
            <label htmlFor="poster">New Campaign Poster (Optional):</label>
            <input
              type="file"
              id="poster"
              accept="image/*"
              onChange={handleFileChange}
            />
            {existingPosterUrl && !posterFile && (
              <p>Current poster: <a href={existingPosterUrl} target="_blank" rel="noopener noreferrer">View</a></p>
            )}
          </div>
          <div className="modal-actions">
            <button type="submit" className="primary-button">Save Changes</button>
            <button type="button" className="secondary-button" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCampaignModal;
