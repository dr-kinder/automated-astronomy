// TimedSlew.js
// Modern Eddington Experiment 2024
// by Daniel Borrero
// Last update: 2024-03-27


/* This script points the telescope to a calibration field shifted west in right ascension by RAoffset from a 
target at (RA,Dec) = (TargRA,TargDec), then to the target, and finally to a calibration field shifted east by
RAoffset in right ascension from the target. The slews are initiated at specific times set by t1 and t2. It 
can easily be generalized for any desired pattern of pointings and offsets desired at a solar eclipse by adding 
additional trigger times and slew blocks. The target coordinate coordinate is taken from TheSkyX's internal 
database. This program only moves the mount, IT DOES NOT TAKE IMAGES. If imaging during the day, be careful
to use appropriate filters when pointing telescope to targets near the Sun.
*/


////////////////////////////////////////////////////////////////////////////
/////// SET TARGET AND SLEW TRIGGER TIMES //////////////////////////////////
////////////////////////////////////////////////////////////////////////////
var StartDate = [5,22,2024];       //day, month, year
var StartTime = [21,16,0];        //hour, minute, second
//                                 //before any waiting, the script immediately slews to the target
//                                 //t0 slews to target (t0 is the StartTime)
var t00inc = [StartTime[0] + 0, StartTime[1] + 0, StartTime[2] + 20]; //slews to target
var t1inc = [StartTime[0] + 0, StartTime[1] + 0, StartTime[2] + 40];     //slews to right calibration field
var t2inc = [StartTime[0] + 0, StartTime[1] + 1, StartTime[2] + 0];      //slews to target
var t3inc = [StartTime[0] + 0, StartTime[1] + 1, StartTime[2] + 20];      //slews to left calibration field
var t4inc = [StartTime[0] + 0, StartTime[1] + 1, StartTime[2] + 40];      //end of program (no more slewing just a timestamp for program end)

// Set trigger times for slews
sky6Utils.ConvertCalenderToJulianDate(StartDate[2],StartDate[0],StartDate[1],StartTime[0],StartTime[1],StartTime[2]) // Input time to start slew to right calibration field in (YYYY, MM, DD, HH, MM, SS) *local* system time
t0 = sky6Utils.dOut0   // Save time for right calibration field slew to t1 as Julian date
sky6Utils.ConvertCalenderToJulianDate(StartDate[2],StartDate[0],StartDate[1],t00inc[0],t00inc[1],t00inc[2]) // Input time to start slew to right calibration field in (YYYY, MM, DD, HH, MM, SS) *local* system time
t00 = sky6Utils.dOut0   // Save time for right calibration field slew to t1 as Julian date
sky6Utils.ConvertCalenderToJulianDate(StartDate[2],StartDate[0],StartDate[1],t1inc[0],t1inc[1],t1inc[2]) // Input time to start slew to right calibration field in (YYYY, MM, DD, HH, MM, SS) *local* system time
t1 = sky6Utils.dOut0   // Save time for right calibration field slew to t1 as Julian date
sky6Utils.ConvertCalenderToJulianDate(StartDate[2],StartDate[0],StartDate[1],t2inc[0],t2inc[1],t2inc[2]) // Input time to start slew to eclipse field in (YYYY, MM, DD, HH, MM, SS) *local* system time
t2 = sky6Utils.dOut0 // Save time for slew to eclipse field t2 as Julian date
sky6Utils.ConvertCalenderToJulianDate(StartDate[2],StartDate[0],StartDate[1],t3inc[0],t3inc[1],t3inc[2]) // Input time to start slew to left field in (YYYY, MM, DD, HH, MM, SS) *local* system time
t3 = sky6Utils.dOut0 // Save time for slew to left calibration field t3 as Julian date
sky6Utils.ConvertCalenderToJulianDate(StartDate[2],StartDate[0],StartDate[1],t4inc[0],t4inc[1],t4inc[2]) // Input time for end of eclipse in (YYYY, MM, DD, HH, MM, SS) *local* system time
t4 = sky6Utils.dOut0 // Save time for slew to left calibration field t4 as Julian date

// Set target and offset
var TargName = "Moon";  // Set target. Named targets like "Sun", "Jupiter", "Vega" should all work. 
var CalRAoffset = 10;           // Set RA offset for left/right calibration fields in degrees
var CalDecoffset = 0;           // Set RA offset for left/right calibration fields in degrees
var EcRAoffset = 0.0;			// Set RA offset for eclipse field (set to 0 for field centered at target)
var EcDecoffset = 0.0;			// Set Dec offset for eclipse field (set to 0 for field centered at target)
CalRAoffset = CalRAoffset/15;  // Set RA offset for left/right calibration fields in hours
EcRAoffset = EcRAoffset/15;  // Set RA offset for eclipse field in hours

////////////////////////////////////////////////////////////////////////////////////////
///////////////// SETUP BASIC OBJECTS //////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////

// Create basic objects to control mount and set up sky model
var Mount = sky6RASCOMTele;      // Create mount object that will take slew commands
var StarChart = sky6StarChart;   // Create skychart object that will be used for calculations of object positions, times, etc.
var Out="";   // Create variable to store output strings
var err; // Create variable to store error codes


/////////////////////////////////////////////////////////////////////
///////////// SETUP AUXILIARY FUNCTIONS ///////////////////
////////////////////////////////////////////////////////////////////

function logOutput(logText){
// Auxiliary function to write messages to the JavaScript output window and to a text log file
	
	RunJavaScriptOutput.writeLine(logText);
	TextFile.write(logText);
	
	}

function TimeStampString(){
// Auxiliary function to write current system time as a string

	StarChart.DocumentProperty(9);
	sky6Utils.ConvertJulianDateToCalender(StarChart.DocPropOut);
	return String(sky6Utils.dOut0) + "-" + String(sky6Utils.dOut1) + "-" + String(sky6Utils.dOut2) + " " + String(sky6Utils.dOut3) + ":" + String(sky6Utils.dOut4) + ":" + String(sky6Utils.dOut5);
	
	}

logOutput("Timed slew running.");
logOutput("");
logOutput("WARNING: This script DOES NOT acquire images.");
logOutput("Image acquisition needs to be done with a different program running in parallel.");
logOutput("");

/////////////////////////////////////////////////////////////////////
/////// CHECK CONNECTION TO MOUNT //////////////////////
////////////////////////////////////////////////////////////////////

logOutput("Connecting to mount...");
try {
	Mount.Connect();
	Mount.Asynchronous = 0;
	}
catch(e) {
	throw new Error("No connection to the mount!");
	}
logOutput("Mount is connected.");
logOutput("");


///////////////////////////////////////////////////////////////////
////////////////////FIND TARGET IN THESKYX DATABASE///////////////
///////////////////////////////////////////////////////////////////

StarChart.Find(TargName);
err = StarChart.LASTCOMERROR;
StarChart.LASTCOMERROR = 0;

logOutput("Searching for target in TheSkyX database..."); 

if (err != 0) {
// If target not found, display error message

	Out = TargName + " not found.";

	}
else {
// If target is found, find current RA and Dec

	sky6ObjectInformation.Property(54); // Look up RA for target in database
	TargRA = sky6ObjectInformation.ObjInfoPropOut;

	sky6ObjectInformation.Property(55); // Look up Dec for target in database
	TargDec = sky6ObjectInformation.ObjInfoPropOut;
	
	Out = "Target found at " + String(TargRA) + " | "+ String(TargDec);

	}

logOutput(Out);
logOutput("");

//////////////////////////////////////////////////////////////////////////////
//////////// RUN SLEW PATTERN W/ TIMED TRIGGERS ///////////////
/////////////////////////////////////////////////////////////////////////////

function TimedSlew(){ 

// Slew to target
	///////////////////////////////////////////////////////////////////////////////
	//////// THIS BLOCK POINTs TELESCOPE AT SUN TO KEEP TEMPERATURE CONSTANT //////
	//////// LEADING UP TO THE ECLIPSE. CAN PROBABLY CAN GET RID OF IT FOR  ///////
	////////                 NON-ECLIPSE OBSERVATIONS.                      ///////
	///////////////////////////////////////////////////////////////////////////////
	
	//Out = TimeStampString(); 
	//logOutput("Starting slew to Polaris at\n" + String(TargRA) + " | "+ String(TargDec) + " at " + Out);
	//Mount.SlewToRaDec(TargRA, TargDec, TargName);
	//Out = TimeStampString(); 
	//logOutput("Slew complete at " + Out);
	//logOutput("");
	
	// Check time until it hits t0
	while (StarChart.DocPropOut < t0) {
		StarChart.DocumentProperty(9); // Pull current time from chart model (i.e., current *local* system time) in Julian time
		}
		
	logOutput("Starting slew to Polaris at\n" + String(TargRA) + " | "+ String(TargDec) + " at " + Out);
	Mount.SlewToRaDec(TargRA, TargDec, TargName);
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");
	
	// Check time until it hits t00
	while (StarChart.DocPropOut < t00) {
		StarChart.DocumentProperty(9); // Pull current time from chart model (i.e., current *local* system time) in Julian time
		}
		
	logOutput("Starting slew to Polaris at\n" + String(TargRA) + " | "+ String(TargDec) + " at " + Out);
	Mount.SlewToRaDec(TargRA, TargDec, TargName);
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");

    ///////////////////////////////////////////////////////////////////////////////
	////////         END OF OPTIONAL SUN POINTING BLOCK      //////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// Check time until it hits t1
	while (StarChart.DocPropOut < t1) {
		StarChart.DocumentProperty(9); // Pull current time from chart model (i.e., current *local* system time) in Julian time
		}

	// Update target position to position at current time
	StarChart.Find(TargName);
	sky6ObjectInformation.Property(54); // Look up RA for target in database
	TargRA = sky6ObjectInformation.ObjInfoPropOut;
	sky6ObjectInformation.Property(55); // Look up Dec for target in database
	TargDec = sky6ObjectInformation.ObjInfoPropOut;

	// Slew to right calibration field
	Out = TimeStampString(); 
	logOutput("Starting slew to right calibration field at\n" + String(TargRA-CalRAoffset) + " | "+ String(TargDec-CalDecoffset) + " at " + Out);
	Mount.SlewToRaDec(TargRA-CalRAoffset, TargDec-CalDecoffset, TargName+"Right");
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");

	// Check time until it hits t2
	while (StarChart.DocPropOut < t2) {
		StarChart.DocumentProperty(9); // Pull current time from chart model (i.e., current *local* system time) in Julian time
		}
		
	// Update target position to position at current time
	StarChart.Find(TargName);
	sky6ObjectInformation.Property(54); // Look up RA for target in database
	TargRA = sky6ObjectInformation.ObjInfoPropOut;
	sky6ObjectInformation.Property(55); // Look up Dec for target in database
	TargDec = sky6ObjectInformation.ObjInfoPropOut;
	
	// Slew to eclipse field
	Out = TimeStampString(); 
	logOutput("Starting slew to target at \n" + String(TargRA+EcRAoffset) + " | "+ String(TargDec+EcDecoffset) + " at " + Out);
	Mount.SlewToRaDec(TargRA+EcRAoffset, TargDec+EcDecoffset,TargName+"Eclipse");
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");

	// Check time until it hits t3
	while (StarChart.DocPropOut < t3) {
		StarChart.DocumentProperty(9);
		}

	// Update target position to position at current time
	StarChart.Find(TargName);
	sky6ObjectInformation.Property(54); // Look up RA for target in database
	TargRA = sky6ObjectInformation.ObjInfoPropOut;
	sky6ObjectInformation.Property(55); // Look up Dec for target in database
	TargDec = sky6ObjectInformation.ObjInfoPropOut;

	// Slew to west calibration field
	sky6Utils.ConvertJulianDateToCalender(StarChart.DocPropOut);
	Out = TimeStampString(); 
	logOutput("Starting slew to left calibration field at\n" + String(TargRA+CalRAoffset) + " | "+ String(TargDec+CalDecoffset) + " at " + Out);
	Mount.SlewToRaDec(TargRA+CalRAoffset, TargDec+CalDecoffset,TargName+"Left");
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");	
	
	// Check time until it hits t4
	while (StarChart.DocPropOut < t4) {
		StarChart.DocumentProperty(9);
		}

	// Print completion message
	logOutput("Timed slew complete. Cap telescope and proceed to take dark frames.");

	}

TimedSlew(); // Run timed slew function



