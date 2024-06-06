// MultiSlew&Snap.js
// Modern Eddington Experiment 2024


/* Script for targeting the moon (calibration before and after). The script takes images of 4 sections of the moon, with the number of images, exposure times, and delay before the first calibration image being adjustable variables.
Wide-angle camera script. Targets the moon with calibration images before and after.
The script takes multiple exposures at specified RA and Dec offsets.
Calibration images are taken 5 degrees east before and 5 degrees west after the main sequence.
This script can be easily adapted for different pointing patterns.
The saved files end with the target name and a suffix indicating the pointings.
BEFORE RUNNING: SET THE DIRECTORY/FOLDER WHERE FILES WILL BE SAVED!
*/


var TargName = "Moon"; // Give the images a logical name
var RAoffset = 1; // SET RA OFFSET in degrees. Camera is 2 x 2.5 degrees
var Decoffset = 1.25; // SET Dec OFFSET in degrees
var CalibRAoffset = 5 / 15; // SET RA OFFSET for calibration images in hours (5 degrees)
var CalibDecoffset = 5; // SET Dec OFFSET for calibration images in degrees
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
// Get the time difference given a start and end time, will fail if the start and end times are during different months
function TimeDifference(Start, End){
	var Output = [End[0] - Start[0], End[1] - Start[1], End[2] - Start[2], End[3] - Start[3], End[4] - Start[4], End[5] - Start[5]]
	while (Output[5] < 0){
		Output[5] += 60;
		Output[4] -= 1;
	}
	while (Output[4] < 0){
		Output[4] += 60;
		Output[3] -= 1;
	}
	while (Output[3] < 0){
		Output[3] += 24;
		Output[2] -= 1;
	}
	return(Output)
}

/////////////////////////////////////////////////////////////////////
// Gets the current time, returns it as an array of 6 values
function GetTime(){
        Sky6Object.DocumentProperty(9);
        sky6Utils.ConvertJulianDateToCalender(Sky6Object.DocPropOut);
        var OutputTime = [sky6Utils.dOut0, sky6Utils.dOut1, sky6Utils.dOut2, sky6Utils.dOut3, sky6Utils.dOut4, sky6Utils.dOut5];
        return OutputTime;
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
var StartTime = GetTime();
Mount.SlewToRaDec(moonRA + CalibRAoffset, moonDec, TargName + "_CalibBefore");
var EndTime = GetTime();
var FirstCalibrationSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargName + "_CalibBefore" + " | Slew time: " + FirstCalibrationSlewTime[4] + ":" + FirstCalibrationSlewTime[5]);
sleep(calibrationDelay * 1000); // Wait for calibrationDelay seconds before the first calibration image
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

// Target the center of the moon first
var StartTime = GetTime();
Mount.SlewToRaDec(moonRA, moonDec, TargName + "_Center");
var EndTime = GetTime();
var MoonCenterSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargName + "_Center" + " | Slew time: " + MoonCenterSlewTime[4] + ":" + MoonCenterSlewTime[5]);
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

// Target the four corners of the moon
var StartTime = GetTime();
Mount.SlewToRaDec(moonRA + RAoffset, moonDec + Decoffset, TargName + "_NE");
var EndTime = GetTime();
var NESlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargName + "_NE" + " | Slew time: " + NESlewTime[4] + ":" + NESlewTime[5]);
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

var StartTime = GetTime();
Mount.SlewToRaDec(moonRA - RAoffset, moonDec + Decoffset, TargName + "_NW");
var EndTime = GetTime();
var NWSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargName + "_NW" + " | Slew time: " + NWSlewTime[4] + ":" + NWSlewTime[5]);
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

var StartTime = GetTime();
Mount.SlewToRaDec(moonRA + RAoffset, moonDec - Decoffset, TargName + "_SE");
var EndTime = GetTime();
var SESlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargName + "_SE" + " | Slew time: " + SESlewTime[4] + ":" + SESlewTime[5]);
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

var StartTime = GetTime();
Mount.SlewToRaDec(moonRA - RAoffset, moonDec - Decoffset, TargName + "_SW");
var EndTime = GetTime();
var SWSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargName + "_SW" + " | Slew time: " + SWSlewTime[4] + ":" + SWSlewTime[5]);
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

// Take a calibration image after moon images
var StartTime = GetTime();
Mount.SlewToRaDec(moonRA - CalibRAoffset, moonDec, TargName + "_CalibAfter");
var EndTime = GetTime();
var SecondCalibrationSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargName + "_CalibAfter" + " | Slew time: " + SecondCalibrationSlewTime[4] + ":" + SecondCalibrationSlewTime[5]);
TakeMultiPhoto(multi, exposureTime1);
TakeMultiPhoto(multi, exposureTime2);

// Output all of the slew times
/*
logOutput("Timed slew complete. Cap telescope and proceed to take dark frames.");
logOutput("Slew times:")
logOutput("First calibration field: " + FirstCalibrationSlewTime[4] + ":" + FirstCalibrationSlewTime[5]);
logOutput("Moon center: " + MoonCenterSlewTime[4] + ":" + MoonCenterSlewTime[5]);
logOutput("North east: " + NESlewTime[4] + ":" + NESlewTime[5]);
logOutput("North west: " + NWSlewTime[4] + ":" + NWSlewTime[5]);
logOutput("South east: " + SESlewTime[4] + ":" + SESlewTime[5]);
logOutput("South west: " + SWSlewTime[4] + ":" + SWSlewTime[5]);
logOutput("Second calibration field: " + SecondCalibrationSlewTime[4] + ":" + SecondCalibrationSlewTime[5]);
*/

}
SlewAndSnap();
logOutput("Done.");