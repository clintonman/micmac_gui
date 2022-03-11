import React from 'react';
const apericloudhelp = {};

apericloudhelp.AperiCloudGeneral = 
<div>
    <h1>Apericloud</h1>
    <p>Create and display a low density 3D point cloud used to verify a good result from the camera calculations. 
        It is run after the initial relative orientation of Tapas or after Campari refinement step or
        after global orientation has been applied to the cameras from SBGlobBascule or GCPBascule using Campari.</p>
    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><strong>Orientation in</strong> - output from the previous command, 
            typically "All" for Tapas, "SBGlobOut" for SBGlobBascule and "CampariOut" for GCPBascule</li>
        <li><strong>Binary</strong> - if unchecked text format ply file is produced</li>
        <li><strong>Include cameras</strong> - cameras included in cloud as point based representations</li>
        <li><strong>3D Preview</strong> - generate and display the sparse 3D point cloud</li>
        <li><strong>Make 3D Mask</strong> - mask out 3D points from further processing in subsequent steps</li>
    </ul>

    <p><a href="https://micmac.ensg.eu/index.php/AperiCloud" target="_blank"
            rel="noopener noreferrer">https://micmac.ensg.eu/index.php/AperiCloud</a></p>

    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
    <hr/>

    <p>maybe display ply file - webgl 64k points limit</p>
    <p>if holes try better tapas - fraser is best, or increase tapioca sampling(resolution?)</p>

    <div>Indeed the areas of the point cloud where you can see a lower density, will be the areas where the correlation
        will be more difficult. If there is a spatial coherence problem, it will be necessary to re-launch some commands
        differently parametrized whose possibilities are:

        - Increase the sampling of Tapioca, to obtain more tie points and therefore it is possible that some errors of
        geometric correspondence might be corrected.
        - Try to obtain a better internal calibration changing the “ModeCalib” (from Radial to Fraser), verifying the
        residual values and if needed add or remove some pictures of the calibration. - Perform an AutoCal on the
        problematic areas to verify or to identify the source of the problem. - Logically, according to the chosen
        commands to solve the problem, you will generally need to redo all the following commands. "AperiCloud" will use
        the folder "All", "Autocal" will overwrite the files in the folder "All" and will use the folder "Calib", and so
        on…</div>

    <p>This command allows to obtain a point cloud in .ply format in low density, containing all
        the tie points recognized. This command locates also the position of the cameras. The
        command is optional, but allows finally to verify and to validate visually the results of all
        the proceeding steps after all the previous calculations. Thanks to the visualization of this
        point cloud, it is possible to control the accuracy of the reconstruction of the scene and
        therefore it should be well restituted in the dense point cloud. This step allows to verify
        the global orientation of the scene and it gives you also some indications for the
        correlation phase. Indeed the areas of the point cloud where you can see a lower density,
        will be the areas where the correlation will be more difficult.</p>
    
            </div>
</div>
export default apericloudhelp;