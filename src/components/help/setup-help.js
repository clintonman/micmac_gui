import React from 'react';
const setuphelp = {};
setuphelp.SetupGeneral = <div>
    <h1>Start/Setup</h1>
    <h2>Overview</h2>
    <p>This is the starting point for processing a set of images into a 3d point cloud, ortho images or mesh.
        The first step is to find common features between all the images. 
        Then the camera properties are calculated based on the initial image exif information and the tie points previously calculated.
        The position and orientation of the cameras is also computed.
        A sparse point cloud is created to check the solution and for creating a mask to use for the final dense 3d output.
        Additional information can be added to the camera data by defining the ground plane and X direction or having onsite measurement data to define the world orientation and scale.
        A dense cloud is created. At this point the cloud can be exported to Meshlab and ortho photos can be generated.
        The final step is to produce a 3d mesh from the cloud points that can be exported in Collada, GLTF and Wavefront obj formats.
    </p>

    <h2>General Usage</h2>
    <ol className='help-usage-list'>
        <li>Define the file paths and camera database if not already set</li>
        <li>Clear Files and load jpg image set. Each image will correspond to a different camera of the same name inside the photogrammetry process.</li>
        <li>If the jpeg images do not have a 35mm equivalent setting or the camera is not in the database then use SetExif or add the camera to the database.</li>
        <li>Tapioca tab for tie point matching</li>
        <li>Tapas tab for camera processing and orientation</li>
        <li>Apericloud tab for sparse point processing</li>
        <li>Optionally go to SBGlobBascule or GCPBascule tabs for world orientation and refinement of the camera positions</li>
        <li>C3DC tab to create a dense cloud and Orthophotomosaic images. Option to export to Meshlab to process the cloud into a high quality textured mesh. </li>
        <li>TiPunch create a mesh from the dense cloud </li>
        <li>Tequila create a UV textured mesh from the tipunch mesh</li>
    </ol>

    <h2>Controls</h2>
    <ul className='help-controls'>
    <li><strong>Clear Files</strong> - empty the working folder of all content</li>
    <li><strong>Copy Images</strong> - select jpeg images to be copied into the working folder for further processing</li>
    <li><strong>Load State</strong> - reload the last saved state. State is updated at the end of each major process. The record of processes that ran successfully will show in the Start tab</li>
    <li><strong>Delete State</strong> - reset the state to empty</li>
    <li><strong>Terminal</strong> - open a terminal to the working folder</li>
    <li><strong>File Browser</strong> - open a file browser to the working folder</li>
    <li><strong>Import</strong> - import a camera database.</li>
    <li><strong>Edit</strong> - edit the camera database</li>
    <li><strong>SetExif</strong> - all dataset images must have camera information even if it is meaningless/unknown. Set the values and use this to set incorrect or missing data.</li>
    <li><strong>Use SaisiemasqQT</strong> - use the SaisiemasqQT command for masking images and 3d point clouds. Use Saisiemasq when unchecked. QT is required for Windows and optional for Mac and Linux?</li>
    <li><strong>Beep on complete</strong> - make a sound after a process step is complete.</li>
    <li><strong>Minimize command inputs</strong> - display resulting commands as a single line to save space.</li>
    <li><strong>Max points</strong> - maximum number of points to display in the 3D view. Set the value then prress the Set Max Points button.</li>
    <li><strong>Mm3d Path</strong> - set the path to the mm3d executable.</li>
    <li><strong>Temp Path</strong> - set the folder to be used for the working directory for the process. This will default to a folder in the users temp directory.</li>
    <li><strong>Remove Settings</strong> - open a file explorer to the settings folder, so it can be removed manually after exiting the MicMac GUI program.</li>
    </ul>
    
    <h2>Notes</h2>
    <p><a href="https://github.com/micmacIGN/Documentation" target="_blank" rel="noopener noreferrer" >https://github.com/micmacIGN/Documentation</a> - DocMicMac.pdf can be found here</p>
    <p><a href="https://micmac.ensg.eu/index.php/Accueil" target="_blank" rel="noopener noreferrer" >https://micmac.ensg.eu/index.php/Accueil</a> - MicMac wiki page</p>
    <p>if get failure with "cannot find file" error while running a process just try running it again</p>
    <p>Tests indicate that the micmac tools may run up to 10% faster on Linux than on Windows machines.</p>

    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
        <hr/>
        <p>imported camera db has "Canon Powershot A10", exif from sample files has "Canon PowerShot A10" with capital "S" so need edit camera db after import to match<br/>
        this is needed for the ET and Kermit samples</p>
        <p>calibration-camera internal parameters</p>
        <p>orientation-relationship between viewpoints and objects</p>
        <p>bundle adjustment is calibration and orientation</p>
        <p>correlation-dense matching for 3d scene reconstruction</p>
        <p>linux messes this up if goes to sleep</p>
        <p>only jpeg files allowed</p>
        <p>Tapas and Campari both camera orientation. Tapas only tie points input. Campari tie points plus GCP</p>
        <p>Camapri happens after Tapas and Bascule for abs orientation</p>
        <p>MVSM - multi view stereo image mapping</p>
        <p>DSM - difital surface model</p>
        <p>C3DC provides point cloud, PIMs provide depth map</p>
        <p>orhtopohoto PIMs to PIMs2MNT to Tawny</p>
        <p>gui tool start with "v" or end in "QT"</p>
        <p>OriConvert use GPS data in images to make image pairs for matching</p>
        <p>WebGL is limited to 64k points?</p>
    </div>
</div>

setuphelp.CameraDB = <div>
    <h3>Import camera sensor data</h3>
    <p>generates a DicoCamera.xml file inside the micmac include/XML_User folder</p>
    <p>the values in the imported file will override the coresponding values in the default database file.</p>
    <p>file format is:</p>
    <p>CameraMaker, CameraModel, SensorDescription, SensorWidth(mm), SensorHeight(mm), SensorWidth(pixels), SensorHeight(pixels)</p>
    <p>uses the "detailed" version of the database from</p>
    <p><a href="https://github.com/openMVG/CameraSensorSizeDatabase" target="_blank" rel="noopener noreferrer">https://github.com/openMVG/CameraSensorSizeDatabase</a></p>
    <p>\CameraSensorSizeDatabase-master\CameraSensorSizeDatabase-master\<strong>sensor_database_detailed.csv</strong></p>
    <p>Database file saved to the micmac folder/Include/XML_User/DicoCamera.xml</p>
</div>
setuphelp.loadimages = <div>
    <h3>Copy Images</h3>
    <p>will not copy images that do not have numbers in the name</p>
    <p>will rename the files, removing all characters that are not numbers, letters, period or underscores</p>
    <p>to add new images to existing images, reload the old images and include the new images. 
        The processed data for existing images will be preserved.</p>
    <p>The images must have an exif header with camera information that exists in the camera database if a 35mm equiv is not found in the exif data.</p>
    <h3>SetExif</h3>
    <p>SetExif is used to build an exif header for images that have none. 
        Micmac requires an exif header, even if the values have no real meaning. </p>
        <p>It is possible to get a succesful solve with incorrect focal length and 35mm equiv values.</p>
</div>
setuphelp.micmacFiles = <div>
    <h3>Temp files created by micmac</h3>
    <p>Ori - orientation</p>
    <p>Homol - Tapioca results</p>
    <p>Tapioca creates folders : Homol, Homol_SRes, Pastis and Tmp-MM-Dir</p>
</div>
//note setexif cannot be used after tapas attempt, can keep homol folder and clear out all other files
export default setuphelp;