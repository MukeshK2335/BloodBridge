import React, { useEffect, useState } from 'react';
import { auth, db, storage } from '../firebase';
import { collection, getDocs, query, where, addDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AddCampaignModal from './AddCampaignModal';
import EditCampaignModal from './EditCampaignModal';
import '../styles/Dashboard.css';

function AdminDashboard() {
  const [donors, setDonors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [organRequests, setOrganRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedView, setSelectedView] = useState('donors');
  const [showAddCampaignModal, setShowAddCampaignModal] = useState(false);
  const [showEditCampaignModal, setShowEditCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const navigate = useNavigate();

  // Filter states for donors
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // In a real app, you'd verify admin role here using custom claims
        fetchData();
      } else {
        navigate('/admin-login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const fetchData = async () => {
    try {
      const usersCollection = collection(db, 'users');
      const donorsQuery = query(usersCollection, where('userType', '==', 'donor'));
      const donorsSnapshot = await getDocs(donorsQuery);
      const donorsList = donorsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDonors(donorsList);

      const requestsCollection = collection(db, 'requests');
      const requestsSnapshot = await getDocs(requestsCollection);
      const requestsList = requestsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRequests(requestsList);

      const campaignsCollection = collection(db, 'campaigns');
      const campaignsSnapshot = await getDocs(campaignsCollection);
      const campaignsList = campaignsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCampaigns(campaignsList);

      const organRequestsCollection = collection(db, 'organRequests');
      const organRequestsSnapshot = await getDocs(organRequestsCollection);
      const organRequestsList = await Promise.all(organRequestsSnapshot.docs.map(async (docItem) => {
        const data = docItem.data();
        console.log("Organ Request Data:", data); // Add this line for debugging
        const userDocRef = doc(db, 'users', data.userId);
        const userDocSnap = await getDoc(userDocRef);
        const userName = userDocSnap.exists() ? userDocSnap.data().name : 'Unknown User';
        return { id: docItem.id, userName, ...data };
      }));
      setOrganRequests(organRequestsList);

    } catch (err) {
      console.error("Error fetching admin data:", err);
      setError('Failed to fetch admin data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectView = (view) => {
    setSelectedView(view);
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'filterName') setFilterName(value);
    else if (name === 'filterEmail') setFilterEmail(value);
    else if (name === 'filterBloodGroup') setFilterBloodGroup(value);
    else if (name === 'filterLocation') setFilterLocation(value);
  };

  const filteredDonors = donors.filter(donor => {
    return (
      donor.name.toLowerCase().includes(filterName.toLowerCase()) &&
      donor.email.toLowerCase().includes(filterEmail.toLowerCase()) &&
      (filterBloodGroup === '' || donor.bloodGroup === filterBloodGroup) &&
      donor.location.toLowerCase().includes(filterLocation.toLowerCase())
    );
  });

  const handleApproveRequest = async (requestId) => {
    // ... (existing code)
  };

  const handleDeleteRequest = async (requestId) => {
    // ... (existing code)
  };

  const handleAddCampaign = async ({ campaignName, date, location, posterFile }) => {
    try {
      let posterURL = '';
      if (posterFile) {
        const storageRef = ref(storage, `campaign_posters/${posterFile.name}`);
        await uploadBytes(storageRef, posterFile);
        posterURL = await getDownloadURL(storageRef);
      }

      await addDoc(collection(db, 'campaigns'), {
        name: campaignName,
        date: date,
        location: location,
        posterURL: posterURL,
        createdAt: new Date(),
      });
      fetchData(); // Refresh campaigns list
      alert('Campaign added successfully!');
    } catch (error) {
      console.error('Error adding campaign:', error);
      alert('Failed to add campaign.');
    }
  };

  const handleEditCampaignClick = (campaign) => {
    setSelectedCampaign(campaign);
    setShowEditCampaignModal(true);
  };

  const handleUpdateCampaign = async ({ campaignId, campaignName, date, location, posterFile }) => {
    try {
      let posterURL = selectedCampaign.posterURL;
      if (posterFile) {
        const storageRef = ref(storage, `campaign_posters/${posterFile.name}`);
        await uploadBytes(storageRef, posterFile);
        posterURL = await getDownloadURL(storageRef);
      }

      const campaignRef = doc(db, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        name: campaignName,
        date: date,
        location: location,
        posterURL: posterURL,
      });

      fetchData();
      alert('Campaign updated successfully!');
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Failed to update campaign.');
    }
  };

  if (loading) {
    return <div className="dashboard-container">Loading Admin Dashboard...</div>;
  }

  if (error) {
    return <div className="dashboard-container">Error: {error}</div>;
  }

  const adminMenuItems = [
    { id: 'donors', label: 'Donors' },
    { id: 'requests', label: 'Requests' },
    { id: 'campaigns', label: 'Campaigns' },
    { id: 'organ-requests', label: 'Organ Requests' },
  ];

  return (
    <div className="dashboard-container">
      <Sidebar onSelect={handleSelectView} selectedView={selectedView} menuItems={adminMenuItems} />
      <div className="donor-dashboard-content">

        {selectedView === 'donors' && (
          <div className="profile-section">
            <h2>All Donors</h2>
            {donors.length > 0 ? (
              <table className="donation-history-table">
                <thead>
                  <tr>
                    <th>
                      Name
                      <input
                        type="text"
                        placeholder="Filter by Name"
                        name="filterName"
                        value={filterName}
                        onChange={handleFilterChange}
                        style={{ width: '90%', padding: '5px', marginTop: '5px' }}
                      />
                    </th>
                    <th>
                      Email
                      <input
                        type="text"
                        placeholder="Filter by Email"
                        name="filterEmail"
                        value={filterEmail}
                        onChange={handleFilterChange}
                        style={{ width: '90%', padding: '5px', marginTop: '5px' }}
                      />
                    </th>
                    <th>
                      Blood Group
                      <select
                        name="filterBloodGroup"
                        value={filterBloodGroup}
                        onChange={handleFilterChange}
                        style={{ width: '90%', padding: '5px', marginTop: '5px' }}
                      >
                        <option value="">All</option>
                        {bloodGroups.map(group => (
                          <option key={group} value={group}>{group}</option>
                        ))}
                      </select>
                    </th>
                    <th>
                      Location
                      <input
                        type="text"
                        placeholder="Filter by Location"
                        name="filterLocation"
                        value={filterLocation}
                        onChange={handleFilterChange}
                        style={{ width: '90%', padding: '5px', marginTop: '5px' }}
                      />
                    </th>
                    <th>Documents</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDonors.map((donor) => (
                    <tr key={donor.id}>
                      <td>{donor.name}</td>
                      <td>{donor.email}</td>
                      <td>{donor.bloodGroup || 'N/A'}</td>
                      <td>{donor.location}</td>
                      <td>
                        {donor.aadharDocumentUrl && (
                          <a href={donor.aadharDocumentUrl} target="_blank" rel="noopener noreferrer">
                            <button>👁️ View Aadhar</button>
                          </a>
                        )}
                        {donor.bloodGroupDocumentUrl && (
                          <a href={donor.bloodGroupDocumentUrl} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '10px' }}>
                            <button>👁️ View Blood Group</button>
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No donors found.</p>
            )}
          </div>
        )}

        {selectedView === 'requests' && (
          <div className="requests-section" style={{ marginTop: '30px' }}>
            <h2>All Blood Requests</h2>
            {requests.length > 0 ? (
              <table className="donation-history-table">
                <thead>
                  <tr>
                    <th>Patient Name</th>
                    <th>Blood Group</th>
                    <th>Quantity</th>
                    <th>Hospital</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td>{request.patientName}</td>
                      <td>{request.bloodGroup}</td>
                      <td>{request.quantity}</td>
                      <td>{request.hospital}</td>
                      <td>{request.contact}</td>
                      <td>{request.status || 'Pending'}</td>
                      <td>
                        {request.status === 'accepted' || request.status === 'completed' ? (
                          <span>Donated by: {request.donorName} from {request.donorLocation}</span>
                        ) : (
                          <>
                            <button onClick={() => handleApproveRequest(request.id)} disabled={request.status === 'approved'}>Approve</button>
                            <button onClick={() => handleDeleteRequest(request.id)} style={{ marginLeft: '10px' }}>Delete</button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No blood requests found.</p>
            )}
          </div>
        )}

        {selectedView === 'campaigns' && (
          <div className="campaign-section">
            <h2>Manage Campaigns</h2>
            <button className="primary-button" style={{ marginBottom: '20px' }} onClick={() => setShowAddCampaignModal(true)}>➕ Add New Campaign</button>
            {campaigns.length > 0 ? (
              <table className="donation-history-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th>Description</th>
                    <th>Poster</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr key={campaign.id}>
                      <td>{campaign.name}</td>
                      <td>{campaign.date}</td>
                      <td>{campaign.location}</td>
                      <td>{campaign.description}</td>
                      <td>
                        {campaign.posterURL && (
                          <img src={campaign.posterURL} alt="Campaign Poster" style={{ width: '50px', height: '50px', objectFit: 'cover' }} />
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleEditCampaignClick(campaign)}
                          style={{ backgroundColor: 'green', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer' }}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No campaigns found.</p>
            )}
          </div>
        )}

      </div>
      {showAddCampaignModal && (
        <AddCampaignModal
          onClose={() => setShowAddCampaignModal(false)}
          onSave={handleAddCampaign}
        />
      )}
      {showEditCampaignModal && (
        <EditCampaignModal
          campaign={selectedCampaign}
          onClose={() => setShowEditCampaignModal(false)}
          onSave={handleUpdateCampaign}
        />
      )}
      {selectedView === 'organ-requests' && (
        <div className="organ-requests-section">
          <h2>All Organ Requests</h2>
          {organRequests.length > 0 ? (
            <table className="donation-history-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Organ Type</th>
                  <th>Blood Group</th>
                  <th>Hospital</th>
                  <th>Contact</th>
                  <th>Status</th>
                  {/* Add more headers as needed */}
                </tr>
              </thead>
              <tbody>
                {organRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.userName}</td>
                    <td>{request.organType || 'N/A'}</td>
                    <td>{request.bloodGroup || 'N/A'}</td>
                    <td>{request.hospital || 'N/A'}</td>
                    <td>{request.contact || 'N/A'}</td>
                    <td>{request.status || 'Pending'}</td>
                    {/* Add more data cells as needed */}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No organ requests found.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
