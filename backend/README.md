# BikeGuard Backend

A Flask-based backend server for the BikeGuard bicycle security system.

## Features

- Real-time video streaming from Raspberry Pi camera
- GPS location tracking and simulation
- Notification system for security alerts
- Alarm control system
- WebSocket support for real-time updates
- SQLite database for data persistence

## Prerequisites

- Python 3.7+
- Flask
- Flask-SocketIO
- Flask-CORS
- Raspberry Pi with camera module (for production)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/bikeguard.git
cd bikeguard/backend

# Install dependencies
pip install -r requirements.txt
```

## Configuration

Update the configuration in `config.py` or environment variables as needed.

## Running the Server

```bash
# Start the backend server
python app.py
```

The server will start on http://YOUR_IP:5001

## API Endpoints

### Authentication
- Authentication is handled by Firebase in the frontend

### Video Feed
- `GET /api/video-feed` - Stream video from the Pi camera

### Notifications
- `GET /api/notifications` - Retrieve all notifications
- `POST /api/notifications` - Create a new notification

### Bike Location
- `GET /api/bike-location` - Get current bike location
- `GET /api/bike-status` - Get complete bike status
- `POST /api/update-location` - Update bike location

### Alarm Control
- `POST /api/trigger-alarm` - Activate the alarm
- `POST /api/stop-alarm` - Deactivate the alarm

## WebSocket Events

- `connect` - Client connection event
- `disconnect` - Client disconnection event
- `bike_data` - Real-time bike data updates
- `new_notification` - Real-time notification events

## Database Schema

- `notifications` - Stores security alerts and notifications
- `location_history` - Stores historical location data
- `bike_status` - Stores current bike status

## Hardware Integration

The backend is designed to interface with:
- Raspberry Pi
- Pi Camera module
- MPU-6050 accelerometer
- GPS module
- Buzzer for alarm