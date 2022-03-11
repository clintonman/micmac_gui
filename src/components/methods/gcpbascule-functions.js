import React from 'react';
import Checkmark from "../Checkmark";
import { displayProgress, displayErrors, endProgress } from '../../utility/batch';

const fs = window.require('fs');
const path = window.require('path');
const spawn = window.require('child_process').spawn;
const electron = window.require('electron');
var xml2js = window.require('xml2js');

let ipcRenderer = electron.ipcRenderer;

const SaisieAppuisInit = (props) => {
    let values = [];
    //populate list here
    let options = props.gcp.map((cp, index) => {
        return <option key={index+1} value={cp.name}>{cp.name}</option>
    });
    options.unshift(<option key="0" value="">choose</option>);

    //commandString: "mm3d SaisieAppuisInitQT InitialImageMeasurements.xml"

    let linevals = props.initPoints.map((val, index) => {
        return (
            <li key={index}>
                <input type="text"
                    className={`command_input ${props.hidecommandinput ? "command_hidden" : ""}`}
                    value={val.commandString}
                    readOnly/>
                <input type="text"
                    value={val.imageRegex}
                    readOnly/>
                <select 
                    name="point" id="point" 
                    title="choose a control point"
                    value={val.name}
                    onChange={(event) => props.updateAppuisInit(event, index)}
                    disabled={val.ran}>
                    {options}
                </select>
                <button 
                    onClick={() => props.setRegex(index)}
                    title="set image selection that contains the control point"
                    disabled={val.ran}>set regex</button>
                <button 
                    onClick={() => props.runAppuisInit(index)} 
                    style={{position:'relative'}} 
                    title="locate point in the image(s)"
                    className="contexthelp"
                    data-help="SaisieAppuisInitQT" data-position="left" 
                    onContextMenu={props.helpcontext}
                    disabled={val.ran}>
                    {val.ran ? <Checkmark className="initialpoint-button-ran" ></Checkmark> : null}init</button>
            </li>
        )
    });

    values.push(linevals)
    console.log(props)
    values.push(<button key="selectpointbutton" 
        title="select a point to be added to the inital image measurements"
        onClick={props.selectPoint}
        data-help="GCPInitialPoints" data-position="center" 
        className="contexthelp"
        onContextMenu={props.helpcontext}>select point</button>)
    return (
        <div className="SaisieAppuisInit">
            <ul>
                {values}
            </ul>
        </div>
    )
}

export {SaisieAppuisInit}

export function addPoint() {
    let newName = '999999';
    const newState = {...this.state};

    let newPoint = {
        name: newName,
        x: 0,
        y: 0,
        z: 0
    };
    newState.gcp.push(newPoint);
    this.setState(newState);
}

 // mm3d Campari "' + fileregex + '" GCPBascPredicOut CampariOut GCP=[OnSiteMeasure.xml,0.2,PredicImageMeasurements-S2D.xml,0.5]
 export function buildCampriCommand(newState) {
    let buildcommand;
    buildcommand = 'mm3d Campari "' + newState.imageRegex +  '" ';
    buildcommand += newState.gcpbascpredicout + " " + newState.campariout;
    
    if(newState.usecamparigcp) {
        buildcommand += ' GCP=[' + newState.onsitegcpxml + '.xml,' 
        buildcommand += newState.uncertainty + ',PredicImageMeasurements-S2D.xml,';
        buildcommand += newState.uncertaintyPixel + ']';
    }
    
    if(newState.exptxt) {
        buildcommand += " ExpTxt=1";
    }

    newState.thecampricommand = buildcommand;
}

export function buildSaisieAppuisPredicQTCommand(newState) {
    let buildcommand;
    buildcommand = 'mm3d SaisieAppuisPredicQT "' + newState.imageRegex +  '" ';
    buildcommand += newState.gcpbascinitout + " " + newState.onsitegcpxml + ".xml PredicImageMeasurements.xml";

    newState.saisieappuispredicCommand = buildcommand;

    this.saisieappuispredicOverride = false;
    // ["SaisieAppuisPredicQT", this.state.imageRegex, this.state.gcpbascinitout, this.state.onsitegcpxml + ".xml", "PredicImageMeasurements.xml" ];
}



// build the 2 bascule commands - initial and predic
export function buildcommand(newState, bascinit) {
    let buildcommand;
    buildcommand = 'mm3d GCPBascule "' + newState.imageRegex +  '" ';
    if(bascinit) {
        buildcommand += newState.orientationin + " " + newState.gcpbascinitout + " ";
        buildcommand += newState.onsitegcpxml + ".xml InitialImageMeasurements-S2D.xml";
        newState.thebascinitcommand = buildcommand;
    } else {
        buildcommand += newState.orientationin + " " + newState.gcpbascpredicout + " ";
        buildcommand += newState.onsitegcpxml + ".xml PredicImageMeasurements-S2D.xml";
        newState.thebascprediccommand = buildcommand;
    }
}

export function copy2DXMLfile() {
    // var res = dialog.showOpenDialogSync({
    //     properties: ['openFile'],
    //     filters: [
    //         {name: '2D Measurements(xml)', extensions: ['xml', 'XML']}
    //     ],
    //     defaultPath: this.state.tempDir
    //   });
    let res = ipcRenderer.sendSync('openxml-dialog', this.state.tempDir);

    if(!res) {
        return;
    }
    fs.copyFileSync(res[0], path.join(this.state.tempDir, "PredicImageMeasurements-S2D.xml"));
    window.alert(`file copied to "PredicImageMeasurements-S2D.xml", the file may need editing depending on if the original image filenames were altered`);
    //note simple copy, no check of proper file format
}

export function deletePoint(index) {
    const newState = {...this.state};
    newState.gcp.splice(index, 1)
    this.setState(newState);
}

export function openSaisieAppuispredicQT() {
    var thestart = new Date().getTime();

    if(!this.saisieappuispredicOverride) {
        if(!this.props.imageList || this.props.imageList.length === 0) {
            window.alert("no images loaded")
            return;
        }
        let count = this.props.imageList.reduce((acc, val) => val.selected ? acc + 1 : acc, 0);

        if(count === 0) {
            window.alert("no images selected")
            return;
        }

        //
        //TODO check measurements file exists
        //

        // mm3d SaisieAppuisPredicQT FullName Orientation FileForGroundControlPoints FileForImageMeasurements
        //var commandarraytext = ["SaisieAppuisPredicQT", this.state.imageRegex, this.state.gcpbascinitout, this.state.onsitegcpxml + ".xml", "PredicImageMeasurements.xml" ];
    }

    var commandarraytext = this.state.saisieappuispredicCommand.split(" ");
    commandarraytext.shift();//remove mm3d

    this.clearBatchState();
    this.props.setStatus(this.batchState);

    this.props.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("SaisieAppuisPredicQT", this.batchState, data, bat, thestart)
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
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
        let status = displayErrors("SaisieAppuisPredicQT", this.batchState, data, bat)
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: false
        }
        this.props.setStatus(this.feedbackState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("SaisieAppuisPredicQT", this.batchState, code, bat, thestart, this.props, commandarraytext.join(" "))
        this.batchState = {...this.batchState, procstatus: status.procstatus}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        this.props.setStatus(this.feedbackState)
    });
}

export function openTextfile() {
    // var res = dialog.showOpenDialogSync({
    //     properties: ['openFile'],
    //     filters: [
    //         {name: 'Measurements(txt)', extensions: ['txt', 'TXT']}
    //     ],
    //     defaultPath: this.state.tempDir
    //   });
      let res = ipcRenderer.sendSync('measuretext-dialog', this.state.tempDir);

    if(!res) {
        return;
    }

    fs.readFile(res[0], 'utf8', (err, data) => {
        let dataArray = data.split("\n");
        let newgcp = [];
        const spaceRegex = /[ |\t]/g;

        dataArray.forEach(val => {
            val = val.replace(/\r/,"");//remove windows \r character
            let currentGCP = val.split(spaceRegex);

            //AppEgels format "PointNumber  VariableNonImported  X    Y    Z"
            if(currentGCP.length === 5 && val[0] !== "#") {
                newgcp.push({
                    name: currentGCP[0],
                    x: currentGCP[2],
                    y: currentGCP[3],
                    z: currentGCP[4]
                });
            } else {
                //AppGeoCub format "PointNumber    X    Y    Z"
                if(currentGCP.length > 3 && val[0] !== "%") {
                    newgcp.push({
                        name: currentGCP[0],
                        x: currentGCP[1],
                        y: currentGCP[2],
                        z: currentGCP[3]
                    });
                }
            }
        });

        if(newgcp.length === 0) {
            window.alert("Bad file format for 3D text file");
            return;
        }

        let newState = {
            ...this.state,
            onsitegcpfile: path.basename(res[0], '.txt'),
            onsitegcpxml: path.basename(res[0], '.txt'),
            gcp: newgcp
        }
        this.buildcommand(newState, true);
        this.buildcommand(newState, false);
        this.buildCampriCommand(newState);

        this.setState(newState);
    });
}

export function openXMLfile() {
    // var res = dialog.showOpenDialogSync({
    //     properties: ['openFile'],
    //     filters: [
    //         {name: 'Measurements(xml)', extensions: ['xml', 'XML']}
    //     ],
    //     defaultPath: this.state.tempDir
    //   });
      let res = ipcRenderer.sendSync('measurexml-dialog', this.state.tempDir);

    if(!res) {
        return;
    }

    var parser = new xml2js.Parser();
    fs.readFile(res[0], (err, data) => {
        let newgcp = [];
        parser.parseString(data, (err, result) => {
            //Gravillons sample has a wrapping Global tag in the measurements file - maybe old format?
            let arr;
            if(result.Global) {
                if(!result.Global.DicoAppuisFlottant || !result.Global.DicoAppuisFlottant[0].OneAppuisDAF) {
                    window.alert("Bad file format for 3D xml file");
                    return;
                }
                arr = result.Global.DicoAppuisFlottant[0].OneAppuisDAF;
            }
            else {
                if(!result.DicoAppuisFlottant || !result.DicoAppuisFlottant.OneAppuisDAF) {
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

        if(newgcp.length === 0) {
            window.alert("Bad file format for 3D xml file");
            return;
        }

        let newState = {
            ...this.state,
            onsitegcpxml: path.basename(res[0], '.xml'),
            onsitegcpfile: path.basename(res[0], '.xml'),
            gcp: newgcp
        }
        this.buildcommand(newState, true);
        this.buildcommand(newState, false);
        this.buildCampriCommand(newState);
        this.buildSaisieAppuisPredicQTCommand(newState);

        this.setState(newState);
    });
}

export function runAppuisInit(index) {
    if(!this.props.imageList || this.props.imageList.length === 0) {
        window.alert("no images loaded")
        return;
    }
    let count = this.props.imageList.reduce((acc, val) => val.selected ? acc + 1 : acc, 0);

    if(count === 0) {
        window.alert("no images selected")
        return;
    }
    // multiple images does not work well - bug in appuisinit(windows?)
    if(count > 1) {
        if(!window.confirm("More than 1 image selected. Continue anyway?")) {
            return;
        }
    }
    let commandarraytext;
    commandarraytext = [
        "SaisieAppuisInitQT",
        this.state.initPoints[index].imageRegex,
        this.state.orientationin,
        this.state.initPoints[index].name,
        "InitialImageMeasurements.xml"
    ];

    this.clearBatchState();
    this.props.setStatus(this.batchState);

    var thestart = new Date().getTime();

    this.props.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("SaisieAppuisInitQT", this.batchState, data, bat, thestart)
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
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
        let status = displayErrors("SaisieAppuisInitQT", this.batchState, data, bat)
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: false
        }
        this.props.setStatus(this.feedbackState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("SaisieAppuisInitQT", this.batchState, code, bat, thestart, this.props, commandarraytext.join(" "));
        this.batchState = {...this.batchState, procstatus: status.procstatus}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        this.props.setStatus(this.feedbackState)
        if(code === 0) {
            let newInitPoints = [...this.state.initPoints];
            newInitPoints[index].ran = true;
            this.setState({...this.state, initPoints: newInitPoints});
        }
    });
}

export function runBascCommand(bascinit) {
    var thestart = new Date().getTime();

    if((!this.bascinitCommandOverride && bascinit) || (!this.bascpredicCommandOverride && !bascinit)) {
        if(!this.state.imageRegex || this.state.imageRegex === "regex goes here" || this.state.imageRegex === "empty selection") {
            window.alert("Select image files first.");
            return;
        }

        if(this.state.imageList.length === 0) {
            window.alert("Select images first.");
            return;
        }
        //in orientation folder
        let checkPath = path.join(this.props.tempDir, 'Ori-'+this.state.orientationin);
        if(!fs.existsSync(checkPath)) {
            window.alert("Run Tapas first");
            return;
        }
        
        //measurements
        checkPath = path.join(this.props.tempDir, this.state.onsitegcpxml + '.xml');

        if(!fs.existsSync(checkPath)) {
            window.alert("Create measurements file first");
            return;
        }
        
        if(bascinit) {
            checkPath = path.join(this.props.tempDir, 'InitialImageMeasurements-S2D.xml');
            if(!fs.existsSync(checkPath)) {
                window.alert("Run SaisieAppuisInit first");
                return;
            }
        } else {
            checkPath = path.join(this.props.tempDir, 'PredicImageMeasurements-S2D.xml');
            if(!fs.existsSync(checkPath)) {
                window.alert("Run SaisieAppuisPredicQT first");
                return;
            }
        }
    }
    
    let commandarray;
    if(bascinit) {
        commandarray = this.state.thebascinitcommand.split(" ");
    } else {
        commandarray = this.state.thebascprediccommand.split(" ");
    }
    this.setState({
        ...this.state, 
        batchIsRunning: true,
    })
    this.clearBatchState();
    this.props.setStatus(this.batchState);

    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.state.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("GCPBascule", this.batchState, data, bat, thestart)
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            updateRunListFile: false
        }
        if(status.updateDisplay){
            this.props.setStatus(this.feedbackState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("GCPBascule", this.batchState, data, bat)
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            updateRunListFile: false
        }
        this.props.setStatus(this.feedbackState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("GCPBascule", this.batchState, code, bat, thestart, this.props, commandarray.join(" "));
        this.batchState = {...this.batchState, procstatus: status.procstatus}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        this.props.setStatus(this.feedbackState)
    });
}

export function runCampari() {
    var thestart = new Date().getTime();

    if(!this.campriCommandOverride) {
        if(!this.state.imageRegex || this.state.imageRegex === "regex goes here" || this.state.imageRegex === "empty selection") {
            window.alert("Select image files first.");
            return;
        }

        if(this.state.imageList.length === 0) {
            window.alert("Select images first.");
            return;
        }
    }

    let commandarray = this.state.thecampricommand.split(" ");

    this.setState({
        ...this.state, 
        batchIsRunning: true
    })
    this.clearBatchState();
    this.batchState.campariout = this.state.campariout

    this.feedbackState = {
        stdout: this.batchState.stdout,
        stderr: this.batchState.stderr,
        elapsedTime: this.batchState.elapsedTime,
        stdoutline: this.batchState.stdoutline,
        updateRunListFile: false
    }
    this.props.setStatus(this.feedbackState);

    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.state.disableApp();

    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        const detailed = true
        let status = displayProgress("Campari", this.batchState, data, bat, thestart, detailed)
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime,
            stdoutline: status.stdoutline
        }
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            updateRunListFile: false
        }
        if(status.updateDisplay){
            this.props.setStatus(this.feedbackState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("Campari", this.batchState, data, bat)
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            updateRunListFile: false
        }
        this.props.setStatus(this.feedbackState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("Campari", this.batchState, code, bat, thestart, this.props, this.state.thecampricommand)
        this.batchState = {...this.batchState, procstatus: status.procstatus}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        this.props.setStatus(this.feedbackState)
    });
}

export function saveMeasurements() {
    if(this.state.gcp.length === 0) {
        window.alert("Must create points first");
        return;
    }

    //force unique names
    let namesArray = this.state.gcp.map(val => {
        return val.name;
    });
    let namesSet = new Set(namesArray);

    if(namesArray.length !== namesSet.size) {
        window.alert("All point names must be unique");
        return;
    }

    let defaultPath = this.state.tempDir;
    if(this.state.onsitegcpfile !== "") {
        defaultPath = path.join(this.props.tempDir, this.state.onsitegcpfile + ".txt")
    }

    // var filename = dialog.showSaveDialogSync({
    //     filters: [
    //         {name: 'Measurements(txt)', extensions: ['txt', 'TXT']}
    //     ],
    //     defaultPath: defaultPath
    // });
    let filename = ipcRenderer.sendSync('savetext-dialog', defaultPath);
  
    if(!filename) {
        return;
    }
    let data = "";
    this.state.gcp.forEach(val => {
        data += val.name + ' ' + val.x + ' ' + val.y + ' ' + val.z + '\n';
    });
    fs.writeFile(filename, data, (err) => {
        if(err) throw(err);

        let commandarraytext = ["GCPConvert", "AppGeoCub", filename]

        this.clearBatchState();
        this.props.setStatus(this.batchState);

        let thestart = new Date().getTime();

        this.props.disableApp();
        const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });
    
        bat.stdout.on('data', (data) => {
            let status = displayProgress("GCPConvert", this.batchState, data, bat, thestart)
            this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
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
            let status = displayErrors("GCPConvert", this.batchState, data, bat)
            this.batchState = {...this.batchState, stderr: status.stderr}
            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline,
                procstatus: this.batchState.procstatus,
                updateRunListFile: false
            }
            this.props.setStatus(this.feedbackState)
        });

        bat.on('exit', (code) => {
            let status = endProgress("GCPConvert", this.batchState, code, bat, thestart, this.props)
            this.batchState = {...this.batchState, procstatus: status.procstatus}
            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline,
                procstatus: this.batchState.procstatus,
                updateRunListFile: false
            }
            this.props.setStatus(this.feedbackState)
        });
    })

}

export function selectPoint() {
    const newState = {...this.state};
    let newPoint = {
        name: "",
        imageRegex: "select images and press the set regex button",
        commandString: 'mm3d SaisieAppuisInitQT "regex" ' + this.state.orientationin +  ' point InitialImageMeasurements.xml'
    };
    newState.initPoints.push(newPoint);
    this.setState(newState);
}

export function setRegex(index) {
    const newState = {...this.state};
    newState.initPoints[index].imageRegex = this.state.imageRegex;

    let commandString =  'mm3d SaisieAppuisInitQT "' + this.state.imageRegex;
    commandString += ' ' + this.state.orientationin;
    commandString += ' ' + this.state.initPoints[index].name;
    commandString += ' InitialImageMeasurements.xml';
    newState.initPoints[index].commandString = commandString;

    this.setState(newState);
}

export function updateAppuisInit(event, index) {
    const newValue = event.target.value;
    const newState = {...this.state};
    newState.initPoints[index].name = newValue;

    let commandString =  'mm3d SaisieAppuisInitQT "' + this.state.imageRegex;
    commandString += ' ' + this.state.orientationin;
    commandString += ' ' + newValue;
    commandString += ' InitialImageMeasurements.xml';
    newState.initPoints[index].commandString = commandString;

    this.setState(newState);
}

export function updateBascInitcommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    if(changedItem==="gcpbascinitout") {
        newState.gcpbascinitout = newValue;
        this.buildSaisieAppuisPredicQTCommand(newState);
    }

    this.buildcommand(newState, true);

    if(changedItem==="thebascinitcommand") {
        newState.thebascinitcommand = newValue.replace(/\n/g,'');
        this.bascinitCommandOverride = true;
    } else {
        this.bascinitCommandOverride = false;
    }

    this.setState(newState);
}

export function updateBascPredicCommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    if(changedItem==="gcpbascpredicout") {
        newState.gcpbascpredicout = newValue;
        this.buildCampriCommand(newState);
    }

    this.buildcommand(newState, false);

    if(changedItem==="thebascprediccommand") {
        newState.thebascprediccommand = newValue.replace(/\n/g,'');
        this.bascpredicCommandOverride = true;
    } else {
        this.bascpredicCommandOverride = false;
    }

    this.setState(newState);
}

export function updateCampariCommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    if(changedItem==="campariout") {
        newState.campariout = newValue;
    }
    if(changedItem==="uncertainty") {
        newState.uncertainty = newValue;
    }
    if(changedItem==="uncertaintyPixel") {
        newState.uncertaintyPixel = newValue;
    }
    if(changedItem==="usecamparigcp") {
        newState.usecamparigcp = !newState.usecamparigcp;
    }
    if(changedItem==="exptxt") {
        newState.exptxt = !newState.exptxt;
    }

    this.buildCampriCommand(newState);

    if(changedItem==="thecampricommand") {
        newState.thecampricommand = newValue.replace(/\n/g,'');
        this.campriCommandOverride = true;
    } else {
        this.campriCommandOverride = false;
    }
    this.setState(newState);
}

export function updatecommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    if(changedItem==="onsitegcpfile") {
        newState.onsitegcpfile = newValue;
    }
    if(changedItem==="orientationin") {
        newState.orientationin = newValue;
        this.buildcommand(newState, true);
        this.buildcommand(newState, false);
    }
    if(changedItem==="onsitegcpxml") {
        newState.onsitegcpxml = newValue;
        this.buildcommand(newState, true);
        this.buildcommand(newState, false);
        this.buildCampriCommand(newState);
        this.buildSaisieAppuisPredicQTCommand(newState);
    }
    if(changedItem==="saisieappuispredicCommand") {
        newState.saisieappuispredicCommand = newValue.replace(/\n/g,'');
        this.saisieappuispredicOverride = true;
    }

    this.setState(newState);
}

export function updateGCPinput(event, cpObj, index) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    cpObj[changedItem] = newValue;

    newState.gcp.splice(index, 1, cpObj);

    this.setState(newState);
}