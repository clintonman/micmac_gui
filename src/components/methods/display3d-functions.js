import * as THREE from 'three';
import BufferGeometryUtils from '../../utility/BufferGeometryUtils';
import OrbitControls from '../../utility/OrbitControls';
import TrackballControls from '../../utility/TrackballControls';
import PLYLoader from '../../utility/PLYLoader';
import GLTFExporter from '../../utility/GLTFExporter';
import OBJExporter from '../../utility/OBJExporter';
import ColladaExporter from '../../utility/ColladaExporter';

const fs = window.require('fs');
const path = window.require('path');
const electron = window.require('electron');
let ipcRenderer = electron.ipcRenderer;

var parseString = window.require('xml2js').parseString;

export function animate() {

    this.animationID = requestAnimationFrame(this.animate);

    if (!this.manualCamera) {
        this.controls.update();
    }

    if (this.cameralights.length !== 0) {
        this.cameralights.forEach(elem => {
            elem.mesh.lookAt(this.camera.position);
        });
    }

    var raycaster = new THREE.Raycaster();

    raycaster.setFromCamera(this.mouse, this.camera);

    var intersects = raycaster.intersectObjects(this.scene.children);

    if (intersects.length > 0 && intersects[0].object.name.startsWith("MicMac_")) {
        if (this.INTERSECTED !== intersects[0].object) {
            this.INTERSECTED = intersects[0].object;
            this.INTERSECTED.material.wireframe = false;
            this.render3d();
        }
    } else {
        if (this.INTERSECTED) {
            this.INTERSECTED.material.wireframe = true;
            this.render3d();
        }
        this.INTERSECTED = null;
    }

    //needed for no controls
    this.render3d();

}

export function doMouseWheel(event) {

    switch (event.deltaMode) {

        case 2:
            // Zoom in pages
            this.fov -= event.deltaY * 0.025;
            break;

        case 1:
            // Zoom in lines
            this.fov -= event.deltaY * 0.01;
            break;

        default:
            // undefined, 0, assume pixels
            this.fov -= event.deltaY * 0.025;
            break;

    }

    this.camera.fov = this.fov;
    this.camera.updateProjectionMatrix();

    this.render3d();
}

export function escFunction(event) {
    if (event.keyCode === 27) {
        this.orbitControlsStart(this.state.groundDefined);
        this.setState({
            ...this.state,
            manualCamera: false,
            threeviewhelp1: "left mouse - rotate",
            threeviewhelp2: "center mouse - zoom",
            threeviewhelp3: "right mouse - pan",
        });
        this.manualCamera = false;
        this.camera.fov = 35;
        this.threeview.removeEventListener('wheel', this.doMouseWheel, false);
    }
}

export function exportMesh() {
    if (!this.mesh || this.mesh.type !== "Mesh") {
        window.alert("Must have mesh geometry");
        return;
    }

    this.meshExport(this.mesh)
}

export function loadCameraLights(camFontSize) {

    //get file list in Ori-"orientation"
    //filter for filename "Orientation-" start
    //camera name between "Orientation-" and ".JPG.xml" ending
    //xml file data is:
    // ExportAPERO > OrientationConque > Externe > Centre
    //rotation matrix is
    // ExportAPERO > OrientationConque > Externe > ParamRotation > CodageMtr > L1,L2,L3

    let orientation = path.join(this.state.tempDir, "Ori-" + this.state.orientation);
    if (!fs.existsSync(orientation)) {
        return false;
    }
    let selectedImages = fs.readdirSync(orientation);
    let numImages = selectedImages.length;

    selectedImages.forEach((elem) => {
        let currentFile = path.join(orientation, elem);

        if (path.basename(currentFile).substring(0, 12) === "Orientation-") {

            var xmldata = fs.readFileSync(currentFile, 'utf8');

            var _this = this;
            parseString(xmldata, function (err, result) {

                var center = result.ExportAPERO.OrientationConique[0].Externe[0].Centre;

                let matrixXml = result.ExportAPERO.OrientationConique[0].Externe[0].ParamRotation[0].CodageMatr[0];
                let L1 = matrixXml.L1;
                let L2 = matrixXml.L2;
                let L3 = matrixXml.L3;
                let L1array = L1[0].split(" ");
                let L2array = L2[0].split(" ");
                let L3array = L3[0].split(" ");

                var elemtext = elem.substring(12, elem.length - 4)
                var geometry = new THREE.TextBufferGeometry(elemtext, {
                    font: _this.font,
                    size: camFontSize,
                    height: camFontSize * 0.1,
                    curveSegments: 3,
                    bevelEnabled: false,
                    bevelThickness: 4,
                    bevelSize: 2,
                    bevelSegments: 5
                });

                var textmaterial = new THREE.MeshBasicMaterial({
                    color: 0xffff00,
                    side: THREE.DoubleSide
                });
                var textMesh = new THREE.Mesh(geometry, textmaterial);

                var centeroftext = center[0].split(" ");

                textMesh.position.x = +centeroftext[0];
                textMesh.position.y = +centeroftext[1];
                textMesh.position.z = +centeroftext[2];
                if (_this.state.centermesh) {
                    textMesh.position.x += _this.meshPosition.x;
                    textMesh.position.y += _this.meshPosition.y;
                    textMesh.position.z += _this.meshPosition.z;
                }

                _this.cameraCenters.x += centeroftext[0];
                _this.cameraCenters.y += centeroftext[1];
                _this.cameraCenters.z += centeroftext[2];

                textMesh.name = elemtext;

                _this.scene.add(textMesh);

                const geometry2 = new THREE.ConeGeometry(0.5, 1, 4);
                var textmaterial2 = new THREE.MeshBasicMaterial({
                    color: 0xff8800,
                    wireframe: true
                });
                var textMeshTarget = new THREE.Mesh(geometry2, textmaterial2);

                const m = new THREE.Matrix4();
                const m2 = new THREE.Matrix4();
                const m3 = new THREE.Matrix4();

                // +/- found through experimentation L1 first and first column negative
                m.set(+L1array[0], -L1array[1], -L1array[2], 0,
                    +L2array[0], -L2array[1], -L2array[2], 0,
                    +L3array[0], -L3array[1], -L3array[2], 0,
                    0, 0, 0, 1);

                //rotate cone mesh so base in camera direction
                m2.makeRotationX(Math.PI / 2);

                m.multiply(m2);

                //rotate 45 on axis just to look better
                m3.makeRotationY(Math.PI / 4);
                m.multiply(m3);

                const quaternion = new THREE.Quaternion();
                quaternion.setFromRotationMatrix(m);

                textMeshTarget.setRotationFromQuaternion(quaternion);

                textMeshTarget.position.x = +centeroftext[0];
                textMeshTarget.position.y = +centeroftext[1];
                textMeshTarget.position.z = +centeroftext[2] + 0.5;
                if (_this.state.centermesh) {
                    textMeshTarget.position.x += _this.meshPosition.x;
                    textMeshTarget.position.y += _this.meshPosition.y;
                    textMeshTarget.position.z += _this.meshPosition.z;
                }
                textMeshTarget.scale.x = _this.sphereRadius * 0.1;
                textMeshTarget.scale.y = _this.sphereRadius * 0.1;
                textMeshTarget.scale.z = _this.sphereRadius * 0.1;
                textMeshTarget.name = "MicMac_" + elemtext;
                _this.scene.add(textMeshTarget);

                textMesh.up = new THREE.Vector3(0, 0, 1);

                var camlight = {
                    name: elemtext,
                    mesh: textMesh,
                    cone: textMeshTarget
                };
                _this.cameralights.push(camlight);
            });
        }

    });
    this.cameraCenters.x /= numImages;
    this.cameraCenters.y /= numImages;
    this.cameraCenters.z /= numImages;
    return true;
}

export function loadGCP(camFontSize) {
    let res = [];
    res.push(path.join(this.state.tempDir, "OnsiteMeasure.xml"));

    if (!fs.existsSync(res[0])) {
        res = ipcRenderer.sendSync('measurexml-dialog', this.state.tempDir);
    }

    if (!res) {
        return false;
    }

    var xmldata = fs.readFileSync(res[0], 'utf8');

    let newgcp = [];
    parseString(xmldata, (err, result) => {
        //Gravillons sample has a wrapping Global tag in the measurements file - maybe old format?
        let arr;
        if (result.Global) {
            if (!result.Global.DicoAppuisFlottant || !result.Global.DicoAppuisFlottant[0].OneAppuisDAF) {
                window.alert("Bad file format for 3D xml file");
                return;
            }
            arr = result.Global.DicoAppuisFlottant[0].OneAppuisDAF;
        } else {
            if (!result.DicoAppuisFlottant || !result.DicoAppuisFlottant.OneAppuisDAF) {
                window.alert("Bad file format for 3D xml file");
                return;
            }
            arr = result.DicoAppuisFlottant.OneAppuisDAF;
        }

        arr.forEach(val => {
            let pointArr = val.Pt[0].split(' ');
            newgcp.push({
                name: val.NamePt[0],
                x: pointArr[0],
                y: pointArr[1],
                z: pointArr[2]
            });
        });
    });

    if (newgcp.length === 0) {
        window.alert("Bad file format for 3D xml file");
        return false;
    }

    for (let i = 0; i < newgcp.length; i++) {
        var geometry = new THREE.TextBufferGeometry(newgcp[i].name, {
            font: this.font,
            size: camFontSize,
            height: camFontSize * 0.1,
            curveSegments: 3,
            bevelEnabled: false,
            bevelThickness: 4,
            bevelSize: 2,
            bevelSegments: 5
        });

        var textmaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: THREE.DoubleSide
        });
        var textMesh = new THREE.Mesh(geometry, textmaterial);

        textMesh.position.x = +newgcp[i].x + this.sphereRadius * 0.1 * 0.25;
        textMesh.position.y = +newgcp[i].y + this.sphereRadius * 0.1 * 0.25;
        textMesh.position.z = +newgcp[i].z + this.sphereRadius * 0.1 * 0.25;
        if (this.state.centermesh) {
            textMesh.position.x += this.meshPosition.x;
            textMesh.position.y += this.meshPosition.y;
            textMesh.position.z += this.meshPosition.z;
        }

        textMesh.name = newgcp[i].name;
        this.scene.add(textMesh);

        let geometry2 = new THREE.SphereGeometry(0.25, 6, 4);
        var textmaterial2 = new THREE.MeshBasicMaterial({
            color: 0xff8800,
            wireframe: true
        });
        var textMeshTarget = new THREE.Mesh(geometry2, textmaterial2);
        textMeshTarget.position.x = +newgcp[i].x;
        textMeshTarget.position.y = +newgcp[i].y;
        textMeshTarget.position.z = +newgcp[i].z;
        if (this.state.centermesh) {
            textMeshTarget.position.x += this.meshPosition.x;
            textMeshTarget.position.y += this.meshPosition.y;
            textMeshTarget.position.z += this.meshPosition.z;
        }
        textMeshTarget.scale.x = this.sphereRadius * 0.1;
        textMeshTarget.scale.y = this.sphereRadius * 0.1;
        textMeshTarget.scale.z = this.sphereRadius * 0.1;
        textMeshTarget.name = "GCP_" + newgcp[i].name;
        this.scene.add(textMeshTarget);

        var gcp = {
            name: newgcp[i].name,
            mesh: textMesh,
            sphere: textMeshTarget
        };
        this.gcp.push(gcp);
    }

    return true;
}

export function loadMesh() {
    let res = ipcRenderer.sendSync('openmeshply-dialog', this.state.tempDir);

    if (!res) {
        return;
    }

    //if plytexture exists then set texture file
    let textureFile = "";

    if (res[0].indexOf("textured") !== -1) {
        textureFile = res[0].substr(0, res[0].lastIndexOf("_")) + "_UVtexture.jpg"
    }

    const newState = {
        ...this.state,
        plyFile: res[0],
        plyReady: true,
        plyTexture: textureFile,
        appBusy: true
    }
    this.setState(newState);
    this.enablePLY = true;
}

export function loadPLY() {
    if(this.isLoading) {
        return;
    }

    this.enablePLY = false;

    this.props.updateParentState({
        enablePLY: false
    });

    if (!fs.existsSync(this.state.plyFile)) {
        this.props.enableApp();
        return;
    }

    var loader = new PLYLoader();

    var textureLoader = new THREE.TextureLoader();

    if (this.mesh) {
        this.scene.remove(this.mesh);
        if (this.mesh.material.map) {
            this.mesh.material.map.dispose();
            this.mesh.material.needsUpdate = true;
            this.mesh.material.map.needsUpdate = true;
        }
        this.mesh.material.dispose();
        this.mesh.geometry.dispose();
    }

    if (this.originmesh) {
        this.scene.remove(this.originmesh);
        this.originmesh.geometry.dispose();
    }

    let theplyfile = this.state.plyFile;
    this.isLoading = true;
    loader.load('file:///' + this.state.plyFile, ({
        geometry,
        header}) => {

        let numUV = 0;
        let numColor = 0;

        if (geometry.attributes.uv) {
            console.log("uv count " + geometry.attributes.uv.count);
            numUV = geometry.attributes.uv.count;
        }
        if (geometry.attributes.color) {
            console.log("color count " + geometry.attributes.color.count);
            numColor = geometry.attributes.color.count;
        }

        let maxCount = this.state.max3dpoints;
        let maxTriangleCount = Math.floor(maxCount / 3);

        const actualvertexcount = document.getElementById("actualvertexcount");
        actualvertexcount.innerText = geometry.attributes.position.count;

        ////textue does not load immediatly so cannot make decisions using it

        var theTexture = header.comments.find(val => {
            return val.startsWith("TextureFile");
        });

        //geometry.index===tipunch file, theTexture===tequila file
        if (geometry.attributes.position.count > maxCount && (geometry.index || theTexture)) {
            //bigger tolerance => fewer verts
            let tolerance = 0.1;
            while (tolerance <= 1 && geometry.attributes.position.count > maxCount) {
                geometry = BufferGeometryUtils.mergeVertices(geometry, tolerance);
                tolerance += 0.1;
            }

        } else if (geometry.attributes.position.count > maxCount) {

            let countTriangle = Math.floor(geometry.attributes.position.count / 3);
            let skipMod = Math.ceil(countTriangle / maxTriangleCount);
            let newCount = maxTriangleCount * 3;
            let smallgeo = new THREE.BufferGeometry();

            // ? will num color num uv ever differ from num position ?
            // ? triangle indices ?
            if (numColor > 0) {
                let col = geometry.getAttribute("color");
                let newcol = new THREE.BufferAttribute(new Float32Array(newCount * 3), 3);
                smallgeo.setAttribute('color', newcol);
                let i = 0;
                for (let trii = 0; trii < countTriangle; trii++) {
                    if (trii % skipMod !== 0) continue;

                    newcol.setX(i, col.getX(trii * 3));
                    newcol.setY(i, col.getY(trii * 3));
                    newcol.setZ(i, col.getZ(trii * 3));
                    i++;
                    newcol.setX(i, col.getX(trii * 3 + 1));
                    newcol.setY(i, col.getY(trii * 3 + 1));
                    newcol.setZ(i, col.getZ(trii * 3 + 1));
                    i++;
                    newcol.setX(i, col.getX(trii * 3 + 2));
                    newcol.setY(i, col.getY(trii * 3 + 2));
                    newcol.setZ(i, col.getZ(trii * 3 + 2));
                    i++;
                }
            }
            if (numUV > 0) {
                let uv = geometry.getAttribute("uv");
                let newuv = new THREE.BufferAttribute(new Float32Array(newCount * 2), 2);
                smallgeo.setAttribute('uv', newuv);
                let i = 0;
                for (let trii = 0; trii < countTriangle; trii++) {
                    if (trii % skipMod !== 0) continue;

                    newuv.setX(i, uv.getX(trii * 3));
                    newuv.setY(i, uv.getY(trii * 3));
                    newuv.setZ(i, uv.getZ(trii * 3));
                    i++;
                    newuv.setX(i, uv.getX(trii * 3 + 1));
                    newuv.setY(i, uv.getY(trii * 3 + 1));
                    newuv.setZ(i, uv.getZ(trii * 3 + 1));
                    i++;
                    newuv.setX(i, uv.getX(trii * 3 + 2));
                    newuv.setY(i, uv.getY(trii * 3 + 2));
                    newuv.setZ(i, uv.getZ(trii * 3 + 2));
                    i++;
                }
            }
            let pos = geometry.getAttribute("position");
            let newpos = new THREE.BufferAttribute(new Float32Array(newCount * 3), 3);
            smallgeo.setAttribute('position', newpos);
            let i = 0;
            for (let trii = 0; trii < countTriangle; trii++) {
                if (trii % skipMod !== 0) continue;
                newpos.setX(i, pos.getX(trii * 3));
                newpos.setY(i, pos.getY(trii * 3));
                newpos.setZ(i, pos.getZ(trii * 3));
                i++;
                newpos.setX(i, pos.getX(trii * 3 + 1));
                newpos.setY(i, pos.getY(trii * 3 + 1));
                newpos.setZ(i, pos.getZ(trii * 3 + 1));
                i++;
                newpos.setX(i, pos.getX(trii * 3 + 2));
                newpos.setY(i, pos.getY(trii * 3 + 2));
                newpos.setZ(i, pos.getZ(trii * 3 + 2));
                i++;
            }
            geometry.dispose();
            geometry = new THREE.BufferGeometry();
            geometry.copy(smallgeo);
            smallgeo.dispose();
        }

        this.cameraCenters = new THREE.Vector3(0, 0, 0);

        geometry.computeVertexNormals();

        const vertexcount = document.getElementById("vertexcount");
        vertexcount.innerText = geometry.attributes.position.count;

        var validTextureFile = false;
        if (theTexture) {
            console.log("found", theTexture);
            var plyTexturePath = path.join(this.props.tempDir, theTexture.split(" ")[1]);
            validTextureFile = fs.existsSync(plyTexturePath);
            if (!validTextureFile) {
                console.log("texture file does not exist");
            } else {
                textureLoader.load('file:///' + plyTexturePath, (textureMap) => {
                    this.mesh.material.map = textureMap;
                    this.mesh.material.needsUpdate = true;
                    this.mesh.material.map.needsUpdate = true;
                });
            }
        }

        const facecount = document.getElementById("facecount");

        //poisson has geometry index, tequila result does not but has texture comment
        //ok if index or texture in comment then domesh

        if (geometry.index || theTexture) {
            if (validTextureFile) {
                this.material = new THREE.MeshBasicMaterial({
                    color: 0xffffff
                });
            } else {
                console.log("no texture applied")
                this.material = new THREE.MeshPhongMaterial({
                    color: 0xffffff
                });
            }

            this.material.specular = new THREE.Color(0x020202)

            this.material.side = THREE.DoubleSide
            if (this.state.wireFrame) {
                this.material.wireframe = true
            } else {
                this.material.wireframe = false
            }

            var actualgeometry = new THREE.Geometry();
            actualgeometry.fromBufferGeometry(geometry);
            facecount.innerText = actualgeometry.faces.length;
            // NO EFFECT on tequilla dup vertices - still may be needed
            actualgeometry.mergeVertices();
            geometry.dispose();
            geometry = new THREE.BufferGeometry().fromGeometry(actualgeometry);

            this.mesh = new THREE.Mesh(geometry, this.material);
        } else {
            this.material = new THREE.PointsMaterial({
                size: this.state.vertexSize,
                vertexColors: THREE.VertexColors
            });
            this.mesh = new THREE.Points(geometry, this.material);
            facecount.innerText = "0"
        }

        geometry.computeBoundingSphere()
        this.boundingSphere = geometry.boundingSphere
        this.sphereRadius = this.boundingSphere.radius;
        this.camera.far = this.sphereRadius * 20;
        this.camera.position.set(this.sphereRadius, 0.0, this.sphereRadius);
        this.camera.updateProjectionMatrix();

        var scalef = 1

        //default first camera position is 0,0,0

        //mesh weighted center

        let posArray = this.mesh.geometry.attributes.position.array;
        let x = 0,
            y = 0,
            z = 0;
        for (var ind = 0; ind < this.mesh.geometry.attributes.position.count; ind++) {
            x += posArray[ind * 3];
            y += posArray[ind * 3 + 1];
            z += posArray[ind * 3 + 2];
        }
        x = x / this.mesh.geometry.attributes.position.count;
        y = y / this.mesh.geometry.attributes.position.count;
        z = z / this.mesh.geometry.attributes.position.count;

        this.mesh.position.x = -x;
        this.mesh.position.y = -y;
        this.mesh.position.z = -z;

        this.meshPosition.x = -x;
        this.meshPosition.y = -y;
        this.meshPosition.z = -z;

        this.mesh.scale.multiplyScalar(scalef);
        this.scene.add(this.mesh);

        var origin = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
        this.originmesh = new THREE.PlaneHelper(origin, 1, 0xffffff);
        this.originmesh.position.x = -x;
        this.originmesh.position.y = -y;
        this.originmesh.position.z = -z;
        this.scene.add(this.originmesh);

        this.scene.remove(this.mesh1);

        this.unloadCameraLights();
        if (this.state.showCameraLights) {
            this.loadCameraLights(this.sphereRadius * 0.02);
        }

        this.render3d();

        this.setState({
            ...this.state,
            appBusy: false,
            camFontSize: this.sphereRadius * 0.02,
            threeviewhelp0: theplyfile
        });
        
        this.isLoading = false;
    });
}

export function meshExport(scene) {

    let filename = ipcRenderer.sendSync('savemesh-dialog', null);

    if (!filename) {
        return;
    }

    let extArray = filename.split(".")
    var ext = extArray[extArray.length - 1];

    let meshdata, mtlresult, result;

    let parentFolder = path.dirname(filename);

    if (ext.toLowerCase() === 'obj') {
        const exporter = new OBJExporter();
        meshdata = exporter.parse(scene, path.basename(filename, ".obj"));

        mtlresult = exporter.parseMtl(scene);
    }

    if (ext.toLowerCase() === 'glb') {
        const gltfExporter = new GLTFExporter();
        gltfExporter.parse(scene, function (result) {
            fs.writeFileSync(filename, Buffer.from(result));
        }, {
            binary: true
        });
    }

    if (ext.toLowerCase() === 'gltf') {
        const gltfExporter = new GLTFExporter();
        gltfExporter.parse(scene, function (result) {
            var output = JSON.stringify(result, null, 2);
            fs.writeFileSync(filename, output);
        });
    }

    if (ext.toLowerCase() === 'dae') {
        const exporter = new ColladaExporter();
        result = exporter.parse(scene, null, {
            textureDirectory: "./"
        });
        meshdata = result.data;
    }

    //write mesh file
    if (meshdata) {
        fs.writeFileSync(filename, meshdata);
    }

    //write material file and texture
    if (mtlresult) {
        fs.writeFileSync(path.join(parentFolder, path.basename(filename, ".obj") + ".mtl"), mtlresult.mtldata);
        if (mtlresult.imagelinks.length > 0) {
            //read image path removing "file:///"
            let currentSrc = mtlresult.imagelinks[0].substring(8);
            fs.readFile(currentSrc, (err, data) => {
                if (err) throw (err);
                fs.writeFile(path.join(parentFolder, path.basename(currentSrc)), data, (err) => {
                    if (err) throw (err);
                });
            });
        }
    }
    if (result && result.textures) {
        //read image path removing "file:///"
        let currentSrc = result.textures[0].original.image.currentSrc.substring(8);
        fs.readFile(currentSrc, (err, data) => {
            if (err) throw (err);
            fs.writeFile(path.join(parentFolder, path.basename(currentSrc)), data, (err) => {
                if (err) throw (err);
            });
        });
    }

}

export function onMouseClick(event) {
    var mouse = new THREE.Vector2();
    var raycaster = new THREE.Raycaster();

    mouse.x = (event.offsetX / this.threeview.offsetWidth) * 2 - 1;
    mouse.y = -(event.offsetY / this.threeview.offsetWidth) * 2 + 1;
    if (this.INTERSECTED !== null) {
        this.setCameraViewFrom3D({
            name: this.INTERSECTED.name.substring(7)
        });
    }

    raycaster.setFromCamera(mouse, this.camera);
}

export function onMouseMove(event) {
    this.mouse.x = (event.offsetX / this.threeview.offsetWidth) * 2 - 1;
    this.mouse.y = -(event.offsetY / this.threeview.offsetWidth) * 2 + 1;
}

export function onWindowResize() {
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(256, 256); //make small so can make big :) too funny

    this.renderer.setSize(this.threeview.offsetWidth, this.threeview.offsetWidth);
}

export function orbitControlsStart(groundDefined) {
    // must be after renderer added to dom
    if (this.controls) {
        this.controls.dispose();
    }

    this.camera.up.set(0, 0, 1);
    this.cameraTarget = new THREE.Vector3(0, 0, 0);

    if (groundDefined) {
        this.controls = new OrbitControls(this.camera, this.threeview);

        this.controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
        this.controls.dampingFactor = 0.05;

        this.controls.screenSpacePanning = false;

        this.controls.maxDistance = 500;

        this.controls.maxPolarAngle = Math.PI / 2;
    } else {
        this.controls = new TrackballControls(this.camera, this.threeview);

        this.controls.rotateSpeed = 1.0;
        this.controls.zoomSpeed = 1.2;
        this.controls.panSpeed = 0.8;

        this.controls.noZoom = false;
        this.controls.noPan = false;

        this.controls.staticMoving = true;
        this.controls.dynamicDampingFactor = 0.3;

        this.controls.keys = [65, 83, 68];
    }
    this.animate();
}

export function setCameraView() {
    let currentCamera;
    let orientation = path.join(this.state.tempDir, "Ori-" + this.state.orientation);
    if (!fs.existsSync(orientation)) {
        window.alert("Ori-" + this.state.orientation + " does not exist")
        return false;
    }

    if (this.state.imageList.length === 0) {
        window.alert("Load images first.");
        return;
    }
    let numselected = 0;
    if (this.state.imageList) {
        numselected = this.state.imageList.reduce((acc, val, currentIndex) => {
            if (val.selected) {
                return acc + 1;
            }
            return acc;
        }, 0);
    }
    if (numselected !== 1) {
        window.alert("Select one image first");
        return;
    }

    currentCamera = this.state.imageList.find((elem) => {
        return elem.selected;
    })


    console.log("camera view from " + currentCamera.name);

    let currentFile = path.join(orientation, "Orientation-" + currentCamera.name + ".xml");

    console.log("read file " + currentFile);

    if (!fs.existsSync(currentFile)) {
        return;
    }

    var xmldata = fs.readFileSync(currentFile, 'utf8');

    // xml file data is:
    // location
    // ExportAPERO > OrientationConque > Externe > Centre
    // rotation matrix is
    // ExportAPERO > OrientationConque > Externe > ParamRotation > CodageMtr > L1,L2,L3

    var _this = this;

    this.setState({
        ...this.state,
        centermesh: false,
        threeviewhelp1: "mouse wheel - zoom",
        threeviewhelp2: "<esc> to exit",
        threeviewhelp3: "",
        manualCamera: true,
        showCameraLights: false
    });
    this.manualCamera = true;

    this.controls.enabled = false;

    cancelAnimationFrame(this.animationID);

    this.threeview.addEventListener('wheel', this.doMouseWheel, false);

    this.unloadCameraLights();

    parseString(xmldata, function (err, result) {

        var center = result.ExportAPERO.OrientationConique[0].Externe[0].Centre;
        var centeroftext = center[0].split(" ");
        let matrixXml = result.ExportAPERO.OrientationConique[0].Externe[0].ParamRotation[0].CodageMatr[0];
        let L1 = matrixXml.L1;
        let L2 = matrixXml.L2;
        let L3 = matrixXml.L3;

        let L1array = L1[0].split(" ");
        let L2array = L2[0].split(" ");
        let L3array = L3[0].split(" ");

        const m = new THREE.Matrix4();

        // +/- found through experimentation L1 first and first column negative
        m.set(+L1array[0], -L1array[1], -L1array[2], 0,
            +L2array[0], -L2array[1], -L2array[2], 0,
            +L3array[0], -L3array[1], -L3array[2], 0,
            0, 0, 0, 1);

        _this.camera.position.x = 0;
        _this.camera.position.y = 0;
        _this.camera.position.z = 0;

        const quaternion = new THREE.Quaternion();
        quaternion.setFromRotationMatrix(m);
        _this.camera.setRotationFromQuaternion(quaternion);

        _this.camera.position.x = +centeroftext[0];
        _this.camera.position.y = +centeroftext[1];
        _this.camera.position.z = +centeroftext[2];

        if (_this.mesh) {
            _this.mesh.position.x = 0;
            _this.mesh.position.y = 0;
            _this.mesh.position.z = 0;
        }
    });

}

export function setCameraViewFrom3D(currentCamera) {

    let orientation = path.join(this.state.tempDir, "Ori-" + this.state.orientation);
    if (!fs.existsSync(orientation)) {
        window.alert("Ori-" + this.state.orientation + " does not exist")
        return false;
    }

    console.log("camera view from " + currentCamera.name);

    let currentFile = path.join(orientation, "Orientation-" + currentCamera.name + ".xml");

    console.log("read file " + currentFile);

    if (!fs.existsSync(currentFile)) {
        return;
    }

    var xmldata = fs.readFileSync(currentFile, 'utf8');

    // xml file data is:
    // location
    // ExportAPERO > OrientationConque > Externe > Centre
    // rotation matrix is
    // ExportAPERO > OrientationConque > Externe > ParamRotation > CodageMtr > L1,L2,L3

    var _this = this;

    this.setState({
        ...this.state,
        centermesh: false,
        threeviewhelp1: currentCamera.name,
        threeviewhelp2: "center mouse - zoom",
        threeviewhelp3: "<esc> to exit",
        manualCamera: true,
        showCameraLights: false
    });
    this.manualCamera = true;

    this.controls.enabled = false;

    cancelAnimationFrame(this.animationID);

    this.threeview.addEventListener('wheel', this.doMouseWheel, false);

    parseString(xmldata, function (err, result) {

        var center = result.ExportAPERO.OrientationConique[0].Externe[0].Centre;
        var centeroftext = center[0].split(" ");
        let matrixXml = result.ExportAPERO.OrientationConique[0].Externe[0].ParamRotation[0].CodageMatr[0];
        let L1 = matrixXml.L1;
        let L2 = matrixXml.L2;
        let L3 = matrixXml.L3;

        let L1array = L1[0].split(" ");
        let L2array = L2[0].split(" ");
        let L3array = L3[0].split(" ");

        _this.controls.enabled = false;
        _this.controls.dispose();

        _this.unloadCameraLights();

        _this.camera.position.x = 0;
        _this.camera.position.y = 0;
        _this.camera.position.z = 0;

        const m = new THREE.Matrix4();

        // +/- found through experimentation L1 first and first column negative
        m.set(+L1array[0], -L1array[1], -L1array[2], 0,
            +L2array[0], -L2array[1], -L2array[2], 0,
            +L3array[0], -L3array[1], -L3array[2], 0,
            0, 0, 0, 1);


        const quaternion = new THREE.Quaternion();
        quaternion.setFromRotationMatrix(m);
        _this.camera.setRotationFromQuaternion(quaternion);

        _this.camera.position.x = +centeroftext[0];
        _this.camera.position.y = +centeroftext[1];
        _this.camera.position.z = +centeroftext[2];

        _this.camera.updateProjectionMatrix(); //does nothing thelp

        _this.render3d();

        if (_this.mesh) {
            _this.mesh.position.x = 0;
            _this.mesh.position.y = 0;
            _this.mesh.position.z = 0;
        }

    });
}

//{name: elemtext,  mesh: textMesh, light: pointLight, lightShape: pointLightHelper}
//light and lightShape have been removed
export function unloadCameraLights() {
    if (this.cameralights.length === 0) {
        return;
    }
    for (var i = 0; i < this.cameralights.length; i++) {
        this.scene.remove(this.cameralights[i].mesh);
        this.scene.remove(this.cameralights[i].cone);
    }
    this.cameralights = [];
    this.cameraLabelMesh = [];
}

export function unloadGCP() {
    if (this.gcp.length === 0) {
        return;
    }
    for (var i = 0; i < this.gcp.length; i++) {
        this.scene.remove(this.gcp[i].mesh);
        this.scene.remove(this.gcp[i].sphere);
    }
    this.gcp = [];
}

export function updateCameraLights(newImageSelection, camFontSize) {

    if (this.cameralights.length === 0) {
        return;
    }
    //remove all camlight meshes
    //recreate camlight meshes
    this.cameralights.forEach(elem => {
        elem.mesh.geometry.dispose();
        var geometry = new THREE.TextBufferGeometry(elem.name, {
            font: this.font,
            size: camFontSize,
            height: camFontSize * 0.1,
            curveSegments: 3,
            bevelEnabled: false,
            bevelThickness: 4,
            bevelSize: 2,
            bevelSegments: 5
        });
        elem.mesh.geometry = geometry;
        elem.cone.scale.x = camFontSize * 5;
        elem.cone.scale.y = camFontSize * 5;
        elem.cone.scale.z = camFontSize * 5;
    })

    if (!newImageSelection) return;

    let numSelected = newImageSelection.reduce((acc, val) => {
        if (val) {
            return acc + 1;
        } else {
            return acc;
        }
    }, 0)
    console.log("num active cameras: ", numSelected);
    this.state.imageSelection.forEach((elem, index) => {
        if (
            (elem && !newImageSelection[index]) || (!elem && newImageSelection[index])
        ) {
            var camlight = this.cameralights.find((el) => {
                return el.name === this.state.imageList[index].name
            })

            if (camlight) {
                if (newImageSelection[index]) {
                    console.log("add cam light: " + this.state.imageList[index].name)
                    camlight.mesh.material.color = new THREE.Color(1, 0, 0);
                    this.scene.add(camlight.cone);
                } else {
                    console.log("remove cam light: " + this.state.imageList[index].name)
                    camlight.mesh.material.color = new THREE.Color(0, 1, 0);
                    this.scene.remove(camlight.cone);
                }
            }
        }
    })
}

export function updatevalues(event) {
    const newState = {
        ...this.state
    };
    const changedItem = event.target.id;
    if (changedItem === "orientation") {
        newState.orientation = event.target.value;
        if (newState.showCameraLights) {
            this.unloadCameraLights();
            newState.showCameraLights = false;
        }

    }
    if (changedItem === "centermesh") {
        newState.centermesh = !newState.centermesh;
        if (this.mesh) {
            if (newState.centermesh) {
                this.mesh.position.x = this.meshPosition.x;
                this.mesh.position.y = this.meshPosition.y;
                this.mesh.position.z = this.meshPosition.z;
            } else {
                this.mesh.position.x = 0;
                this.mesh.position.y = 0;
                this.mesh.position.z = 0;
            }
        }
        this.unloadCameraLights();
        newState.showCameraLights = false;
    }
    if (changedItem === "groundDefined") {
        newState.groundDefined = !newState.groundDefined;
        if (newState.groundDefined) {
            if (this.mesh) {
                this.mesh.position.x = 0;
                this.mesh.position.y = 0;
                this.mesh.position.z = 0;
                newState.centermesh = false;
            }
        }
        this.unloadCameraLights();
        newState.showCameraLights = false;
        this.orbitControlsStart(newState.groundDefined);
    }

    if (changedItem === "showGCP") {
        newState.showGCP = !newState.showGCP;
        if (newState.showGCP) {
            if (!this.loadGCP(this.state.camFontSize)) {
                newState.showGCP = !newState.showGCP;
            }
        } else {
            this.unloadGCP();
        }
    }

    if (changedItem === "matsize") {
        newState.vertexSize = event.target.value;
        if (this.material) {
            this.material.size = event.target.value;
        }
    }

    if (changedItem === "camFontSize") {
        newState.camFontSize = event.target.value;
        if (this.state.showCameraLights) {
            this.updateCameraLights(this.state.imageSelection, newState.camFontSize)
        }
    }
    if (changedItem === "wireframe") {
        newState.wireFrame = !newState.wireFrame;
        if (this.material) {
            this.material.wireframe = newState.wireFrame;
        }
    }
    if (changedItem === "doublesided") {
        newState.doublesided = !newState.doublesided;
        if (this.material) {
            this.material.side = newState.doublesided ? THREE.DoubleSide : THREE.FrontSide;
        }
    }
    if (changedItem === "showCameraLights") {
        newState.showCameraLights = !newState.showCameraLights;
        if (newState.showCameraLights) {
            if (!this.loadCameraLights(this.state.camFontSize)) {
                newState.showCameraLights = !newState.showCameraLights;
            }
        } else {
            this.unloadCameraLights();
        }
    }
    this.setState(newState);
}