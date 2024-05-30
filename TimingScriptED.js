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

function GetTime(){
    // Gets the current time, returns it as an array of 6 values
    
        StarChart.DocumentProperty(9);
        sky6Utils.ConvertJulianDateToCalender(StarChart.DocPropOut);
        var OutputTime = [sky6Utils.dOut0, sky6Utils.dOut1, sky6Utils.dOut2, sky6Utils.dOut3, sky6Utils.dOut4, sky6Utils.dOut5];
        return OutputTime;
    }

function AddTime(Time, Minutes, Seconds){
    // Takes a time array in, and adds a given amount of minutes and seconds. Returns a time that the sky64 can read
    
        var NewTime = [Time[0],Time[1],Time[2],Time[3],Time[4]+Minutes,Time[5]+Seconds];
        while (NewTime[5] >= 60){
            NewTime[5] -= 60;
            NewTime[4] += 1;
        }
        while (NewTime[4] >= 60){
            NewTime[4] -= 60;
            NewTime[3] += 1;
        }
        while (NewTime[3] >= 24){
            NewTime[3] -= 24;
            NewTime[2] += 1;
        }
        sky6Utils.ConvertCalenderToJulianDate(NewTime[0],NewTime[1],NewTime[2],NewTime[3],NewTime[4],NewTime[5]) // Input time to start slew to right calibration field in (YYYY, MM, DD, HH, MM, SS) *local* system time
        return sky6Utils.dOut0
    
    }

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

////////////////////////////////////////////////////////////////////////////
/////// SET TARGET AND SLEW TRIGGER TIMES //////////////////////////////////
////////////////////////////////////////////////////////////////////////////
t0 = GetTime(); //gets current time to use for starting program
t0 = AddTime(t0, 0, 5); //adds 10 seconds to t0, the idea is to wait 10 seconds once the script starts before slewing

// Set target and offset
var TargName = "Polaris";  // Set target. Named targets like "Sun", "Jupiter", "Vega" should all work. 
var CalRAoffset = 10;           // Set RA offset for left/right calibration fields in degrees
var CalDecoffset = 0;           // Set RA offset for left/right calibration fields in degrees
var EcRAoffset = 0.0;			// Set RA offset for eclipse field (set to 0 for field centered at target)
var EcDecoffset = 0.0;			// Set Dec offset for eclipse field (set to 0 for field centered at target)
CalRAoffset = CalRAoffset/15;  // Set RA offset for left/right calibration fields in hours
EcRAoffset = EcRAoffset/15;  // Set RA offset for eclipse field in hours


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
    StartOfSlew = GetTime();
	Mount.SlewToRaDec(TargRA, TargDec, TargName);
    EndOfSlew = GetTime();
    Time2Target1 = TimeDifference(StartOfSlew, EndOfSlew);
    NextTime = AddTime(EndOfSlew, 0, 5);
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");
	
    /*
	// Check time until it hits t00
	while (StarChart.DocPropOut < t00) {
		StarChart.DocumentProperty(9); // Pull current time from chart model (i.e., current *local* system time) in Julian time
		}
		
	logOutput("Starting slew to Polaris at\n" + String(TargRA) + " | "+ String(TargDec) + " at " + Out);
	Mount.SlewToRaDec(TargRA, TargDec, TargName);
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");
    */

    ///////////////////////////////////////////////////////////////////////////////
	////////         END OF OPTIONAL SUN POINTING BLOCK      //////////////////////
	///////////////////////////////////////////////////////////////////////////////

	// Wait for set amount of time
    while (StarChart.DocPropOut < NextTime) {
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
    StartOfSlew = GetTime();
	Mount.SlewToRaDec(TargRA-CalRAoffset, TargDec-CalDecoffset, TargName+"Right");
    EndOfSlew = GetTime();
    Time2RightField = TimeDifference(StartOfSlew, EndOfSlew);
    NextTime = AddTime(EndOfSlew, 0, 5);
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");

	// Check time until it hits t2
	while (StarChart.DocPropOut < NextTime) {
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
    StartOfSlew = GetTime();
	Mount.SlewToRaDec(TargRA+EcRAoffset, TargDec+EcDecoffset,TargName+"Eclipse");
    EndOfSlew = GetTime();
    Time2Target2 = TimeDifference(StartOfSlew, EndOfSlew);
    NextTime = AddTime(EndOfSlew, 0, 5);
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");

	// Check time until it hits t3
	while (StarChart.DocPropOut < NextTime) {
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
    StartOfSlew = GetTime();
	Mount.SlewToRaDec(TargRA+CalRAoffset, TargDec+CalDecoffset,TargName+"Left");
    EndOfSlew = GetTime();
    Time2LeftField = TimeDifference(StartOfSlew, EndOfSlew);
    NextTime = AddTime(EndOfSlew, 0, 5);
	Out = TimeStampString(); 
	logOutput("Slew complete at " + Out);
	logOutput("");	
	
	// Check time until it hits t4
	while (StarChart.DocPropOut < NextTime) {
		StarChart.DocumentProperty(9);
		}

	// Print completion message
	logOutput("Timed slew complete. Cap telescope and proceed to take dark frames.");
    logOutput("Slew times (time to target, time to right field, time to target again, time to left field):")
    logOutput(Time2Target1[4] + ":" + Time2Target1[5]);
    logOutput(Time2RightField[4] + ":" + Time2RightField[5]);
    logOutput(Time2Target2[4] + ":" + Time2Target2[5]);
    logOutput(Time2LeftField[4] + ":" + Time2LeftField[5]);

	}

TimedSlew(); // Run timed slew function



