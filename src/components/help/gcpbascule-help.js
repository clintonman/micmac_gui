import React from 'react';
const gcpbasculehelp = {};

gcpbasculehelp.GCPBasculeGeneral = 
<div>
    <h1>GCPBascule</h1>
    <p>Process to read in known point locations, Ground Control Point(GCP), in order to create an absolute oriented result</p>

    <h2>General Usage</h2>
    <ol>
        <li>Define points or mark known locations while taking images for the dataset.</li>
        <li>Visually note the locations so they can be identified and matched in the images later.</li>
        <li>Measurements can be imported from a file or typed in the Measurement Points section.</li>
        <li>(SaisieAppuisInit) Measure image coordinates for a small set of GCP and process them.</li>
        <li>(SaisieAppuisPredic) Use the result to help measure all the GCPs image coordinates.</li>
        <li>(Campari) Use the image measurements to orient the cameras in absolute space.</li>
        <li>(Apericloud) Check the sparse cloud to check the new orientation.</li>
    </ol>

    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><strong>Open GCP Text</strong> - load the measurements from a text file in AppGeoCub or AppEgels formats into the "Measurement Points" list</li>
        <li><strong>Open GCP Xml</strong> - load from a pre-existing xml format measurements file</li>
        <li><h3>Measurement Points</h3><p>Create the point measurement files.</p></li>
        <li><strong>Add New Point</strong> - type in point data instead of importing</li>
        <li><strong>Create Measurements Files(Txt and Xml)</strong> - will create text and xml format measurement files in the working folder</li>
        <li><strong>Orientation in</strong> - usually the Tapas output result</li>
        <li><strong>Import as final 2D file</strong> - when checked will import the file and rename it to "PredicImageMeasurements-S2D.xml" 
        to be used in <span style={{textDecoration:"underline"}}>Process Final 2D Measurements</span>,
        when unchecked the file name will be named "InitialImageMeasurements-S2D.xml" 
        which will be used in <span style={{textDecoration:"underline"}}>Process Initial 2D Measurements</span>.</li>
        <li><strong>Import 2D Measurements File</strong> - import tutorial 2D point file data<br/>
        If <em>Import as final 2D file</em> is checked the next step is to process the final 2D measurements, press the <em>Basc Predic</em> button.<br/>
        If <em>Import as final 2D file</em> is not checked then next step is to process the initial 2D measurements, press the <em>Initial Points</em> button.</li>
        <li><h3>Define Initial 2D Image Points</h3><p>(SaisieAppuisInit) Measure at least 3 GCP in at least 2 images.</p></li>
        <li><strong>Select Point</strong> - add line to choose a point and an image to define that points location.
            A small number of points will be used for the initial measurements
        </li>
        <li>
            <ul>
                <li><strong>choose</strong> - select a measurement point</li>
                <li><strong>Set Regex</strong> - set the image(s) to be measured</li>
                <li><strong>Init</strong> - press to locate the measurement point in the selected image(s)</li>
            </ul>
        </li>
        <li><strong>Initial points</strong> - process the initial 2D image points</li>
        <li>
            <h3>Define 2D Points</h3><p>(SaisieAppuisPredic) use the initial 2D image points to help define all the rest of the image points.</p>
        </li>
        <li><strong>Validate Points</strong> - use the initial 2D points to predict the location of all the 3D points and 
            verify and correct their locations in the images</li>
            <li>
                <h3>Process Final 2D Measurements</h3>
            </li>
        <li><strong>Basc Predic</strong> - process the final 2D measurements</li>
        <li><strong>Run Campari</strong> - apply the measurements to the camera orientations</li>
        <li><strong>3D Preview</strong> - jump to the apericloud screen for sparse cloud generation to check the result</li>
    </ul>
    <h2>Notes</h2>
    <h3>Measurement Points space delimited text formats</h3>
    <ul>
        <li>AppGeoCub: point number, x coordinate, y coordinate, z coordinate</li>
        <li>AppEgels: PointNumber, VariableNonImported, X, Y, Z</li>
    </ul>
    <p></p>

    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
    <hr/>

                <p>
                The ”standard pipeline” to do a bundle adjustment with ground control points with MicMac is: <br/>
— compute images relative orientations, with Tapioca and Tapas;<br/>
— transform GCP coordinates into a local euclidean coordinate system, with GCPConvert;<br/>
— measure image coordinates for a small set of GCP, with SaisieAppuisInit;<br/>
— transform image relative orientations into the same local coordinate system, with GCPBascule;<br/>
— measure image coordinates for all GCP, with SaisieAppuisPredic;<br/>
— transform image relative orientations into the local coordinate system, with GCPBascule;<br/>
— run the bundle adjustment, with Campari;<br/>
— transform back relative orientations into an appropriate coordinate system, with ChgSysCo;<br/>
— compute a rectified image, with Tarama;<br/>
— make the matching with Malt;<br/>
— generate the ortho image with Tawny;
                </p>
                <p>The GCPBascule command, allows to transform a purely relative orientation, as computed with Tapas, in an absolute one, as soon as there is at least 3 GCP whose projection are known in at least 2 images.</p>
                <p>GCPBascule for using ground control point (GCP) to make a global transformation from a generally
purely relative orientation to an orientation in the system of the GCP;</p>
<p><a href="https://micmac.ensg.eu/index.php/GCPBascule" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/GCPBascule</a></p>
</div>
</div>

gcpbasculehelp.GCPBasculeGCPtext = <div>
    <p>Import space or tab delimited ground control point measurements in the AppGeoCub or AppEgels file format</p>
    <p>Use the "Create measurements files" button to save into the project.</p>
    <h3>Notes</h3>
    <ul>
        <li>the input file has to be a space or tabulation separated values file (no comma or other symbols)</li>
        <li>AppGeoCub text formatted as <br></br>PointNumber    X    Y    Z</li>
        <li>Lines beginning with '%' are considered as comments</li>
        <li>AppEgels text formatted as <br></br>PointNumber  VariableNonImported  X    Y    Z</li>
        <li>Lines beginning with '#' are considered as comments</li>
    </ul>
    <p><a href="https://micmac.ensg.eu/index.php/GCPConvert" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/GCPConvert</a></p>
</div>

gcpbasculehelp.GCPBasculeGCPxml = <div>
    <p>Open the project ground control point file or</p>
    <p>Import ground control point measurements from an external AppGeoCub format xml file</p>
    <p>Use the "Create measurements files" button to save into the project.</p>
    <p><a href="https://micmac.ensg.eu/index.php/GCPConvert" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/GCPConvert</a></p>
</div>

gcpbasculehelp.GCPBasculeAddGCP = <div>
    <p>add new GCP measurement</p>
    <p>choose a unique identification number and fill in the XYZ values measured on site. Use the X button to delete an entry </p>
</div>

gcpbasculehelp.GCPInitialPoints = 
<div>
    <h1>Initial Points</h1>
    <p>Measure a few points that will be processed to make defining all the rest of the points easier.</p>
    <p> We measure 3 support points well distributed (SaisieAppuisInit command)</p>
    <p>The whole process is this:</p>
    <ul>
        <li>2 files are created "InitialImageMeasurements-S2D.xml" and "InitialImageMeasurements-S3D.xml" for 2D measure on the image and 3D measure based on Tapas run</li>
        <li>The 2D file is run through GCPBascule to get an initial absolute orientation for all measured points</li>
        <li>That result is then fed into SaisieAppuisPredicQT to fine tune the result for a final GCPBascule run.</li>
    </ul>
    <h3>Windows Bugs</h3>
    <ul>
        <li>Small images can cause failure even when only one image is selected.</li>
        <li>Images list updates do not always update in a timely manner.</li>
    </ul>
    <p></p>
    <h3>Usage</h3>
    <ol className='help-usage-list'>
        <li>press <strong>Select Point</strong> to start an initial ground control point</li>
        <li>select image(s) that contain the point</li>
        <li>press the <strong>Set Regex</strong> to set image selection</li>
        <li>choose the point from the dropdown list</li>
        <li>press <strong>Init</strong> button to start the point matching process, SausieAppuisInit</li>
        <li>repeat for a total of at least 3 points on at least 2 images</li>
    </ol>
    <h3>SausieAppuisInit steps</h3>
    <ol className='help-usage-list'>
        <li>Select the point in list</li>
        <li>MMB and wheel to zoom and pan in the image</li>
        <li>LMB to set the point location and RMB to validate</li>
        <li>If the point already exists in the image drag it into position and RMB to validate.</li>
        <li>Exit to save files - InitialImageMeasurements-S2D.xml and InitialImageMeasurements-S3D.xml</li>
    </ol>
    <h3>SausieAppuisInit notes</h3>
    <ul>
        <li>when choosing a point in the list click on the number portion - it will turn orange when selected</li>
        <li>items that need to be validated will be orange in the images list</li>
        <li>validated items will show green on the image list</li>
        <li>fully validated items will be black in the points list</li>
        <li>mmb pan images</li>
        <li>mouse wheel to zoom</li>
        <li>UI update unreliable on Windows machines - move mouse around interface and hover over the point list to force an update</li>
        <li>will fail on black and white images (Windows bug?), must be rgb format images</li>
    </ul>
    
    <p><a href="https://micmac.ensg.eu/index.php/SaisieAppuisInitQT" target="_blank" rel="noopener noreferrer" >https://micmac.ensg.eu/index.php/SaisieAppuisInitQT</a></p>
</div>
gcpbasculehelp.GCPBasculeInitRun = 
<div>
    <h1>GCPBascule</h1>
    <h2>Initial 1st Run</h2>
    <p>Initial run to define a small subset of the GCP.</p>
    <p>The purpose of the initial run is to make defining all the points easier.</p>
    <p>Transforms a relative orientation into an absolute one using at least 3 ground control points (GCP)</p>
    <p>run on all images</p>
    <p>The GCPBascule command, allows to transform a purely relative orientation, as computed with Tapas, 
        in an absolute one, as soon as there is at least 3 GCP whose projection are known in at least 2 images. </p>
    <p><a href="https://micmac.ensg.eu/index.php/GCPBascule" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/GCPBascule</a></p>
</div>
gcpbasculehelp.GCPBasculePredicRun = 
<div>
    <h1>GCPBascule</h1>
    <h2>Final 2nd Run</h2>
    <p>Final run to process all the GCPs</p>
    <p>Transforms a relative orientation into an absolute one using all available ground control points (GCP)</p>
    <p>run on all images</p>
    <p>Transforms a relative orientation into an absolute one</p>
    <p>The GCPBascule command, allows to transform a purely relative orientation, as computed with Tapas, 
        in an absolute one, as soon as there is at least 3 GCP whose projection are known in at least 2 images. </p>
    <p><a href="https://micmac.ensg.eu/index.php/GCPBascule" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/GCPBascule</a></p>
</div>

gcpbasculehelp.SaisieAppuisInitQT = 
<div>
    <h1>SaisieAppuisInitQT</h1>
    <p> Interactive tool for initial capture of GCP. A small number of points will be defined and then processed to make defining all the GCP easier.</p>
    <p>mark locations of the GCP in the corresponding images</p>
    <p>graphic interface to input 2D and 3D coordinates of ground control points</p>
<p>from docmicmac for SaisieAppuisInitQT</p>
<p>displays two lists on the right side: the points list, and the images list. Points list can
be clicked to choose which point to measure. You can also remove a point by clicking it in the list and press
Suppr. You can also right-click and choose between following actions:</p>
<ul>
    <li>— Change images for selected point</li>
    <li>— Delete selected points (multiple selection allowed)</li>
    <li>— Validate selected points (idem)</li>
</ul>
<p>
The image lists show all available images. When a point has been measured in at least two images, the image list
is displayed. Images currently displayed in the windows are highlighted in blue. The image where the cursor is
moving is displayed in light orange. You can right-click and select View images to load corresponding images. A
3D window shows the images location, and the point measured. By default point are displayed in red ; when a
point is selected, it is displayed in blue.</p>
<p><a href="https://micmac.ensg.eu/index.php/SaisieAppuisInitQT" target="_blank" rel="noopener noreferrer" >https://micmac.ensg.eu/index.php/SaisieAppuisInitQT</a></p>

</div>

gcpbasculehelp.SaisieAppuisPredicQT = 
<div>
    <h1>Validate Points</h1>
    <h2>SaisieAppuisPredicQT</h2>
    <p> Interactive tool for assisted capture of GCP</p>
    <p>run basc init first</p>
    <p>select all images that contain GCPs and run</p>
    <p>We have now to measure the remaining points : the absolute orientation calculated from the previous step, allows to suggest an approximated position for each points</p>
    <p> When the global transform between ground control points and image relative orientations is known, we can switch to the predictive interface SaisieAppuisPredic which will display the remaining ground control points, loaded from the Xml file. You need to adjust points image location and validate them. </p>
    <h3>SausieAppuisPredic steps</h3>
    <ul>
        <li>Select all images that have GCP visible in them and press the <strong>Validate Points</strong> button</li>
        <li>Choose a point in the list(directly on the number)</li>
        <li>RMB on the list point and "Change images for ###"</li>
        <li>LMB drag a point in an image to position it</li>
        <li>RMB to validate it and the other 3 images will zoom to the same point</li>
        <li>Move good points into position and RMB Validate them</li>
        <li>RMB Refute bad points</li>
        <li>If all the points on the images are bad simply RMB Refute them all</li>
        <li>repeat by RMB "Change images" in the points list until the point entry turns black</li>
        <li>choose another point in the list and continue as before until all points in the list are black</li>
        <li>exit to save files - InitialImageMeasurements-S2D.xml and InitialImageMeasurements-S3D.xml</li>
    </ul>
    <h3>SausieAppuisPredic notes</h3>
    <ul>
        <li>can run multiple times to update</li>
        <li>zoom the selected point in each image before validating</li>
        <li>work on 1 point at a time to reduce confusion</li>
        <li>start with valid points before refuted points</li>
        <li>when choosing a point in the list click on the number portion - it will turn orange when selected</li>
        <li>items that need to be validated will be orange in the images list</li>
        <li>validated items will show green on the image list</li>
        <li>fully validated points will be black in the points list</li>
        <li>mmb pan images</li>
        <li>mouse wheel to zoom</li>
        <li>UI update unreliable - move mouse around interface and hover over the point list to force an update</li>
    </ul>
    <p><a href="https://micmac.ensg.eu/index.php/SaisieAppuisPredicQT" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/SaisieAppuisPredicQT</a></p>
</div>


gcpbasculehelp.Campari = 
<div>
    <h1>Campari</h1>
    <p>Campari is a tool for compensation of heterogeneous measures (tie points and ground control points). 
        By default, the bundle adjustment computed by Campari only affects camera orientation(position and lens direction).</p>
    <p> Changing the value of FocFree and/or PPFree and/or AffineFree, or AllFree to 1 permits to refine also camera calibration.</p>
    <p>It can take in gcp and gps run after a good orientation found and after bascule</p>
    <p>Campari can also be used to refine the camera solve.</p>
    <p>georeferencing tool</p>
    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><h3>Campari GCPBascule controls</h3></li>
        <li><strong>Final 2D</strong> use the 2D file from the final measurments in the GCP param section</li>
        <li><strong>Initial 2D</strong> use the 2D file from the initial measurments in the GCP param section</li>
        <li><strong>Text tie points</strong> Tapioca was run with the text format output</li>
        <li><strong>Use GCP param</strong> "GCP=" section will be added to the command</li>
        <li><strong>Orientation out</strong> - destination folder for the computed results</li>
        <li><strong>measurement uncertainty</strong> - GCP measurement uncertainty in the units of measure(meters, inches etc.)</li>
        <li><strong>pixel uncertainty</strong> - GCP pixel uncertainty in pixels</li>
    </ul>
    <p>measurement uncertainty is in the units of measure, ex) uncertainty of 0.002 in units of meters is 2 mm uncertainty</p>
    <ul className='help-controls'>
        <li><h3>Campari Tapas controls</h3></li>
        <li><strong>Orientation in</strong> - input folder</li>
        <li><strong>Out</strong> - destination folder for the computed results</li>
        <li><strong>None, CPI1, CPI2</strong> - "If Campari is used repeatedly to improve orientation, use the CPI1=1 option on the first call to Campari, and CPI2=1 for any subsequent call"</li>
        <li><strong>Lock poses</strong> - frozen poses</li>
        <li><strong>Refine FL</strong> - free focal length</li>
        <li><strong>Refine PP</strong> - free principle point</li>
    </ul>
    <p><a href="https://micmac.ensg.eu/index.php/Campari" target="_blank" rel="noopener noreferrer" >https://micmac.ensg.eu/index.php/Campari</a></p>
    <p>Some notes: <a href="http://bestrema.fr/micmac-tutoriel-et-script-pour-photogrammetrie-sous-windows/" target="_blank" rel="noopener noreferrer">http://bestrema.fr/micmac-tutoriel-et-script-pour-photogrammetrie-sous-windows/</a></p>

    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
        <hr/>
    <h2>AppuisPredic bad results</h2>
    <p>only way to get good campari is set pixel uncertainty to about 50 which gives a poor scaling result</p>
    <p>AppuisInit seems better? in that the 2d coordinates saved match the image, but maybe the bascule changes the image to allow for distortion?</p>
    <p>also note that baked (already processed from tutorial 2d measurments seem to give a good result - see gravillons tut</p>
    <p>translated from <a href="http://bestrema.fr/micmac-tutoriel-et-script-pour-photogrammetrie-sous-windows/" target="_blank" rel="noopener noreferrer">http://bestrema.fr/micmac-tutoriel-et-script-pour-photogrammetrie-sous-windows/</a></p>
    <p>FocFree = 1 only frees the focal length</p>
    <p>PPFree = 1 frees only the main point (intersection of the axis of the objective with the sensor).</p>
    <p>AllFree = 1 frees all the parameters</p>
    <p>CPI1 and CPI2 also used</p>
    <p>more info on the page may explain how campari is used and what it does</p>
    <p>campari can make a bad orientation from tapas good for radial and fisheye modes</p>
    <p>campari improves GCP result via weighting?</p>
    </div>
</div>
gcpbasculehelp.SaveMeasurements = <div>
    <p>save 2d measure file into the project in xml and txt formats. The names of the file come from the GCP Xml name above.</p>
</div>
export default gcpbasculehelp;