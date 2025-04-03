from flask import Flask, Response
from picamera2 import Picamera2
import time
from io import BytesIO
from PIL import Image

# Initialize the Flask app
app = Flask(__name__)

# Initialize Picamera2
picam2 = Picamera2()
picam2.configure(picam2.create_video_configuration(main={"size": (640, 480)}))
picam2.start()

def generate_frames():
    time.sleep(1)  # Allow the camera to warm up
    while True:
        frame = picam2.capture_array()  # Capture frame as NumPy array
        image = Image.fromarray(frame).convert("RGB")  # Convert to RGB to remove alpha channel
        buffer = BytesIO()
        image.save(buffer, format="JPEG")
        frame_bytes = buffer.getvalue()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/api/video-feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/')
def index():
    return '<h1>Raspberry Pi Camera Stream</h1><img src="/api/video-feed" width="640" height="480">'


if __name__ == '__main__':
    app.run(host="128.197.180.200", port=5000, debug=False, threaded=True)

