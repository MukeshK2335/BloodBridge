import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './Sidebar';
import '../styles/Dashboard.css';
import profileImage from '../assets/image.png'; // Assuming you have a default profile image
import { auth, db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { GoogleMap, useLoadScript, Marker } from '@react-google-maps/api';
import PosterModal from './PosterModal'; // Import PosterModal

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

function DonorDashboard() {
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

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCykGquhe3x8hiwvFCGS6wXIDA-DQQFTH8', // Your Google Maps API Key. Consider using environment variables for security (e.env.REACT_APP_GOOGLE_MAPS_API_KEY)
    libraries: ['places'], // Required for Geocoding
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
          setDonationHistory(history);

          // Fetch Patient Requests (assuming a top-level 'requests' collection)
          const requestsSnapshot = await getDocs(collection(db, 'requests'));
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
              <div className="campaigns-list">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="campaign-card">
                    {campaign.posterURL && (
                      <img src={campaign.posterURL} alt={campaign.name} className="campaign-poster" />
                    )}
                    <h3>{campaign.name}</h3>
                    <p><strong>Date:</strong> {campaign.date}</p>
                    <p><strong>Location:</strong> {campaign.location}</p>
                    {campaign.description && <p>{campaign.description}</p>}
                    {campaign.posterURL && (
                      <button 
                        className="primary-button"
                        onClick={() => handleViewPoster(campaign.posterURL)}
                        style={{ marginTop: '15px', alignSelf: 'flex-start' }} /* Added inline style for spacing */
                      >
                        View Poster
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No blood donation campaigns available at the moment.</p>
            )}
          </div>
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
