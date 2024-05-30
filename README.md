This repository holds JavaScript code for telescope mount control.
It is designed to run in TheSky, by Software Bisque.

Descritions of some scripts:
    eclipse-day-script:
        This is the script that was used for the most recent eclipse observations.
        This script looks at the sun and a left and right calibration field.
        Information is given for the start and end times of the slews.
        At the start of the script, all of the slew times are setup.
    SlewTime:
        This script was mainly a testing script for timing slews.
    PolarisMimicOfEclipseDayScript:
        This script was based on the eclipse day script.
        Arrays are used to make inputing set slew times easier.
        The script slews around Polaris instead of the Sun.
    TimingScriptED:
        The purpose of this script is to use the functions and layout for testing slew times and methods for observing the eclipse.
        This script was based on the eclipse day script.
        Instead of setting slew start times for each slew, this script waits for a slew to finish, and then adds 5 seconds before starting the next one.
        At the end of the script, the time taken for each slew is given.
