// MultiSlew&Snap.js
// Modern Eddington Experiment 2024
// Richard L Berry
// Release 2023-11-11T11:46:00


/* Wide-angle camera script. Target with E and W offsets.
The scale offsets are optional with wide-angle systems.
This script can easily be generalized for any desired pattern of 
pointings and offsets desired at a solar eclipse. The target coordinate
specify the location the the ecliopsed Sun. The offsets allow large-
scle dithering about the target to cover a larger field. The saved files 
end with the target name with a suffix to indicate the pointings.
BEFORE RUNNING: SET THE DIRECTORY/FOLDER WHERE FILES WILL BE SAVED!
*/
	
var TargName = "MoonProxy"; // Give the images a logical name
var TargRA = 22.2541;          // SET TARGET RA in hours  
var TargDec = -12.7341;         // SET TEAGET Dec in degrees
var RAoffset = 0.5;          // SET RA OFFSET in degrees
// var Decoffset = 0.5;         // SET Dec OFFSET in degrees
var RAscale = 8.00;          // SET SCALE OFFSET in degrees

RAoffset = RAoffset/ ; // convert to hours
RAscale= RAscale/15 ; // convert to hours

var Imager = ccdsoftCamera;
var Mount = sky6RASCOMTele;
var exposureTime = 1.0;      // SET the EXPOSURE in seconds
var exposureDelay = 0.0;
var multi = 16;              // SET the FRAMECOUNT


/////////////////////////////////////////////////////////////////////
// Write to the JavaScript output window and a text log file
function logOutput(logText)
	{
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
	}
catch(e) {
	throw new Error("No connection to the mount!");
	}
logOutput("Mount is connected.")

/////////////////////////////////////////////////////////////////////
// Make sure we are connected to the imager
try {
	//var Imager = ccdsoftCamera;
	Imager.Autoguider = 0;
	Imager.Asynchronous = 0;
	Imager.Autosave = 1;
	Imager.Delay = exposureDelay;
	Imager.ExposureTime = exposureTime;
	Imager.Connect();
	Imager.BinX = 1;
	Imager.BinY = 1;
	}
catch(e)
	{
	throw new Error("No connection to the main imager!");
	}
logOutput("Camera is connected.");

/////////////////////////////////////////////////////////////////////
// Take multi images at this pointing.
function TakeMultiPhoto(multi)
{
	for (i=0; i<multi; ++i)
	{
	Imager.Connect();
	Imager.Asynchronous = 0;
	Imager.TakeImage();
	}
}

/////////////////////////////////////////////////////////////////////
// This three-target-pointing model begins with an East pointing
// followed by a target set and two surrounding sets, usually
// including the targ well inside the frame. It ends with a West
// pointing. The east and west pointings are optional for wide-angle
// systems.
function SlewAndSnap()
{
Mount.SlewToRaDec(TargRA+RAscale, TargDec,TargName+"East");
logOutput(TargName+"East");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA, TargDec,TargName+"Center");
logOutput(TargName+"Center1");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA+RAoffset, TargDec,TargName+"-E");
logOutput(TargName+"-E");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA-RAoffset, TargDec,TargName+"-W");
logOutput(TargName+"-W");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA, TargDec,TargName+"Center2");
logOutput(TargName+"Center2");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA-RAscale, TargDec,TargName+"West");
logOutput(TargName+"West");
TakeMultiPhoto(multi);
}

SlewAndSnap();

logOutput("Done.");


