import smbus
from smbus2 import SMBus

import time
import math
import requests
import sys
import gpiozero
from gpiozero import Buzzer
from time import sleep
import RPi.GPIO as GPIO
import time

#adding some stuff for csv file 
import subprocess
import os
import csv

from flask import Flask, Response
from picamera2 import Picamera2
from io import BytesIO
from PIL import Image

from flask_socketio import SocketIO, emit

# threading
import threading


# Replace with your laptop's IP address where Flask is running
BACKEND_URL = "http://128.197.180.200:5001"

# Define the MPU-6050 I2C address and registers
MPU6050_ADDRESS = 0x68
PWR_MGMT_1 = 0x6B
ACCEL_XOUT_H = 0x3B
ACCEL_YOUT_H = 0x3D
ACCEL_ZOUT_H = 0x3F
GYRO_XOUT_H = 0x43
GYRO_YOUT_H = 0x45
GYRO_ZOUT_H = 0x47

app = Flask(__name__)
socketio = SocketIO(app)

# Initialize Picamera2
picam2 = Picamera2()
picam2.configure(picam2.create_video_configuration(main={"size": (640, 480)}))
picam2.start()

buzzer_pin = 17 
GPIO.setmode(GPIO.BCM)
GPIO.setup(buzzer_pin, GPIO.OUT)

def control_buzzer(state):
    GPIO.output(buzzer_pin, state)


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

@app.route('/api/trigger-alarm', methods=['POST'])
def trigger_alarm():
    print("Alarm trigger request received.")
    control_buzzer(GPIO.HIGH)
    return {"status": "Alarm triggered"}, 200

@app.route('/api/stop-alarm', methods=['POST'])
def stop_alarm():
    print("Alarm stop request received.")
    control_buzzer(GPIO.LOW)
    return {"status": "Alarm stopped"}, 200

@socketio.on('trigger_buzzer')
def handle_buzzer_trigger():
    print("Triggering buzzer...")
    control_buzzer(GPIO.HIGH)  
    socketio.emit('buzzer_status', {'status': 'on'}) 
    print("Buzzer triggered!")
    
@socketio.on('stop_buzzer')
def handle_buzzer_stop():
    print("Stopping buzzer...")
    control_buzzer(GPIO.LOW)  
    socketio.emit('buzzer_status', {'status': 'off'})  
    print("Buzzer stopped!")




# Initialize MPU-6050
def init_mpu():
	bus.write_byte_data(MPU6050_ADDRESS, PWR_MGMT_1, 0)

# Read raw data from a register (two bytes)
def read_raw_data(register):
	high = bus.read_byte_data(MPU6050_ADDRESS, register)
	low = bus.read_byte_data(MPU6050_ADDRESS, register + 1)
	value = (high << 8) + low
	if value > 32768:
		value = value - 65536
	return value
# Main function to read accelerometer and gyroscope data

# Read MPU-5060
def read_mpu_data():

	# Read accelerometer data
	accel_x = read_raw_data(ACCEL_XOUT_H)
	accel_y = read_raw_data(ACCEL_YOUT_H)
	accel_z = read_raw_data(ACCEL_ZOUT_H)

	# Read gyroscope data
	gyro_x = read_raw_data(GYRO_XOUT_H)
	gyro_y = read_raw_data(GYRO_YOUT_H)
	gyro_z = read_raw_data(GYRO_ZOUT_H)

	print(f"Raw Accel Data: X={accel_x}, Y={accel_y}, Z={accel_z}")  # Debugging
	print(f"Raw Gyro Data: X={gyro_x}, Y={gyro_y}, Z={gyro_z}")      # Debugging

	# Convert to g and degrees per second
	accel_x /= 16384.0
	accel_y /= 16384.0
	accel_z /= 16384.0
	gyro_x /= 131.0
	gyro_y /= 131.0
	gyro_z /= 131.0

	return {
		"accel": {"x": accel_x, "y": accel_y, "z": accel_z},
		"gyro": {"x": gyro_x, "y": gyro_y, "z": gyro_z}
		}


def send_notification(message):
    try:
        response = requests.post(
            f'{BACKEND_URL}/api/notifications',
            json={
                'message': message,
                'type': 'movement'
            },
            headers={
                'Content-Type': 'application/json'
            }
        )
        if response.status_code == 201:
            print(f"Notification sent successfully to {BACKEND_URL}")
        else:
            print(f"Failed to send notification: {response.status_code}")
            print(f"Response: {response.text}")
    except Exception as e:
        print(f"Error sending notification to {BACKEND_URL}: {e}")
		
# Calculate Pitch and Roll
def calculate_pitch_roll(accel):
	ax = accel["x"]
	ay = accel["y"]
	az = accel["z"]

	pitch = math.atan2(ay, math.sqrt(ax * ax + az * az)) * (180 / math.pi)
	roll = math.atan2(-ax, az) * (180 / math.pi)

	try:
		if pitch > 5 or roll > 10:
			print("Movement detected!")
			control_buzzer(GPIO.HIGH)  # Turn buzzer on
			time.sleep(1)  # Buzzer on for 1 second
			control_buzzer(GPIO.LOW)  # Turn buzzer off
			time.sleep(1)  # Buzzer off for 1 second
			send_notification("Your bike is moving too much!")
	except KeyboardInterrupt:
		print("\nExiting program.")
		GPIO.cleanup()

	return pitch, roll

def accel_thread():
	try:
		while True:
			data = read_mpu_data()
			pitch, roll = calculate_pitch_roll(data["accel"])
			#pitch, roll = read_mpu_data
			print("pitch", pitch)
			print("roll", roll)
			#-------------- CSV file writing
			# Prepare row for CSV
			csv_row = [
				f"{data['accel']['x']:.2f}", f"{data['accel']['y']:.2f}", f"{data['accel']['z']:.2f}",
				f"{data['gyro']['x']:.2f}", f"{data['gyro']['y']:.2f}", f"{data['gyro']['z']:.2f}",
				f"{pitch:.2f}", f"{roll:.2f}"
				]
			# Write row to CSV
			with open(csv_file_path, mode="a", newline="") as file:
				writer = csv.writer(file)
				writer.writerow(csv_row)

			#----------- CSV file writing ends
			sys.stdout.flush()  # Add this line to flush the output buffer
			time.sleep(1)


	except KeyboardInterrupt:
 		print("Measurement stopped by User")

def camera_thread():
	app.run(host="0.0.0.0", port=5001, debug=False, threaded=True)



if __name__ =="__main__":

	# Initialize the I2C bus
	bus = smbus.SMBus(1)

	# initializae MPU-5060
	init_mpu()

	# ------------------ CSV file setup
	csv_file_path = "mpu_data_log.csv"
	csv_headers = ["Accel_X", "Accel_Y", "Accel_Z", "Gyro_X", "Gyro_Y", "Gyro_Z", "Pitch", "Roll"]

	# Initialize the CSV file with headers if it doesn't exist
	if not os.path.exists(csv_file_path):
		with open(csv_file_path, mode="w", newline="") as file:
			writer = csv.writer(file)
			writer.writerow(csv_headers)


	t1 = threading.Thread(target=accel_thread)
	t2 = threading.Thread(target=camera_thread)

	t1.start()
	t2.start()

	t1.join()
	t2.join()
