import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './Sidebar';
import '../styles/Dashboard.css';
import profileImage from '../assets/image.png'; // Assuming you have a default profile image
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api'; // Added InfoWindow
import PosterModal from './PosterModal'; // Import PosterModal
import UploadDetailsModal from './UploadDetailsModal';


const mapContainerStyle = {
  width: '100%',
  height: '400px',
  marginTop: '20px',
};

const defaultCenter = {
  lat: 34.052235,
  lng: -118.243683,
}; // Default to Los Angeles if location not found

const BLOOD_COMPATIBILITY = {
  "A+": { "can_receive_from": ["A+", "A-", "O+", "O-"], "can_donate_to": ["A+", "AB+"] },
  "A-": { "can_receive_from": ["A-", "O-"], "can_donate_to": ["A+", "A-", "AB+", "AB-"] },
  "B+": { "can_receive_from": ["B+", "B-", "O+", "O-"], "can_donate_to": ["B+", "AB+"] },
  "B-": { "can_receive_from": ["B-", "O-"], "can_donate_to": ["B+", "B-", "AB+", "AB-"] },
  "AB+": { "can_receive_from": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"], "can_donate_to": ["AB+"] },
  "AB-": { "can_receive_from": ["A-", "B-", "AB-", "O-"], "can_donate_to": ["AB+", "AB-"] },
  "O+": { "can_receive_from": ["O+", "O-"], "can_donate_to": ["O+", "A+", "B+", "AB+"] },
  "O-": { "can_receive_from": ["O-"], "can_donate_to": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] }
};

const libraries = ['places'];

function DonorDashboard() {
  console.log("Forcing a re-render of DonorDashboard");
  const [selectedView, setSelectedView] = useState('profile');
  const [donorProfile, setDonorProfile] = useState(null);
  const [donationHistory, setDonationHistory] = useState([]);
  const [patientRequests, setPatientRequests] = useState([]);
  const [campaigns, setCampaigns] = useState([]); // New state for campaigns
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapError, setMapError] = useState(null);
  const [showPosterModal, setShowPosterModal] = useState(false); // State for poster modal
  const [selectedPosterUrl, setSelectedPosterUrl] = useState(''); // State for selected poster URL
  const [nearbyBloodNeeds, setNearbyBloodNeeds] = useState([]); // New state for nearby blood needs
  const [selectedMarker, setSelectedMarker] = useState(null); // New state for selected marker
  

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCykGquhe3x8hiwvFCGS6wXIDA-DQQFTH8', // Your Google Maps API Key. Consider using environment variables for security (e.env.REACT_APP_GOOGLE_MAPS_API_KEY)
    libraries, // Required for Geocoding
  });

  const filteredPatientRequests = useMemo(() => {
    if (!donorProfile || !donorProfile.bloodGroup || !patientRequests.length) {
      return [];
    }

    const donorBloodGroup = donorProfile.bloodGroup;
    const canDonateTo = BLOOD_COMPATIBILITY[donorBloodGroup]?.can_donate_to || [];

    return patientRequests.filter(request => 
      canDonateTo.includes(request.bloodGroup)
    );
  }, [donorProfile, patientRequests]);

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
          // Fetch Donor Profile
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setDonorProfile(userDocSnap.data());
          }

          // Fetch Donation History (assuming a 'donations' collection where each donation document has a 'donorId' field)
          const donationsQuery = query(collection(db, 'donations'), where('donorId', '==', user.uid));
          const donationSnapshot = await getDocs(donationsQuery);
          const history = donationSnapshot.docs.map(doc => doc.data());
          console.log("Fetched donation history:", history);
          setDonationHistory(history);

          // Fetch Patient Requests (assuming a top-level 'requests' collection)
          const requestsQuery = query(collection(db, 'requests'), where('status', '==', 'pending'));
          const requestsSnapshot = await getDocs(requestsQuery);
          const requests = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setPatientRequests(requests);

          // Fetch Campaigns
          const campaignsCollection = collection(db, 'campaigns');
          const campaignsSnapshot = await getDocs(campaignsCollection);
          const campaignsList = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setCampaigns(campaignsList);

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

  useEffect(() => {
    const geocodeAddress = async () => {
      if (donorProfile && donorProfile.location && isLoaded) {
        try {
          console.log("Geocoding address:", donorProfile.location);
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(donorProfile.location)}&key=AIzaSyCykGquhe3x8hiwvFCGS6wXIDA-DQQFTH8`
          );
          const data = await response.json();

          if (data.results && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            setMapCenter({ lat, lng });
          } else {
            setMapError('Could not find location for geocoding.');
            setMapCenter(defaultCenter); // Fallback to default center
          }
        } catch (err) {
          console.error("Error geocoding address:", err);
          setMapError('Failed to geocode address.');
          setMapCenter(defaultCenter); // Fallback to default center
        }
      }
    };

    geocodeAddress();
  }, [donorProfile, isLoaded]);

  const handleSelectView = (view) => {
    setSelectedView(view);
  };

  const handleViewPoster = (posterUrl) => {
    setSelectedPosterUrl(posterUrl);
    setShowPosterModal(true);
  };

  const handleAcceptRequest = async (requestId, patientId) => {
    if (!user || !donorProfile) {
      console.error("User not logged in or donor profile not loaded.");
      return;
    }

    try {
      const requestRef = doc(db, 'requests', requestId);
      await updateDoc(requestRef, {
        status: 'accepted',
        donorId: user.uid,
        donorName: donorProfile.name,
        donorBloodGroup: donorProfile.bloodGroup,
        donorContact: donorProfile.phoneNumber, // Assuming phoneNumber is available in donorProfile
        donorLocation: donorProfile.location, // Store donor's location
      });

      // Optionally, remove the accepted request from the local state
      setPatientRequests(prevRequests => prevRequests.filter(req => req.id !== requestId));

      alert('Request accepted successfully! Patient will be notified.');
    } catch (error) {
      console.error("Error accepting request:", error);
      alert('Failed to accept request. Please try again.');
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

  const donorMenuItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'requests', label: 'Requests' },
    { id: 'campaign', label: 'Campaign' },
    { id: 'uploadDetails', label: 'Upload Details' },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar onSelect={handleSelectView} selectedView={selectedView} menuItems={donorMenuItems} />
      <div className="donor-dashboard-content">
        {selectedView === 'profile' && (
          <div className="profile-section">
            <h2>Donor Profile</h2>
            {donorProfile ? (
              <div className="profile-card">
                <div className="profile-avatar">
                  <img src={profileImage} alt="Profile" />
                </div>
                <div className="profile-details">
                  <h3>{donorProfile.name}</h3>
                  <p>Blood Group: <strong>{donorProfile.bloodGroup}</strong></p>
                  <p>Email: {donorProfile.email}</p>
                  <p>Phone: {donorProfile.phoneNumber}</p>
                  <p>Last Donation: {donorProfile.lastDonation || 'N/A'}</p>
                  <p>Address: {donorProfile.location}</p>
                </div>
              </div>
            ) : (
              <p>No profile data available.</p>
            )}

            <div className="donation-history-section">
              <h3>Blood Donation History</h3>
              {donationHistory.length > 0 ? (
                <table className="donation-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Hospital Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donationHistory.map((donation, index) => (
                      <tr key={index}>
                        <td>{donation.date}</td>
                        <td>{donation.hospital}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p>No donation history available.</p>
              )}
            </div>

            {mapError && <div style={{ color: 'red' }}>Map Error: {mapError}</div>}
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={10}
              >
                <Marker position={mapCenter} />
              </GoogleMap>
            ) : (
              <div>Loading Map...</div>
            )}
          </div>
        )}
        {selectedView === 'requests' && (
          <div className="requests-section">
            <h2>Blood Requests from Patients</h2>
            {filteredPatientRequests.length > 0 ? (
              <table className="donation-history-table"> 
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Blood Group</th>
                    <th>Quantity</th>
                    <th>Hospital</th>
                    <th>Contact</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatientRequests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.patientName}</td>
                      <td>{request.bloodGroup}</td>
                      <td>{request.quantity}</td>
                      <td>{request.hospital}</td>
                      <td>{request.contact}</td>
                      <td>
                        <button 
                          className="primary-button"
                          onClick={() => handleAcceptRequest(request.id, request.patientId)}
                        >
                          Accept
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No blood requests available at the moment that match your blood group compatibility.</p>
            )}
          </div>
        )}

        {selectedView === 'campaign' && (
          <div className="campaign-section">
            <h2>Blood Donation Campaigns</h2>
            {campaigns.length > 0 ? (
              <table className="campaigns-table"> {/* Using a new class name for campaigns table */}
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Poster</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td>{campaign.date}</td>
                      <td>{campaign.location}</td>
                      <td>
                        <button
                          className="primary-button"
                          onClick={() => handleViewPoster(campaign.posterURL)}
                        >
                          View Poster
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No blood donation campaigns available at the moment.</p>
            )}
          </div>
        )}
      {selectedView === 'uploadDetails' && (
          <UploadDetailsModal
            onClose={() => setSelectedView('profile')} // Go back to profile after closing
            currentAadhar={donorProfile?.aadharNumber}
            currentBloodGroup={donorProfile?.bloodGroup}
          />
        )}
      </div>
      {showPosterModal && (
        <PosterModal
          posterUrl={selectedPosterUrl}
          onClose={() => setShowPosterModal(false)}
        />
      )}
    </div>
  );
}

export default DonorDashboard;