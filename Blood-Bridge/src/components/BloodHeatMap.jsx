import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase'; // Assuming you have your firebase config here

const mapContainerStyle = {
  width: '100%',
  height: '600px', // Adjust height as needed
  marginTop: '20px',
};

const defaultCenter = {
  lat: 34.052235,
  lng: -118.243683,
}; // Default to Los Angeles

const libraries = ['places']; // Required for Geocoding

function BloodHeatMap() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCykGquhe3x8hiwvFCGS6wXIDA-DQQFTH8', // Your Google Maps API Key
    libraries,
  });

  const [bloodLocations, setBloodLocations] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapError, setMapError] = useState(null);

  useEffect(() => {
    const fetchBloodData = async () => {
      try {
        const usersCollection = collection(db, 'users');
        const usersSnapshot = await getDocs(usersCollection);
        const locations = [];
        for (const doc of usersSnapshot.docs) {
          const userData = doc.data();
          if (userData.location && userData.bloodGroup) {
            // Geocode address to lat/lng
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(userData.location)}&key=AIzaSyCykGquhe3x8hiwvFCGS6wXIDA-DQQFTH8`
            );
            const data = await response.json();

            if (data.results && data.results.length > 0) {
              const { lat, lng } = data.results[0].geometry.location;
              locations.push({
                id: doc.id,
                position: { lat, lng },
                bloodGroup: userData.bloodGroup,
                name: userData.name || 'Unknown',
                type: userData.userType || 'Unknown', // Assuming userType exists
              });
            }
          }
        }
        setBloodLocations(locations);
      } catch (err) {
        console.error("Error fetching blood data:", err);
        setMapError('Failed to load blood data.');
      }
    };

    if (isLoaded) {
      fetchBloodData();
    }
  }, [isLoaded]);

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <div className="blood-heatmap-container">
      <h2>Detailed Blood Group Heat Map</h2>
      {mapError && <div style={{ color: 'red' }}>{mapError}</div>}
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={10}
      >
        {bloodLocations.map((location) => (
          <Marker
            key={location.id}
            position={location.position}
            onClick={() => setSelectedMarker(location)}
            // You can customize marker icons based on blood group here
            // icon={{
            //   url: `http://maps.google.com/mapfiles/ms/icons/${
            //     location.bloodGroup === 'O+' ? 'red' : 'blue'
            //   }-dot.png`,
            // }}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div>
              <h3>{selectedMarker.name}</h3>
              <p>Blood Group: <strong>{selectedMarker.bloodGroup}</strong></p>
              <p>Type: {selectedMarker.type}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default BloodHeatMap;
