import cv2
from flask import Flask, Response
import socket
import logging
import threading

app = Flask(__name__)

# Initialize the camera
camera = cv2.VideoCapture(0)

# Adding streaming route
@app.route('/video_stream')
def video_stream():
    def generate():
        while True:
            success, frame = camera.read()
            if not success:
                break
            else:
                ret, buffer = cv2.imencode('.jpg', frame)
                # Convert the frame to bytes
                frame = buffer.tobytes()
                # Yield the frame in a format that Flask can stream
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')

    return Response(generate(), mimetype='multipart/x-mixed-replace; boundary=frame')

# Function to get the actual IP address of the system
def get_ip_address():
    try:
        # Create a dummy socket to get the IP address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        # We don't need a real connection, just to know the IP used for routing
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception as e:
        print(f"Error getting IP address: {e}")
        return '127.0.0.1'

def print_video_stream_url(host, port):
    print(f"Video streaming is available at: http://{host}:{port}/video_stream")

if __name__ == "__main__":
    # Dynamically get the host IP address
    host = get_ip_address()
    port = 8000

    # Suppress all Flask logging output (including startup messages)
    log = logging.getLogger('werkzeug')
    log.disabled = True

    # Disable Flask's built-in logging completely
    app.logger.disabled = True

    # Suppress warnings about production use
    import warnings
    warnings.filterwarnings("ignore", category=UserWarning, module='flask')

    # Print the video stream URL in a new thread
    threading.Thread(target=print_video_stream_url, args=(host, port), daemon=True).start()

    # Start the Flask app silently
    app.run(host='0.0.0.0', port=port, debug=False)
