import React, { useState, useEffect, useRef } from 'react';
import './LiveMap.css'; // Make sure this file exists

const LiveMap = ({ bikeLocation, isTracking }) => {
  const mapRef = useRef(null);
  const [mapStatus, setMapStatus] = useState('loading');
  const [googleMapInstance, setGoogleMapInstance] = useState(null);
  const [marker, setMarker] = useState(null);
  
  // Default location if none provided
  const defaultLocation = { lat: 37.7749, lng: -122.4194 }; // San Francisco
  
  // Load Google Maps script
  useEffect(() => {
    // Only load the script once
    if (window.google?.maps) {
      setMapStatus('loaded');
      return;
    }
    
    if (document.getElementById('google-maps-script')) {
      return; // Script is already loading
    }
    
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDVbbG7oXS4khNtlg40cS21VVbUbMFrthk&callback=initMap`;
    script.async = true;
    script.defer = true;
    
    // Define global callback
    window.initMap = () => {
      setMapStatus('loaded');
    };
    
    script.onerror = () => {
      setMapStatus('error');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup - remove the callback
      window.initMap = undefined;
    };
  }, []);
  
  // Initialize map once script is loaded
  useEffect(() => {
    if (mapStatus !== 'loaded' || !mapRef.current || !window.google?.maps) return;
    
    try {
      const mapOptions = {
        center: bikeLocation || defaultLocation,
        zoom: 16,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
      };
      
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setGoogleMapInstance(newMap);
      
      const newMarker = new window.google.maps.Marker({
        position: bikeLocation || defaultLocation,
        map: newMap,
        title: 'Your Bike'
      });
      setMarker(newMarker);
    } catch (err) {
      console.error('Error initializing map:', err);
      setMapStatus('error');
    }
  }, [mapStatus, bikeLocation]);
  
  // Update marker when bike location changes
  useEffect(() => {
    if (!marker || !bikeLocation || !window.google?.maps) return;
    
    marker.setPosition(bikeLocation);
    
    if (isTracking && googleMapInstance) {
      googleMapInstance.panTo(bikeLocation);
    }
  }, [bikeLocation, isTracking, marker, googleMapInstance]);
  
  return (
    <div className="map-container">
      <div className="map-header">
        <h3>Live Location</h3>
        {mapStatus === 'loaded' && bikeLocation ? (
          <div className="location-info">
            <span className="location-dot"></span>
            <span>Live Tracking Active</span>
          </div>
        ) : (
          <div className="location-info">
            {mapStatus === 'loading' ? 'Loading map...' : 
             mapStatus === 'error' ? 'Error loading map' : 'Waiting for location...'}
          </div>
        )}
      </div>
      
      <div className="google-map" ref={mapRef}>
        {mapStatus !== 'loaded' && (
          <div className="map-overlay">
            {mapStatus === 'loading' ? (
              <p>Loading Google Maps...</p>
            ) : (
              <p>Error loading Google Maps</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveMap;