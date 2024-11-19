import time
from flask import Flask, Response
from picamera2 import Picamera2
import io
import cv2
import numpy as np

# Initialize Flask app
app = Flask(__name__)

# Initialize the camera
picam2 = Picamera2()

# Function to capture frames and convert to JPEG
def generate_frames():
    picam2.start()
    while True:
        # Capture a frame from the camera
        frame = picam2.capture_array()

        # Convert the frame to JPEG
        _, jpeg = cv2.imencode('.jpg', frame)

        # Yield the frame as a byte stream
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + jpeg.tobytes() + b'\r\n\r\n')

@app.route('/')
def index():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    # Start the Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
