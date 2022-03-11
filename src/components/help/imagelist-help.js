import React from 'react';
const imagelisthelp = {};
imagelisthelp.ImageListGeneral = <div>
    <h1>Image List</h1>
    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><strong>Select All Images</strong> - all images are selected</li>
        <li><strong>Invert Selection</strong> - reverse the selection state, selected images become deselected and deselected images become selected</li>
        <li><strong>Clear Selection</strong> - deselect all images</li>
        <li>Width - width of the first image in pixels</li>
        <li>Selected - (number of selected images) / (total number of images)</li>
        <li><strong>Thumb size</strong> - set the size of the thumbnail images</li>
        <li><strong>Regex</strong> - the regular expression used to select the images for MicMac processes</li>
    </ul>
    <h3>Images</h3>
    <ul className="help-controls">
        <li>Color code: <strong>Green</strong> good, <strong>Blue</strong> ok, <strong>Red</strong> bad, <strong>Gray</strong> not processed yet</li>
        <li>Image Thumbnail - red cross mean deselected. Left click to toggle the selection state. Can be used with the Shift key for multiple selections.</li>
        <li>File name</li>
        <li>fl: is the focal length of the image</li>
        <li><strong>M</strong> mask button and indicator. "M" will show for masked images, pressing the button will start the masking process for that image.</li>
        <li>res: is the residual error of the camera calculations. The value corresponds to the color code</li>
    </ul>
</div>
//note setexif cannot be used after tapas attempt, can keep homol folder and clear out all other files
export default imagelisthelp;