import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useLoadScript, Marker, InfoWindow } from '@react-google-maps/api';

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

function BloodHeatMap({ locations }) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: 'AIzaSyCykGquhe3x8hiwvFCGS6wXIDA-DQQFTH8', // Your Google Maps API Key
    libraries,
  });

  const [selectedMarker, setSelectedMarker] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);

  // Determine initial map center based on locations, or use default
  useEffect(() => {
    if (locations && locations.length > 0) {
      // Calculate average center or use the first location
      const centerLat = locations.reduce((sum, loc) => sum + loc.position.lat, 0) / locations.length;
      const centerLng = locations.reduce((sum, loc) => sum + loc.position.lng, 0) / locations.length;
      setMapCenter({ lat: centerLat, lng: centerLng });
    }
  }, [locations]);

  if (loadError) {
    return <div>Error loading maps: {loadError.message}</div>;
  }

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <div className="blood-heatmap-container">
      <h2>Detailed Blood Group Heat Map</h2>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={mapCenter}
        zoom={10}
      >
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={location.position}
            onClick={() => setSelectedMarker(location)}
            icon={{
              url: location.type === 'patient' ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            }}
          />
        ))}

        {selectedMarker && (
          <InfoWindow
            position={selectedMarker.position}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div>
              <h3>{selectedMarker.name}</h3>
              <p>Type: {selectedMarker.type}</p>
              {selectedMarker.bloodGroup && <p>Blood Group: <strong>{selectedMarker.bloodGroup}</strong></p>}
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}

export default BloodHeatMap;
