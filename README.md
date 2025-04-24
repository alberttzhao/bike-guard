# BikeGuard

<p align="center">
<img src="./photos/LogoRendition3.png" width="50%">
</p>
A bike security system using Raspberry Pi for movement detection and notifications.

## Setup Instructions

### Frontend Setup
```bash
# Go to the frontend directory
cd bike-guard/frontend
# Install all frontend dependencies using npm:
npm install
# This single command will install all the packages defined in package.json file
```
To start the development server:
```bash
npm start
```

### Backend Setup
```bash
# Go to the backend directory
cd ../backend
# Create a python virtual environment
python -m venv .venv
# Activate the virtual environment:
# on windows:
.venv\Scripts\activate
# on mac:
source .venv/bin/activate

# Then, install all backend dependencies:
pip install -r requirements.txt
```

To start the flask server:
```bash
python app.py
```

### For Production and Testing
To build the frontend for production or PWA testing
```bash
cd frontend
npm run build
serve -s build
```

### For Those with No Python or Flask 
1. Install Prerequisites 
Install Node.js and npm
- Node.js includes npm (Node Package Manager) by default

For Windows/MacOS:
1. Download the installer from nodejs.org
2. Run the installer and follow the instructions
3. Verify installation:
```bash
node --version
npm --version
```

For Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install nodejs npm
```

Install Python
```bash
brew install python
```

And then repeat all the necessary steps to setup front and backend

### Hardware Setup (Raspberry Pi)
1. Switch the key lock switch from OFF to ON

## Project Structure
```
bike-guard/
├── frontend/         # React frontend
├── backend/         # Flask server
│   └── app.py      # Main server file
├── hardware/        # Raspberry Pi code
│   └── boot_try.py
│   └── accelerometer.py
│   └── mpu_data_log.csv
├── requirements.txt # Python dependencies
└── README.md
```

## Configuration
- The Flask backend runs on port 5000
- The React frontend runs on port 3000
- Make sure to update the API URLs in both frontend and hardware code if needed

## Notes
- You need Python 3.8+ installed

# BikeGuard - Development Setup

## Firebase Configuration

For local development, you need to set up Firebase credentials:

1. Option 1: Create a file named `serviceAccountKey.json` in the backend directory with your Firebase service account key.

2. Option 2: Set an environment variable with your Firebase credentials:
   ```bash
   # On Linux/Mac
   export FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"..."}'
   
   # On Windows (PowerShell)
   $env:FIREBASE_CREDENTIALS='{"type":"service_account","project_id":"..."}'
