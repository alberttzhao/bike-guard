from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import sqlite3
import os

app = Flask(__name__)
CORS(app)  # This allows your React frontend to connect

# Database initialization
def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            message TEXT NOT NULL,
            type TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Create a notification
@app.route('/api/notifications', methods=['POST'])
def create_notification():
    data = request.json
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    
    try:
        c.execute('''
            INSERT INTO notifications (message, type)
            VALUES (?, ?)
        ''', (data['message'], data.get('type', 'movement')))
        conn.commit()
        notification_id = c.lastrowid
        
        # Fetch the created notification
        c.execute('SELECT * FROM notifications WHERE id = ?', (notification_id,))
        notification = c.fetchone()
        
        return jsonify({
            'id': notification[0],
            'message': notification[1],
            'type': notification[2],
            'timestamp': notification[3]
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

# Get all notifications
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

if __name__ == '__main__':
    init_db()  # Initialize database on startup
    app.run(host='0.0.0.0', port=5001, debug=True)