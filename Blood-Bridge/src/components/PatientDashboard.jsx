import React, { useState, useEffect, useMemo } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import Sidebar from './Sidebar'; // Import Sidebar
import '../styles/Dashboard.css'; // Reusing dashboard styles
import profileImage from '../assets/image.png'; // Assuming you have a default profile image
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import BloodHeatMap from './BloodHeatMap'; // Import BloodHeatMap

const mapContainerStyle = {
  width: '100%',
  height: '200px', // Smaller map for display in table
  marginTop: '10px',
  marginBottom: '10px',
};

const defaultCenter = {
  lat: 34.052235,
  lng: -118.243683,
}; // Default to Los Angeles if location not found

function PatientDashboard() {
  const [patientProfile, setPatientProfile] = useState(null);
  const [pendingRequests, setPendingRequests] = useState([]); // Renamed from myRequests
  const [acceptedRequests, setAcceptedRequests] = useState([]); // New state for accepted requests
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedView, setSelectedView] = useState('profile'); // New state for selected view

  const navigate = useNavigate(); // Initialize useNavigate

  const [requestForm, setRequestForm] = useState({
    bloodGroup: '',
    quantity: '',
    hospital: '',
    contact: '',
  });
  const [formErrors, setFormErrors] = useState({});

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Fetch Patient Profile
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setPatientProfile(userDocSnap.data());
          }

          // Fetch Patient's Own Requests
          const q = query(collection(db, 'requests'), where('patientId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const allRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Separate requests into pending and accepted
          const pending = allRequests.filter(req => req.status !== 'accepted');
          const accepted = allRequests.filter(req => req.status === 'accepted');

          setPendingRequests(pending);
          setAcceptedRequests(accepted);

        } catch (err) {
          console.error("Error fetching data:", err);
          setError('Failed to fetch data.');
        } finally {
          setLoading(false);
        }
      }
    };

    fetchData();
  }, [user]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm({
      ...requestForm,
      [name]: value,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!requestForm.bloodGroup) newErrors.bloodGroup = 'Blood Group is required';
    if (!requestForm.quantity) newErrors.quantity = 'Quantity is required';
    if (!requestForm.hospital.trim()) newErrors.hospital = 'Hospital Name is required';
    if (!requestForm.contact.trim()) newErrors.contact = 'Contact Info is required';
    return newErrors;
  };

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setFormErrors(validationErrors);
      return;
    }

    if (!user) {
      alert('You must be logged in to submit a request.');
      return;
    }

    try {
      await addDoc(collection(db, 'requests'), {
        ...requestForm,
        patientId: user.uid,
        patientName: patientProfile ? patientProfile.name : 'Unknown', // Use patient's name from profile
        timestamp: new Date(),
        status: 'pending', // Set initial status to pending
      });
      alert('Blood request submitted successfully!');
      setRequestForm({
        bloodGroup: '',
        quantity: '',
        hospital: '',
        contact: '',
      });
      setFormErrors({});
      // Re-fetch requests to update the list
      const q = query(collection(db, 'requests'), where('patientId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const allRequests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const pending = allRequests.filter(req => req.status !== 'accepted');
      const accepted = allRequests.filter(req => req.status === 'accepted');
      setPendingRequests(pending);
      setAcceptedRequests(accepted);

    } catch (err) {
      console.error("Error submitting request:", err);
      alert(`Failed to submit request: ${err.message}`);
    }
  };

  const handleSelectView = (view) => {
    if (view === 'donor-view') {
      navigate('/donor-dashboard'); // Navigate to donor dashboard
    } else {
      setSelectedView(view);
    }
  };

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCykGquhe3x8hiwvFCGS6wXIDA-DQQFTH8', // Your Google Maps API Key
    libraries: ['places'], // Required for Geocoding
  });

  const [donorLocationsMap, setDonorLocationsMap] = useState({}); // To store geocoded locations

  useEffect(() => {
    const geocodeLocations = async () => {
      if (isLoaded && acceptedRequests.length > 0) {
        const newDonorLocationsMap = {};
        for (const request of acceptedRequests) {
          if (request.donorLocation && !donorLocationsMap[request.id]) {
            try {
              const response = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(request.donorLocation)}&key=AIzaSyCykGquhe3x8hiwvFCGS6wXIDA-DQQFTH8`
              );
              const data = await response.json();

              if (data.results && data.results.length > 0) {
                const { lat, lng } = data.results[0].geometry.location;
                newDonorLocationsMap[request.id] = { lat, lng };
              } else {
                console.warn(`Could not find location for: ${request.donorLocation}`);
                newDonorLocationsMap[request.id] = defaultCenter; // Fallback
              }
            } catch (err) {
              console.error("Error geocoding address:", err);
              newDonorLocationsMap[request.id] = defaultCenter; // Fallback
            }
          }
        }
        setDonorLocationsMap(prev => ({ ...prev, ...newDonorLocationsMap }));
      }
    };

    geocodeLocations();
  }, [acceptedRequests, isLoaded]);

  const handleMarkAsDone = async (requestId, donorId, patientId, hospital) => {
    if (!user) {
      alert('You must be logged in to mark a request as done.');
      return;
    }
  
    try {
      // 1. Update request status to 'completed'
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        status: 'completed',
      });
  
      // 2. Add entry to donor's donation history
      const donationDocRef = await addDoc(collection(db, 'donations'), {
        donorId: donorId,
        patientId: patientId,
        date: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        hospital: hospital,
        requestId: requestId, // Link to the original request
      });
      console.log("Donation record added with ID:", donationDocRef.id);
  
      // 3. Update local state to remove the marked request from acceptedRequests
      setAcceptedRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));
  
      alert('Request marked as done and donor history updated!');
    } catch (error) {
      console.error("Error marking request as done:", error);
      alert('Failed to mark request as done. Please try again.');
    }
  };

  if (loading || !isLoaded) {
    return <div className="dashboard-container">Loading dashboard and map...</div>;
  }

  if (error || loadError) {
    return <div className="dashboard-container">Error: {error || loadError.message}</div>;
  }

  if (!user) {
    return <div className="dashboard-container">Please log in to view the dashboard.</div>; // Or redirect to login
  }

  const patientMenuItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'requests', label: 'My Requests' }, // Added Donor View
    { id: 'heatmap', label: 'Detailed Heat Map' },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar onSelect={handleSelectView} selectedView={selectedView} menuItems={patientMenuItems} />
      <div className="donor-dashboard-content"> {/* Reusing the content styling */} 
        {selectedView === 'profile' && (
          <div className="profile-section">
            {patientProfile ? (
              <div className="profile-card">
                <div className="profile-avatar">
                  <img src={profileImage} alt="Profile" />
                </div>
                <div className="profile-details">
                  <h3>{patientProfile.name}</h3>
                  <p>Email: {patientProfile.email}</p>
                  <p>Phone: {patientProfile.phoneNumber}</p>
                  <p>Location: {patientProfile.location}</p>
                </div>
              </div>
            ) : (
              <p>No profile data available.</p>
            )}
          </div>
        )}

        {selectedView === 'requests' && (
          <>
            <div className="requests-section">
              <h2>Submit a Blood Request</h2>
              <form onSubmit={handleSubmitRequest} noValidate>
                <div className="form-group">
                  <label htmlFor="bloodGroup">Blood Group Needed</label>
                  <select id="bloodGroup" name="bloodGroup" value={requestForm.bloodGroup} onChange={handleFormChange} className={formErrors.bloodGroup ? 'error' : ''}>
                    <option value="">Select Blood Group</option>
                    {bloodGroups.map(group => <option key={group} value={group}>{group}</option>)}
                  </select>
                  {formErrors.bloodGroup && <span className="error-message">{formErrors.bloodGroup}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="quantity">Quantity (units)</label>
                  <input type="text" id="quantity" name="quantity" value={requestForm.quantity} onChange={handleFormChange} className={formErrors.quantity ? 'error' : ''} />
                  {formErrors.quantity && <span className="error-message">{formErrors.quantity}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="hospital">Hospital Name</label>
                  <input type="text" id="hospital" name="hospital" value={requestForm.hospital} onChange={handleFormChange} className={formErrors.hospital ? 'error' : ''} />
                  {formErrors.hospital && <span className="error-message">{formErrors.hospital}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="contact">Contact Information (Email/Phone)</label>
                  <input type="text" id="contact" name="contact" value={requestForm.contact} onChange={handleFormChange} className={formErrors.contact ? 'error' : ''} />
                  {formErrors.contact && <span className="error-message">{formErrors.contact}</span>}
                </div>

                <button type="submit" className="login-submit-btn">Submit Request</button>
              </form>
            </div>

            <div className="requests-section" style={{ marginTop: '30px' }}>
              <h2>Your Submitted Requests</h2>
              {pendingRequests.length > 0 ? (
                <table className="donation-history-table"> {/* Reusing table style */}
                  <thead>
                    <tr>
                      <th>Blood Group</th>
                      <th>Quantity</th>
                      <th>Hospital</th>
                      <th>Contact</th>
                      <th>Date Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.bloodGroup}</td>
                        <td>{request.quantity}</td>
                        <td>{request.hospital}</td>
                        <td>{request.contact}</td>
                        <td>{request.timestamp ? new Date(request.timestamp.toDate()).toLocaleString() : 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>You have not submitted any blood requests yet.</p>
              )}
            </div>

            <div className="requests-section" style={{ marginTop: '30px' }}>
              <h2>Accepted Requests</h2>
              {acceptedRequests.length > 0 ? (
                <table className="donation-history-table"> 
                  <thead>
                    <tr>
                      <th>Blood Group</th>
                      <th>Quantity</th>
                      <th>Hospital</th>
                      <th>Donor Name</th>
                      <th>Donor Blood Group</th>
                      <th>Donor Contact</th>
                      <th>Location</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acceptedRequests.map((request) => (
                      <tr key={request.id}>
                        <td>{request.bloodGroup}</td>
                        <td>{request.quantity}</td>
                        <td>{request.hospital}</td>
                        <td>{request.donorName || 'N/A'}</td>
                        <td>{request.donorBloodGroup || 'N/A'}</td>
                        <td>{request.donorContact || 'N/A'}</td>
                        <td>
                          {request.donorLocation && donorLocationsMap[request.id] ? (
                            <GoogleMap
                              mapContainerStyle={mapContainerStyle}
                              center={donorLocationsMap[request.id]}
                              zoom={10}
                            >
                              <Marker position={donorLocationsMap[request.id]} />
                            </GoogleMap>
                          ) : (
                            request.donorLocation || 'N/A'
                          )}
                        </td>
                        <td>
                          <button
                            className="primary-button"
                            onClick={() => handleMarkAsDone(request.id, request.donorId, user.uid, request.hospital)}
                          >
                            Mark as Done
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No accepted blood requests yet.</p>
              )}
            </div>
          </>
        )}
        {selectedView === 'heatmap' && (
          <div className="heatmap-section">
            <BloodHeatMap />
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;
