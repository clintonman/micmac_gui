import React from 'react';

const tapiocahelp = {};
tapiocahelp.TapiocaMode =
<div>
    <h1>Mode</h1>
    <p>Mode is an enumerated value specifying a functioning mode (i.e. a way to compute the pair of images
        that are to be matched). These values are</p>
    <ul>
        <li><strong>All</strong> for all possible pairs</li>
        <li><strong>MulScale</strong> for all pairs with multiscale optimization</li>
        <li><strong>Line</strong> for a selection adapted to linear images acquisition</li>
        <li>File for XML ﬁle describing the pairs - not used in GUI</li>
        <li>Graphs - note used in GUI</li>
    </ul>
</div>

tapiocahelp.TapiocaGeneral =
<div>
    <h1>Compute Tie Points</h1>
    <p>Tapioca is a tool for automatically computing common feature points between images.
        The resulting ties can be further processed through image masking and a process called Schnaps.
        The purpose of masking is to ignore moving objects or unchanging pixels in the images and 
        the purpose of Schnaps is to reduce the number of tie points.</p>

    <h2>General Usage</h2>
    <ol className='help-usage-list'>
        <li>Choose a mode and options, select the images and press the Run button</li>
        <li>After the run the resulting tie points between images can be examined in the viewport</li>
        <li>Optionally mask the images.</li>
        <li>Optionally run the mask or unmasked results through the Schnaps tool for further refinement</li>
    </ol>

    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><strong>Mode</strong> - choose a mode of operation. All will process all images, Line will process the images in a line and
            Mulscale will preprocess smaller versions of the images for a faster result.</li>
        <li><strong>Suggest Scale</strong> - set scale to shrink the images before processing. The MicMac docs recommend a final image scale
            of 0.3 to 0.5</li>
        <li><strong>Set Fullsize Final</strong> - do not scale down the final image</li>
        <li><strong>Image size/Image scale</strong> - set final size of the image in pixels or scale</li>
        <li><strong>Small size/Small scale</strong> - set preprocess size for the Mulscale mode</li>
        <li><strong>Line Delta</strong> - the number of images to search before and after the current image for tie point matches</li>
        <li><strong>Line Circular</strong> - line mode where the first and last images are next to each other</li>
        <li><strong>Method</strong> - Digeo is newer and faster, Sift(scale invariant feature transform) is the older more reliable method.
            Digeo can cause Tapas to fail on a poor dataset.</li>
        <li><strong>Ratio</strong> - higher values result in more, lower quality matches, lower values will give fewer higher quality matches</li>
        <li><strong>Text format</strong> - will write the tie point data as text files instead of binary data.</li>
        <li><strong>Image contrast</strong> - will increase the contrast of the images before the feature search.</li>
        <li><strong>Select Previous</strong> - create image selection from previous tapioca runs to be combined with subsequent tapioca runs.
            Combine the 2 runs together, finding matches between the 2 groups but not within the groups.</li>
        <p>Can be used to add one or more images later to improve the final MicMac result.</p>
        <ol>
            <li>find features/matches between new images - select new images and run with the same mode and scale as the
                original run</li>
            <li>select the original run images and press Select Previous button</li>
            <li>select the new images</li>
            <li>set mode to All(Mulscale does not work(Windows?)) and run. Matches will be found between the original image
                set and the new image set.</li>
            <li>if was run after an original Tapas run then for next Tapas run select the original images and press Select
                Frozen, select all images and run Tapas.</li>
        </ol>
        <li><strong>Run</strong> - run the process to find tie point matches</li>
        <li><strong>Clear Previous</strong> - will clear the data generated by previous Tapioca runs</li>
        <li><strong>Mask An Image</strong> - select a single image and start the masking process. The mask will be a black and white tiff
            image file.
            If masking all the images will need a mask applied to them unless a single global mask is used.
        </li>
        <li><strong>Select Global Mask</strong> - select a black and white tiff format image to be used as a mask for all images.
            This is useful to remove fiducial marks that are common to all the images, like the crosses in old Apollo moon
            mission photos.</li>
        <li><strong>Process Masks</strong> - will filter the tie points based on the single global mask or from all the image maskes.</li>
        <li><strong>Clear Filter</strong> - remove the filter file created by the process masks run</li>
        <li><strong>NbWin</strong> - then number of windows the images will be broken up into for Schnaps processing</li>
        <li><strong>Run Schnaps</strong> - clean and reduce tie points. Can be run on the Tapioca run result or if masks are defined will use the masked image process result.</li>
        <li><strong>Clear Schnaps</strong> - clear the files created by the Schnaps process</li>
    </ul>

    <h2>Tie Points Display</h2>
    <p>Displays the tie points found between pairs of images. The image colors have been altered to differentiate them
        from each other.</p>
    <p><strong>Manual rotate</strong> is used to manually rotate images in the display by 90, 180 or 270 degrees</p>
    <p><strong>Portrait TP</strong> is used to fix the display of the points when the image is in portrait instead of
        of landscape format</p>
    <p><strong>Source</strong></p>
    <ul>
        <li><strong>Default</strong> - display points from the Tapioca run</li>
        <li><strong>Mask filtered</strong> - show the result of the masking operation</li>
        <li><strong>Schnaps reduction</strong> - show the points processed through Schnaps (and masking if any)</li>
    </ul>
    <p><strong>Tie point skip</strong> can be used to reduce the number of tie points displayed, by default it shows every tenth point
    </p>
    <p>Use the left and right dropdowns to select the image pairs to display and the slider to fade between the two
        images.</p>
    <p>A tiepoint can be removed by clicking on it in the image.</p>
    <p><strong>Prep</strong> - choose the 2 images and press to begin the tie point edit process. 
    When the window with 1 image opens, close it without making any changes. 
    This will create the files needed in order to edit the tie points.</p>
    <p><strong>Edit</strong> - open the 2 images to edit tie points</p>
    <p><strong>Update</strong> - write to the Homol to create the new tie points</p>
    <p><strong>Cancel</strong> - remove the temporary files and stop the process</p>

    <p><a href="https://micmac.ensg.eu/index.php/Tapioca" target="_blank"
            rel="noopener noreferrer">https://micmac.ensg.eu/index.php/Tapioca</a></p>

        <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
    <hr />
    <p>manual tie point edit process maybe not so useful as hoped. might work with very low tie point counts</p>
        <p>testing on low quality images shows it's best to run tapioca with low scale and <em>maybe</em> increase the ratio to 0.8 or 0.9 if more points are needed</p>
        <p>mulscale is faster than all mode when final scale is high. should be faster when not much overlap but not in a line</p>
    <p>images must not be too similar(can fix with Schnaps) and must be horizontal and vertical arranged</p>
    <p>lower scale is faster with not much loss of density?</p>
    <p>can be run differently for different selection of images, like use Line for images in a line then run again with
        All option to get extra info from images not in a line</p>
    <p>ffmpeg can be used to convert video - see 4.4.2 of pdf docs</p>

    <p> creates folders : Homol, Homol_SRes, Pastis and Tmp-MM-Dir</p>
    <p>Homol_SRes is created from the Mulscale option to hold the temporary small image matches.</p>
    <p>Homol is the final output folder containing tie point data</p>
    <p>Tmp-MM-Dir which contains in particular information taken from the exif of the photos,
        Pastis which contains the information of key points,
        Homol and Homol_SRes (if MulScale use ) for the storage of correspondences (homologous points).</p>
    <p>note: homol tie points not symetrical - tiepoints image A to image B not the same as B to A</p>
    <p>
        Tapioca full automatic tie points computation
        Tapioca Interface to Pastis which is an interface to Sift++ for tie point detection and matching
    </p>
    <p>HomolFilterMasq is a tool dedicated to filter tie point. So you have to use it after tie points computation by
        Tapioca and before orientation computation by Tapas (or Martini) and before tie point reduction by Schnaps.</p>
    <div>Schnaps is a global order-agnostic tie point reduction tool.</div>
    <p>The tie filter display may be useful for selecting calibration images.</p>
    <p>Line mode good to avoid bad match on similar structures that are not near each other</p>
    
            </div>
</div>

tapiocahelp.TapiocaCombine =
<div>
    <h1>Combine Tapioca Runs</h1>
    <p>Run the tie point match on 2 sets of images then combine them by selecting one of the sets for the previous image run and the other like a normal tapioca run. The 2 sets will be run together only looking for new tie points between the 2 sets.</p>
    <p>Process steps</p>
    <ol>
        <li>run Tapioca on a selection of images</li>
        <li>run Tapioca on another selection of images</li>
        <li>use the button to setup one of the previous run selections</li>
        <li>normal selection will be used for the other previous run</li>
        <li>when Tapioca runs a third time only matches between the two sets will be computed</li>
    </ol>
    <p>Can be used to add images to fill holes without starting from scratch.</p>
    <p>Can be used with multiple Line mode runs - is a little faster but more work and can avoid bad tie points from repeating features.</p>
    <p>Combining runs only works with the All mode. If scaling or MulScale is used for the runs then final scale for the images in the combined run must also match</p>
</div>

tapiocahelp.HomolfilterMasq =
<div>
    <h1>HomolfilterMasq</h1>
    <p>Used to remove tie points by mask filtering.</p>
    <p>Use a global mask to be applied to all images - ex remove tie points created by fiducial marks on images</p>
    <p>Add individual masks to all images then run to only keep tie points that are inside the masks. All the images must have a mask.</p>
    <p>HomolMasqFiltered folder will contain the resulting masked tie point data.</p>
    <p><a href="https://micmac.ensg.eu/index.php/HomolFilterMasq" target="_blank"
            rel="noopener noreferrer">https://micmac.ensg.eu/index.php/HomolFilterMasq</a></p>
</div>

tapiocahelp.Schnaps =
<div>
    <h1>Schnaps</h1>
    <p>The command Schnaps is used to clean and reduce tie points before any orientation, and without needing any
        order in the pictures. Its limitation is the user memory: it can’t be used if computer RAM is lower than Homol
        directory size.</p>
    <p>Can be used with tapioca line mode and low delta to add tie points between images.</p>
    <p>if Tapas fails or the 3d model has ghosting, can try running Schnaps to clean it up.</p>
    <p>The folder Homol_mini will contain the processed tie point data.</p>
    <p>"The Schnaps tool is not documented to our knowledge. It seems that this tool cuts each image into a number of
        windows (1000 by default),
        then checks for the presence of peer points and their correspondence with at least one other photo in each of
        these windows."</p>
    <p><a href="https://micmac.ensg.eu/index.php/Schnaps" target="_blank"
            rel="noopener noreferrer">https://micmac.ensg.eu/index.php/Schnaps</a></p>
</div>
export default tapiocahelp;