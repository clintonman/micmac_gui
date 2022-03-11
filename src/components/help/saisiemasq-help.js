import React from 'react';
const saisiemasqhelp = {};

saisiemasqhelp.SaisieMasqRun = 
<div>
    <h1>SaisieMasq</h1>
    <p>Create mask files for images and 3D point clouds. 
        These masks are used for tie point filtering, ground plane definition 
        and reducing the area of interest for dense cloud production.</p>
        <p>The output is a black and white tiff format file when masking images 
            and an xml file when masking 3D ply format files.</p>
            <p><strong>LMB</strong>=left mouse button, <strong>RMB</strong>=right mouse button</p>
    <h3>Windows Bugs</h3>
    <ul>
        <li>Small images can cause failure.</li>
        <li>if the UI gets stuck on loading images try - LMB click in the window then press the esc key</li>
    </ul>
    <h2>Masking steps</h2>
        <ol>
            <li>if masking a 3D cloud orient the view for the selection and use the f9 key to toggle between selection and move modes</li>
            <li>LMB to set down polygon points</li>
            <li>RMB to close the polygon</li>
            <li>space key to add image polygon/3d points to the mask</li>
            <li>file menu save selection/mask and quit when done</li>
        </ol>

        <h2>Sausiemasq notes</h2>
        <ul>
            <li>Windows bug: if the UI gets stuck on loading images try - LMB click in the window then esc key</li>
            <li>LMB set polygon points</li>
            <li>RMB close polygon</li>
            <li>RMB on polygon point to remove from the finished polygon</li>
            <li>LMB drag on polygon point to move it</li>
            <li>shift + LMB on polygon line to add a point</li>
            <li><strong>esc</strong> to delete polygon</li>
            <li><strong>space</strong> add inside polygon to the mask</li>
            <li><strong>D</strong> remove inside polygon from the mask</li>
            <li><strong>Y</strong> remove outside of polygon from the mask</li>
            <li><strong>U</strong> add outside polygon to mask</li>
            <li>by default the output file will have the same name as the input with a "_Masq" postfix</li>
            <li>green is the part that is kept for tie point masking and dense 3D reconstruction</li>
        </ul>
        <p><a href="https://micmac.ensg.eu/index.php/SaisieMasqQT" target="_blank" rel="noopener noreferrer" >https://micmac.ensg.eu/index.php/SaisieMasqQT</a></p>
        <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
        <hr/>
    <div>SaisieMasq is a very simple tool to edit mask images. It creates a binary mask image from a polygonal selection in the displayed image. Processing is as follow: 
                        <ul>
                            <li>— Click: add a point to polygon </li>
                            <li>— Shift click: close polygon and apply selection </li>
                            <li>— Ctrl + right click: delete last point </li>
                            <li>— Shift + right click + Coul : switch between add mode and remove mode </li>
                            <li>— Shift + right click + Exit : save mask image and Xml ﬁle and quit</li>
                        </ul>
                    </div>
                    <div>SaisieMasqQT is the same tool as SaisieMasq,  you need to draw a polygon ﬁrst, and then apply an action (add to mask, remove from mask, etc.). You can get a complete list of possibles actions typing F1.
                        <ul>
                            <li>for 3D files use F9 to toggle between move and selection modes</li>
                            <li>create polygon
                                <ol>
                                    <li>— Left click: draw polygon points</li>
                                    <li>— Right click: finish drawing polygon </li>
                                </ol>
                            </li>
                            <li>edit polygon
                                <ul>
                                    <li>Left drag on a point to move it</li>
                                    <li>— Right click (close to a point): delete point </li>
                                    <li>— Shift + left click: add a new point to the polygon </li>
                                    <li>— Esc: delete the polygon </li>
                                </ul>
                            </li>
                            <li>edit selection/mask - shows as green mask or light dots in 3D
                                <ul>
                                    <li>— Space: Add to mask</li>
                                    <li>— D: Remove from mask </li>
                                    <li>— Y: Remove outside from mask </li>
                                    <li>— U: Add outside to mask </li>

                                </ul>
                            </li>
                            <li>— Ctrl+S: save mask image and Xml ﬁle </li>
                            <li>— F2: display image in full screen </li>
                            <li>— Wheel roll: zoom </li>
                            <li>— Wheel click: move image </li>
                            <li>— Shift+wheel click: zoom fast </li>
                            <li>— Ctrl+Q: quit</li>
                            <li>Ctrl+R: start over</li>
                        </ul>
                        <div> SaisieMasqQT can edit both images and 3d point clouds</div>
                    </div>
                    <div>SaisieMasqQT can also be used to measure 3D mask from a point cloud. This 3D mask is useful to restrict computation to the main object. SaisieMasqQT allows to open ply ﬁles in a 3D view and to do a manual segmentation with a polygonal selection tool. SaisieMasqQT can open one or several ply ﬁles (provided that ply ﬁles have been computed in the same reference frame). The 3D mask selection with SaisieMasqQT is designed to work with some speciﬁc functions, such as C3DC: the idea is to do a manual segmentation, by rotating around the objet, and by drawing a polygon. Each rotation (or translation) and polygonal selection is stored into a Xml ﬁle which can be used with other MicMac commands.</div>
                    <div>The command "SaisieMasqQT" launches a small program from which you can draw the masks for the correlation. 
To use the command: - File then Open Image - Left click then Draw the mask - Right click then Finish the mask - Dial then Zoom - Mask Edition then To modify the mask (add subtract, etc…) - File then Save Mask </div>
    <div>If screen gets stuck on "Loading..." then left click and press esc key</div>
    </div>
</div>
export default saisiemasqhelp;