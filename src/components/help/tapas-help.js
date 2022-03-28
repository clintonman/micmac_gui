import React from 'react';
const tapashelp = {};

tapashelp.TapasGeneral = 
    <div>
       <h1>Tapas</h1>
       <p>Tapas will calculate the camera orientation and internal parameters of the camera from the tie points and the camera EXIF information. 
           Orientation is the position of the camera and the direction of it's lens.
           </p>
       <p>The calculations can be run on the images all at once or in steps. 
           Can fail when run on a large number of images without doing a calibration run first, but most of the time it does work.
           MicMac docs recommend running first for calibration on a subset of images.
           Another source recommends adding images incrementally to avoid divergence errors.</p>
        <p>Each run has the option of starting from the result of a previous Tapas run. 
            The previous calibration can be used as a starting point for a new set of calculations or a previous orientation which also includes calibration can be used as the starting point.
            The Tapas output always includes calibration and orientation data for the cameras the images represent.</p>
        <h2>General Usage</h2>
        <p>Two lens workflow is based on the Saint Martin Street data set found in the Micmac Docs section 3.5. It uses a set of images that have 2 focal lengths. 
            Low focal length, wide angle images to cover the area and high fl, narrow angle to get details.
            Within each set of images was a set of calibration images. 
            These calibration images are used to define the camera for the photogrammetry calculations and are not used to reconstruct the final 3D geometry.</p>
            <p>Separate calibraton images are recommended in the docs for the best result and faster and more stable calculations, but are not always required. 
                Simplified usage is listed below along with the full 2 lens with calibration workflow.</p>
                <p>If the simplified run fails, try selecting the first 5 to 10 images as calibration source and use the Single Lens with calibration workflow.</p>
        <h3>Single Lens/FL no calibration images(Simplest)</h3>
        <ol>
            <li>Choose a mode</li>
            <li>Select all images</li>
            <li>Optionally choose "Orient final" operation</li>
            <li>Press Run</li>
        </ol>
        <h3>Single Lens/FL with calibration images</h3>
        <ol>
            <li>Choose a mode</li>
            <li>Choose images to be used for calibration</li>
            <li>Press Run with "Calib local" selected</li>
            <li>Choose "Orient final"</li>
            <li>Select all images to be used in the 3D reconstruction</li>
        </ol>
        <h3>Two Lens/FL no calibration images</h3>
        <ol>
            <li>Choose a mode</li>
            <li>Two lens workflow</li>
            <li>Uncheck "_with calibration"</li>
            <li>Choose "Orient local"</li>
            <li>Select all wide angle images that have lower FL</li>
            <li>Press Run</li>
            <li>Choose "Orient final" operation</li>
            <li>Select all images</li>
            <li>Press Run</li>
        </ol>
        <h3>Two Lens/FL with calibration images</h3>
        <ol>
            <li>Choose a mode</li>
            <li>Two lens workflow</li>
            <li>_with calibration</li>
            <li>Choose "Calib local"</li>
            <li>Select all calibration images with wide angle images that have lower FL</li>
            <li>Press Run</li>
            <li>Choose "Calib detail"</li>
            <li>Select all calibration images with narrow angle images that have higher FL</li>
            <li>Press Run</li>
            <li>Choose "Orient local"</li>
            <li>Select all the wide angle images to be used for 3D modeling</li>
            <li>Press Run</li>
            <li>Choose "Orient final" operation</li>
            <li>Select all non-calibration images</li>
            <li>Press Run</li>
        </ol>
       <h2>Controls</h2>
       <ul className='help-controls'>
            <li><strong>SH alternate input</strong> - use masking or Schnaps results for the tie points source</li>
            <li><strong>Mode</strong> - AutoCal and Figee are special modes, HemiEqui and FishEyeEqui are for wide angle lenses 
            and modes of increasing complexity are from mode RadialBasic to Fraser at the top of the list.</li>
            <li><strong>Two lens workflow</strong> - check if more than 1 focal length is used in the images</li>
            <li><strong>_with calibration</strong> - check if the calibration images are included with the 2 focal lengths. 
            Assumes one wide fl for the whole model and a narrow fl zoomed in for details</li>
            {/* <li><strong>Use Old Tapas</strong> - old version of the command can be tried if the new one fails for some reason</li> */}
            <li><strong>Text tie points</strong> - read text format tie point files instead of the default binary format</li>
            <li><strong>FL min max</strong> - minimum/maximum focal length of the images files to process</li>

            <li><strong>Calib local</strong> - choose calibration images taken with the wide angle lens and run</li>
            <li><strong>Calib detail</strong> - choose calibration images taken with the narrow angle lens and run</li>
            <li><strong>Orient local</strong> - choose all wide angle images to be used in the 3d reconstruction and run.</li>
            <li><strong>Orient final</strong> - choose all images to be used in the 3d reconstruction and run</li>
            <li><strong>Manual</strong> - use the section below to manally control the input and output</li>
            <li>If images are added to the Tapioca run via the "previous image run" then the "Orient final In" will be the last orientation from Tapas and Orient final Out will be the last with "Add" appended to it. Typically In=All and Out=AllAdd.</li>
            <li>The X buttons to the right are used to clear the corresponding tapas run. The top X will clear all runs</li>
            <li><strong>Calibration In</strong> - choose from previous Tapas runs to use as the calibration start values</li>
            <li><strong>Orientation In</strong> - choose from previous Tapas runs to use as the calibration and orientation start values</li>
            <li><strong>Out</strong> - output name for the Tapas run</li>
            
            <li><strong>Select Frozen</strong> - select images that will not be recalculated for the next run. 
            Can be used to add new images to fill holes or after a bad run. A way to add new images more quickly than recalculating everything from the start.<br/>
            2 buttons, one for frozen poses and one for frozen calibration</li>
            <li><strong>Run</strong> process the selected images</li>
            <li>
                <h3>Campari - optional refinement</h3>
                <p>can be used to improve the residual errors from the Tapas run(everything not green) and for when the 3d preview shows bad camera positions</p>
            </li>
            <li><strong>Orientation In</strong> - input orientation for Campari</li>
            <li><strong>Out</strong> - output orientation for Campari</li>
            <li><strong>calibration per image</strong> - used to refine images taken with autofocus or 
                lens stabilization active or for images that have arbitrary exif information assigned to them. 
                 <strong>CPI1</strong> is for the first run and <strong>CPI2</strong> is for all runs after the first run.
                Use in combination with "Refine FL" and "Refine PP" options.</li>
            <li><strong>Lock Poses</strong> - by default Campari does not lock the camera orientations</li>
            <li><strong>Refine FL</strong> - releases the focal length of the camera for recalculation.
                Autofocus can change the focal length so it does not perfectly match the value reported in the image exif.</li>
            <li><strong>Refine PP</strong> - releases the principal point of the camera for recalculation. 
                The principal point changes when using camera stabilization so it will be different for each image.</li>
            <li>
            <li><strong>Refine</strong> - run the Campari refinement</li>
                <h3>3D Check and Masking</h3>
            </li>
            <li><strong>Orientation In</strong> - choose output orientation run for the 3d preview</li>
            <li><strong>Include cameras</strong> - will create points to represent the camera positions and orientations in the sparse cloud</li>
            <li><strong>3D Preview</strong> - create a sparse cloud of points to check the last run of Tapas or Campari. 
            If the camera positions are not good you can try running Campari to refine the result and try again</li>
            <li><strong>Make 3D Mask</strong> - mask the sparse cloud to remove unwanted data and outlier points for the final dense cloud calculations</li>
       </ul>

        <p>Default behavior is to assume the MicMac doc recommendation of having a separate set of calibration images. 
            If this is not the case you can optionally choose a subset of the images and process them as if they are calibration images and still include those same images in the final run.</p>
        <p>Tapas and Campari runs will color code the images to show the amount of error. Green is the best, then blue and red is the worst. 
            It is still possible to get a final 3D result even with some red and blue tags.</p>
        <p><a href="https://micmac.ensg.eu/index.php/Tapas" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/Tapas</a></p>

            <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
        <hr/>
        <p>campari can make a bad orientation from tapas good for radial and fisheye modes</p>

        <h2>managing divergence</h2>
        <ol>
            <li>small calibration set</li>
            <li>all images Figee so calibration does not change, only orientation computed</li>
            <li>AutoCal to get better calibration</li>
        </ol>
        <p>dont use campari freeall, add focfree, ppfree and drmax one at a time</p>
        <p>Tapas FrozenPoses and Campari PoseFigee=1 to work on calibrations</p>
        <p>Recommend runing in 2 steps. First for calibration with a set of 5 to 10 images. Second the full orientation.</p>
    <p>For large dataset run in 2 parts, first subset of good images using Out= option, second use the first runs output as the input to the second run. 1st run is just for calibration</p>

<p>small dataset of 5 to 10 pictures good for calibration ( step 1 )</p>
     <div> With large data set, it is often preferable to proceed in two step : 
            <ul>
                <li>— compute on a small set of image a value of intrinsic calibration, this set of image should be favorable to calibration; ideally, it should fulﬁll the following requirements : 
                    <ul>
                        <li>— all image converging to same part of the scene,to facilitate the computation of external orientation </li>
                        <li>— a scene with suﬃcient depth variation ,to have accurate focal length estimation</li>
                        <li>— a image acquisition where there position of the same ground points are located at very diﬀerent position in the diﬀerent images where they are seen, this is to have accurate estimation of distortion; this can be obtained by rotating the camera like acquisition of ﬁgure 3.2; </li>
                        <li>COSH - ..."vertical, horizontal and 45deg or 2 at 30 and 60deg</li>
                    </ul>
                </li>
                <li>— use the calibration obtained on the small set as an initial value for the global orientation</li>
            </ul>
            The set for calibration can be a subset of the images used for the scene reconstruction ; often having a separate acquisition is preferable to ensure that it fulﬁll all the requirements
        </div>
        <p>poor quality images can sometimes be solved by solving all at once - guess is that the bad tie points are diluted by processing all tie points at once</p>

        <p>
        Tapas is a tool offering most of the posssibilities of Apero for computing purely relative orientations 
        </p>
        <div>Tapas produce a directory named "Ori-Out_name" which contain :
            <ul>
                <li>Camera calibration file : AutoCal[...].xml with camera parameters : focal length, PPP, distorsion parameters.</li>
                <li>Orientation file for each picture : Orientation-image_name.xml with :camera orientation (3D similarity), tie points used for orientation etc...</li>
            </ul>
        </div>
        
        <div>The result of Tapas are stored in a subdirectory Ori-OUTDIR , where OUTDIR is speciﬁed by the optional out argument of Tapas, when out is not speciﬁed the value of ModeCalib is used. With this basic command, the result are stored in the directory Ori-RadialExtended/ :</div>
        <div>— the ﬁle AutoCal280.xml contains the intrinsic calibration; the name has been automatically computed from the focal length got in exif ﬁle (here 28mm); there is only one ﬁle because there was only one focal length; </div>
        <div>— the ﬁles Orientation-IMGPXXXX.JPG.xml contain the external orientations;</div>
       

        <h2>Compute Camera and picture positions with tie points included. relative orientation</h2>
    <p>Tapas produces a directory named "Ori-Out_name" which contains:<br/> Camera calibration file,
Orientation file for each picture - also contains the tie points</p>
    
    <p>
        Tapas full automatic orientation computation
         OldTapas        Interface to Apero to compute external and internal orientations
         initialize using exif data, choose central image(most tie points),compute orientations
         results stored in Ori-OUTDIR, AutoCalxxx.xml contains intrinsic calibration, Orientation-xxxx.jpg.xml contains external orientations
    </p>
    <p>tapas calibration set of 5 to 10 images is good, tapas is calibration and orientations</p>
    <div>In the automated process it's better to use the mode FraserBasic (more accurate than RadialExtended) to perform a calibration – orientation on the set of pictures ( thus 
AutoCal becomes superfluous).</div>

    <p>creates the Ori-* folder which contains calibration and orientation information</p>
    <p>InOri reads orientation portion, InCal reads calibration section</p>

    <p>Ori-xxx folder contains camera internal definition(calibration) and camera orientations, Tapas InCal will read the camera definition 
        and InOri will read both the camera definition and orientations.</p>
    <p>Can improve results by running Radialbasic to feed RadialStd or RadialExtended. Don't know how yet.</p>
    <p>compensation - minimization of all residual errors</p>
        <p>bascule used to convert tapas relative to some known coordinate system</p>
        <p>CenterBascule uses GPS coordinates and requires special equipment to get good GPS info into the images.</p>
    </div>
    </div>

tapashelp.TapasMode =
<div>
    <h1>Mode</h1>
    <ul className='help-controls'>
        <li><strong>Fraser</strong> - most demanding 12 params</li>
        <li><strong>FraserBasic</strong> - 10 params</li>
        <li><strong>RadialExtended</strong> - handles 10 parameters (less "accurate" and without decentering), generic/medium mode</li>
        <li><strong>RadialStd</strong> -</li>
        <li><strong>RadialBasic</strong> - when extended doesnt work</li>
        <li><strong>FishEyeEqui</strong> - equirectangular fisheye  (also called diagonal), wich look like a full frame fisheye</li>
        <li><strong>HemiEqui</strong> - circular fisheye (180° circular frame outlined in black)</li>
        <li><strong>FishEyeBasic</strong> - more robust model</li>
        <li><strong>AutoCal and Figee</strong> are for refinement, not needed if fraser or radial gives good results already</li>
    </ul>
    <p>Only RadialBasic, RadialStd and RadialExtended are compatible with Meshlab</p>

    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
    <hr/>
    <p>if tapioca added images and tapas has run before then set as AutoCal and 
    jump to last option and set input as last tapas out and output as last tapas + "Add"
    would Figee be better than AutoCal here?</p>
    <p>"AutoCal" is the partial name of the calibration files created by Tapas.</p>
    <p>?"Figee" only update orientation, calibration frozen?</p>
    <p>AutoCal and Figee calibration must already exist for all images</p>
    <div>fraserbasic sb good already so no need for autocal</div>
    <div>It’s possible to apply afterwards AutoCal or Figee without applying any of the previous models, to refine a result. While using Radial distorsion models, it's better use this refinement step. These two modes, only process the orientation, it means that a previous calibration on few pictures must have been done before. AutoCal reevaluates the results while Figee freezes them. This way to compute the calibration then the orientation, is more interesting and less time consuming for large dataset processing.</div>
    <div>— AutoCal and Figee , with this tag no model is deﬁned, all the calibration must have a value (via InCal or InOri options); with AutoCal the calibration are re-evaluated while with Figee it stay frozen. </div>
        </div>
</div>

tapashelp.TapasTwoLens = <div>
    <h1>Two lens workflow</h1>
    <p>Assumes 2 focal lengths were used to capture the images, where the zoomed in narrow focal length images are used to capture details covered by the wide angle focal length images.</p>
    <p>Run down the Operation list in order, pressing the Run button below at the end of each step</p>
    <ol className='help-usage-list'>
        <li><strong>Calibration local</strong> - Select the wide angle images to be used for calibration</li>
        <li><strong>Calibration detail</strong> - Select the narrow zoomed in images to be used for calibration</li>
        <li><strong>Orientation local</strong> - Select the wide angle images that will be used to create the final 3D point cloud</li>
        <li><strong>Orientation final</strong> - Select all the wide and narrow images that will be used to create the final 3D point cloud</li>
    </ol>
    <p>No calibration images - uncheck <strong>with Calibration</strong></p>
    <ol className='help-usage-list'>
        <li><strong>Orientation local</strong> - Select the wide angle images</li>
        <li><strong>Orientation final</strong> - Select all the images</li>
    </ol>
    <p>Two lens workflow with calibration is based on DocMicMac.pdf sections 3.5.1 and 3.5.2</p>
    <p>Two lens without calibration workflow based on Zhenjue tutorial</p>
    <p>Behind the scenes for Two Lens with calibration the resulting camera data from the detail calibration will be copied into the orientation local result<br/>
    So the folder will contain the full local camera and orientations plus the detail camera definition</p>
    
</div>

tapashelp.TapasRun = 
<div>
    <h1>Run</h1>
    <p>Select images and press Run</p>
    <p>Each step will activate automatically after a succesful previous run step.</p>
    <p>Typical 2 step operation.</p>
    <ol>
        <li>Select a subset of images for calibration.</li>
        <li>Choose all images to be used in the point cloud generation.</li>
    </ol>
    <p>4 step operation assumes images were taken with 2 different focal lengths.</p>
    <ol>
        <li>Select the wide angle images to be used for calibration</li>
        <li>Select the narrow zoomed in images to be used for calibration</li>
        <li>Select the wide angle images</li>
        <li>Select all the images</li>
    </ol>
    <p>Images will be color coded for quality after the run</p>
    <h4>Result interpretation:</h4>
    <ul>
        <li>image file name</li>
        <li>ER2 = residual error, square root of the weighted average of quadratic residuals</li>
        <li>
            <ul>
                <li>0.5 to 1.0 is good (green)</li>
                <li>1.0 to 1.5 is ok (blue)</li>
                <li>greater than 1.5 is bad (red)</li>
            </ul>
        </li>
        <li>Nn = is the percentage of residuals that are under EcartMax; it should be over 95%</li>
    </ul>
</div>

tapashelp.TapasFrozenPoses = <div>
    <h1>Frozen Poses</h1>
    <p>lock the orientations of the selected cameras</p>
    <h1>Frozen Calibrations</h1>
    <p>lock the camera calibrations for the selected cameras</p>
</div>
tapashelp.TapasOperation = <div>
    <h1>Operations</h1>
    <p>This section was originally setup for 1 and 2 lens workflows with separate calibration images. 
        Go down the list in order pressing the Run button process each step.</p>
    <h2>Controls</h2>
    <ol>
        <li><strong>Calib local</strong> choose calibration images for wide angle pictures</li>
        <li><strong>Calib detail</strong> 2 lens workflow choose the narrow angle images for calibration</li>
        <li><strong>Orient local</strong> 2 lens workflow choose wide angle images for 3d reconstruction, the wide angle calibration will be used as the starting point for all the images in this set.</li>
        <li><strong>Orient final</strong> choose all the images to use for 3d reconstruction, all previous data will be combined into the final result</li>
        <li><strong>Manual</strong> - use the manual entry values for Calibration In, Orientation In and the Out.</li>
    </ol>
    <p>The single lens workflow uses steps 1 and 4, Calib local and Orient final.</p>
    <p>5, Manual, can be used to develop different workflows</p>
    <p>In the 2 lens workflow some files and folders are copied behind the scenes to complete the process described in the MicMac documentation.</p>
</div>

tapashelp.imageinfo =
<div>
    <h1>Image Information</h1>
    <p><strong>fl</strong> - focal length in mm</p>
    <p>masking button - <strong>"M"</strong> will displayed when corresponding mask image is found</p>
    <p><strong>res</strong> - residual error from Tapas or Campari</p>
    <ul>
        <li>0.5 to 1.0 is good (green)</li>
        <li>1.0 to 1.5 is ok (blue)</li>
        <li>greater than 1.5 is bad (red)</li>
    </ul>
    <p>3D solve can still be successful with red images</p>
    <p>res = -1.00, not processed yet / image will be ignored</p>
</div>
    export default tapashelp;