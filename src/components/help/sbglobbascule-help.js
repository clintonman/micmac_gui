import React from 'react';
const sbglobbasculehelp = {};

sbglobbasculehelp.SBGlobBasculeGeneral = 
<div>
    <h1>SBGlobBascule</h1>
    <p>Generate absolute world orientation based on physical information on the scene without using ground control point definitions.</p>
    <p>User defines the orientation through masking and setting points in images to define the ground plane, X axis direction, origin point and scale.</p>
    <h2>General Usage</h2>
    <ol className='help-usage-list'>
        <li>set points, <em>Line1</em> and <em>Line2</em> in the images to define the horizontal X axis direction</li>
        <li>set points to define an origin and scale, <em>Ech1, Ech2, Origine</em></li>
        <li>mask one or more images to define the ground plane, Z=0 XY plane</li>
        <li>run the bascule and campari commands to apply the defined world orientation</li>
        <li>check the resulting sparse cloud</li>
    </ol>
    
    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><strong>Copy 2D File</strong> - used to copy a premade 2D file from tutorials</li>
        <li><strong>Define Points</strong> - select images to define the points that define the global orientation</li>
        <li><strong>Mask Image</strong> - define ground plane by masking one or more images</li>
        <li><strong>Ground from mask(s)</strong> - use the masks to define the ground</li>
        <li><strong>Use distance fs</strong> - Ech1 and Ech2 distance is known and points have been defined</li>
        <li><strong>Distfs</strong> - distance between Ech1 and Ech2</li>
        <li><strong>out orientation</strong> - destination folder for the new camera orientations</li>
        <li><strong>Target coordinate system</strong> - </li>
        <li><strong>Calculate</strong> - calculate global transform based on input points and ground masks</li>
        <li><strong>Run Campari</strong> - to apply the global orientations to the cameras</li>
        <li><strong>3d Preview</strong> - see sparse cloud result to check the new orientation</li>
        <li><strong>Make 3D Mask</strong> - filter out undesirable points from the cloud</li>
    </ul>

    <p>Windows Bug: If the images are too small the Define Points(SaisieBascQT) may fail to run properly with more than 3 images selected.</p>
    <p><a href="https://micmac.ensg.eu/index.php/SBGlobBascule" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/SBGlobBascule</a></p>

    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
    <hr/>

<p>”scene based global” bascule</p>
                    <p>mm3d SaisieAppuisInitQT FullName Orientation PointName FileForImageMeasurements</p>
                    <div>
                    size and orientation
select images
tapioca
tapas
apericloud - optional
SaisieMasqQT - on 1 or more images
SaisieAppuisInitQT - select Line1 and Line2 defining X axis in 1 image only? and assumed to be in masked plane
SaisieAppuisInitQT - optional select Ech1 and Ech2 points defining size in at least 2 images
SBGlobBascule - PostPlan=_Masq, optional DistFS=desired distance between Ech1 and Ech2, "_Masq" is default postfix to masked image name
apericloud - optional
c3dc
tipunch
tequila
                    </div>
                    <br/>
                    <div>SaisieMasqQT 
                    Main actions are :

F2: display image in full screen
Wheel roll: zoom
Wheel click: move image
Shift+wheel click: zoom fast
Left click: add a point to polygon
Right click: close polygon
Space: Add to mask
Suppr: Remove from mask
Right click (close to a point): delete point
Echap: delete polygon
Shift + click & drag: insert point
Ctrl+S: save mask image and Xml file
Ctrl+Q: quit
                    </div>
                    <p>mm3d SaisieBascQT "^Lnk12IMGP5307.JPG$" All OutputBasc.xml

mm3d SaisieMasqQT Lnk12IMGP5307.JPG

SBGlobBascule "^Face1IMGP(5259|52[6-8][0-9]|529[0-3]).JPG$|^Lnk12IMGP(529[5-9]|530[0-9]|531[0-2]).JPG$|^Face2IMGP(531[4-9]|53[2-4][0-9]|535[0-4]).JPG$" All OutputBasc.xml Glob PostPlan=_Masq

SBGlobBascule "^Face1IMGP(5259|52[6-8][0-9]|529[0-3]).JPG$|^Lnk12IMGP(529[5-9]|530[0-9]|531[0-2]).JPG$|^Face2IMGP(531[4-9]|53[2-4][0-9]|535[0-4]).JPG$" All OutputBasc-S2D.xml Glob PostPlan=_Masq


mm3d AperiCloud "^Face1IMGP(5259|52[6-8][0-9]|529[0-3]).JPG$|^Lnk12IMGP(529[5-9]|530[0-9]|531[0-2]).JPG$|^Face2IMGP(531[4-9]|53[2-4][0-9]|535[0-4]).JPG$" Glob WithCam=0


mm3d SaisieMasqQT Face1-IMGP5261.JPG
mm3d SaisieMasqQT Face2-IMGP5352.JPG

mm3d AperiCloud "^Face1IMGP(5259|52[6-8][0-9]|529[0-3]).JPG$|^Lnk12IMGP(529[5-9]|530[0-9]|531[0-2]).JPG$|^Face2IMGP(531[4-9]|53[2-4][0-9]|535[0-4]).JPG$" Glob WithCam=0</p>
<p>There is a new option Rep=ij, the meaning of this option is :
— it is a string that describe a repair;
— it must contain 2 symbols, each symbols can be in (i,-i,j,-j,k,-k) and describe a vector;
— the global orientation with be such that in the final orientation the line defined by Line1-Line2 is aligned
on first vector, and the normal to the plane is aligned on second vector;
— here in final orientation i will be the horizontal of the wall and j will be the normal to the wall, consequently
k = i ∧ j will be the vertical;</p>
</div>
</div>


sbglobbasculehelp.SaisieBasc = 
<div>
    <h1>SaisieBasc</h1>
    <p>Tool to measure special points in the images with the goal of producing an absolute orientation for the model by running the result through SBGlobBascule and Campari.</p>
    <p>It's purpose is to create an input file for the SBGlobBascule command.</p>
    <p>It is used to mark the horizontal line in the X direction, the scale by marking a line whose length is known and an origin point can also be defined.</p>

    <h2>Windows Bugs</h2>
    <ul>
        <li>Small images can cause failure. Try processing images 1 at a time.</li>
        <li>If gets stuck loading an image try click in window then press the esc key.</li>
        <li>May spontaneously crash and close the window</li>
    </ul>

<h2>Measurements:</h2>
<ul>
    <li>Points <strong>Line1</strong> and <strong>Line2</strong> define the direction of the X axis</li>
    <li>Masked images define the Z=0 XY plane later</li>
    <li>Points <strong>Ech1</strong> and <strong>Ech2</strong> define a known distance in the images and are used for scaling the point cloud</li>
    <li><strong>Origine</strong> defines the origin point. Overrides the Z=0 of the image mask?</li>
    <li><strong>Distfs</strong> defines the distance between Ech1 and Ech2 when SBGlobBascule is run</li>
</ul>
<h2>Usage Steps:</h2>
    <ol>
        <li>The images can be selected one at a time or as a group of images. Select the images that will be measured.</li>
        <li>press the "Define Points" button</li>
        <li>If the window gets stuck try LMB in the window then press the esc key.</li>
        <li>Select the point in the points list by clicking on it's name. It turns orange.</li>
        <li>LMB click in the image(s) to set the point location. The whole line turns orange. Drag the point into position if it already shows on the image.</li>
        <li>RMB and choose validate to set the point if the point was positioned by dragging. Point turns green in the image.</li>
        <li>It is not necessary to set all the points.</li>
        <li>Set the X horizontal direction by defining points Line1 and Line2 in one image. It does not have to be the same image and an image mask will be required later.</li>
        <li>Set the scale by defining the Ech1 and Ech2 points in at least 2 images.</li>
        <li>Set the origin point (0,0,0) by defining the Origine point in at least 2 images</li>
        <li>File Exit when done defining the points.</li>
    </ol>
    <h2>Usage notes</h2>
    <ul>
        <li>A maximum of 4 images will display at one time in the left section.</li>
        <li>Window has two lists on the right side: the points list above and the images list below.</li>
        <li>Select the point in the list by clicking on it's name.</li>
        <li>Press the delete key to remove a point from the list - not needed for this process</li>
        <li>The image lists show all available images but won't display anything until a point has been measured in one image and the points list is hovered over.</li>
        <li>RMB click the image list and choose "View Images" to cycle through all the open images</li>
        <li>Moving the mouse cursor to the images on the left will highlight the image name in the image list</li>
        <li>Points start as yellow in color</li>
        <li>Points turn green when validated in the image they are validated in.</li>
        <li>Point line turns black when a point is defined in all open images</li>
        <li>To only scale the data define Ech1 and Ech2 and nothing else and use distfs later</li>
        <li>To only translate define Origine and nothing else</li>
        <li>If Line1 and Line2 are defined then a mask will be needed to define the XY plane</li>
    </ul>

<div>
    
    <h3>notes</h3>
    <ul>
        <li>Windows Bug: The process may fail to run properly on small images. 
            Small images can be processed more reliably when run on one image at a time.</li>
    </ul>
    
<p><a href="https://micmac.ensg.eu/index.php/SaisieBascQT" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/SaisieBascQT</a></p>
</div>
<label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
        <hr/>
        <p>Plan0 point meaning is not defined anywhere</p>
        <p>SaisieBasc is a graphic interface to measure objects to be able to perform transformations such as data scaling and rigid transformation (rotation, translation). 
            One can size a point to set the origin of the new frame. One can size two lines:
<br></br>
one to set horizontal (with two points: Line1, Line2) required <br/>
one to set scale (with two points: Ech1, Ech2) optional</p>
        </div>
</div>
export default sbglobbasculehelp;