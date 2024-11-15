
// Serial port example from design pattern
// Uses ESP code in folder: serial-esp-to-node-serialport
const fs = require('fs');
const {SerialPort} = require('serialport')
const port = new SerialPort({ path: '/dev/cu.usbserial-01425FBF', baudRate: 115200 });

const {ReadlineParser} = require('@serialport/parser-readline');

const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

port.on("open", () => {
  //console.log('Serial port now open');
});
fs.writeFile("accellerometer_senior_design.csv", "", (err1) =>
{
  if (err1)
    console.log(err1);
 
});
parser.on('data', data => {
  const cleanedData = data.trim(); // Clean the incoming data
  console.log(cleanedData);

  fs.appendFile("accellerometer_senior_design.csv", cleanedData + '\n', (err) => { // Append to file
    if (err) console.log(err);
  });
});