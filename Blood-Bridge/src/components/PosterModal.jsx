import React from 'react';
import '../styles/Modal.css'; // Reusing the modal styles

function PosterModal({ posterUrl, onClose }) {
  if (!posterUrl) return null; // Don't render if no posterUrl is provided

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>Campaign Poster</h2>
        <img src={posterUrl} alt="Campaign Poster" style={{ maxWidth: '100%', height: 'auto', display: 'block', margin: '0 auto' }} />
      </div>
    </div>
  );
}

export default PosterModal;
