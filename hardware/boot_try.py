import RPi.GPIO as GPIO
import time
import os

SWITCH_GPIO = 17  # Change this to your GPIO pin

GPIO.setmode(GPIO.BCM)
GPIO.setup(SWITCH_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP)

def shutdown(channel):
    print("Shutting down...")
    os.system("sudo shutdown -h now")

# Detect falling edge (switch closed)
GPIO.add_event_detect(SWITCH_GPIO, GPIO.FALLING, callback=shutdown, bouncetime=2000)

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    GPIO.cleanup()
