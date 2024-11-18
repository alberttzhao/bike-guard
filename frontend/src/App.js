import React from "react";
import { Container, Box, Grid, Typography, Button } from "@mui/material";
import Notifications from './components/Notifications';
import CameraFeed from './components/CameraFeed';
import BikeLocation from './components/BikeLocation';

function App() {
  console.log("App component is rendering");

  const handleAlarmClick = () => {
    console.log("Alarm button clicked!");
    alert("Alarm Triggered!");
    // Add API call here to trigger the alarm on the backend
  };

  return (
    <Container maxWidth="lg" style={{ marginTop: "20px" }}>
      <Typography variant="h4" gutterBottom>
        Bike Guard Dashboard
      </Typography>
      <Grid container spacing={3}>
        {/* Notifications Section */}
        <Grid item xs={12} md={4}>
          <Notifications />
        </Grid>

        {/* Live Camera Feed */}
        <Grid item xs={12} md={8}>
          <CameraFeed />
        </Grid>

        {/* Bike Location */}
        <Grid item xs={12} md={8}>
          <BikeLocation />
        </Grid>

        {/* Alarm Button */}
        <Grid item xs={12} md={4}>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
          >
            <Button
              variant="contained"
              color="error"
              size="large"
              onClick={handleAlarmClick}
              style={{
                padding: "20px 40px",
                fontSize: "18px",
                fontWeight: "bold",
              }}
            >
              Sound Alarm
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}

export default App;