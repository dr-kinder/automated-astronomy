// MultiSlew&Snap.js
// Modern Eddington Experiment 2024
/* Script for targeting the moon (calibration before and after). The script takes images of the left and right halves of the moon, with the number of images, exposure times, and delay before the first calibration image being adjustable variables.
Wide-angle camera script. Targets the moon with calibration images before and after.
The script takes multiple exposures at specified RA and Dec offsets.
Calibration images are taken 5 degrees east before and 5 degrees west after the main sequence.
This script can be easily adapted for different pointing patterns.
The saved files end with the target name and a suffix indicating the pointings.
BEFORE RUNNING: SET THE DIRECTORY/FOLDER WHERE FILES WILL BE SAVED!
*/


var TargName = "Moon"; // Give the images a logical name
var RAoffset = .875; // SET RA OFFSET in degrees. Camera is 2 x 2.5 degrees. Slight overlap built in
var Decoffset = 0; // No Dec offset needed for left/right halves
var CalibRAoffset = 5 / 15; // SET RA OFFSET for calibration images in hours (5 degrees)
var CalibDecoffset = 0; // No Dec offset needed for calibration images
RAoffset = RAoffset / 15; // convert to hours
Decoffset = Decoffset; // degrees remain the same

var Imager = ccdsoftCamera;
var Mount = sky6RASCOMTele;
var Sky6Object = sky6StarChart;
var exposureTime1 = 0.1; // SET the EXPOSURE in seconds (100 ms)
var exposureTime2 = 0.2; // SET the EXPOSURE in seconds (200 ms)
var exposureDelay = 0.05; // SET the delay between exposures in seconds
var calibrationDelay = 2.0; // SET the delay before the first calibration image in seconds
var multi = 2; // SET the FRAMECOUNT (number of images to take)
/////////////////////////////////////////////////////////////////////

// Write to the JavaScript output window and a text log file
function logOutput(logText) {
RunJavaScriptOutput.writeLine(logText);
TextFile.write(logText);
}

/////////////////////////////////////////////////////////////////////
logOutput("MultiSlew&Snap running");
/////////////////////////////////////////////////////////////////////

// Make sure we are connected to the mount
try {
Mount.Connect();
Mount.Asynchronous = 0;
} catch (e) {
throw new Error("No connection to the mount!");
}
logOutput("Mount is connected.")
/////////////////////////////////////////////////////////////////////

// Make sure we are connected to the imager
try {
Imager.Autoguider = 0;
Imager.Asynchronous = 0;
Imager.Autosave = 1;
Imager.Delay = exposureDelay;
Imager.Connect();
Imager.BinX = 1;
Imager.BinY = 1;
} catch (e) {
throw new Error("No connection to the main imager!");
}
logOutput("Camera is connected.");
/////////////////////////////////////////////////////////////////////

// Center on the moon using StarChart.Find and sky6ObjectInformation
try {
Sky6Object.Find(TargName);
logOutput("Located object: " + TargName);

// Fetch the RA and Dec of the moon
sky6ObjectInformation.Property(54); // RA
var moonRA = sky6ObjectInformation.ObjInfoPropOut;
sky6ObjectInformation.Property(55); // Dec
var moonDec = sky6ObjectInformation.ObjInfoPropOut;
logOutput("Moon located at RA: " + moonRA + ", Dec: " + moonDec);
} catch (e) {
logOutput("Error: Cannot locate the Moon! " + e.message);
throw new Error("Cannot locate the Moon!");
}
/////////////////////////////////////////////////////////////////////

// Function to pause for a given number of milliseconds
function sleep(ms) {
var start = new Date().getTime();
var end = start;
while (end < start + ms) {
end = new Date().getTime();
}
}
/////////////////////////////////////////////////////////////////////

// Take multi images at this pointing.
function TakeMultiPhoto(multi, exposureTime) {
for (var i = 0; i < multi; ++i) {
Imager.Connect();
Imager.Asynchronous = 0;
Imager.ExposureTime = exposureTime;
Imager.TakeImage();
sleep(exposureDelay * 1000); // Wait for exposureDelay seconds
}
}
/////////////////////////////////////////////////////////////////////

// This function targets the moon and takes calibration images
function SlewAndSnap() {

// Take a calibration image before moon images
Mount.SlewToRaDec(moonRA + CalibRAoffset, moonDec, TargName + "_CalibBefore");
logOutput(TargName + "_CalibBefore");
sleep(calibrationDelay * 1000); // Wait for calibrationDelay seconds before the first calibration image
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

// Target the center of the moon first
Mount.SlewToRaDec(moonRA, moonDec, TargName + "_Center");
logOutput(TargName + "_Center");
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

// Target the left half of the moon
Mount.SlewToRaDec(moonRA - RAoffset, moonDec, TargName + "_Left");
logOutput(TargName + "_Left");
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

// Target the right half of the moon
Mount.SlewToRaDec(moonRA + RAoffset, moonDec, TargName + "_Right");
logOutput(TargName + "_Right");
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

// Take a calibration image after moon images
Mount.SlewToRaDec(moonRA - CalibRAoffset, moonDec, TargName + "_CalibAfter");
logOutput(TargName + "_CalibAfter");
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);
}
SlewAndSnap();
logOutput("Done.");