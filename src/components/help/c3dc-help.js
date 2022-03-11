import React from 'react';
const c3dchelp = {};

c3dchelp.C3DCGeneral = 
<div>
    <h1>C3DC</h1>
    <p>The command Culture 3D Cloud (C3DC) is the first version of a 100% automatic point
    cloud correlation. It is possible to launch it just after the AperiCloud so the PLY can use
    the 3D mask. It is based on AperoChImSecMM and MMInitialModel experience.
    This command generates automatically masks (using tie points), select best pictures for
    correlation and prevent certain bad projections at the borders of 2D masks. It will create a
    colored, oriented .ply file with the normals.
    </p>

    <h2>General Usage</h2>
    <p>Run after camera and model have been checked with Apericloud. 
        When complete the result can be exported for further processing in Meshlab and Orthophotos can be generated.</p>

    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><strong>Use mask</strong> - use the predefined 3D mask to filter the points for processing</li>
        <li><strong>Mode</strong> - QuickMac is the fastest and lowest density result, Statue is the slowest and highest density result</li>
        <li><strong>Orientation</strong> - from last camera orientation result from Tapas or Campari</li>
        <li><strong>Binary</strong> - resulting ply file will be in binary format, uncheck for text format result</li>
        <li><strong>Use GPU</strong> - use NVidia Cuda for some calculations</li>
        <li><strong>Dense Cloud</strong> - generate and display the 3d point cloud</li>

        <li><h3>Meshlab</h3></li>
        <li><strong>Export Meshlab</strong> - create a meshlab project file</li>
        <li><strong>Copy Path</strong> - will copy the path to the project file into the clipboard so it can be pasted inside Meshlab open project menu option</li>
        <li><strong>Copy Ply Path</strong> - copy the ply file path for past in import mesh of Meshlab file menu</li>
        <li><h3>Orthophoto</h3></li>
        <li><strong>Mask An Image</strong> - define the face direction for the ortho photo in one or more images</li>
        <li><strong>Line</strong> - type of line used</li>
        <li><strong>Ortho cylindrical</strong> - used when images are in a single line</li>
        <li><strong>RepLocBascule</strong> - define Z axis as perpendicular to the masked image</li>
        <li><strong>Local Repair</strong> - use local repair from GCPBascule</li>
        <li><strong>PIMs2Mnt</strong> - create digital surface or elevation model from depth maps</li>
        <li><strong>Save Depth Map</strong> - save as tiff format file</li>
        <li><strong>Tawny</strong> - create ortho photo mosaic</li>
        <li><strong>Save Photomosaic</strong> - save tif image</li>
    </ul>
    <p>Orthophoto section is used to create depth maps and ortho photo mosaic images</p>

    <p><a href="https://micmac.ensg.eu/index.php/C3DC" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/C3DC</a></p>


    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
    <hr />
    <div>The C3CD command is the command that compute automatically a point cloud from a set of oriented images.</div>
    <p>c3dc option SH seems to match tapas SH option, but is undocumented</p>
                <p>c3dc uses homol(not sres) and ori folders - others can be removed</p>
                <p>before c3dc have homol, ori-all, ori-internscan, pastis, tmp-mm-dir</p>
                <p>no way to have feedback during run - nothing meaniningful to display</p>
                <p>test cuda gpu had no effect</p>
                <div>The syntax is :             
                    <ul>
                        <li>— type of matching in enumerated values</li>
                        <li>— set of images to use</li>
                        <li>— orientation</li>
                        <li>— if Masq3D is speciﬁed, indicates a 3D masq as created with SaisieMasqQT;</li>
                        <li>— if SzNorm is speciﬁed, indicates the window size parameters for normal extraction in ply ﬁle (usefull for meshing);</li>
                        <li>— if PlyCoul is speciﬁed, indicates that coloring of points is required.</li>
                        <li>— if ZoomF is speciﬁed, indicates the Zoom Final (1 is full resolution, 2 is half...). Default value for each type of matching is:
                            <ul>
                                <li>— BigMac = 2</li>
                                <li>— MicMac = 4</li>
                                <li>— QuickMac = 8</li>
                                <li>— Statue = 2 (epipolair matching)</li>
                                <li>— Forest = 4 (epipolair matching)</li>
                            </ul>
                        </li>
                        <li>— if SH is speciﬁed, suﬃx of Homol folder (default=”” means ”Homol”).</li>
                        <li>— if NormByC is speciﬁed, in the output PLY ﬁle: replace vector normal for each point by optical center coordinate.</li>
                        <li>— if ZReg is speciﬁed in MM-Param2Im.xml, default value = 0.05</li>
                        <li>— if DefCor Default correlation score threshold, default value = 0.5 (in Epipolair Matching mode)</li>
                    </ul>
                </div>
                <p>This command generates automatically masks (using tie points), select best pictures for 
correlation and prevent certain bad projections at the borders of 2D masks. It will create a 
colored, oriented .ply file with the normals.
Notice that 
different mode of correlation are available, while Quick/Mic/BigMac are 
multistereoscopic, the Statue mode is stereoscopic (with an epipolar geometry approach, 
better but slower)
.</p>
<p>masking comes from the AperiCloud process and SaisieMasqQT or the 2D masking processes</p>
    <p>creates several ply files inside PIMs-BigMac folder then combines them into C3DC_BigMac.ply</p>
    <p>requires data from Homol and Ori* folders, free to remove all others</p>
    <p>
    C3DC   Automatic Matching from Culture 3D Cloud project
</p>
<p>export meshlab creates a meshlabProj.mlp project file - this file along with the ply file can be read into meshlab for further processing, meshing etc.</p>
<p>Windows/MicMac v1.0beta13 - BigMac mode will not process properly inside meshlab (per vertex normals error when try to poisson cloud).</p>
<p>c3dc does limited automasking based on tie points, generates normals, statue is best and very slow</p>
</div>
</div>

c3dchelp.Meshlab = 
<div>
    <h1>Meshlab</h1>
    <p>the open source system for processing and editing 3D triangular meshes</p>
    <p>Meshlab only accepts Tapas mode of RadialBasic, RadialStd and RadialExtended</p>
    <p>Gives a better textured mesh result than TiPunch and Tequila.</p>
    <p>Meshlab does not work directly with BigMac mode ply files because of vertex normals error on poisson reconstruction.
    Workaround is to run Meshlab menu item: "Filters" then "Point Set" then "Compute normals for point set"</p>
    <h2>Load into Meshlab</h2>
    <ol>
        <li>Generate a dense cloud</li>
        <li>Press <strong>Export Meshlab</strong> to run the Apero2Meshlab command</li>
        <li>Press <strong>Copy Path</strong></li>
        <li>Open Meshlab</li>
        <li>File menu, Open project... and paste</li>
        <li>Back in MicMac press <strong>Copy Ply Path</strong></li>
        <li>In Meshlab File menu, Import Mesh… and paste</li>
    </ol>

    <h3>UV textured mesh creation</h3>
    <ol>
        <li>Filters menu then "Remeshing, Simplification and Reconstruction" then "Surface Reconstruction Screened Poisson" </li>
        <li>Set values and press "Apply" then "Close"</li>
        <li>Select the Poisson mesh in the list to make it the active layer.</li>
        <li>Filters menu then Selection then "Select non Manifold Edges", Apply, Close and press the Delete key</li>
        <li>do one of the following
            <ul>
                <li>Filters menu then Texture then "Parameterization + texturing from registered rasters" - good for fewer images/lower res mesh</li>
                <li>Filters then Camera then "Project active rasters to current mesh, filling the texture" - good for many images/high res mesh <br/>and as second step?not blended?</li>
            </ul>
        </li>
        <li>Export the mesh to the mm3d_temp folder, since that seems to be where the generated texture ends up even when a different folder is selected.</li>
    </ol>
    <h3>Rough notes and things to try</h3>
    <p>Simplify the mesh - Quadratic Edge Collapse Decimation</p>
    <p>Cleanup - Remove Faces from Non Manifold Edges - do before texture generation</p>
    <p>Uniform Mesh Resampling</p>
    <p><a href="https://www.meshlab.net/" target="_blank" rel="noopener noreferrer">https://www.meshlab.net/</a></p>
</div>

c3dchelp.C3DCMode = <div>
    <p>Notice that different mode of correlation are available, while Quick/Mic/BigMac are
multistereoscopic, the Statue mode is stereoscopic (with an epipolar geometry approach,
better but slower).</p>
<ul>
    <li>QuickMac This is a mode of C3DC with ZoomF=8 (low preset 1pt/64px)</li>
    <li>MicMac This is a mode of C3DC with ZoomF=4 (medium preset 1pt/16px)</li>
    <li>BigMac This is a mode of C3DC with ZoomF=2 (high preset 1pt/4px)</li>
    <li>Statue This is a different mode of C3DC with ZoomF=2 (high preset with less noise)</li>
    <li>Forest stereoscopic (strictly epipolar mode (ie. best stereographic pairs)) with ZoomF=4, ie. medium preset 1pt/16px</li>
    <li></li>
    <li>QuickMac multistereoscopic with ZoomF=8, ie. low preset 1pt/64px</li>
    <li>MicMac multistereoscopic with ZoomF=4, ie. medium preset 1pt/16px</li>
    <li>BigMac multistereoscopic with ZoomF=2 ie. high preset 1pt/4px</li>
    <li>Statue stereoscopic (strictly epipolar mode (ie. best stereographic pairs)) with ZoomF=2, ie. high preset 1pt/4px (with less noise)</li>
    <li>Forest stereoscopic (strictly epipolar mode (ie. best stereographic pairs)) with ZoomF=4, ie. medium preset 1pt/16px</li>
  
</ul>

<hr/>
<p>looks like QuickMac can give better results on poor quality images - styrac, doll dataset, less holes in the point cloud</p>

</div>

c3dchelp.RepLocBascule = <div>
    <h3>Define Z axis perpendicular to masked image</h3>
    <p>choose all images in facing direction and run</p>
    <p>MicMac tools are designed to work in the Z up direction. 
        Something like a wall needs a "local repair" so it lines up in Z for subsequent tool usage.</p>
    <p> Tool to define a local repair without changing the orientation</p>
    <p> Computation of a local landmark where the Z axis is perpendicular and going through the support points included into the masks</p>
    <p>define z axis perpendicular to masked image plane</p>
    <p>HORvy - treat vertical wall as the ground</p>
    <p>OrthoCyl=1 can be used when camera locations are all in a line or around a cylindrical subject</p>
    <p>next step run PIMs2Mnt and Tawny</p>
    <p><a href="https://micmac.ensg.eu/index.php/RepLocBascule" target="_blank" rel="noopener noreferrer"s >https://micmac.ensg.eu/index.php/RepLocBascule</a></p>
</div>

c3dchelp.PIMs2Mnt = <div>
    <p>Generate Mnt from Per Image Matchings</p>
    <p>As the name of the command is quite explicit, it will turn a result from a Per Image
Matching into a Modele Numérique de Terrain (aka DTM) with an option to compute an
orthophoto.</p>
<p>In a prior step, PIMs computes depth map for each image. PIMs2Mnt merges these individual depth maps in a global digital surface (or elevation) model.
Name of this tool comes from "Per Image Matching" (PIM) and the French "Modèle Numérique de Terrain" (MNT) which is generally translated by "Digital Elevation Model" (DEM). </p>
<p>?multiple pims error - need to delete pims folder?</p>
<p><a href="https://micmac.ensg.eu/index.php/PIMs2MNT" target="_blank" rel="noopener noreferrer" >https://micmac.ensg.eu/index.php/PIMs2MNT</a></p>
<p>The simplified tool for generating ortho mosaic is Tawny</p>
<p><a href="https://micmac.ensg.eu/index.php/Tawny" target="_blank" rel="noopener noreferrer" >https://micmac.ensg.eu/index.php/Tawny</a></p>
</div>
export default c3dchelp;