### Table of Contents
1. Source Code Structure

2. Executables & Build Artifacts

3. Compilation Instructions

4. Target Platform Deployment

5. Configuration Management

6. Post-Installation Verification

### 1. Source Code Structure
```
bike-guard/
├── frontend/ # Frontend React application
│ ├── public/ # Static assets
│ ├── src/ # Source code
│ │ ├──components
│ │ │ ├──Account.css
│ │ │ ├──Account.js
│ │ │ ├──AuthForm.css
│ │ │ ├──AuthForm.js
│ │ │ ├──BikeLocation.js
│ │ │ ├──BluetoothComponents.css
│ │ │ ├──BluetoothComponents.js
│ │ │ ├──CameraFeed.js
│ │ │ ├──Components.css
│ │ │ ├──LiveMap.css
│ │ │ ├──LiveMap.js
│ │ │ ├──Notifications.js
│ │ │ ├──Settings.css
│ │ │ ├──Settings.js
│ │ │ ├──Support.css
│ │ │ ├──Support.js
│ │ ├──App.css
│ │ ├──App.js
│ │ ├──App.test.js
│ │ ├──Status.js
│ │ ├──config.js
│ │ ├──firebase.js
│ │ ├──index.css
│ │ ├──index.js
│ │ ├──logo.svg
│ │ ├──reportWebVitals.js
│ │ ├──service-worker.js
│ │ ├──serviceWorkerRegistration.js
│ │ ├──setupTests.js
│ ├── package-lock.json
│ ├── package.json
│ ├── .firebaserc 
│ ├── firebase.json
│ └── implementation.txt 
│
├── backend/ # Backend application
│ ├── app.py # Main backend logic
│ ├── package-lock.json
│ ├── node_modules
│ │ ├── dotenv
│ │ ├──lib
│ │ │ ├──lCHANGELOG.md
│ │ │ ├──lLICENSE
│ │ │ ├──lREADME-es.md
│ │ │ ├──lREADME.md
│ │ │ ├──lconfig.d.ts
│ │ │ ├──lconfig.js
│ ├── package-lock.json
│ └── database.db # SQLite database
│
├── hardware/ # Hardware integration
│ ├── .vscode/ # VSCode settings
│ ├── photos/ # Hardware-related images
│ ├── .DS_Store # [IGNORE] MacOS file
│ ├── README.md # Hardware documentation
│ ├── accelerometer.py # Sensor script
│ └── boot_try.py # Startup script
│
├── .gitignore
├── LICENSE
├──.DS_Store
├──README_Software.md
├──requirements.txt
└── README.md 
```

### 2. Executables & Build Artifacts

The project consists of multiple components, each of which generates build artifacts:

- **Frontend**: React application, built using `npm run build` for production or PWA testing.
- **Backend**: Python Flask application, requiring a virtual environment and dependencies from `requirements.txt`.
- **Hardware**: Raspberry Pi code, including Python scripts for sensor data collection and boot configuration.

## 3. Compilation Instructions

### Frontend

```
# Navigate to the frontend directory
cd bike-guard/frontend

# Install dependencies
npm install

# start frontend
npm start

```
### Backend
```

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

### 5. Configuration Management
```

The Flask backend runs on port 5000
The React frontend runs on port 3000
Make sure to update the API URLs in both frontend and hardware code if needed
Need Python 3.8+ installed
```

### 6. Post-Installation Verification

After installation, you can verify that everything is set up properly by following these steps:

**Frontend Verification**

- Start the frontend locally with npm start.

- Ensure that the application loads correctly, and all components are functional.

- Test the Firebase integration by adding or removing data (e.g., user settings or alerts).

**Backend Verification**

- Ensure that the Flask server is running by visiting http://localhost:5000.

- Test API endpoints to ensure they respond correctly.

- Check the backend logs for any errors.

**Hardware Verification**

- Check that the Raspberry Pi boots up and runs the sensor scripts.

- Verify that data is logged in mpu_data_log.csv.

- Test the functionality by simulating bike movement and confirming that the system detects it and sends alerts.



