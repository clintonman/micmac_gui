import React from 'react';
import { displayProgress, displayErrors, endProgress } from '../../utility/batch';

const fs = window.require('fs');
const path = window.require('path');
// const {app} = window.require('electron');
const spawn = window.require('child_process').spawn;
const xml2js = window.require('xml2js');
const electron = window.require('electron');

var ipcRenderer = electron.ipcRenderer;

const RunList = (props) => {
    let index = 0;
    let runlist = props.mm3dRunList.map(val => {
        let text = "";
        for(let i in val) {
            text += i + ": " + val[i] + ", ";
        }
        return <li key={index++}>{text}</li>;
    })
    return (
        <ol className="runlist">{runlist}</ol>
    )
}
export {RunList}

const Camera = (props) => {
    let cams = props.cameras.map((cam, index) => {
        return (
            <li key={index}>
                <span className="camera-line">
                <input type="text"
                    id="Name"
                    value={cam.Name}
                    onChange={(event) => props.updateCameraEntry(event, cam, index)}/>
                <input type="text"
                    id="SzCaptMm"
                    value={cam.SzCaptMm}
                    onChange={(event) => props.updateCameraEntry(event, cam, index)}/>
                <input type="text"
                    id="ShortName"
                    value={cam.ShortName}
                    onChange={(event) => props.updateCameraEntry(event, cam, index)}/>
                <button title="add new line after current line" onClick={(e) => props.AddCamera(index)}>Add</button>
                <button title="delete current line" onClick={(e) => props.RemoveCamera(index)}>Del</button>
                    </span>
            </li>)
    })

    let retval = null;
    if(cams.length>0)
        retval = <div className="Camera">
            <div className="camera__header">
                <h2>Camera Database</h2>
                <button onClick={props.saveCameraDB}>Save cameras</button>
            </div>
            <ol>{cams}</ol>
        </div>
    return retval;
}
export {Camera}

// this functions

export function AddCamera(ind) {
    let newCam = this.state.cameras;
    newCam.splice(ind + 1, 0, {
        Name: "Name", 
        SzCaptMm: "9.87 6.54", 
        ShortName: 'short name'
    });
    this.setState({...this.state, cameras: newCam})
}

export function RemoveCamera(ind) {
    let newCam = this.state.cameras;
    newCam.splice(ind, 1);
    this.setState({...this.state, cameras: newCam})
}

export function DeleteRunState() {
    const runStateFile = path.join(this.props.tempDir,"runstate.json");
    if(fs.existsSync(runStateFile)) {
        fs.unlinkSync(runStateFile);
        window.alert("run state file deleted");
    }
}

export function editCameraDatabase() {
    var mm3dpath = this.props.mm3dPath;
    var parentPath = path.dirname(path.dirname(mm3dpath));

    //create folder include/XML_User
    var includepath = path.join(parentPath, "include");

    var xmluserpath = path.join(includepath, "XML_User");
    let cameraDB = path.join(xmluserpath, 'DicoCamera.xml');
    if( !fs.existsSync(xmluserpath) ) {
        fs.mkdirSync(xmluserpath);
    }
    console.log(cameraDB)
    
    if(!fs.existsSync(cameraDB)) {
        //create blank camera db file here
        let builder = new xml2js.Builder();
        let objtest = {
            MMCameraDataBase: [
                {CameraEntry: {
                    Name: "Super", 
                    SzCaptMm: "7 11", 
                    ShortName: 'shrtname'
                }},
                {CameraEntry: {
                    Name: "Super 2", 
                    SzCaptMm: "7 11", 
                    ShortName: 'shrtname'
                }}
            ]
        };
        let xml = builder.buildObject(objtest);
        fs.writeFileSync(cameraDB, xml);
    }

    var parseString = xml2js.parseString;
    let xmldata = fs.readFileSync(cameraDB, 'utf8');

    if(!xmldata) {
        console.log("empty file")
        //create blank camera db file here
        let builder = new xml2js.Builder();
        let objtest = {
            MMCameraDataBase: [
                {CameraEntry: {
                    Name: "Super", 
                    SzCaptMm: "7 11", 
                    ShortName: 'shrtname'
                }},
                {CameraEntry: {
                    Name: "Super 2", 
                    SzCaptMm: "7 11", 
                    ShortName: 'shrtname'
                }}
            ]
        };
        let xml = builder.buildObject(objtest);
        fs.writeFileSync(cameraDB, xml);
        xmldata = fs.readFileSync(cameraDB, 'utf8');
    }
    var _this = this;
    parseString(xmldata, function (err, result) {
        console.dir(result.MMCameraDataBase.CameraEntry);
        let camArray = result.MMCameraDataBase.CameraEntry;
        _this.setState({..._this.state, cameras: camArray})
    });
}

// https://github.com/openMVG/CameraSensorSizeDatabase
export function importCameraDatabase() {
    console.log("import cameras")
    //dialog to find source csv
    // var res = dialog.showOpenDialogSync({
    //     properties: ['openFile'],
    //     filters: [
    //         {name: 'CSV(csv)', extensions: ['csv', 'CSV']},
    //         {name: 'All Files', extensions: ['*']}
    //     ]
    // });
    let res = ipcRenderer.sendSync('opencsv-dialog', null);

    if(!res) {
    return;
    }

    var cameraSourceFile = res[0];

    var mm3dpath = this.props.mm3dPath;
    var parentPath = path.dirname(path.dirname(mm3dpath));

    //create folder include/XML_User
    var includepath = path.join(parentPath, "include");
    var xmluserpath = path.join(includepath, "XML_User")
    if( !fs.existsSync(xmluserpath) ) {
        fs.mkdirSync(xmluserpath);
    }

    var builder = new xml2js.Builder();

    var camArray = [];

    let data = fs.readFileSync(cameraSourceFile, 'utf8');

    let datalines = data.split('\n');
    //
    // ***** ***** TODO VERIFY file format is correct
    //
    let regex =  /\s|[^0-9A-Z]/g;
    datalines.forEach((line) => {
        var rawCameraData = line.split(',');
        if(rawCameraData[0].length > 0) {
            var lastletter = rawCameraData[1].substring(rawCameraData[1].length-1);
            var allbutlast = rawCameraData[1].substring(0, rawCameraData[1].length-1);
            var cameraData = {
                Name: ' ' + rawCameraData[0] + ' ' + rawCameraData[1] + ' ',
                SzCaptMm: ' ' + rawCameraData[4] + ' ' + rawCameraData[3] + ' ',
                ShortName: ' ' + rawCameraData[0][0] + allbutlast.replace(regex, '') + lastletter + ' '
            };

            var camobj = { CameraEntry: cameraData };

            if(rawCameraData[4] === '' || rawCameraData[3] === '') {
                console.log("bad camera", rawCameraData[0])
            }
            if(rawCameraData[4] !== '' && rawCameraData[3] !== '' && !isNaN(rawCameraData[4]) && !isNaN(rawCameraData[3])) {
                camArray.push(camobj);
            }
        }
    });

    //convert csv to json
    // console.log(data)
    //read and write the file - DicoCamera.xml
    var obj = {MMCameraDataBase: camArray};
    var xml = builder.buildObject(obj);
    // xml = '<!-- Generated from ' + path.basename(cameraSourceFile) + ' -->\n' + xml;
    fs.writeFileSync(path.join(xmluserpath, 'DicoCamera.xml'), xml);

    this.editCameraDatabase();
}

export function openTerminal() {
    console.log("open terminal")
    if(window.process.platform === "win32") {
        window.require('child_process').exec('start "cmd"', { cwd:this.props.tempDir });
    } else if(window.process.platform === "darwin") {
        // let openTerminalAtPath = spawn ('open', [ '-a', 'Terminal', app.getPath(this.props.tempDir) ]);
        let openTerminalAtPath = spawn ('open', [ '-a', 'Terminal', this.props.tempDir ]);
        if(!openTerminalAtPath) {
            alert("only works with macos")
        }
    } else {
        const terminal = 'gnome-terminal';//name different for different linux distros
        let openTerminalAtPath = spawn (terminal, { cwd:this.props.tempDir });
        if(!openTerminalAtPath) {
            alert("only works with gnome-terminal")
        }
    }
}

export function saveCameraDB() {
    var mm3dpath = this.props.mm3dPath;
    var parentPath = path.dirname(path.dirname(mm3dpath));

    //create folder include/XML_User
    var includepath = path.join(parentPath, "include");

    var xmluserpath = path.join(includepath, "XML_User");
    let cameraDB = path.join(xmluserpath, 'DicoCamera.xml');

    var builder = new xml2js.Builder();
    var camerasObj = {
        MMCameraDataBase: []
    };
    this.state.cameras.forEach(val => {
        let newCamobj = {
            CameraEntry: {
                Name: val.Name,
                SzCaptMm: val.SzCaptMm,
                ShortName: val.ShortName
            }
        }
        camerasObj.MMCameraDataBase.push(newCamobj)
    })

    var xml = builder.buildObject(camerasObj);
    
    fs.writeFile(cameraDB, xml, (err) => {
        this.props.setStatus({procstatus: "Camera database saved.", updateRunListFile: false});
    });
}

export function setexif() {
    var thestart = new Date().getTime();

    this.batchState = {
        stdout: "",
        stdoutline: "",
        stderr: "",
        fatalErrorFlag: false,
        elapsedTime: "00:00",
        updateRunListFile: false
    }
    this.props.setStatus(this.batchState);

    //camera model can have spaces
    //https://stackoverflow.com/questions/16261635/javascript-split-string-by-space-but-ignore-space-in-quotes-notice-not-to-spli
    let spaceNoQuotesRegex = /(?:[^\s"]+|"[^"]*")+/g;
    var commandarray = this.state.setexifcommand.match(spaceNoQuotesRegex);

    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.props.disableApp();

    let spawnOptions = { cwd:this.props.tempDir }
    if(this.props.globalEnv) {
        spawnOptions.env = this.props.globalEnv;
    }

    const bat = spawn(this.props.mm3dPath, commandarraytext, spawnOptions);

    bat.stdout.on('data', (data) => {
        let status = displayProgress("SetExif", this.batchState, data, bat, thestart) ;
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime};
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: false
        }
        if(status.updateDisplay){
            this.props.setStatus(this.feedbackState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("SetExif", this.batchState, data, bat) ;
        this.batchState = {...this.batchState, stderr: status.stderr};
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: false
        }
        this.props.setStatus(this.feedbackState);
    });

    bat.on('exit', (code) => {
        let status = endProgress("SetExif", this.batchState, code, bat, thestart, this.props, this.state.setexifcommand);
        this.batchState = {...this.batchState, procstatus: status.procstatus};
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }

        if(code === 0) {
            let newImageList = [...this.state.imageList];
            newImageList.forEach(val=>{
                if(!val.exif) {
                    val.exif = {}
                }
                if(!val.exif.SubExif) {
                    val.exif.SubExif = {}
                }
                val.exif.SubExif.FocalLength = this.state.f;
                val.exif.SubExif.FocalLengthIn35mmFilm = this.state.f35;
                val.exif.Model = this.state.cam;
            })
            this.feedbackState.imageList = newImageList;
        }
        this.feedbackState.exifisset = true;
        this.props.setStatus(this.feedbackState);
    });
}

export function setMaxPoints() {
    const max3dpoints = document.getElementById("max3dpoints");
    if(max3dpoints) {
        let max3dpointsval = max3dpoints.value;
        this.props.setMaxPoints(max3dpointsval);
    }
}

export function clearSettingsFiles() {
    //cannot remove while running
    // ipcRenderer.send('clear-settings',null);
    // const userDataPath = (electron.app).getPath('userData');
    const userDataPath = ipcRenderer.sendSync('get-user-data-path', null);

    window.alert("Exit MicMac GUI and manually remove the folder\n" + 
        userDataPath + 
        "\n\nA folder explorer will now open to that location");
    electron.shell.openPath(userDataPath);
  }

export function updateCameraEntry(event, camObj, index) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    camObj[changedItem] = newValue;

    newState.cameras.splice(index, 1, camObj);

    this.setState(newState);
}

export function updateExifCommand(event) {
    const changedItem = event.target.id;
    // const newValue = event.target.value;
    const newValue = event.target.value;
    const newState = {...this.state}

    if(changedItem==="cam") {
        newState.cam = newValue;
    }
    if(changedItem==="f") {
        newState.f = newValue;
    }
    if(changedItem==="f35") {
        newState.f35 = newValue;
    }
    if(changedItem==="exifisset") {
        newState.exifisset = newValue;
        this.props.setStatus({exifisset: !this.props.exifisset});
    }
    
    this.buildexifcommand(newState);

    if(changedItem==="setexifcommand") {
        newState.setexifcommand = newValue.replace(/\n/g,'');
    }
    this.setState(newState);
}

export function updateValue(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state}

    if(changedItem==="max3dpoints") {
        newState.max3dpoints = +newValue;
        this.props.setStatus({max3dpoints: +newValue});
    }
}