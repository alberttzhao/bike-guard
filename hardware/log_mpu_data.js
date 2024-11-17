const { spawn } = require('child_process'); //library that starts the python script
const fs = require('fs');
const path = require('path');


//const express = require ('express');
//const app = express();
//const port = 3000;

//app.use(express.json());

// Path to the Python script
const pythonScriptPath = path.join(__dirname, 'accelerometer.py');

// Path to the log file
//const logFilePath = path.join(__dirname, 'mpu_data_log.txt');

// Create a write stream for logging data
//const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Function to log data from Python script
//function logDataFromPython() {
    // Spawn a child process to run the Python script
    //const pythonProcess = spawn('python3', [pythonScriptPath]);

    // Listen to data events on stdout
    //pythonProcess.stdout.on('data', (data) => {
        //const output = data.toString();  // Convert buffer to string
        //console.log(output);             // Print output to the console
        //logStream.write(output);         // Write output to the log file
    //});

    // Listen for errors from the Python script
    //pythonProcess.stderr.on('data', (error) => {
        //console.error(`Error: ${error}`);
    //});

    // Listen for the script to close
    //pythonProcess.on('close', (code) => {
        //console.log(`Python script exited with code ${code}`);
        //logStream.end();  // Close the file stream
    //});
//}

// Start logging data
//logDataFromPython();
const csvFilePath = path.join(__dirname, 'mpu_data_log.csv');
const csvStream = fs.createWriteStream(csvFilePath, { flags: 'a' });

// Function to log data from Python script to CSV
function logDataToCSV() {
    const pythonProcess = spawn('python3', [pythonScriptPath]);

    pythonProcess.on('error', (err) => {
        console.error('Failed to start child process:', err);
      });

    pythonProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log(output);
        const csvData = output.trim() + '\n';// Convert space-separated data to CSV format
        print(csvData);
        console.log(csvData);
        csvStream.write(csvData);
    });


    pythonProcess.stderr.on('data', (error) => {
        console.error(`Error: ${error}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`Python script exited with code ${code}`);
        csvStream.end();
    });
}

// Start logging data to CSV
logDataToCSV();
console.log('Data logging started...');