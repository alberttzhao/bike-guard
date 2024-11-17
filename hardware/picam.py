import cv2

# Open the camera using libcamera
camera = cv2.VideoCapture(0)  # '0' is the default camera device index

if not camera.isOpened():
    print("Error: Could not open camera.")
    exit()

try:
    # Capture a single frame
    ret, frame = camera.read()
    if ret:
        # Save the frame as an image
        cv2.imwrite('/home/pi/Desktop/image.jpg', frame)
        print("Image captured!")
    else:
        print("Error: Failed to capture image.")

finally:
    # Release the camera
    camera.release()
