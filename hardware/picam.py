import picamera
from time import sleep

# Initialize the camera
camera = picamera.PiCamera()

try:
    # Set camera properties
    camera.resolution = (1920, 1080)  # Full HD resolution
    camera.framerate = 30

    # Start camera preview
    camera.start_preview()

    # Wait before taking a picture
    sleep(5)

    # Capture an image
    camera.capture('/home/pi/Desktop/image.jpg')
    print("Image captured!")

finally:
    # Close the camera
    camera.stop_preview()
    camera.close()
