import smbus
import time
import math
import requests
import sys
import gpiozero
from gpiozero import Buzzer
from time import sleep

#adding some stuff for csv file 
import subprocess
import os
import csv

#Adding some stuff for picam 
from flask import Flask, Response
import picamera
import io
from time import sleep

# Initialize the Flask app
app = Flask(__name__)

# Replace with your laptop's IP address where Flask is running
BACKEND_URL = "http://128.197.180.212:5001"

# Define the MPU-6050 I2C address and registers
MPU6050_ADDRESS = 0x68
PWR_MGMT_1 = 0x6B
ACCEL_XOUT_H = 0x3B
ACCEL_YOUT_H = 0x3D
ACCEL_ZOUT_H = 0x3F
GYRO_XOUT_H = 0x43
GYRO_YOUT_H = 0x45
GYRO_ZOUT_H = 0x47
# Initialize the I2C bus
bus = smbus.SMBus(1)
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
def read_mpu_data():
    # Read accelerometer data
    accel_x = read_raw_data(ACCEL_XOUT_H)
    accel_y = read_raw_data(ACCEL_YOUT_H)
    accel_z = read_raw_data(ACCEL_ZOUT_H)
    # Read gyroscope data
    gyro_x = read_raw_data(GYRO_XOUT_H)
    gyro_y = read_raw_data(GYRO_YOUT_H)
    gyro_z = read_raw_data(GYRO_ZOUT_H)
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

def calculate_pitch_roll(accel):
    ax = accel["x"]
    ay = accel["y"]
    az = accel["z"]
    
    pitch = math.atan2(ay, math.sqrt(ax * ax + az * az)) * (180 / math.pi)
    roll = math.atan2(-ax, az) * (180 / math.pi)
    
    buzzer = Buzzer(17)
    
    try:
        if pitch > 5 or roll > 10:
            print("Movement detected!")
            buzzer.on()  # Turn on the buzzer
            # Send notification when movement is detected
            send_notification("Your bike is moving too much!")
            sleep(1)
            buzzer.off()
    except KeyboardInterrupt:
        print("\nExiting program.")
        buzzer.off()
    
    return pitch, roll



# ------------------ CSV file setup
csv_file_path = "mpu_data_log.csv"
csv_headers = ["Accel_X", "Accel_Y", "Accel_Z", "Gyro_X", "Gyro_Y", "Gyro_Z", "Pitch", "Roll"]

# Initialize the CSV file with headers if it doesn't exist
if not os.path.exists(csv_file_path):
    with open(csv_file_path, mode="w", newline="") as file:
        writer = csv.writer(file)
        writer.writerow(csv_headers)


# ------------------ CSV file setup ends


# Initialize MPU
init_mpu()

# Collect data
try:
    while True:
        data = read_mpu_data()
        pitch, roll = calculate_pitch_roll(data["accel"])
        
        
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
        

            
        #data adapted to work well for csv 
       #print(f"{data['accel']['x']:.2f}, {data['accel']['y']:.2f}, {data['accel']['z']:.2f}, {data['gyro']['x']:.2f}, {data['gyro']['y']:.2f}, {data['gyro']['z']:.2f}, {pitch:.2f}, {roll:.2f}")
        sys.stdout.flush()  # Add this line to flush the output buffer

        time.sleep(1)
 
except KeyboardInterrupt:
    print("Measurement stopped by User")
   
 #-------------- Picam 
def generate_camera_stream():
    with picamera.PiCamera() as camera:
        # Camera warm-up time
        sleep(2)
        
        stream = io.BytesIO()
        for _ in camera.capture_continuous(stream, 'jpeg', use_video_port=True):
            stream.seek(0)
            frame = stream.read()
            
            # Use yield to return the current frame as part of the response
            yield (b'--frame\r\n'b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
                   
            # Reset stream for the next frame
            stream.seek(0)
            stream.truncate()

@app.route('/video_stream')
def video_stream():
    return Response(generate_camera_stream(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')
app.run(host='128.197.180.227', port=8000, threaded=True)

#if __name__ == '__main__':
   # app.run(host='128.197.180.227', port=8000, threaded=True)

 #-------------- Picam ends 