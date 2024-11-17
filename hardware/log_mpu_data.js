const { spawn } = require('child_process'); //library that starts the python script
const fs = require('fs');
const path = require('path');



//app.use(express.json());

// Path to the Python script
const pythonScriptPath = path.join(__dirname, 'accelerometer.py');


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