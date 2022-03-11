import React from 'react';
const tipunchhelp = {};

tipunchhelp.TiPunchGeneral = 
<div>
    <h1>Tipunch</h1>
    <p>Create a mesh from a point cloud</p>
    <p>"To reduce computing time, use a subset of the whole images set (typically 8 to 12 in statue conﬁguration), by choosing the right pattern."</p>
    <h2>Controls</h2>
    <ul className='help-controls'>
        <li><strong>Choose Ply File</strong></li>
        <li><strong>Binary</strong> - output mesh ply format, binary or text</li>
        <li><strong>filter</strong> - do we ﬁlter mesh</li>
        <li><strong>depth</strong> - Maximum reconstruction depth for PoissonRecon. Most important parameter.</li>
        <li><strong>C3DC Mode</strong> - needed if Filter=true, mode of C3DC (needed for PIMs- directory)</li>
        <li><strong>Scale</strong> - Z-buﬀer downscale factor, used for ﬁltering (a bigger downscale factor speeds up process, but is less accurate)</li>
        <li><strong>Filter from border</strong> - force ﬁltering to start from mesh borders (it avoids creating holes)</li>
        <li><strong>Run</strong> - generate the 3D mesh</li>
    </ul>
    <p><a href="https://micmac.ensg.eu/index.php/TiPunch" target="_blank" rel="noopener noreferrer" >https://micmac.ensg.eu/index.php/TiPunch</a></p>

    <label className = "showHideLabel" htmlFor="cssHideBtn">Rough Notes</label>
    <input type="checkbox" id="cssHideBtn"/>
    <div id="roughnotes">
    <hr/>
    <p>should use subset of images 8 to 12 - bug in tequila may require all image selection in 1 or 2 contiguous sections</p>
                    <div>
                    TiPunch command creates a mesh from a point cloud. The point cloud has to be in .ply format and has to store normal direction for each point. This commands performs two steps: 
                    <ul>
                        <li>— mesh generation </li>
                        <li>— mesh ﬁltering</li>
                    </ul>
                    </div>
                    <div>
                    Note: this tool is still under development, for now, it is recommended to use it with Filter option set to false. 
                    </div>
                    <div>Mesh generation is built as a call to PoissonRecon binary from Misha Khazdan (for more information on M. Khazdan’s code and research: http://www.cs.jhu.edu/~misha/Code/PoissonRecon/ ) It has mainly one important parameter: the depth of reconstruction. PoissonRecon solves the Poisson equation with a discretization of space into a voxel grid. The depth d parameter deﬁnes the size of the voxel grid, as grid is 2d x 2d x 2d voxels. As a result, a higher depth will lead to a higher level of detail in the ﬁnal mesh.
                    </div>
                    <div>
                    As PoissonRecon can sometimes generate wrong mesh parts, mesh ﬁltering is necessary to deletes parts of the mesh which are too far from point cloud. Mesh ﬁltering makes the assumption that point cloud ply has been generated using C3DC command. But one can also use Nuage2Ply (with Normale option) and MergePly to generate compatible point cloud. In this case, you can desactivate mesh ﬁltering, with option Filter=0. To ﬁlter the mesh, depth images are used (there location is recovered from Pattern and C3DC mode). To reduce computing time, use a subset of the whole images set (typically 8 to 12 in statue conﬁguration), by choosing the right pattern.
                    </div>
                    <div>
                    Syntax is:          
                        <ul>
                            <li>— ply ﬁle, with normal direction computed for each point</li>
                            <li>— Pattern, needed if Filter=true, set of images to ﬁlter mesh (we use depth images computed by C3DC)</li>
                            <li>— Out, output mesh ﬁlename</li>
                            <li>— Bin, output mesh ply format (ascii or binary, true means binary)</li>
                            <li><strong>— Depth, Maximum reconstruction depth for PoissonRecon</strong></li>
                            <li>— Rm, remove output of PoissonRecon (mainly if Filter=true)</li>
                            <li>— Filter, do we ﬁlter mesh - c3dc= then yes</li>
                            <li>— Mode, needed if Filter=true, mode of C3DC (needed for PIMs- directory)</li>
                            <li>— Scale, Z-buﬀer downscale factor, used for ﬁltering (a bigger downscale factor speeds up process, but is less accurate)</li>
                            <li>— FFB, Filter from border: force ﬁltering to start from mesh borders (it avoids creating holes)</li>
                        </ul>
                    </div>
                    <p>Must be ply file with normals for each point</p>
    <p>uses the Screened Poisson Surface Reconstruction algorithm</p>
    <p> Mesh filtering makes the assumption that point cloud ply has been
generated using C3DC command.</p>
<p>After a dense matching using C3DC its possible to process meshing and texture the
mesh directly with micmac. TiPunch is for meshing and use the well known Screened
Poisson Surface Reconstruction algorithm. Tequila is for texturing the mesh using the
photos as raster images.</p>
    <p>filter option runs mostly in the background with little feedback</p>
    <p>Windows/MicMac v1.0beta13 - text ply file output is not giving good results. If cloud ran through sbglobbascule get much better results.</p>
    <p>output file name = "C3DC_" + mode + "_poisson_depth" + depth chosen<br/>
    ex. "C3DC_QuickMac_poisson_depth8.ply"</p>
    <p>mode default of statue maybe means that works best?</p>
    <p>to rerun tipunch must delete ply file? tipunch filter option = holes?</p>
    <p>more depth = more detail</p>
    </div>
</div>
export default tipunchhelp;