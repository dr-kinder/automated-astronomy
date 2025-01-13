// -----------------------------------------------------------------------------
// moon-left-right-150ms.js
// -----------------------------------------------------------------------------
// Slewing script for the moon.
// ----------------------------
// The script takes 2 sets of images near the moon: to the left and the right,
// centered on the moon.  It will take 100 frames at 150ms exposures at each
// location, for a total exposure of 30 seconds.  The angle offsets are for a
// ZWO 1600, with a field of view of 140' x 106' = 2.33° x 1.76°.  The saved
// files end with the target name and a suffix indicating the pointings.
// ----------------------------------------------------------------------------- 
// BEFORE RUNNING: SET THE DIRECTORY/FOLDER WHERE FILES WILL BE SAVED!
// ----------------------------------------------------------------------------- 

// -----------------------------------------------------------------------------
// Set up the box parameters.
// ----------------------------------------------------------------------------- 
var TargetName = "Moon";                // Identify target for TheSkyX.
var DataName = "moon-left-right-150ms"; // Give the output files a logical name.
var RAOffset = 0.8;                     // SET RA OFFSET in degrees.
var DecOffset = 0.8;                    // SET Dec OFFSET in degrees.
RAOffset = RAOffset / 15;               // Convert to hours.
DecOffset = DecOffset;                  // Degrees remain the same.

// -----------------------------------------------------------------------------
// Set up the camera.
// ----------------------------------------------------------------------------- 
var Imager = ccdsoftCamera;     // From TheSkyX: don't change.
var Mount = sky6RASCOMTele;     // From TheSkyX: don't change.
var Sky6Object = sky6StarChart; // From TheSkyX: don't change.
var ExposureDelay = 0.001;      // SET the delay between exposures in seconds.
var ExposureTime = 0.150;       // SET the EXPOSURE in seconds (150 ms).
var FrameCount = 100;           // SET the FRAMECOUNT (number of images).

// -----------------------------------------------------------------------------
// Write to the JavaScript output window and a text log file
// ----------------------------------------------------------------------------- 
function logOutput(logText) {
RunJavaScriptOutput.writeLine(logText);
TextFile.write(logText);
}

// -----------------------------------------------------------------------------
// Get the time difference given a start and end time.  Will fail if the
// start and end times are during different months.
// ----------------------------------------------------------------------------- 
function TimeDifference(Start, End){
	var Output = [End[0] - Start[0], End[1] - Start[1], End[2] - Start[2],
	              End[3] - Start[3], End[4] - Start[4], End[5] - Start[5]]
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

// -----------------------------------------------------------------------------
// Gets the current time, returns it as an array of 6 values
// ----------------------------------------------------------------------------- 
function GetTime(){
        Sky6Object.DocumentProperty(9);
        sky6Utils.ConvertJulianDateToCalender(Sky6Object.DocPropOut);
		var OutputTime = [sky6Utils.dOut0, sky6Utils.dOut1, sky6Utils.dOut2,
						  sky6Utils.dOut3, sky6Utils.dOut4, sky6Utils.dOut5];
        return OutputTime;
    }

// -----------------------------------------------------------------------------
// Function to pause for a given number of milliseconds
// ----------------------------------------------------------------------------- 
function sleep(ms) {
var start = new Date().getTime();
var end = start;
while (end < start + ms) {
end = new Date().getTime();
}
}

// -----------------------------------------------------------------------------
// Take FrameCount images at this pointing.
// ----------------------------------------------------------------------------- 
function TakeMultiPhoto(FrameCount, ExposureTime) {
for (var i = 0; i < FrameCount; ++i) {
Imager.Connect();
Imager.Asynchronous = 0;
Imager.ExposureTime = ExposureTime;
Imager.TakeImage();
sleep(ExposureDelay * 1000); // Wait for ExposureDelay seconds
}
}

// -----------------------------------------------------------------------------
// This function targets the moon and takes images.
// ----------------------------------------------------------------------------- 
function SlewAndSnap() {
var TimeZero = GetTime();

// Target the center of the moon first
var StartTime = GetTime();
Mount.SlewToRaDec(MoonRA, MoonDec, DataName + "-initial");
var EndTime = GetTime();
var MoonInitialSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargetName + "_Start" + " | Slew time: " + MoonInitialSlewTime[4] + ":" + MoonInitialSlewTime[5]);

// Target the four corners of the moon and take photos.
// Left = -RA
var StartTime = GetTime();
Mount.SlewToRaDec(MoonRA - RAOffset, MoonDec, DataName + "-0l");
var EndTime = GetTime();
var LLSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargetName + "_0L" + " | Slew time: " + LLSlewTime[4] + ":" + LLSlewTime[5]);
TakeMultiPhoto(FrameCount, ExposureTime);

// Right = +RA
var StartTime = GetTime();
Mount.SlewToRaDec(MoonRA + RAOffset, MoonDec, DataName + "-0r");
var EndTime = GetTime();
var RRSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargetName + "_0R" + " | Slew time: " + RRSlewTime[4] + ":" + RRSlewTime[5]);
TakeMultiPhoto(FrameCount, ExposureTime);

// Return to moon.
var StartTime = GetTime();
Mount.SlewToRaDec(MoonRA, MoonDec, DataName + "-final");
var EndTime = GetTime();
var MoonFinalSlewTime = TimeDifference(StartTime,EndTime);
logOutput(TargetName + "_Final" + " | Slew time: " + MoonFinalSlewTime[4] + ":" + MoonFinalSlewTime[5]);

// Compute total operation time.
var TimeFinal = GetTime();
var TotalTime = TimeDifference(TimeZero,TimeFinal);

// Output all of the slew times
logOutput("------------");
logOutput("Slew times")
logOutput("------------");
logOutput("Moon start: " + MoonInitialSlewTime[4] + ":" + MoonInitialSlewTime[5]);
logOutput("0L: " + LLSlewTime[4] + ":" + LLSlewTime[5]);
logOutput("0R: " + RRSlewTime[4] + ":" + RRSlewTime[5]);
logOutput("Moon final: " + MoonFinalSlewTime[4] + ":" + MoonFinalSlewTime[5]);
logOutput("------------");
logOutput("Total Time: " + TotalTime[4] + ":" + TotalTime[5]);
logOutput("------------");
}

// -----------------------------------------------------------------------------
// Start slewing and image collection.
// ----------------------------------------------------------------------------- 
logOutput("150ms left-right protocol running.");

// -----------------------------------------------------------------------------
// Make sure we are connected to the mount.
// ----------------------------------------------------------------------------- 
try {
Mount.Connect();
Mount.Asynchronous = 0;
} catch (e) {
throw new Error("No connection to the mount!");
}
logOutput("Mount is connected.")

// -----------------------------------------------------------------------------
// Make sure we are connected to the imager.
// ----------------------------------------------------------------------------- 
try {
Imager.Autoguider = 0;
Imager.Asynchronous = 0;
Imager.Autosave = 1;
Imager.Delay = ExposureDelay;
Imager.Connect();
Imager.BinX = 1;
Imager.BinY = 1;
} catch (e) {
throw new Error("No connection to the main imager!");
}
logOutput("Camera is connected.");

// -----------------------------------------------------------------------------
// Center on the moon using StarChart.Find and sky6ObjectInformation
// ----------------------------------------------------------------------------- 
try {
Sky6Object.Find(TargetName);
logOutput("Located object: " + TargetName);
// Fetch the RA and Dec of the moon
sky6ObjectInformation.Property(54); // RA
var MoonRA = sky6ObjectInformation.ObjInfoPropOut;
sky6ObjectInformation.Property(55); // Dec
var MoonDec = sky6ObjectInformation.ObjInfoPropOut;
logOutput("Moon located at RA: " + MoonRA + ", Dec: " + MoonDec);
} catch (e) {
logOutput("Error: Cannot locate the Moon! " + e.message);
throw new Error("Cannot locate the Moon!");
}

// -----------------------------------------------------------------------------
// Slew and take photos.
// ----------------------------------------------------------------------------- 
SlewAndSnap();

// -----------------------------------------------------------------------------
// Wrap up.
// ----------------------------------------------------------------------------- 
logOutput("Timed slew complete. Cap telescope and proceed to take dark frames.");
logOutput("Done.");
