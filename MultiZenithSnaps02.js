// MultiZenithSnaps02.js
// Modern Eddington Experiment 2024
// Richard L Berry
//Release 2023-09-30


/* This script takes a set of zenith images for calibrating
the optical distortion pattern of the tlescope. The saved files 
end with the target name with a suffix to indicate the pointings.
BEFORE RUNNING: SET DISRECTORY/FOLDER WHERE IMAGES WILL BE SAVED!
*/
	
sky6Utils.ComputeLocalSiderealTime()

var TargName = "Zenith"; // 
var TargRA = sky6Utils.dOut0; // hours  
var TargDec = 44.92; // ENTER YOUR LATITUDE HERE in degrees
var RAoffset = 0.5;  // ENTER YOUR OFFSET HERE in degrees
var Decoffset = 0.5; // ENTER YOUR OFFSET HERE in degrees

RAoffset = RAoffset/15 ; // convert to hours

var Imager = ccdsoftCamera;
var Mount = sky6RASCOMTele;
var exposureTime = 3.0;
var exposureDelay = 0.0;
var multi = 10; // shoot ten photos

/////////////////////////////////////////////////////////////////////
// Write to the JavaScript output window and a text log file
function logOutput(logText)
	{
	RunJavaScriptOutput.writeLine(logText);
	TextFile.write(logText);
	}
/////////////////////////////////////////////////////////////////////

logOutput("MultiSlew&Snap running");
logOutput("Zenith RA= ", TargRA)
logOutput("Zenith Dec= ", TargDec)

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
// This is a six-pointing model that begins centered on the zenith
// followed by four pointings at the surrounding area, usually
// including the targ well inside the frame. It ends with a repeat
// pointing at the zenith.
/////////////////////////////////////////////////////////////////////
function SlewAndSnap()
{
Mount.SlewToRaDec(TargRA, TargDec,TargName+"-Center1");
logOutput(TargName+"Center1");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA+RAoffset, TargDec+Decoffset,TargName+"-EN");
logOutput(TargName+"-EN");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA+RAoffset, TargDec-Decoffset,TargName+"-ES");
logOutput(TargName+"-ES");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA-RAoffset, TargDec+Decoffset,TargName+"-WN");
logOutput(TargName+"-WN");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA-RAoffset, TargDec-Decoffset,TargName+"-WS");
logOutput(TargName+"-WS");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA, TargDec,TargName+"-Center2");
logOutput(TargName+"Center2");
TakeMultiPhoto(multi);
}

SlewAndSnap();

logOutput("Done.");


