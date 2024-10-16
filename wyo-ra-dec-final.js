'WYO RA-DEC Final.vbs finallized on Aug 20, 2017 at about 10pm

set tsxo = CreateObject("TheSkyX.Application")
set tsxt = CreateObject("TheSkyX.sky6RASCOMTele")
status = tsxt.Connect()
set tsxs = CreateObject("TheSkyX.sky6StarChart")
status = tsxt.Connect()
Set camera = CreateObject("MaxIm.CCDCamera")
camera.SetFullFrame
set tsxc = CreateObject("TheSkyX.ccdsoftCamera")
status = tsxc.Connect()

camera.LinkEnabled = True
camera.DisableAutoShutdown = True	'Leave camera on when we are done
if Not camera.LinkEnabled Then
   wscript.echo "Failed to start camera."
   Quit
End If

Const RT = 25                           ' enter duration allotted to RIGHT series
Const EABT = 35                      ' enter duration allotted to Eclipse A, B series
Const E2T = 18                         ' enter duration allotted to Eclipse 2-star series
Const LT = 85                           ' enter duration allotted to LEFT series = RT+61
Const D = 950                           ' enter dark background level from Aug 19 tests
Const ET = 0.1                          ' enter exposure time for exposure measurement ~0.1
Const OAexp = 1                      ' enter exposure for optical axis measurements
Const size = 100                        ' enter region of interest dimensions ~100
Const RLLevel = 10000             ' enter desired signal level inside ROI nominal 10000
Const ECLevel = 20000             ' enter desired signal level inside ROI near SUN nominal 20000
Const FFLevel = 20000             ' enter desired twilight level inside ROI, nominal 20000
Const ROIleft = 2620                 ' enter left starting of ROI nominal 2620 for exposure level test
Const ROItop = 2030                ' enter top starting of ROI nominal 2030 for exposure level test
Const path = "C:\Eclipse\WY\"   ' enter folder to save the images
Const ovrhd = 1.43                      ' enter time to digitize and save images (seconds)
Const ovrhd2 = 1.43                  ' enter time to digitize 1400x1400subframe in 2star series=0.24x1.8
Const LEFTRA = 10.5239         ' enter apparent AZ, in hours for LEFT calibration field
Const LEFTDEC = 15.0969      ' enter apparent ALT for LEFT calibration field
Const ECLRA = 10.0636           ' enter apparent AZ, in hours for ECLIPSE field
Const ECLDEC = 12.1928        ' enter apparent ALT for ECLIPSE field, offset from SUN
Const RIGHTRA = 9.6032        ' enter apparent AZ, in hours for RIGHT calibration field
Const RIGHTDEC = 9.1945     ' enter apparent ALT for RIGHT calibration field
Const sleeptime = 100               ' enter milliseconds sleep time, optimized for ML8051 = 100
Const DARK = 1                      ' enter exposure time of DARK frames
Const FF = 0.03                        ' enter exposure time of Flat Field frames

DIM I
Dim doc
Dim camera
DIM ADU                                ' average value measured over ROI
DIM EN                                   ' calculated best exposure time
DIM NOF                                ' calculated number of frames
Dim time                                   ' file timestamp
DIM E2                                    ' time for 2-star exposure

msgbox ("Focus anywhere. When done, Press ENTER, auto slews to RIGHT, waits until 11:41:42.")
tgtname = "R"
status = tsxt.SlewToRADec (RIGHTRA, RIGHTDEC, tgtname)

       Do While Timer() < 42101.8    ' 55.8 sec before C2 in Casper = 42101.8
             wscript.sleep sleeptime
       Loop

EN = 2                                     'early exposures estimate 2 sec fixed
NOF =16                                 'make 16 frames, maybe some will be useable
FOR I = 1 TO NOF                 'use 61 seconds for the Early RIGHT fields
        time = 0.1*INT(Timer()*10)
	camera.Expose EN,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "ER" & "_" & I & "_of_" & NOF & "_exp_" & EN & "_sec_at_" & time & ".fit")
NEXT

' start the auto-exposure at 5 seconds after C2, should be dark enough

tgtname = "R-AutoExp"
'status = tsxt.SlewToRADec (RIGHTRA, RIGHTDEC, tgtname)   ' make sure to go back to R if not there already
time = 0.1*INT(Timer()*10)
camera.Expose ET,1,0          'do the RIGHT short test exposure full frame
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
camera.SaveImage(path & "Rtest_" & time & ".fit")

Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the RIGHT ROI field
EN = ET*(RLLevel - D)/(ADU - D)     'Calculate new RIGHT exposure to get RLLevel, typically a few seconds
IF EN > 5 THEN EN = 5                     'but don't let RIGHT exposures last more than 5 seconds
IF EN < 0.3 THEN EN = 0.3               'but don't let RIGHT exposures last less than 0.3 second
EN = 0.01*INT(EN*100)                    'reduce time to 2 decimals
NOF = int(RT/(EN + ovrhd))                'add ovrhd ~1.8 seconds to account for downloading and saving image
FOR I = 1 TO NOF                             'use RT (25) seconds for the deep totality RIGHT fields; need to round down 
        time = 0.1*INT(Timer()*10)
	camera.Expose EN,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "R" & "_" & I & "_of_" & NOF & "_exp_" & EN & "_sec_at_" & time & ".fit")
NEXT

tgtname = "E-AutoExpA"
status = tsxt.SlewToRADec (ECLRA, ECLDEC, tgtname)
time = 0.1*INT(Timer()*10)
camera.Expose ET,1,0          'do the ECLIPSE short test exposure, no need to let slew settle
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
camera.SaveImage(path & "E_test_" & time & ".fit")
Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the ECLIPSE field
EN = ET*(ECLevel - D)/(ADU - D)     'Calculate new ECLIPSE exposure to get ECLevel, typically a few seconds
IF EN > 2 THEN EN = 2                     'but don't let ECLIPSE exposures last more than 2 seconds
IF EN < 0.15 THEN EN = 0.15           'but don't let ECLIPSE exposures last less than 0.15 second
EN = 0.01*INT(EN*100)                    'reduce time to 2 decimals
NOF = int(EABT/(EN + ovrhd))           'add ovrhd ~ 1.8 seconds to account for downloading and saving image
FOR I = 1 TO NOF                             'use EABT (35) seconds for the EA, EB ECLIPSE fields; need to round down 
        time = 0.1*INT(Timer()*10)
	camera.Expose EN,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "EA_" & I & "_of_" & NOF & "_exp_" & EN & "_sec_at_" & time & ".fit")
NEXT

E2 = EN * 0.15                           'Calculate new ECLIPSE exposure to get 2-star ECLevel, 0.15 of Eclipse
IF E2 > 0.3 THEN E2 = 0.3        'but don't let ECLIPSE2star exposures last more than 0.3 seconds
IF E2 < 0.03 THEN E2 = 0.03    'but don't let ECLIPSE2star exposures last less than 0.03 second
E2 = 0.01*INT(E2*100)             'reduce time to 2 decimals
'tsxc.ExposureTime = E2
'tsxc.Frame = 1
NOF = int(E2T/(E2 + ovrhd2))    'add ovrhd2 ~ 1.8*0.24 seconds to account for downloading, saving image
FOR I = 1 TO NOF                    'use E2T(10) seconds for the ECLIPSE2star fields; need to round down 
        time = 0.1*INT(Timer()*10)
	camera.Expose E2,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "E2_" & I & "_of_" & NOF & "_exp_" & E2 & "_sec_at_" & time & ".fit")
NEXT

'tsxc.Subframe=0   ' go back to full-frame

'tgtname = "E-AutoExpB"
'status = tsxt.SlewToRADec (ECLRA, ECLDEC, tgtname)
Set doc = camera.Document

NOF = int(EABT/(EN + ovrhd))    'add ovrhd ~ 1.8 seconds to account for downloading and saving image
FOR I = 1 TO NOF                      'use EABT(35) seconds for the EA, EB ECLIPSE fields; need to round down 
        time = 0.1*INT(Timer()*10)
	camera.Expose EN,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "EB_" & I & "_of_" & NOF & "_exp_" & EN & "_sec_at_" & time & ".fit")
NEXT

tgtname = "L-AutoExp"
status = tsxt.SlewToRADec (LEFTRA, LEFTDEC, tgtname)
time = 0.1*INT(Timer()*10)
camera.Expose ET,1,0          'do the LEFT short test exposure, no need to let slew settle
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
camera.SaveImage(path & "Ltest_" & time & ".fit")
Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the LEFT field
EN = ET*(RLLevel - D)/(ADU - D)     'Calculate new LEFT exposure to get RLLevel, typically a few seconds
IF EN > 5 THEN EN = 5                     'but don't let LEFT exposures last more than 5 seconds
IF EN < 0.3 THEN EN = 0.3               'but don't let LEFT exposures last less than 0.3 second
EN = 0.01*INT(EN*100)                    'reduce time to 2 decimals
NOF = int(LT/(EN + ovrhd))                'add ovrhd ~1.8 seconds to account for downloading and saving image
FOR I = 1 TO NOF                             'use LT(86) seconds for the LEFT fields; need to round down 
        time = 0.1*INT(Timer()*10)
	camera.Expose EN,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "L_" & I & "_of_" & NOF & "_exp_" & EN & "_sec_at_" & time & ".fit")
NEXT

' take twilight flats for a few minutes, auto-move mount to avoid star build-up
time = 0.1*INT(Timer()*10)
camera.Expose FF,1,0          'do a short test exposure full frame - first set
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop

time = 0.1*INT(Timer()*10)
camera.SaveImage(path & "FFtest1_" & time & ".fit")

Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the FF ROI field
EN = FF*(FFLevel - D)/(ADU - D)     'Calculate new FF exposure to get FFLevel
IF EN > 5 THEN EN = 5                    'but don't let FF exposures last more than 5 seconds
IF EN < 0.01 THEN EN = 0.01          'but don't let FF exposures last less than 0.01 second
EN = 0.01*INT(EN*100)                   'reduce time to 2 decimals
        time = 0.1*INT(Timer()*10)
        tgtname = "FF1"
        status = tsxt.SlewToRADec (LEFTRA+.001, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF1_1" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF1"
        status = tsxt.SlewToRADec (LEFTRA+0.002, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF1_2" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF1"
        status = tsxt.SlewToRADec (LEFTRA+0.003, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF1_3" & "_exp_" & EN & "_sec_at_" & time & ".fit")

'Sky will be rapidly brightening, so re-calculate TWILIGHT exposure time

camera.Expose FF,1,0          'do a short test exposure full frame - second set
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop

time = 0.1*INT(Timer()*10)
camera.SaveImage(path & "FFtest2_" & time & ".fit")

Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the FF ROI field
EN = FF*(FFLevel - D)/(ADU - D)     'Calculate new FF exposure to get FFLevel
IF EN > 5 THEN EN = 5                    'but don't let FF exposures last more than 5 seconds
IF EN < 0.01 THEN EN = 0.01          'but don't let FF exposures last less than 0.01 second
EN = 0.01*INT(EN*100)                   'reduce time to 2 decimals
        time = 0.1*INT(Timer()*10)
        tgtname = "FF2"
        status = tsxt.SlewToRADec (LEFTRA+0.004, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF2_1" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF2"
        status = tsxt.SlewToRADec (LEFTRA+0.005, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF2_2" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF2"
        status = tsxt.SlewToRADec (LEFTRA+0.006, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF2_3" & "_exp_" & EN & "_sec_at_" & time & ".fit")

camera.Expose FF,1,0          'do a short test exposure full frame - third set
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop

time = 0.1*INT(Timer()*10)
camera.SaveImage(path & "FFtest3_" & time & ".fit")

Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the FF ROI field
EN = FF*(FFLevel - D)/(ADU - D)     'Calculate new FF exposure to get FFLevel
IF EN > 5 THEN EN = 5                    'but don't let FF exposures last more than 5 seconds
IF EN < 0.01 THEN EN = 0.01          'but don't let FF exposures last less than 0.01 second
EN = 0.01*INT(EN*100)                   'reduce time to 2 decimals
        time = 0.1*INT(Timer()*10)
        tgtname = "FF3"
        status = tsxt.SlewToRADec (LEFTRA+0.007, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF3_1" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF3"
        status = tsxt.SlewToRADec (LEFTRA+0.008, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF3_2" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF3"
        status = tsxt.SlewToRADec (LEFTRA+0.009, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF3_3" & "_exp_" & EN & "_sec_at_" & time & ".fit")


camera.Expose FF,1,0          'do a short test exposure full frame - fourth set
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop

time = 0.1*INT(Timer()*10)
camera.SaveImage(path & "FFtest4_" & time & ".fit")

Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the FF ROI field
EN = FF*(FFLevel - D)/(ADU - D)     'Calculate new FF exposure to get FFLevel
IF EN > 5 THEN EN = 5                    'but don't let FF exposures last more than 5 seconds
IF EN < 0.01 THEN EN = 0.01          'but don't let FF exposures last less than 0.01 second
EN = 0.01*INT(EN*100)                   'reduce time to 2 decimals
        time = 0.1*INT(Timer()*10)
        tgtname = "FF4"
        status = tsxt.SlewToRADec (LEFTRA+0.010, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF4_1" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF4"
        status = tsxt.SlewToRADec (LEFTRA+0.011, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF4_2" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF4"
        status = tsxt.SlewToRADec (LEFTRA+0.012, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF4_3" & "_exp_" & EN & "_sec_at_" & time & ".fit")



camera.Expose FF,1,0          'do a short test exposure full frame - fifth set
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop

time = 0.1*INT(Timer()*10)
camera.SaveImage(path & "FFtest5_" & time & ".fit")

Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the FF ROI field
EN = FF*(FFLevel - D)/(ADU - D)     'Calculate new FF exposure to get FFLevel
IF EN > 5 THEN EN = 5                     'but don't let FF exposures last more than 5 seconds
IF EN < 0.01 THEN EN = 0.01           'but don't let FF exposures last less than 0.01 second
EN = 0.01*INT(EN*100)                    'reduce time to 2 decimals
        time = 0.1*INT(Timer()*10)
        tgtname = "FF5"
        status = tsxt.SlewToRADec (LEFTRA+0.013, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF5_1" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF5"
        status = tsxt.SlewToRADec (LEFTRA+0.014, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF5_2" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF5"
        status = tsxt.SlewToRADec (LEFTRA+0.015, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF5_3" & "_exp_" & EN & "_sec_at_" & time & ".fit")


camera.Expose FF,1,0          'do a short test exposure full frame - sixth set
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop

time = 0.1*INT(Timer()*10)
camera.SaveImage(path & "FFtest6_" & time & ".fit")

Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the FF ROI field
EN = FF*(FFLevel - D)/(ADU - D)     'Calculate new FF exposure to get FFLevel
IF EN > 5 THEN EN = 5                    'but don't let FF exposures last more than 5 seconds
IF EN < 0.01 THEN EN = 0.01          'but don't let FF exposures last less than 0.01 second
EN = 0.01*INT(EN*100)                   'reduce time to 2 decimals
        time = 0.1*INT(Timer()*10)
        tgtname = "FF6"
        status = tsxt.SlewToRADec (LEFTRA+0.016, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF6_1" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF6"
        status = tsxt.SlewToRADec (LEFTRA+0.017, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF6_2" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF6"
        status = tsxt.SlewToRADec (LEFTRA+0.018, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF6_3" & "_exp_" & EN & "_sec_at_" & time & ".fit")


camera.Expose FF,1,0          'do a short test exposure full frame - seventh set
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop

time = 0.1*INT(Timer()*10)
camera.SaveImage(path & "FFtest7_" & time & ".fit")

Set doc = camera.Document
ADU = doc.CalcAreaInfo(ROIleft, ROItop, ROIleft+size, ROItop+size)(2)  ' Find average value in the FF ROI field
EN = FF*(FFLevel - D)/(ADU - D)     'Calculate new FF exposure to get FFLevel
IF EN > 5 THEN EN = 5                    'but don't let FF exposures last more than 5 seconds
IF EN < 0.01 THEN EN = 0.01          'but don't let FF exposures last less than 0.01 second
EN = 0.01*INT(EN*100)                   'reduce time to 2 decimals
        time = 0.1*INT(Timer()*10)
        tgtname = "FF7"
        status = tsxt.SlewToRADec (LEFTRA+0.019, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF7_1" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF7"
        status = tsxt.SlewToRADec (LEFTRA+0.020, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF7_2" & "_exp_" & EN & "_sec_at_" & time & ".fit")

        time = 0.1*INT(Timer()*10)
        tgtname = "FF7"
        status = tsxt.SlewToRADec (LEFTRA+0.021, LEFTDEC, tgtname)
	camera.Expose EN,1,0
            Do While Not camera.ImageReady
                 wscript.sleep sleeptime
            Loop
        camera.SaveImage(path & "FF7_3" & "_exp_" & EN & "_sec_at_" & time & ".fit")

'Expect the sky will be too bright 2 minutes after C3, so stop FF and proceed to OA sets
msgbox ("Put lenscap on, PLUG-IN 9V, press ENTER to take all OA images")

tgtname = "RIGHT-OA"
status = tsxt.SlewToRADec (RIGHTRA, RIGHTDEC, tgtname)
        time = 0.1*INT(Timer()*10)
	camera.Expose OAexp,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "R-OA_" & time & ".fit")

tgtname = "ECLIPSE-OA"
status = tsxt.SlewToRADec (ECLRA, ECLDEC, tgtname)
        time = 0.1*INT(Timer()*10)
	camera.Expose OAexp,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "E-OA_" & time & ".fit")

tgtname = "LEFT-OA"
status = tsxt.SlewToRADec (LEFTRA, LEFTDEC, tgtname)
        time = 0.1*INT(Timer()*10)
	camera.Expose OAexp,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "L-OA_" & time & ".fit")

msgbox ("Saved OA images. Unplug 9V, Press ENTER to take DARKS")

tgtname = "DARK"
FOR I = 1 TO 100              'take 100 DARKS 
        time = 0.1*INT(Timer()*10)
	camera.Expose DARK,1,0
        Do While Not camera.ImageReady
             wscript.sleep sleeptime
        Loop
        camera.SaveImage(path & "DARK_" & I & "_" & "_of_100_" & time & ".fit")
NEXT

MsgBox("End of twlight test eclipse, save all data to USB drive")
wscript.Quit
