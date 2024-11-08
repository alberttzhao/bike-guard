# Bike Guard Project

## Project Overview

The Bike Guard project is a security system designed to protect bikes from theft. It consists of a web application with a **React.js** frontend, a **Node.js** backend, and code for a **Raspberry Pi** device that detects and reports suspicious activities.

---

## File Structure

The project is organized into three main directories: `frontend`, `backend`, and `raspberry-pi`. Each directory serves a specific purpose, as described below.

```plaintext
bike-guard-project/
├── frontend/               # React.js frontend
│   ├── node_modules/       # Frontend dependencies (ignored by Git)
│   ├── public/             # Public assets for the frontend
│   ├── src/                # Source files for React components
│   │   ├── components/     # Reusable React components
│   │   ├── App.js          # Main React component
│   │   └── index.js        # Entry point for React
│   ├── package.json        # Lists frontend dependencies and scripts
│   └── .env                # Environment variables for the frontend (ignored by Git)
│
├── backend/                # Node.js backend
│   ├── node_modules/       # Backend dependencies (ignored by Git)
│   ├── controllers/        # Controllers for handling API logic
│   │   └── bikeController.js   # Example controller for bike data
│   ├── routes/             # API route definitions
│   │   └── bikeRoutes.js   # Example routes for bike endpoints
│   ├── app.js              # Main entry point for the backend server
│   ├── package.json        # Lists backend dependencies and scripts
│   └── .env                # Environment variables for the backend (ignored by Git)
│
├── raspberry-pi/           # Raspberry Pi specific code
│   ├── scripts/            # Scripts to run on the Raspberry Pi
│   │   └── pi_listener.js  # Script to listen for bike guard events
│   ├── config/             # Configuration files for the Raspberry Pi
│   │   └── config.json     # Configuration file example
│   └── README.md           # Documentation specific to the Raspberry Pi setup
│
└── .gitignore              # Files and directories to ignore in Git