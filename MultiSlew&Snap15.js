// MultiSlew&Snap.js
// Modern Eddington Experiment 2024
// Richard L Berry
//Release 2023-09-30T12:54:00


/* This script can easily be generalized for any desired pattern of 
pointings and offsets desired at a solar eclipse. The target coordinate
specify the location the the ecliopsed Sun. The offsets allow large-
scle dithering about the target to cover a larger field. The saved files 
end with the target name with a suffix to indicate the pointings.
BEFORE RUNNING: SET THE DIRECTORY/FOLDER WHERE FILES WILL BE SAVED!
*/
	
var TargName = "R12h_D+30d"; // Give the images a logical name
var TargRA = 12.00;          // SET TARGET RA in hours  
var TargDec = 30.00;         // SET TEAGET Dec in degrees
var RAoffset = 1.0;          // SET RA OFFSET in degrees
var Decoffset = 0.5;         // SET Dec OFFSET in degrees
var RAscale = 8.00;          // SET SCALE OFFSET in degrees

RAoffset = RAoffset/15 ; // convert to hours
RAscale= RAscale/15 ; // convert to hours

var Imager = ccdsoftCamera;
var Mount = sky6RASCOMTele;
var exposureTime = 3.0;      // SET the EXPOSURE in seconds
var exposureDelay = 0.0;
var multi = 10;              // SET the FRAMECOUNT


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
// This is a seven-pointing model that begin with an East pointing
// followed by a target set and four of the surrounding sets, usually
// including the targ well inside the frame. It ends with a West
// pointing.
function SlewAndSnap()
{
Mount.SlewToRaDec(TargRA+RAscale, TargDec,TargName+"East");
logOutput(TargName+"East");
TakeMultiPhoto(multi);

Mount.SlewToRaDec(TargRA, TargDec,TargName+"Center");
logOutput(TargName+"Center");
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

Mount.SlewToRaDec(TargRA-RAscale, TargDec,TargName+"West");
logOutput(TargName+"West");
TakeMultiPhoto(multi);
}

SlewAndSnap();

logOutput("Done.");


