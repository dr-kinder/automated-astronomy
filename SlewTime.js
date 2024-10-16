var StarChart = sky6StarChart;   // Create skychart object that will be used for calculations of object positions, times, etc.
var Out="";                      // Create variable to store output strings
var Mount = sky6RASCOMTele;      // Create mount object that will take slew commands
var StarChart = sky6StarChart;   // Create skychart object that will be used for calculations of object positions, times, etc.

var TargName = "";               // Set target. Named targets like "Sun", "Jupiter", "Vega" should all work.

var StartTime = [];
var EndTime = [];
var TimeDifference = [];

function logOutput(logText){
    // Auxiliary function to write messages to the JavaScript output window and to a text log file
        
    RunJavaScriptOutput.writeLine(logText);
    TextFile.write(logText);
        
}

function TimeStampString(){
    // Auxiliary function to write current system time as a string

	StarChart.DocumentProperty(9); //this line puts the julian calendar time into the DocPropOut() property
	sky6Utils.ConvertJulianDateToCalender(StarChart.DocPropOut);
	return String(sky6Utils.dOut0) + "-" + String(sky6Utils.dOut1) + "-" + String(sky6Utils.dOut2) + " " + String(sky6Utils.dOut3) + ":" + String(sky6Utils.dOut4) + ":" + String(sky6Utils.dOut5);
	
}

function GetTime(){
    var TimeValue = [];
    StarChart.DocumentProperty(9); //this line puts the julian calendar time into the DocPropOut() property
	sky6Utils.ConvertJulianDateToCalender(StarChart.DocPropOut);
    //TimeValue[0] = sky6Utils.dOut0;
    //TimeValue[1] = sky6Utils.dOut1;
    //TimeValue[2] = sky6Utils.dOut2;
    TimeValue[3] = sky6Utils.dOut3;
    TimeValue[4] = sky6Utils.dOut4;
    TimeValue[5] = sky6Utils.dOut5;
    return TimeValue;
}

function GetTimeDifference(Start, End){
    var Dif = [];
    //var Output = ""
    //Dif[0] = End[0] - Start[0];
    //Dif[1] = End[1] - Start[1];
    //Dif[2] = End[2] - Start[2];
    Dif[3] = End[3] - Start[3];
    Dif[4] = End[4] - Start[4];
    Dif[5] = End[5] - Start[5];
    //Output = String(Dif[0]) + "-" + String(Dif[1]) + "-" + String(Dif[2]) + " " + String(Dif[3]) + ":" + String(Dif[4]) + ":" + String(Dif[5]);
    return Dif;
    //Output = String(Dif[3]) + ":" + String(Dif[4]) + ":" + String(Dif[5]);
    //return Output;
}

function TimeToString(Time){
    var Output = String(Time[3]) + ":" + String(Time[4]) + ":" + String(Time[5]);
    return Output;
}

function FindTarget(TargName){
    /////////////////////////////////////////////////////////////////////
    ////////////////////FIND TARGET IN THESKYX DATABASE//////////////////
    /////////////////////////////////////////////////////////////////////
    
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
}

/////////////////////////////////////////////////////////////////////
/////// CHECK CONNECTION TO MOUNT ///////////////////////////////////
/////////////////////////////////////////////////////////////////////

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

/////////////////////////////////////////////////////////////////////
////////////////////Slew to Target///////////////////////////////////
/////////////////////////////////////////////////////////////////////

TargName = "Moon";
FindTarget(TargName);
logOutput("");
logOutput("All time time outputs listed as: hours:minutes:seconds");
logOutput("");
StartTime = GetTime();
logOutput("Starting Slew to " + TargName + " at " + TimeToString(StartTime));
Mount.SlewToRaDec(TargRA, TargDec, TargName);
EndTime = GetTime();
logOutput("The slew ended at: " + TimeToString(EndTime));
TimeDifference = GetTimeDifference(StartTime, EndTime);
logOutput("The slew took: " + TimeToString(TimeDifference));



