import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Status = () => {
  const [status, setStatus] = useState("Loading...");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/status");
        setStatus(response.data.message);
      } catch (error) {
        console.error("Error fetching status:", error);
        setStatus("Error fetching status");
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2>Current Status</h2>
      <p>{status}</p>
    </div>
  );
};

export default Status;