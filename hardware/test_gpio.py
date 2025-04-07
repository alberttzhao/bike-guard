import RPi.GPIO as GPIO
import time

# Set up GPIO
GPIO.setmode(GPIO.BCM)
SWITCH_GPIO = 27
GPIO.setup(SWITCH_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP)

try:
    while True:
        input_state = GPIO.input(SWITCH_GPIO)
        print(f"GPIO27 state: {input_state}")
        time.sleep(1)  # Check every 1 second
except KeyboardInterrupt:
    GPIO.cleanup()
