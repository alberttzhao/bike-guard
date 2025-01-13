# Hardware Readme
This read me will cover the hardware components of BikeGuard. Note to self for future: in the future we can try to implement everything with Python.

## Components Needed
The components necessary for this project include:
- A Raspberry Pi Zero 2 W (MUST be flashed with Raspberry Pi OS 32 Bit (Legacy), Debian Bullseye)
- A 32GB SanDisk SDHC Class 10 Card
- Piezo Buzzer
- MPU-6050 (Accelerometer)
- INIU BI-B61 Portable Charger 22.5W 10000mAh Power Bank
- Raspberry Pi Camera Module V2
- TP Link Router
- Small Breadboard
- Electrical Tape
- Jumper cable
- USB-C to micro USB cable
- small heat sinks

<p align="center">
<img src="./photos/components_overview.png" width="80%">
</p>

## Set Up Explained
Our hardware setup includes a Raspberry Pi Zero 2 W, a corresponding Raspberry Pi Camera, an accelerometer, and a buzzer. We use a router to establish our own network within the broader BU wifi. We connected the Raspberry Pi to the network and are hosting all our servers on the network. We use SSH to access the Raspberry Pi remotely. We are powering the Raspberry PI with a portable power bank that is intended to charge phones and tablets. We additionally attached small heat sinks to our Raspberry Pi. Our components are in a lock box attached to the bike. The accelerometer's data are saved in a CSV file utilizing a node.js code. In this manner, the data can be used to train the machine learning model to classify possible bike theft. Once the pitch and roll reach a certain threshold while shaking, the buzzer goes off. The backend file app.py receives constant information from the raspberry pi accelerometer.py folder. If the accelerometer detects motion greater than a pre-set threshold, it sends a push request to the backend and stores the message in the SQL database. Once the front end detects new changes in the database, it displays the most recent message on our website. As for the camera live view, the Raspberry Pi already has a module to convert real video feed into mpng (different format of png), then using flask we can stream the video feed directly to the front end. 

<p align="center">
<img src="./photos/hardware_diagram.png" width="80%">
</p>



## Set Up Procedure
1. Connect and turn on the router.
2. Connect to the Raspberry Pi from the computer through ssh with the following command: ssh Team8@Raspberry_pi_IP.
3. Run the Python script  “python3 picam3.py” to start the camera and push it to the background -> ctrl + z, bg
4. Run the node JS script “node log_mpu_data.js” to start the Python code accelerometer.py which connects to the back end and saves the  accelerometer data to a CSV file. 

## Code Flow Explained
As can be seen, running the log_mpu_data.js node.js script will create a python child process called accelerometer.py. Accelerometer.py is responsible for communicating with the acceleromter and collecting accelerometer values. It then prints these values, which are grabbed by the node.js code and written to a csv file. In the future, we might move this all to one python script given that python also has capabilities to write to a csv file. 

The Pi Camera is controlled via the picam3.py code. This code generates the stream and sends data to a Flask server. 

<p align="center">
<img src="./photos/onboard_software.png" width="80%">
</p>



