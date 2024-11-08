# bike-guard
senior project bike guard


## Overall File Structure:
### Backend:
backend/
├── node_modules/
├── controllers/
│   └── bikeController.js
├── routes/
│   └── bikeRoutes.js
├── app.js                 # Main entry point
├── package.json
└── .env                   # Environment variables

### Frontend:
frontend/
├── node_modules/
├── public/
├── src/
│   ├── components/
│   ├── App.js
│   └── index.js
├── package.json
└── .env

### Raspberry-pi:
raspberry-pi/
├── scripts/
│   └── pi_listener.js          # Node.js or Python code for handling Pi data
├── config/
│   └── config.json
└── README.md