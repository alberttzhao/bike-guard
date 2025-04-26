from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room, leave_room
from datetime import datetime
import sqlite3
import socket
import json
import threading
import time
import random
import socketio
import firebase_admin
import os
from firebase_admin import credentials, firestore

# When you run your backend on different devices, you can set the environment variable:

# On your development machine: FLASK_ENV=development python app.py
# On Raspberry Pi: FLASK_ENV=raspberry python app.py
# In production: FLASK_ENV=production python app.py

# This approach ensures your app can seamlessly switch between different environments while maintaining connectivity to Firebase for notifications.

# First try to get credentials from environment variable
firebase_creds_json = os.environ.get('FIREBASE_CREDENTIALS')

# Determine environment
ENV = os.environ.get('FLASK_ENV', 'development')

# Try to initialize Firebase
try:
    # Check if credentials JSON string is available in environment
    if firebase_creds_json:
        # Write credentials to temporary file
        with open('temp_credentials.json', 'w') as f:
            f.write(firebase_creds_json)
        cred = credentials.Certificate('temp_credentials.json')
        # Clean up after loading
        os.remove('temp_credentials.json')
    else:
        # Look for credentials file in various locations
        if ENV == 'production':
            cred_path = './prod-serviceAccountKey.json'
        elif ENV == 'raspberry':
            cred_path = './raspberry-serviceAccountKey.json'
        else:
            # Try multiple possible local paths
            possible_paths = [
                './dev-serviceAccountKey.json',
                './serviceAccountKey.json',
                './firebase-credentials.json',
                '../backend/serviceAccountKey.json',
                './bike-guard-2025-firebase-adminsdk-fbsvc-539f1cd285.json'
            ]
            
            cred_path = None
            for path in possible_paths:
                if os.path.exists(path):
                    cred_path = path
                    break
                    
            if not cred_path:
                raise FileNotFoundError("No Firebase credentials file found")
                
        cred = credentials.Certificate(cred_path)
        
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    firebase_enabled = True
    print(f"Firebase initialized successfully for {ENV} environment")
except Exception as e:
    firebase_enabled = False
    print(f"Firebase initialization failed: {e}")
    print(f"Detailed error info: {type(e).__name__}")
    print("Continuing without Firebase integration")

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": [
            "http://localhost:3000", 
            "http://127.0.0.1:3000",
            "http://192.168.*",
            "http://10.*",
            "https://bike-guard-2025.web.app",
            "http://128.197.180.214:3000",
            "http://128.197.180.214:5001"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='threading')

def get_ip():
    hostname = socket.gethostname()
    ip_address = socket.gethostbyname(hostname)
    return ip_address

# Database initialization
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    # Notifications table
    c.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Location history table
    c.execute('''
        CREATE TABLE IF NOT EXISTS location_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Bike status table
    c.execute('''
        CREATE TABLE IF NOT EXISTS bike_status (
            id INTEGER PRIMARY KEY,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            battery INTEGER NOT NULL,
            is_locked BOOLEAN NOT NULL,
            is_alarm_active BOOLEAN NOT NULL,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Check if bike_status has an initial entry
    c.execute('SELECT COUNT(*) FROM bike_status')
    if c.fetchone()[0] == 0:
        # Insert default bike status (San Francisco location)
        c.execute('''
            INSERT INTO bike_status (id, latitude, longitude, battery, is_locked, is_alarm_active)
            VALUES (1, 42.349, -71.106, 100, 1, 0)
        ''')
    
    conn.commit()
    conn.close()

# Bike data state (in-memory for quick access)
bike_data = {
    "location": {"lat": 42.349, "lng": -71.106},  # Default to Photonics Boston
    "battery": 100,
    "is_locked": True,
    "is_alarm_active": False,
    "last_updated": datetime.now().isoformat()
}

# Load initial bike data from database
def load_bike_data():
    global bike_data
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT latitude, longitude, battery, is_locked, is_alarm_active, last_updated FROM bike_status WHERE id = 1')
    result = c.fetchone()
    if result:
        bike_data = {
            "location": {"lat": result[0], "lng": result[1]},
            "battery": result[2],
            "is_locked": bool(result[3]),
            "is_alarm_active": bool(result[4]),
            "last_updated": result[5]
        }
    conn.close()

# Add a function to store notifications in Firebase
@app.route('/api/notifications', methods=['POST'])
def create_notification():
    print(f"Received notification from user: {request.args.get('user_id')}")
    data = request.json
    print(f"Received notification: {data}")
    
    # Get user_id from request if provided
    user_id = request.args.get('user_id')
    
    # Only store in Firebase if user_id is provided
    if user_id and firebase_enabled:
        try:
            # 1. First emit via Socket.IO for instant frontend update
            notification_data = {
                'id': str(datetime.now().timestamp()),  # Temporary ID
                'message': data['message'],
                'type': data.get('type', 'movement'),
                'timestamp': datetime.now().isoformat()
            }
            
            socketio.emit('new_notification', notification_data, room=user_id)
            print(f"INSTANT: Emitted to {user_id} via Socket.IO")
            
            # 2. Then store in Firebase (non-blocking)
            firebase_notification = {
                'message': data['message'],
                'type': data.get('type', 'movement'),
                'timestamp': firestore.SERVER_TIMESTAMP,
                'read': False
            }
            
            # Use async firebase write
            def async_firebase_write():
                try:
                    doc_ref = db.collection('users').document(user_id)\
                                .collection('notifications').add(firebase_notification)
                    print(f"PERSISTED: Saved to Firebase {doc_ref[1].id}")
                except Exception as e:
                    print(f"Firebase write error: {e}")
            
            threading.Thread(target=async_firebase_write).start()
            
            return jsonify(notification_data), 201
            
        except Exception as e:
            print(f"Error: {e}")
            return jsonify({'error': str(e)}), 500
    else:
        # For testing only - should be removed in production
        # Store in SQLite for backward compatibility during testing
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        
        try:
            c.execute('''
                INSERT INTO notifications (message, type)
                VALUES (?, ?)
            ''', (data['message'], data.get('type', 'movement')))
            conn.commit()
            notification_id = c.lastrowid
            
            notification_data = {
                'id': notification_id,
                'message': data['message'],
                'type': data.get('type', 'movement'),
                'timestamp': datetime.now().isoformat()
            }
            
            # Global broadcast only if no user_id (for testing)
            socketio.emit('new_notification', notification_data)
            
            return jsonify(notification_data), 201
        except Exception as e:
            print(f"Error creating notification: {e}")
            return jsonify({'error': str(e)}), 500
        finally:
            conn.close()

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    # Get user_id from request parameter if provided
    user_id = request.args.get('user_id')
    print(f"GET /api/notifications - User ID: {user_id}")
    
    # If user_id is provided, ONLY get notifications from Firebase
    if user_id:
        try:
            if not firebase_enabled:
                print("Firebase not enabled, returning empty list")
                return jsonify([])
                
            print(f"Attempting to fetch notifications from Firebase for user {user_id}")
            # Get user's notifications from Firebase
            notifications_ref = db.collection('users').document(user_id).collection('notifications')
            notifications_query = notifications_ref.order_by('timestamp', direction=firestore.Query.DESCENDING).limit(50)
            notifications_docs = notifications_query.stream()
            
            # Convert to list of dictionaries
            notifications = []
            for doc in notifications_docs:
                notification = doc.to_dict()
                notification['id'] = doc.id
                # Convert timestamp to ISO format string if it exists
                if 'timestamp' in notification and notification['timestamp']:
                    notification['timestamp'] = notification['timestamp'].isoformat() \
                        if hasattr(notification['timestamp'], 'isoformat') \
                        else str(notification['timestamp'])
                notifications.append(notification)
            
            print(f"Retrieved {len(notifications)} notifications from Firebase")
            return jsonify(notifications)
        except Exception as e:
            print(f"Error getting notifications from Firebase: {e}")
            # If Firebase is available but there was an error, return empty list
            return jsonify([])
    
    # Only use SQLite if no user_id is provided (for anonymous users)
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    try:
        c.execute('SELECT * FROM notifications ORDER BY timestamp DESC LIMIT 50')
        notifications = [{
            'id': row[0],
            'message': row[1],
            'type': row[2],
            'timestamp': row[3]
        } for row in c.fetchall()]
        
        print(f"Retrieved {len(notifications)} notifications from SQLite")
        return jsonify(notifications)
    except Exception as e:
        print(f"Error getting notifications from SQLite: {e}")
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# function definition back to your code:
def store_notification_in_firebase(notification_data, user_id=None):
    if not firebase_enabled:
        print("Firebase not enabled, skipping Firestore update")
        return False
    
    try:
        # Format notification data for Firestore
        firebase_notification = {
            'message': notification_data['message'],
            'type': notification_data['type'],
            'timestamp': firestore.SERVER_TIMESTAMP,
            'read': False
        }
        
        if user_id:
            # Add notification only to the specific user
            db.collection('users').document(user_id).collection('notifications').add(firebase_notification)
            print(f"Notification added to user {user_id}")
            return True
        else:
            print("No user_id provided, skipping notification storage")
            return False
    except Exception as e:
        print(f"Error storing notification in Firebase: {e}")
        return False
        
@app.route('/api/video-feed')
def video_feed():
    # Return the actual video feed URL
    return jsonify({
        "videoUrl": "http://128.197.180.214:5001/api/video-feed"  # Adjust to your actual video endpoint
    })

# Location tracking endpoints
@app.route('/api/bike-location', methods=['GET'])
def get_bike_location():
    return jsonify(bike_data["location"])

@app.route('/api/bike-status', methods=['GET'])
def get_bike_status():
    return jsonify(bike_data)

@app.route('/api/update-location', methods=['POST'])
def update_location():
    data = request.json
    
    if 'lat' in data and 'lng' in data:
        lat = float(data['lat'])
        lng = float(data['lng'])
        
        # Update in-memory data
        bike_data["location"]["lat"] = lat
        bike_data["location"]["lng"] = lng
        bike_data["last_updated"] = datetime.now().isoformat()
        
        # Update database
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        try:
            # Update current status
            c.execute('''
                UPDATE bike_status 
                SET latitude = ?, longitude = ?, last_updated = CURRENT_TIMESTAMP
                WHERE id = 1
            ''', (lat, lng))
            
            # Add to location history
            c.execute('''
                INSERT INTO location_history (latitude, longitude)
                VALUES (?, ?)
            ''', (lat, lng))
            
            conn.commit()
            
            # Update location in Firebase for all users
            if firebase_enabled:
                try:
                    # Get all users
                    users_ref = db.collection('users')
                    users = users_ref.stream()
                    
                    # Update bikeData for each user
                    for user in users:
                        user_id = user.id
                        db.collection('users').document(user_id).update({
                            'bikeData.currentLocation': {
                                'lat': lat,
                                'lng': lng
                            },
                            'bikeData.lastUpdated': firestore.SERVER_TIMESTAMP
                        })
                        
                        # Add to location history
                        db.collection('users').document(user_id).collection('locationHistory').add({
                            'lat': lat,
                            'lng': lng,
                            'timestamp': firestore.SERVER_TIMESTAMP
                        })
                except Exception as e:
                    print(f"Error updating location in Firebase: {e}")
            
            # Emit update via Socket.IO
            socketio.emit('bike_data', bike_data)
            
            return jsonify({"success": True})
        except Exception as e:
            return jsonify({"success": False, "error": str(e)}), 500
        finally:
            conn.close()
    else:
        return jsonify({"success": False, "error": "Missing lat or lng parameter"}), 400

# Alarm control endpoints
@app.route('/api/trigger-alarm', methods=['POST'])
def trigger_alarm():
    # Update in-memory data
    bike_data["is_alarm_active"] = True
    bike_data["last_updated"] = datetime.now().isoformat()
    
    # Update database
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE bike_status 
            SET is_alarm_active = 1, last_updated = CURRENT_TIMESTAMP
            WHERE id = 1
        ''')
        conn.commit()
        
        # Create notification
        c.execute('''
            INSERT INTO notifications (message, type)
            VALUES (?, ?)
        ''', ("Alarm triggered", "alarm"))
        conn.commit()
        notification_id = c.lastrowid
        
        notification_data = {
            'id': notification_id,
            'message': "Alarm triggered",
            'type': "alarm",
            'timestamp': datetime.now().isoformat()
        }
        
        # Store in Firebase
        user_id = request.args.get('user_id')
        if user_id:
            store_notification_in_firebase(notification_data, user_id)
        
        # Emit update via Socket.IO
        socketio.emit('bike_data', bike_data)

        if user_id:
            socketio.emit('new_notification', notification_data, room=user_id)
        else:
            socketio.emit('new_notification', notification_data)
        
        return jsonify({"success": True, "message": "Alarm triggered"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()

@app.route('/api/stop-alarm', methods=['POST'])
def stop_alarm():
    # Update in-memory data
    bike_data["is_alarm_active"] = False
    bike_data["last_updated"] = datetime.now().isoformat()
    
    # Update database
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    try:
        c.execute('''
            UPDATE bike_status 
            SET is_alarm_active = 0, last_updated = CURRENT_TIMESTAMP
            WHERE id = 1
        ''')
        conn.commit()
        
        # Create notification
        c.execute('''
            INSERT INTO notifications (message, type)
            VALUES (?, ?)
        ''', ("Alarm stopped", "info"))
        conn.commit()
        notification_id = c.lastrowid
        
        notification_data = {
            'id': notification_id,
            'message': "Alarm stopped",
            'type': "info",
            'timestamp': datetime.now().isoformat()
        }
        
        # Store in Firebase
        user_id = request.args.get('user_id')
        if user_id:
            store_notification_in_firebase(notification_data, user_id)
        
        # Emit update via Socket.IO
        socketio.emit('bike_data', bike_data)

        if user_id:
            socketio.emit('new_notification', notification_data, room=user_id)
        else:
            socketio.emit('new_notification', notification_data)
        
        return jsonify({"success": True, "message": "Alarm stopped"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
    finally:
        conn.close()

# Socket.IO events
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Get user ID from request args or session
    user_id = request.args.get('user_id')
    if user_id:
        # Join the user to a room with their user_id
        join_room(user_id)
        print(f"User {user_id} joined their personal room")
    emit('bike_data', bike_data)

@socketio.on('disconnect')
def handle_disconnect():
    user_id = request.args.get('user_id')
    if user_id:
        leave_room(user_id)
        print(f"User {user_id} left their personal room")
    print('Client disconnected')

# Simulate moving bike when no actual GPS is available
def simulate_movement():
    while True:
        # Small random movement around San Francisco
        current_lat = bike_data["location"]["lat"]
        current_lng = bike_data["location"]["lng"]
        
        # Generate small random movement (approximately within ~10-100 meters)
        lat_change = (random.random() - 0.5) * 0.001
        lng_change = (random.random() - 0.5) * 0.001
        
        new_lat = current_lat + lat_change
        new_lng = current_lng + lng_change
        
        # Update location
        conn = sqlite3.connect('database.db')
        c = conn.cursor()
        try:
            # Update current status
            c.execute('''
                UPDATE bike_status 
                SET latitude = ?, longitude = ?, last_updated = CURRENT_TIMESTAMP
                WHERE id = 1
            ''', (new_lat, new_lng))
            
            # Add to location history
            c.execute('''
                INSERT INTO location_history (latitude, longitude)
                VALUES (?, ?)
            ''', (new_lat, new_lng))
            
            conn.commit()
            
            # Update in-memory data
            bike_data["location"]["lat"] = new_lat
            bike_data["location"]["lng"] = new_lng
            bike_data["last_updated"] = datetime.now().isoformat()
            
            # Update Firebase for all users
            if firebase_enabled:
                try:
                    # Get all users
                    users_ref = db.collection('users')
                    users = users_ref.stream()
                    
                    # Update bikeData for each user
                    for user in users:
                        user_id = user.id
                        db.collection('users').document(user_id).update({
                            'bikeData.currentLocation': {
                                'lat': new_lat,
                                'lng': new_lng
                            },
                            'bikeData.lastUpdated': firestore.SERVER_TIMESTAMP
                        })
                        
                        # Add to location history
                        db.collection('users').document(user_id).collection('locationHistory').add({
                            'lat': new_lat,
                            'lng': new_lng,
                            'timestamp': firestore.SERVER_TIMESTAMP
                        })
                except Exception as e:
                    print(f"Error updating location in Firebase during simulation: {e}")
            
            # Emit update via Socket.IO
            socketio.emit('bike_data', bike_data)
            
        except Exception as e:
            print(f"Error simulating movement: {e}")
        finally:
            conn.close()
        
        # Wait before next update (30 seconds)
        time.sleep(30)

if __name__ == '__main__':
    init_db()
    load_bike_data()
    ip = get_ip()
    print(f"Server running on http://{ip}:5001")
    
    # Start simulation in a background thread
    simulation_thread = threading.Thread(target=simulate_movement, daemon=True)
    simulation_thread.start()
    
    socketio.run(app, host='0.0.0.0', port=5001, debug=True, allow_unsafe_werkzeug=True)