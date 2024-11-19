import cv2

# Open the camera using the v4l2 backend
camera = cv2.VideoCapture(0, cv2.CAP_V4L2)  # Explicitly use Video4Linux backend

if not camera.isOpened():
    print("Error: Could not open camera.")
    exit()

try:
    # Capture a single frame
    ret, frame = camera.read()
    if ret:
        # Save the frame as an image
        cv2.imwrite('/home/Team8/Desktop/image.jpg', frame)
        print("Image captured!")
    else:
        print("Error: Failed to capture image.")

finally:
    # Release the camera
    camera.release()
