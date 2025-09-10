import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import Sidebar from './Sidebar'; // Import Sidebar
import '../styles/Dashboard.css'; // Reusing dashboard styles
import profileImage from '../assets/image.png'; // Assuming you have a default profile image

function PatientDashboard() {
  const [patientProfile, setPatientProfile] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [selectedView, setSelectedView] = useState('profile'); // New state for selected view

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
          const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMyRequests(requests);

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
      const requests = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMyRequests(requests);

    } catch (err) {
      console.error("Error submitting request:", err);
      alert(`Failed to submit request: ${err.message}`);
    }
  };

  const handleSelectView = (view) => {
    setSelectedView(view);
  };

  if (loading) {
    return <div className="dashboard-container">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-container">Error: {error}</div>;
  }

  if (!user) {
    return <div className="dashboard-container">Please log in to view the dashboard.</div>; // Or redirect to login
  }

  const patientMenuItems = [
    { id: 'profile', label: 'Profile' },
    { id: 'requests', label: 'My Requests' },
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
              {myRequests.length > 0 ? (
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
                    {myRequests.map((request) => (
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
          </>
        )}
      </div>
    </div>
  );
}

export default PatientDashboard;
