import RPi.GPIO as GPIO
import time
import subprocess



GPIO.setmode(GPIO.BCM)
SWITCH_GPIO = 27
GPIO.setup(SWITCH_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP)


process = None

def start_script():
    global process
    if process is None:
        print("Switch ON - starting accelerometer.py...")
        process = subprocess.Popen(["sudo","python3", "/home/Prova/bike-guard/hardware/accelerometer.py"])
    else:
        print("Script is already running.")

def stop_script():
    global process
    if process:
        print("Switch OFF - stopping accelerometer.py...")
        process.terminate()  # Gracefully terminate the process
        try:
            process.wait(timeout=5)  # Wait for the process to terminate
        except subprocess.TimeoutExpired:
            print("Process did not stop in time, forcing termination...")
            process.kill()  # Kill the process if it's still running after timeout
        process = None
    else:
        print("No process to stop.")

try:
    last_state = GPIO.input(SWITCH_GPIO)
    while True:
        current_state = GPIO.input(SWITCH_GPIO)
        if current_state != last_state:
            if current_state == GPIO.LOW:  # Switch is ON
                start_script()
            else:  # Switch is OFF
                stop_script()
                
            last_state = current_state
        time.sleep(0.1)
except KeyboardInterrupt:
    stop_script()
finally:
    GPIO.cleanup()


