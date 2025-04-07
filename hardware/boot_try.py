#!/usr/bin/env python3
import RPi.GPIO as GPIO
import time
import subprocess
import os
import signal

GPIO.setmode(GPIO.BCM)
SWITCH_GPIO = 27
GPIO.setup(SWITCH_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP)

process = None  # Will hold the accelerometer.py process

def start_script():
    global process
    if process is None:
        print("Switch ON -- starting accelerometer.py...")
        process = subprocess.Popen(["python3", "/home/pi/accelerometer.py"])

def stop_script():
    global process
    if process:
        print("Switch OFF -- stopping accelerometer.py...")
        process.terminate()
        try:
            process.wait(timeout=5)
        except subprocess.TimeoutExpired:
            process.kill()
        process = None

try:
    last_state = GPIO.input(SWITCH_GPIO)
    if last_state == GPIO.LOW:
        start_script()

    while True:
        current_state = GPIO.input(SWITCH_GPIO)
        if current_state != last_state:
            if current_state == GPIO.LOW:
                start_script()
            else:
                stop_script()
            last_state = current_state
        time.sleep(0.1)
except KeyboardInterrupt:
    stop_script()
finally:
    GPIO.cleanup()