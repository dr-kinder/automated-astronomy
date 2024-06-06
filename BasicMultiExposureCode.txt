// Modern Eddington Experiment 2024
// Basic Multi-Exposure Code
// 2024-05-30

/* This script captures photos at different exposures.
It connects to a camera, sets different exposure times, and captures photos.
BEFORE RUNNING: ENSURE YOUR CAMERA IS CONNECTED AND ACCESSIBLE VIA JAVASCRIPT APIs!
*/


var exposureTimes = [0.01, .02, .03, .04]; // SET YOUR DESIRED EXPOSURE TIMES IN SECONDS
var photoCount = exposureTimes.length;
var Imager = ccdsoftCamera;
/////////////////////////////////////////////////////////////////////
// Write to the JavaScript output window and a text log file
function logOutput(logText) {
RunJavaScriptOutput.writeLine(logText);
TextFile.write(logText);
}
/////////////////////////////////////////////////////////////////////


// Connect to the camera
function connectCamera() {
try {
Imager.Autoguider = 0;
Imager.Asynchronous = 0;
Imager.Autosave = 1;
Imager.Connect();
Imager.BinX = 1;
Imager.BinY = 1;
logOutput("Camera is connected.");
} catch(e) {
throw new Error("No connection to the main imager!");
}
}


/////////////////////////////////////////////////////////////////////
// Take a photo with a specific exposure time
function takePhoto(exposureTime, photoName) {
try {
Imager.ExposureTime = exposureTime;
Imager.Delay = 0;
Imager.ImageReduction = 0; // No image reduction (like dark frame subtraction)
Imager.PathToFITS = photoName;
Imager.TakeImage();
logOutput("Photo " + photoName + " taken with " + exposureTime + " seconds exposure.");
} catch(e) {
logOutput("Error taking photo: " + e.message);
}
}
/////////////////////////////////////////////////////////////////////


// Capture photos at different exposures
function capturePhotosAtDifferentExposures() {
connectCamera();
for (var i = 0; i < photoCount; i++) {
var exposureTime = exposureTimes[i];
var photoName = "C:/Path/To/Save/Directory/Photo_" + (i + 1) + "_Exposure_" + exposureTime + "s.fits";
takePhoto(exposureTime, photoName);
}
logOutput("All photos captured.");
}
// Start the process
capturePhotosAtDifferentExposures();
logOutput("Done.");