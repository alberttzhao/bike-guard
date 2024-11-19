# BikeGuard

A bike security system using Raspberry Pi for movement detection and notifications.

## Setup Instructions

### Backend Setup
1. Create and activate a virtual environment:
```bash
# On Windows:
python -m venv venv
venv\Scripts\activate

# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate
```

2. Install required dependencies:
```bash
pip install -r requirements.txt
```

3. Start the Flask backend:
```bash
cd backend
python app.py
```

### Frontend Setup
1. Install Node.js dependencies:
```bash
cd frontend
npm install
```

2. Start the React development server:
```bash
npm start
```

### Hardware Setup (Raspberry Pi)
1. Activate the virtual environment and install dependencies (same as backend setup)
2. Run the accelerometer script:
```bash
cd hardware
python accelerometer.py
```

## Project Structure
```
bike-guard/
├── frontend/         # React frontend
├── backend/         # Flask server
│   └── app.py      # Main server file
├── hardware/        # Raspberry Pi code
│   └── accelerometer.py
├── requirements.txt # Python dependencies
└── README.md
```

## Configuration
- The Flask backend runs on port 5000
- The React frontend runs on port 3000
- Make sure to update the API URLs in both frontend and hardware code if needed

## Notes
- You need Python 3.8+ installed
- For Raspberry Pi setup, you need the required hardware components connected
- Make sure I2C is enabled on your Raspberry Pi for the accelerometer