import React from 'react';
const tequilahelp = {};

tequilahelp.TequilaGeneral = 
<div>
    <h1>Tequila</h1>
    <p>Tequila computes a UV texture image from a ply ﬁle, a set of images and their orientations.</p>
    <p>"Choosing a subset of the whole images is recommended (8 to 12 images can give good results, in statue mode)."</p>
    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><strong>Orientation</strong> - source folder for camera orientations</li>
        <li><strong>Mode</strong> - Pack or Basic</li>
        <li>
            <h3>Graph cut optimization</h3>
        </li>
        <li>
            <ul>
                <li><strong>enable</strong></li>
                <li><strong>weighting factor</strong></li>
                <li><strong># iteration steps</strong></li>
            </ul>
        </li>
        <li><strong>Max texture size</strong> - max size in width or height in pixels</li>
        <li><strong>Scale</strong> - which allow to speed up computation (higher downscale factor leads to faster computation)</li>
        <li><strong>JPG compression quality</strong></li>
        <li><strong>Max Angle</strong> - threshold for maximum angle between normal and viewing direction(if Crit=Angle)</li>
        <li><strong>Texture choice criteria</strong> - Angle, Stretch, or AAngle</li>
        <li><strong>Binary</strong> - binary or text format ply file</li>
        <li><strong>Out</strong> - ply file, timestamp is added for subsequent runs</li>
        <li><strong>Texture</strong> - texture file, timestamp is added for subsequent runs</li>
        <li><strong>Run</strong> - generate the uv textured mesh</li>
    </ul>
    <p>If the error "Warning: scaling factor too low, try higher texture size(Parameter Sz)" then increase the value of the Max texture size.</p>
    <p><a href="https://micmac.ensg.eu/index.php/Tequila" target="_blank" rel="noopener noreferrer">https://micmac.ensg.eu/index.php/Tequila</a></p>

    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
    <hr/>
    <p>Note: (Windows?) bug will only run with 1 or 2 contiguous image selections. 
        3 contigous image selections will fail, even though the selection works in other areas of micmac.
        GUI works around the bug by renaming the deselected images and thumbnail images, running the command 
        with all images selected and renaming the files back to normal after the run.</p>

    <div>
         Ply ﬁle has to be a
        mesh, and can be the result of TiPunch (but not the direct result of C3DC). Here again, using the whole set of
        images is not necessary. Choosing a subset of the whole images is recommended (8 to 12 images can give good
        results, in statue mode).

        <div>
            Tequila performs following steps:
            <ol>
                <li>— load data — compute zbuﬀers</li>
                <li>— choose which image is best for each triangle</li>
                <li>— ﬁlter mesh according to visibility (optional)</li>
                <li>— graph-cut optimization (optional)</li>
                <li>— write UV texture</li>
                <li>— write ply ﬁle with uv texture coordinates</li>
            </ol>

        </div>

        <div>
            Relevant parameters are:
            <ul>
                <li>— Angle, threshold for maximum angle between normal and viewing direction
                </li>
                <li>— Mode, choose between Basic and Pack (see upper)
                </li>
                <li>— Crit, choose between Angle, Stretch, and AAngle (see upper)
                </li>
                <li>— Scale, which allow to speed up computation (higher downscale factor leads to faster computation).
                </li>
                <li>— Sz, which will force texture size, to conform with graphic card capacity (see GL MAX TEXTURE SIZE
                    if available)
                </li>
                <li>— QUAL, the jpeg compression quality, which allows to compact UV texture image.
                </li>
                <li>— Optim, post-processing step, to gather neighbouring triangles with the same image texture
                    (graph-cut algorithm, detailed below)
                </li>
                <li>— Lambda, weighting factor for graph-cut optimization
                </li>
                <li>— Iter, number of iteration steps for optimization</li>
            </ul>
        </div>

    </div>

    <p>triangles of mesh are not connected to each other, mass of floating triangles</p>
    <h4>Create textured mesh from point cloud mesh, images and orientation.</h4>
    <p>tequila windows bug: texture file will not generate if the jpg is included in the file name, internally this gui
        removes the extension leaving the '.' at the end</p>
    <p>need to test linux to see if same error</p>
    <p>tequila optimization only works with pack mode</p>
    <p>images must have even lighting to get a good result, auto exposure will make it splotchy</p>
    <p>once the textured ply is loaded the texture will remain until the app is restarted</p>
    <p>output file name = input file name + "_textured.ply" for mesh and + "_UVtextured.jpg" image<br />
        ex. "C3DC_QuickMac_poisson_depth8_textured.ply" and "C3DC_QuickMac_poisson_depth8_UVtextured.jpg"</p>
    </div>
</div>

tequilahelp.TextureMode = <div>
    <p>
        Tequila has also two modes, which refer to texture computing strategies: basic and pack. In the basic mode, all
        images from the set are stored in the uv texture, and if necessary are downscaled. Each image is masked with the
        zbuﬀer, to store a minimum of signiﬁcant information. In the pack mode, each image is divided in small regions,
        and only useful regions are packed into the uv texture, in an optimal way. This mode leads to smaller images,
        and gives better texture quality.
    </p>
    <p>The mode cannot be changed after a Tequila run. The program needs to be restarted. Theory: original image texture
        stuck inside the GPU</p>
    <p>potential fix - rename the texture in ply header and the corresponding jpg file to some unique name at each run
    </p>
</div>

tequilahelp.GraphCut = <div>
    <p>
        To limit jumps between several texture images in adjacent triangles, an optimization can be performed as a
        post-processing step. This optimization is stated as a multi-label energies graph-cut. Each triangle is assigned
        a likelihood term (here, angle to image viewing direction or projected triangle stretching). Two adjacent
        triangles deﬁne a graph edge, and a coherence term is assigned to this edge (here, the diﬀerence between mean
        texture in each triangle). λ parameter (Lambda) is the weight between likelihood term and coherence term.
    </p>

    <p>seems to only effect pack mode</p>
</div>

tequilahelp.Angle = <div>
    <p>
        For the angle criterion, expressed in degrees, a threshold is set to avoid using images that view a triangle
        with a low incidence (parameter Angle). It means that if the angle between triangle normal and image viewing
        direction is higher than Angle, the image will not be used for texturing.
    </p>
</div>

tequilahelp.TequilaCrit = <div>
    <p>Choosing which image is best for each triangle can be done with three different criterions:</p>
    <ul>
        <li>— best angle between triangle normal and image viewing direction (parameter Crit=Angle, by default, and
            recommended)</li>
        <li>— best stretching of triangle projection in image (parameter Crit=Stretch)</li>
        <li>— best acute angle of triangle projection in image (parameter Crit=AAngle)</li>
    </ul>

</div>
export default tequilahelp;