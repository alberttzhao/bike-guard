// import React, { useState, useEffect, useRef } from 'react';
// import './LiveMap.css';

// const LiveMap = ({ bikeLocation, isTracking }) => {
//   const mapRef = useRef(null);
//   const [mapStatus, setMapStatus] = useState('loading');
//   const [googleMapInstance, setGoogleMapInstance] = useState(null);
//   const [marker, setMarker] = useState(null);
//   // const [showOverlay, setShowOverlay] = useState(!isTracking);

  
//   // Default location if none provided
//   const defaultLocation = { lat: 42.349, lng: -71.106 }; // San Francisco
  
//   // Use a static map image while the dynamic map loads
//   const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${defaultLocation.lat},${defaultLocation.lng}&zoom=14&size=600x400&markers=color:red%7C${defaultLocation.lat},${defaultLocation.lng}&key=AIzaSyDVbbG7oXS4khNtlg40cS21VVbUbMFrthk`;
  
//   // Load Google Maps script
//   useEffect(() => {
//     // Only load the script once
//     if (window.google?.maps) {
//       setMapStatus('loaded');
//       return;
//     }
    
//     if (document.getElementById('google-maps-script')) {
//       return; // Script is already loading
//     }
    
//     // Use a more optimized loading approach
//     const loadMap = () => {
//       const script = document.createElement('script');
//       script.id = 'google-maps-script';
//       // Load only essential libraries and reduce the payload
//       script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDVbbG7oXS4khNtlg40cS21VVbUbMFrthk&callback=initMap&v=weekly&libraries=core`;
//       script.async = true;
//       script.defer = true;
      
//       // Define global callback
//       window.initMap = () => {
//         setMapStatus('loaded');
//       };
      
//       script.onerror = () => {
//         setMapStatus('error');
//       };
      
//       document.head.appendChild(script);
//     };
    
//     // Delay loading the map slightly to prioritize other UI elements first
//     setTimeout(loadMap, 300);
    
//     return () => {
//       window.initMap = undefined;
//     };
//   }, []);
  
//   // Initialize map once script is loaded
//   useEffect(() => {
//     if (mapStatus !== 'loaded' || !mapRef.current || !window.google?.maps) return;
    
//     try {
//       const mapOptions = {
//         center: bikeLocation || defaultLocation,
//         zoom: 14, // Start with slightly less detailed zoom
//         disableDefaultUI: false, // Simplify UI
//         mapTypeControl: false, // Remove map type control initially
//         streetViewControl: false,
//         fullscreenControl: true,
//         zoomControl: true,
//         gestureHandling: 'greedy',
//         maxZoom: 18,
//         minZoom: 10,
//         styles: [
//           {
//             featureType: "poi",
//             elementType: "labels",
//             stylers: [{ visibility: "off" }] // Remove POI labels to reduce visual clutter
//           }
//         ]
//       };
      
//       const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
//       setGoogleMapInstance(newMap);
      
//       const newMarker = new window.google.maps.Marker({
//         position: bikeLocation || defaultLocation,
//         map: newMap,
//         title: 'Your Bike',
//         animation: window.google.maps.Animation.DROP
//       });
//       setMarker(newMarker);
      
//       // Add zoom controls after a delay to prioritize initial rendering
//       setTimeout(() => {
//         newMap.setOptions({
//           mapTypeControl: true
//         });
//       }, 1000);
//     } catch (err) {
//       console.error('Error initializing map:', err);
//       setMapStatus('error');
//     }
//   }, [mapStatus, bikeLocation]);
  
//   // Update marker when bike location changes
//   useEffect(() => {
//     if (!marker || !bikeLocation || !window.google?.maps) return;
    
//     marker.setPosition(bikeLocation);
    
//     if (isTracking && googleMapInstance) {
//       googleMapInstance.panTo(bikeLocation);
//     }
//   }, [bikeLocation, isTracking, marker, googleMapInstance]);

//   // Update overlay when tracking state changes
//   // useEffect(() => {
//   //   setShowOverlay(!isTracking);
//   // }, [isTracking]);
  
//   return (
//     <div className="map-container">
//       <div className="map-header">
//         <h3>Live Location</h3>
//         {mapStatus === 'loaded' && bikeLocation ? (
//           <div className="location-info">
//             <span className={`location-dot ${!isTracking ? 'inactive' : ''}`}></span>
//             <span>{isTracking ? 'Live Tracking Active' : 'Live Tracking Inactive'}</span>
//           </div>
//         ) : (
//           <div className="location-info">
//             {mapStatus === 'loading' ? 'Loading map...' : 
//             mapStatus === 'error' ? 'Error loading map' : 'Waiting for location...'}
//           </div>
//         )}
//       </div>
      
//       <div className="google-map" ref={mapRef}>
//         {mapStatus !== 'loaded' && (
//           <div className="map-overlay">
//             {mapStatus === 'loading' ? (
//               <>
//                 <img 
//                   src={staticMapUrl} 
//                   alt="Static map" 
//                   style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} 
//                 />
//                 <div style={{position: 'absolute', backgroundColor: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '4px'}}>
//                   <p>Loading interactive map...</p>
//                 </div>
//               </>
//             ) : (
//               <p>Error loading Google Maps</p>
//             )}
//           </div>
//         )}
//         {/* Add the location tracking overlay here */}
//         {!isTracking && (
//           <div className="location-tracking-overlay">
//             <span className="material-icons">location_off</span>
//             <p>Location Tracking Off</p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default LiveMap;

import React, { useState, useEffect, useRef } from 'react';
import './LiveMap.css';
import { getAuth } from 'firebase/auth';

const LiveMap = ({ bikeLocation, isTracking, userData }) => {
  const mapRef = useRef(null);
  const [mapStatus, setMapStatus] = useState('loading');
  const [googleMapInstance, setGoogleMapInstance] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  
  // The authorized user ID - replace with your specific ID (use the same ID as in CameraFeed)
  const AUTHORIZED_USER_ID = "ppGAWdLVilX4vGTaAl3xrCt9AJ02";
  
  // Default location if none provided
  const defaultLocation = { lat: 42.349, lng: -71.106 }; // Boston coordinates
  
  // Use a static map image while the dynamic map loads
  const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${defaultLocation.lat},${defaultLocation.lng}&zoom=14&size=600x400&markers=color:red%7C${defaultLocation.lat},${defaultLocation.lng}&key=AIzaSyDVbbG7oXS4khNtlg40cS21VVbUbMFrthk`;
  
  // Check if the current user is authorized
  useEffect(() => {
    const checkAuthorization = () => {
      // First check from passed userData
      if (userData && userData.uid) {
        console.log("LiveMap - Current User UID:", userData.uid);
        return userData.uid === AUTHORIZED_USER_ID;
      }
      
      // Fallback to checking Firebase Auth directly
      try {
        const auth = getAuth();
        const currentUser = auth.currentUser;
        if (currentUser) {
          console.log("LiveMap - Current User UID from Firebase Auth:", currentUser.uid);
          return currentUser.uid === AUTHORIZED_USER_ID;
        }
      } catch (error) {
        console.error("Error checking Firebase auth:", error);
      }
      
      return false;
    };
    
    setIsAuthorized(checkAuthorization());
  }, [userData]);
  
  // Load Google Maps script
  useEffect(() => {
    if (!isAuthorized) return; // Don't load the map if not authorized
    
    // Only load the script once
    if (window.google?.maps) {
      setMapStatus('loaded');
      return;
    }
    
    if (document.getElementById('google-maps-script')) {
      return; // Script is already loading
    }
    
    // Use a more optimized loading approach
    const loadMap = () => {
      const script = document.createElement('script');
      script.id = 'google-maps-script';
      // Load only essential libraries and reduce the payload
      script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDVbbG7oXS4khNtlg40cS21VVbUbMFrthk&callback=initMap&v=weekly&libraries=core`;
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
    };
    
    // Delay loading the map slightly to prioritize other UI elements first
    setTimeout(loadMap, 300);
    
    return () => {
      window.initMap = undefined;
    };
  }, [isAuthorized]);
  
  // Initialize map once script is loaded
  useEffect(() => {
    if (!isAuthorized || mapStatus !== 'loaded' || !mapRef.current || !window.google?.maps) return;
    
    try {
      const mapOptions = {
        center: bikeLocation || defaultLocation,
        zoom: 14, // Start with slightly less detailed zoom
        disableDefaultUI: false, // Simplify UI
        mapTypeControl: false, // Remove map type control initially
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        maxZoom: 18,
        minZoom: 10,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }] // Remove POI labels to reduce visual clutter
          }
        ]
      };
      
      const newMap = new window.google.maps.Map(mapRef.current, mapOptions);
      setGoogleMapInstance(newMap);
      
      const newMarker = new window.google.maps.Marker({
        position: bikeLocation || defaultLocation,
        map: newMap,
        title: 'Your Bike',
        animation: window.google.maps.Animation.DROP
      });
      setMarker(newMarker);
      
      // Add zoom controls after a delay to prioritize initial rendering
      setTimeout(() => {
        newMap.setOptions({
          mapTypeControl: true
        });
      }, 1000);
    } catch (err) {
      console.error('Error initializing map:', err);
      setMapStatus('error');
    }
  }, [mapStatus, bikeLocation, isAuthorized]);
  
  // Update marker when bike location changes
  useEffect(() => {
    if (!isAuthorized || !marker || !bikeLocation || !window.google?.maps) return;
    
    marker.setPosition(bikeLocation);
    
    if (isTracking && googleMapInstance) {
      googleMapInstance.panTo(bikeLocation);
    }
  }, [bikeLocation, isTracking, marker, googleMapInstance, isAuthorized]);
  
  return (
    <div className="map-container">
      <div className="map-header">
        <h3>Live Location</h3>
        {!isAuthorized ? (
          <div className="location-info">
            <span className="material-icons">lock</span>
            <span>unavailable</span>
          </div>
        ) : mapStatus === 'loaded' && bikeLocation ? (
          <div className="location-info">
            <span className={`location-dot ${!isTracking ? 'inactive' : ''}`}></span>
            <span>{isTracking ? 'Live Tracking Active' : 'Live Tracking Inactive'}</span>
          </div>
        ) : (
          <div className="location-info">
            {mapStatus === 'loading' ? 'Loading map...' : 
            mapStatus === 'error' ? 'Error loading map' : 'Waiting for location...'}
          </div>
        )}
      </div>
      
      {!isAuthorized ? (
        <div className="map-unauthorized">
          <span className="material-icons">error_outline</span>
          <p>No Location Available</p>
        </div>
      ) : (
        <div className="google-map" ref={mapRef}>
          {mapStatus !== 'loaded' && (
            <div className="map-overlay">
              {mapStatus === 'loading' ? (
                <>
                  <img 
                    src={staticMapUrl} 
                    alt="Static map" 
                    style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover'}} 
                  />
                  <div style={{position: 'absolute', backgroundColor: 'rgba(255,255,255,0.7)', padding: '10px', borderRadius: '4px'}}>
                    <p>Loading interactive map...</p>
                  </div>
                </>
              ) : (
                <p>Error loading Google Maps</p>
              )}
            </div>
          )}
          {/* Add the location tracking overlay here */}
          {!isTracking && (
            <div className="location-tracking-overlay">
              <span className="material-icons">location_off</span>
              <p>Location Tracking Off</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LiveMap;