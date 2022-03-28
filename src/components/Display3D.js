import React, {Component} from 'react';
import * as THREE from 'three';
import * as display3dF from './methods/display3d-functions';

const path = require('path');
const process = window.require('process');

class Display3D extends Component {
    constructor(props) {
        super(props)
        this.fov = 35;
        this.camera = new THREE.PerspectiveCamera( 35, 1, 0.2, 2000 );
        this.camera.up.set(0,0,1);
        this.cameraTarget = new THREE.Vector3( 0, 0, 0 );
        this.sphereRadius = 4;
        this.scene = new THREE.Scene();
        this.mesh = null;
        this.mesh1 = null;
        this.meshes = [];
        this.INTERSECTED = null;
        this.mouse = new THREE.Vector2();
        this.animationID = null;

        // Create a renderer with Antialiasing
        this.renderer = new THREE.WebGLRenderer({antialias:true});
        
        // Configure renderer clear color
        this.renderer.setClearColor("#222222");

        // Configure renderer size
        this.renderer.setSize( 256, 256 );
        
        let newImageSelection = [];
        if(props.imageList && props.imageList.length > 0) {
            newImageSelection = props.imageList.map((elem) => {
                return elem.selected
            })
        }

        let orientationin = "All";
        let testOri = props.mm3dRunList.find(val => {
            if(val.name === "Apericloud" || val.name === "Campari" || val.name === "C3DC") {
                return val.orientation;
            } else {
                return false;
            }
        });

        if(testOri) {
            orientationin = testOri.orientation;
        }

        this.state = {
            ...props,
            vertexSize: 0.08,
            wireFrame: false,
            doublesided: true,
            imageSelection: newImageSelection,
            camFontSize: 0.1,
            showCameraLights: false,
            orientation: orientationin,
            centermesh: true,
            appBusy: false,
            manualCamera: false,
            threeviewhelp1: "left mouse - rotate",
            threeviewhelp2: "center mouse - zoom",
            threeviewhelp3: "right mouse - pan",
            threeviewhelp0: "",
            groundDefined: false,
            showGCP: false,
        }

        // imports Display3D functions

        this.animate = display3dF.animate.bind(this);
        this.doMouseWheel = display3dF.doMouseWheel.bind(this);
        this.escFunction = display3dF.escFunction.bind(this);
        this.exportMesh = display3dF.exportMesh.bind(this);
        this.loadCameraLights = display3dF.loadCameraLights.bind(this);
        this.loadGCP = display3dF.loadGCP.bind(this);
        this.loadMesh = display3dF.loadMesh.bind(this);
        this.loadPLY = display3dF.loadPLY.bind(this);
        this.meshExport = display3dF.meshExport.bind(this);
        this.onMouseClick = display3dF.onMouseClick.bind(this);
        this.onMouseMove = display3dF.onMouseMove.bind(this);
        this.onWindowResize = display3dF.onWindowResize.bind(this);
        this.orbitControlsStart = display3dF.orbitControlsStart.bind(this);
        this.setCameraView = display3dF.setCameraView.bind(this);
        this.setCameraViewFrom3D = display3dF.setCameraViewFrom3D.bind(this);
        this.updateCameraLights = display3dF.updateCameraLights.bind(this);
        this.unloadGCP = display3dF.unloadGCP.bind(this);
        this.unloadCameraLights = display3dF.unloadCameraLights.bind(this);
        this.updatevalues = display3dF.updatevalues.bind(this);
        

        this.manualCamera = false;
        this.gcp = [];

        this.enablePLY = true;

        this.boundingSphere = new THREE.Sphere();
        this.Material = null;
        this.font = null;
        var loader = new THREE.FontLoader();

        // https://gero3.github.io/facetype.js/
        // convert ttf to json
        // loader.load( './fonts/Open Sans Light_Regular.json', ( font ) => {
            const resourcePath =
                !process.env.NODE_ENV || process.env.NODE_ENV === "production"
                    ? process.resourcesPath // Live Mode
                    : '.'; // Dev Mode

        // let fontPath = path.join(process.resourcesPath, 'extraResources', 'fonts', 'Open Sans Light_Regular.json');
        let fontPath = path.join(resourcePath, 'fonts', 'Open Sans Light_Regular.json');
        // console.log(fontPath);
        loader.load(path.join(fontPath), ( font ) => {
            this.font = font;
        });

        this.cameralights = [];

        this.directionalLights = [];

        this.cameraCenters = new THREE.Vector3(0,0,0);

        this.planemesh = null;
        this.originmesh = null;
        this.x_axis_vis = null;
        this.y_axis_vis = null;
        this.z_axis_vis = null;
        this.meshPosition = new THREE.Vector3( 0, 0, 0 );

        // directional lights along each axis
        let colorR = 0xffdddd,
            colorG = 0xddffdd,
            colorB = 0xddddff;
        var directionalLightpX = new THREE.DirectionalLight( colorR, 0.33 );
        directionalLightpX.position.x = 1000
        this.scene.add( directionalLightpX );
        this.directionalLights.push(directionalLightpX);

        var directionalLightpY = new THREE.DirectionalLight( colorG, 0.33 );
        directionalLightpY.position.y = 1000
        this.scene.add( directionalLightpY );
        this.directionalLights.push(directionalLightpY);

        var directionalLightpZ = new THREE.DirectionalLight( colorB, 0.33 );
        directionalLightpZ.position.z = 1000
        this.scene.add( directionalLightpZ );
        this.directionalLights.push(directionalLightpZ);

        var directionalLightnX = new THREE.DirectionalLight( colorR, 0.33 );
        directionalLightnX.position.x = -1000
        this.scene.add( directionalLightnX );
        this.directionalLights.push(directionalLightnX);

        var directionalLightnY = new THREE.DirectionalLight( colorG, 0.33 );
        directionalLightnY.position.y = -1000
        this.scene.add( directionalLightnY );
        this.directionalLights.push(directionalLightnY);

        var directionalLightnZ = new THREE.DirectionalLight( colorB, 0.33 );
        directionalLightnZ.position.z = -1000
        this.scene.add( directionalLightnZ );
        this.directionalLights.push(directionalLightnZ);

    }

    componentDidMount() {
        // console.log("display3d component did mount")

        window.addEventListener( 'resize', this.onWindowResize, false );
        
        // Append Renderer to DOM
        this.threeview = document.getElementById("threeview")
        this.threeview.appendChild( this.renderer.domElement );

        this.threeview.addEventListener('dblclick', this.onMouseClick, false);
        
        this.threeview.addEventListener('mousemove', this.onMouseMove, false);

        document.addEventListener("keydown", this.escFunction, false);

        this.renderer.setSize( this.threeview.offsetWidth, this.threeview.offsetWidth );

        this.orbitControlsStart(false);

        // create the particle variables
        var particleCount = 1800;
        var boxSize = 8;

        var positions = [];
        var colors = [];
        var color = new THREE.Color();
        // now create the individual particles
        for (var p = 0; p < particleCount; p++) {

            // create a particle with random
            // position values, -250 -> 250
            var pX = Math.random() * boxSize - 0.5*boxSize,
            pY = Math.random() * boxSize - 0.5*boxSize,
            pZ = Math.random() * boxSize - 0.5*boxSize

            positions.push(pX, pY, pZ);
            // colors

            var vx = Math.random();
            var vy = Math.random();
            var vz = Math.random();

            color.setRGB( vx, vy, vz );

            colors.push( color.r, color.g, color.b );
        }

        var geometry = new THREE.BufferGeometry();

        // itemSize = 3 because there are 3 values (components) per vertex
        geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );

        var material1 = new THREE.PointsMaterial( { size: 0.02, vertexColors: THREE.VertexColors } );
        this.mesh1 = new THREE.Points( geometry, material1 );

        this.scene.add(this.mesh1);

        let lineMaterial = new THREE.LineBasicMaterial({color: 0xaaaaaa});
        let planeLines = new THREE.Geometry();
        planeLines.vertices.push(
            new THREE.Vector3( 5, 5, 0 ),
            new THREE.Vector3( -5, 5, 0 ),
            new THREE.Vector3( -5, -5, 0 ),
            new THREE.Vector3( 5, -5, 0 ),
            new THREE.Vector3( 5, 5, 0 )
        );
        this.planemesh = new THREE.Line( planeLines, lineMaterial );
        this.scene.add( this.planemesh );
        
        var xmaterial = new THREE.LineBasicMaterial({color: 0xff0000});
        var xgeometry = new THREE.Geometry();
        xgeometry.vertices.push(
            new THREE.Vector3( 0, 0, 0 ),
            new THREE.Vector3( 10, 0, 0 )
        );
        var ymaterial = new THREE.LineBasicMaterial({color: 0x00ff00});
        var ygeometry = new THREE.Geometry();
        ygeometry.vertices.push(
            new THREE.Vector3( 0, 0, 0 ),
            new THREE.Vector3( 0, 10, 0 )
        );
        var zmaterial = new THREE.LineBasicMaterial({color: 0x0000ff});
        var zgeometry = new THREE.Geometry();
        zgeometry.vertices.push(
            new THREE.Vector3( 0, 0, 0 ),
            new THREE.Vector3( 0, 0, 10 )
        );
        
        this.x_axis_vis = new THREE.Line( xgeometry, xmaterial );
        this.y_axis_vis = new THREE.Line( ygeometry, ymaterial );
        this.z_axis_vis = new THREE.Line( zgeometry, zmaterial );
        this.scene.add( this.x_axis_vis );
        this.scene.add( this.y_axis_vis );
        this.scene.add( this.z_axis_vis );

        this.camera.position.set( this.sphereRadius*5, 0.0, this.sphereRadius*5 );
        this.camera.far = this.sphereRadius * 40;
        this.camera.updateProjectionMatrix();
    }

    
    // Render Loop
    render3d = () => {

      // Render the scene
      this.renderer.render(this.scene, this.camera);
    };

    componentWillReceiveProps(nextProps) {
        if(nextProps.appDisabled) {
            return;
        }

        //check for selection change
        let newImageSelection = [];

        if(nextProps.imageList && nextProps.imageList.length > 0) {
            newImageSelection = nextProps.imageList.map((elem) => {
                return elem.selected
            })
        }

        var notneedupdate = this.state.imageSelection.every((elem, index) => {
            if( elem && newImageSelection[index]) {
                return true;
            }
            if( !elem && !newImageSelection[index]) {
                return true;
            }
            return false;
        });

        if(this.state.imageSelection.length ===0) {
            notneedupdate = true;
        }
        if(!notneedupdate) {
            this.updateCameraLights(newImageSelection, this.state.camFontSize);
        }

        const newState = {
            ...this.state,
            ...nextProps,
            imageSelection: newImageSelection
        }

        if(nextProps.enablePLY) {
            this.enablePLY = true;
        }

        this.setState(newState);
    }

    componentDidUpdate() {
        this.render3d();
    }

    componentWillUnmount() {
        window.removeEventListener( 'resize', this.onWindowResize, false );

        //threejs objects must be disposed manually
        if(this.mesh) {
            this.scene.remove(this.mesh);
            if(this.mesh.material.map) {
                this.mesh.material.map.dispose();
            }
            this.mesh.material.dispose();
            this.mesh.geometry.dispose();
        }

        if(this.originmesh) {
            this.scene.remove(this.originmesh);
            this.originmesh.geometry.dispose();
        }

        if(this.controls) {
            this.controls.dispose();
        }

        cancelAnimationFrame(this.animationID);

        document.removeEventListener("keydown", this.escFunction, false);
        this.threeview.removeEventListener('wheel', this.doMouseWheel, false);

        //remove lights - probaby not needed - no dispose indicated
        if(this.directionalLights.length > 0) {
            for(var i=0;i<this.directionalLights.length;i++) {
                this.scene.remove( this.directionalLights[i] );
            }
            this.directionalLights = [];
        }
        this.renderer.dispose();
    }

    render() {
        if(this.state.plyReady && this.enablePLY) {
            this.loadPLY()
        }

        return(
            <div className="Display3D">
                <div id="threeview" style={{border: this.state.manualCamera ? "2px solid red": "none"}}></div>
                <ul className="threeview-help">
                    <li>{this.state.threeviewhelp0}</li>
                    <li>{this.state.threeviewhelp1}</li>
                    <li>{this.state.threeviewhelp2}</li>
                    <li>{this.state.threeviewhelp3}</li>
                </ul>
                <div className="controls3d">
                    <h1 className="contexthelp displayhead"
                        data-help="Display3D" data-position="center" 
                        onContextMenu={this.props.helpcontext}>
                        3D Display
                    </h1>
                    <div className="controls3dgroup">

                        <label>Max Vertex count: </label><span id="maxvertexcount" className="readonlyval">{this.state.max3dpoints}</span>
                        <label>Actual Vertex count: </label><span id="actualvertexcount" className="readonlyval">0</span>
                        <label>Display Vertex count: </label><span id="vertexcount" className="readonlyval">0</span>
                        <label>Face count: </label><span id="facecount" className="readonlyval">0</span>

                        <label htmlFor="">Ground defined</label>
                        <input type="checkbox" name="" id="groundDefined" checked={this.state.groundDefined} onChange={this.updatevalues} />
                        <label htmlFor="">Show GCP</label>
                        <input type="checkbox" name="" id="showGCP" checked={this.state.showGCP} onChange={this.updatevalues} />
                        <label htmlFor="">Center mesh</label>
                        <input type="checkbox" name="" id="centermesh" checked={this.state.centermesh} onChange={this.updatevalues} />
                        <label><span className="label-span">Point size</span>
                        </label>
                            <input id="matsize" type="number" value={this.state.vertexSize} onChange={this.updatevalues}
                                title="display point size"
                                min="0.001" step="0.001" />
                        <div className="divider">
                            <hr/>
                        </div>
                        <label htmlFor="orientation" title="camera orientation">Orientation</label>
                        <select 
                            name="orientation" id="orientation" 
                            title="orientation name"
                            value={this.state.orientation}
                            onChange={this.updatevalues}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>
                        <label htmlFor="showCameraLights">Show cameras
                        </label>
                        <input id="showCameraLights" type="checkbox" checked={this.state.showCameraLights} onChange={this.updatevalues} />
                        <label><span className="label-span">Name size</span>
                        </label>
                            <input id="camFontSize" type="number" 
                                value={this.state.camFontSize} 
                                onChange={this.updatevalues} 
                                min="0.001"
                                step="0.1" />
                        <button onClick={this.setCameraView}>View to camera</button>
                        <div className="divider">
                            <hr/>
                        </div>

                        <label>Wireframe
                        </label>
                            <input id="wireframe" type="checkbox" checked={this.state.wireframe} onChange={this.updatevalues} />
                        <label htmlFor="doublesided">Double sided
                        </label>
                            <input id="doublesided" type="checkbox" checked={this.state.doublesided} onChange={this.updatevalues} />

                        <div className="divider">
                            <hr/>
                        </div>

                        <button onClick={this.loadMesh} 
                            title="load ply file - note once a texture map loads it remains in memory until restart">Load mesh file</button>
                        <button onClick={this.exportMesh} title="save obj or dae file">Export mesh file</button>
                    </div>
                </div>

                <div id="busy" style={this.state.appBusy ? {display:"block"} : {display:"none"}}>
                    <svg id="busy-loading-mm"  viewBox="-40 30 600 180" >
                        <defs>
                            <path
                            id="m-path"
                            d="m 51.320726,187.3773 c -3.98166,-1.0708 -6.83523,-3.22188 -8.94747,-6.7448 -2.3344,-3.8934 -2.20262,-0.0445 -2.10107,-61.36091 l 0.0913,-55.092236 0.69824,-1.844371 c 0.38402,-1.014414 1.37242,-2.886566 2.19642,-4.160334 2.42202,-3.744065 7.24519,-6.541966 12.10088,-7.01968 4.89198,-0.481282 10.38491,1.591924 14.21087,5.363634 2.46022,2.425346 3.79115,4.613176 9.87409,16.23141 2.28029,4.355286 4.58645,8.665721 5.1248,9.578785 0.53835,0.913048 2.31371,4.244287 3.94521,7.402788 1.63153,3.1585 4.43449,8.456588 6.2288,11.773544 6.137924,11.34648 8.047794,14.95017 8.047794,15.18523 0,0.65939 4.77234,8.63429 5.25946,8.78889 1.11938,0.35528 1.96267,-0.74911 5.01179,-6.56347 1.70189,-3.24533 3.09434,-5.99162 3.09434,-6.10288 0,-0.11124 1.07693,-2.1509 2.39316,-4.53255 1.31625,-2.38167 4.12676,-7.63095 6.24559,-11.665076 2.11881,-4.034128 6.34869,-12.029038 9.3997,-17.766435 3.05104,-5.737396 6.30344,-11.903283 7.22756,-13.701961 4.05501,-7.892452 6.81305,-10.816522 12.38587,-13.131435 1.59927,-0.664326 2.52069,-0.815891 5.05286,-0.83115 8.70418,-0.05245 15.183,5.202501 16.7938,13.621428 0.72149,3.770766 0.71678,107.426509 -0.005,110.833639 -1.36273,6.43254 -4.96905,10.11091 -11.55824,11.78917 -2.53298,0.64514 -7.12592,0.49434 -9.69375,-0.31828 -4.02862,-1.27491 -8.02914,-5.18199 -9.5922,-9.36819 l -0.77446,-2.07416 -0.0644,-26.67548 c -0.0487,-20.19038 -0.15943,-26.7901 -0.45558,-27.14692 -0.78549,-0.94645 -1.08343,-0.48916 -8.19959,12.58464 -1.70785,3.13766 -5.26507,9.8123 -7.90494,14.83255 -4.97296,9.45716 -6.59809,12.06146 -9.01068,14.4399 -3.70951,3.657 -10.50845,4.96157 -15.68457,3.00951 -4.570254,-1.72357 -7.692694,-5.33555 -12.490254,-14.44853 -1.62402,-3.08484 -3.6928,-6.92905 -4.59729,-8.5427 -0.90448,-1.61366 -2.2012,-3.96079 -2.88162,-5.21585 -0.68041,-1.25506 -1.77981,-3.23545 -2.44309,-4.40086 -0.66327,-1.16542 -2.05219,-3.80594 -3.08647,-5.86783 -1.03428,-2.06189 -2.25971,-4.15434 -2.72317,-4.64989 -0.76089,-0.81358 -0.89168,-0.85201 -1.34782,-0.39609 -0.44489,0.4447 -0.5246,3.58523 -0.66815,26.32825 l -0.16299,25.82332 -1.09195,2.71222 c -1.27596,3.16924 -3.87348,6.22102 -6.52193,7.66249 -3.6234,1.9721 -9.50337,2.70212 -13.37586,1.66067 z"
                            />
                        </defs>
                        <g>
                            <g
                            
                            id="white-group">
                            <use href="#m-path" className="slideright" />
                            <use href="#m-path" className="slideleft"/>
                            </g>
                            <g
                            
                            id="cyan-group">
                                <use href="#m-path" className="slideright" />
                            </g>
                            <g
                            id="red-group">
                                <use href="#m-path" className="slideleft"/>
                            </g>
                            <g
                            
                            id="purple-group">
                            <use href="#m-path" className="slideright" />
                            <use href="#m-path" className="slideleft"/>
                            </g>
                        </g>
                        <text>Loading...</text>
                    </svg>
                </div>
            </div>
        );
    }
}

export default Display3D;