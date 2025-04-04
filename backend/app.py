from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from datetime import datetime
import sqlite3
import socket
import json
import threading
import time
import random
import socketio
import firebase_admin
from firebase_admin import credentials, firestore

# Initialize Firebase with your service account credentials
# You'll need to create a serviceAccountKey.json from your Firebase console
try:
    cred = credentials.Certificate('../backend/bike-guard-2025-firebase-adminsdk-fbsvc-6f53d1a6af.json')  # Adjust path as needed
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    firebase_enabled = True
    print("Firebase initialized successfully")
except Exception as e:
    firebase_enabled = False
    print(f"Firebase initialization failed: {e}")
    print("Continuing without Firebase integration")

app = Flask(__name__)
CORS(app)
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
            VALUES (1, 37.7749, -122.4194, 100, 1, 0)
        ''')
    
    conn.commit()
    conn.close()

# Bike data state (in-memory for quick access)
bike_data = {
    "location": {"lat": 37.7749, "lng": -122.4194},  # Default to San Francisco
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
def store_notification_in_firebase(notification_data):
    if not firebase_enabled:
        print("Firebase not enabled, skipping Firestore update")
        return False
    
    try:
        # Get all users from Firebase to send them the notification
        users_ref = db.collection('users')
        users = users_ref.stream()
        
        # Format notification data for Firestore
        firebase_notification = {
            'message': notification_data['message'],
            'type': notification_data['type'],
            'timestamp': firestore.SERVER_TIMESTAMP,
            'read': False
        }
        
        # Add the notification to each user's collection
        for user in users:
            user_id = user.id
            db.collection('users').document(user_id).collection('notifications').add(firebase_notification)
            print(f"Notification added to user {user_id}")
        
        return True
    except Exception as e:
        print(f"Error storing notification in Firebase: {e}")
        return False

# Notifications endpoints
@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    # Get user_id from request parameter if provided
    user_id = request.args.get('user_id')
    print(f"GET /api/notifications - User ID: {user_id}")
    
    # If user_id is provided and Firebase is enabled, get notifications from Firebase
    if user_id and firebase_enabled:
        try:
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
            # Fall back to SQLite
            print("Falling back to SQLite database")
    
    # Fall back to SQLite database
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
        
@app.route('/api/video-feed')
def video_feed():
    # This function seems to be missing implementation
    # You would need to implement generate_frames()
    # For now, return a placeholder response
    return Response("Video feed not implemented", mimetype='text/plain')

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
        store_notification_in_firebase(notification_data)
        
        # Emit update via Socket.IO
        socketio.emit('bike_data', bike_data)
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
        store_notification_in_firebase(notification_data)
        
        # Emit update via Socket.IO
        socketio.emit('bike_data', bike_data)
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
    emit('bike_data', bike_data)

@socketio.on('disconnect')
def handle_disconnect():
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