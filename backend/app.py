from flask import Flask, request, jsonify
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

# Notifications endpoints
@app.route('/api/notifications', methods=['POST'])
def create_notification():
    data = request.json
    print(f"Received notification: {data}")  # Debug print
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
        
        # Emit notification via Socket.IO
        socketio.emit('new_notification', notification_data)
        
        return jsonify(notification_data), 201
    except Exception as e:
        print(f"Error creating notification: {e}")  # Debug print
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
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
        
        return jsonify(notifications)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()
        
@app.route('/api/video-feed')
def video_feed():
    # Return the video stream response
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

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
        
        # Emit update via Socket.IO
        socketio.emit('bike_data', bike_data)
        
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
        
        # Emit update via Socket.IO
        socketio.emit('bike_data', bike_data)
        
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