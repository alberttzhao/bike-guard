import RPi.GPIO as GPIO
import time

SWITCH_GPIO = 27  # Change this to the GPIO pin you're using

GPIO.setmode(GPIO.BCM)
GPIO.setup(SWITCH_GPIO, GPIO.IN, pull_up_down=GPIO.PUD_UP)

print("Monitoring switch... (Press Ctrl+C to stop)")
try:
    while True:
        input_state = GPIO.input(SWITCH_GPIO)
        if input_state == False:
            print("Switch CLOSED (pressed or toggled ON)")
        else:
            print("Switch OPEN")
        time.sleep(0.5)
except KeyboardInterrupt:
    GPIO.cleanup()
    print("\nStopped and cleaned up.")