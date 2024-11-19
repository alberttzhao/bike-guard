import smbus
import time
import math
import requests
import sys
import gpiozero
from gpiozero import Buzzer
from time import sleep

# Keep your existing MPU-6050 code...

def send_notification(message):
    try:
        response = requests.post(
            'http://localhost:5000/api/notifications',
            json={
                'message': message,
                'type': 'movement'
            }
        )
        if response.status_code == 201:
            print("Notification sent successfully")
        else:
            print(f"Failed to send notification: {response.status_code}")
    except Exception as e:
        print(f"Error sending notification: {e}")

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

# Initialize MPU
init_mpu()

# Collect data
try:
    while True:
        data = read_mpu_data()
        pitch, roll = calculate_pitch_roll(data["accel"])
        
        #data adapted to work well for csv 
        print(f"{data['accel']['x']:.2f}, {data['accel']['y']:.2f}, {data['accel']['z']:.2f}, {data['gyro']['x']:.2f}, {data['gyro']['y']:.2f}, {data['gyro']['z']:.2f}, {pitch:.2f}, {roll:.2f}")
        sys.stdout.flush()  # Add this line to flush the output buffer

        time.sleep(1)
except KeyboardInterrupt:
    print("Measurement stopped by User")
