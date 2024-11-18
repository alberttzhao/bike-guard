import React from "react";
import { Card, CardContent, Typography } from "@mui/material";

const notifications = [
  { message: "Bike moved", time: "10:45 AM" },
  { message: "Suspicious activity detected", time: "9:30 AM" },
];

function Notifications() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notifications
        </Typography>
        {notifications.map((notification, index) => (
          <Typography key={index} style={{ marginBottom: "10px" }}>
            <strong>{notification.message}</strong> - {notification.time}
          </Typography>
        ))}
      </CardContent>
    </Card>
  );
}

export default Notifications;