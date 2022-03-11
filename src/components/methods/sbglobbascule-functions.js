import { displayProgress, displayErrors, endProgress } from '../../utility/batch';
import { prepSaisieMasq } from '../../utility/mmutil';

const process = window.require('process');
const fs = window.require('fs');
const path = window.require('path');
const spawn = window.require('child_process').spawn;
const electron = window.require('electron');

let ipcRenderer = electron.ipcRenderer;

export function buildapericloudcommand(newState) {
    newState.apericloudCommand = 'mm3d AperiCloud "' + newState.imageRegex + '"';
    newState.apericloudCommand += " " + newState.campariout;
    newState.apericloudCommand += (newState.exptxt ? " ExpTxt=1" : "");
    newState.apericloudCommand += (!newState.withCam ? " WithCam=0" : "");
}

export function buildCampriCommand(newState) {
    let buildcommand;
    buildcommand = 'mm3d Campari "' + newState.imageRegex +  '" ';
    buildcommand += newState.orientationout + " " + newState.campariout ;
    if(newState.exptxt) {
        buildcommand += " ExpTxt=1";
    }

    newState.thecampricommand = buildcommand;
}

export function buildcommand(newState) {
    var buildcommand = 'mm3d SBGlobBascule "' + newState.imageRegex +  '" ';

    buildcommand += newState.orientationin + " Measurements-S2D.xml ";
    buildcommand += newState.orientationout;
    
    if(newState.exptxt) {
        buildcommand += " ExpTxt=1";
    }
    
    if(newState.postplan) {
        buildcommand += " PostPlan=_MasqPlane" ;
    } else {
        buildcommand += " PostPlan=NONE" ;
    }
    
    if(newState.usedistFS) {
        buildcommand += " DistFS=" + newState.distfs ;
    }

    if(newState.rep !=='ki' && newState.validrep) {
        buildcommand += " Rep=" + newState.rep;
    }
    newState.command = buildcommand;
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
    fs.copyFileSync(res[0], path.join(this.state.tempDir, "Measurements-S2D.xml"));
    window.alert(`file copied to "Measurements-S2D.xml", the file may need editing depending on if the original image filenames were altered`);
    //note: simple copy, no check of proper file format
}


//define Line1 and Line2 points to indicate x direction
    //define Ech1 and Ech2 points optional length measurement
    export function openSaisieBasc() {
        var thestart = new Date().getTime();

        if(!this.saisiebascOverride) {
            
            if(this.state.imageWidth <128) {
                window.alert("Image is too small to open safely");
                return;
            }
            
            if(this.state.imageWidth <1024 && process.platform === 'win32') {
                if(!window.confirm("Image maybe too small to open on Windows systems. Proceed anyway?")) {
                    return;
                }
            }
            
            let numselected = 0;
            
            if(this.state.imageList) {
                numselected = this.state.imageList.reduce((acc,val, currentIndex) => {
                    if(val.selected) {
                        return acc + 1;
                    }
                    return acc;
                }, 0);
            }
        
            if(numselected === 0) {
                window.alert("Select 1 or more images first");
                return;
            }
        
            if(numselected > 10) {
                if(!window.confirm("More than 10 images selected, proceed anyway?")) {
                    return;
                }
            }
        
            // commandarraytext = ["SaisieBascQT", this.state.imageRegex, this.state.orientationin, "Measurements.xml"];
        } 
        var commandarraytext = this.state.saisiebascCommand.split(" ");
        commandarraytext.shift();//remove mm3d at start

        this.clearBatchState();
        this.batchState.orientation = this.state.orientationin;

        this.props.setStatus(this.batchState);

        this.state.disableApp();
        const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

        bat.stdout.on('data', (data) => {
            let status = displayProgress("SaisieBascQT", this.batchState, data, bat, thestart);
            this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, procstatus: status.procstatus};
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
            let status = displayErrors("SaisieBascQT", this.batchState, data, bat) ;
            this.batchState = {...this.batchState, stderr: status.stderr};
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
            let status = endProgress("SaisieBascQT", this.state, code, bat, thestart, this.props, commandarraytext.join(" "));
            this.batchState = {...this.batchState, procstatus: status.procstatus }
            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline,
                procstatus: status.procstatus,
                updateRunListFile: false
            }
            this.props.setStatus(this.feedbackState)
        });

        //Line1, Line2 define x axis
        //Ech1, Ech2 define scale line
        //if masking plane must do Line1/Line2 
        //if only scale then Ech1/Ech2 required
    }

    export function openSaisi() {
        var thestart = new Date().getTime();

        this.clearBatchState();
        this.batchState.orientation = this.state.campariout;

        // let commandarraytext = prepSaisieMasq("AperiCloud", this.batchState, this.props)
        // if(commandarraytext.length === 0) {
        //     return;
        // }
        if(!this.saisiemasqplyOverride) {
            let checkarray= prepSaisieMasq("AperiCloud", this.batchState, this.props, true);
            if(checkarray.length === 0) {
                return;
            }
        }
        var commandarraytext = this.state.saisiemasqplyCommand.split(" ");
        commandarraytext.shift();//remove mm3d at start

        this.props.disableApp();

        this.props.setStatus(this.batchState);

        const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });
    
        bat.stdout.on('data', (data) => {
            let status = displayProgress("SaisieMasqQT-SBGlobBascule", this.batchState, data, bat, thestart)
            this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime};
            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline
            }
            if(status.updateDisplay){
                this.props.setStatus(this.feedbackState);
            }
        });

        bat.stderr.on('data', (data) => {
            let status = displayErrors("SaisieMasqQT-SBGlobBascule", this.batchState, data, bat)
            this.batchState = {...this.batchState, stderr: status.stderr}
            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline
            }
            this.props.setStatus(this.feedbackState)
        });

        bat.on('exit', (code) => {
            let status = endProgress("SaisieMasqQT-SBGlobBascule", this.batchState, code, bat, thestart, this.props)
            this.batchState = {...this.batchState, procstatus: status.procstatus}
            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline,
                procstatus: status.procstatus
            }
            this.props.setStatus(this.feedbackState)
        });
    }

    // saisiemasq for ground plane definition
export function openSaisieMasq() {
    var thestart = new Date().getTime();

    if(!this.saisiemasqimgOverride) {
        let checkarray= prepSaisieMasq("SBGlobBascule", this.state, this.props, true);
        if(checkarray.length === 0) {
            return;
        }
    }

    var commandarraytext = this.state.saisiemasqimgCommand.split(" ");
    commandarraytext.shift();//remove mm3d at start

    this.clearBatchState();
    this.props.setStatus(this.batchState);

    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("SaisieMasqQT", this.batchState, data, bat, thestart)
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
        if(status.updateDisplay){
            this.props.setStatus(this.batchState);
        }
    });

    bat.stderr.on('data', (data) => {
        this.props.disableApp();//only care about errors
        let status = displayErrors("SaisieMasqQT", this.batchState, data, bat)
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.props.setStatus(this.batchState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("SaisieMasqQT", this.batchState, code, bat, thestart, this.props)
        let newImageList = [...this.state.imageList]
        let selectedIndex = newImageList.findIndex(val => {
            return val.selected
        })
        newImageList[selectedIndex].masked = true;
        this.batchState = {...this.batchState, procstatus: status.procstatus, imageList: newImageList}
        this.props.setStatus(this.batchState)
    });
}

export function runApericloud() {
    var thestart = new Date().getTime();

    if(this.state.imageList.length === 0) {
        window.alert("Select images first.");
        return;
    }
    let numselected = 0;
    
    if(this.state.imageList) {
        numselected = this.state.imageList.reduce((acc,val, currentIndex) => {
            if(val.selected) {
                return acc + 1;
            }
            return acc;
        }, 0);
    }
    if(numselected < 3) {
        window.alert("Select images first");
        return;
    }
    
    let oriPath = path.join(this.props.tempDir, 'Ori-'+this.state.campariout);
    if(!fs.existsSync(oriPath)) {
        window.alert("Run campari first");
        return;
    }

    // var commandarray = ["mm3d", "AperiCloud", this.props.imageRegex, this.state.campariout, "WithCam=0"];
    let commandarray = this.state.apericloudCommand.split(" ");

    this.setState({
        ...this.state, 
        batchIsRunning: true,
    })

    this.clearBatchState();
    this.batchState.orientation = this.state.campariout;
    
    this.props.setStatus(this.batchState);

    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.props.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("Apericloud-SBGlobBascule", this.batchState, data, bat, thestart);
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, procstatus: status.procstatus};
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline
        }
        if(status.updateDisplay){
            this.props.setStatus(this.feedbackState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("Apericloud-SBGlobBascule", this.batchState, data, bat) ;
        this.batchState = {...this.batchState, stderr: status.stderr};
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline
        }
        this.props.setStatus(this.feedbackState)
    });

    bat.on('exit', (code) => {
        this.setState({
            ...this.state,
            plyReady: true,
            plyFile: path.join(this.props.tempDir, 'AperiCloud_' + this.state.campariout +'.ply')
        })
        let status = endProgress("Apericloud-SBGlobBascule", this.batchState, code, bat, thestart, this.props, commandarray.join(" "));
        this.batchState = {...this.batchState, procstatus: status.procstatus}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: status.procstatus,
            updateRunListFile: true
        }
        if(status.apericloudran) {
            this.setState({...this.state, apericloudran: true, enablePLY: true});
            this.feedbackState.apericloudran = true;
        }
        this.props.setStatus(this.feedbackState)
    });

}

export function runCampari() {
    var thestart = new Date().getTime();

    if(!this.commandOverrideCampari) {
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

    //
    // ***** ***** ** TODO check for orientation file exist
    //

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
        let status = displayProgress("Campari", this.batchState, data, bat, thestart)
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
        //campari is the last step of bascule
        if(status.campariran)
            this.feedbackState.sbglobbasculeran = true;
        this.props.setStatus(this.feedbackState)
    });
}

export function runCommand() {
    var thestart = new Date().getTime();

    if(!this.commandOverride) {
        if(this.state.imageList.length === 0) {
            window.alert("Select images first.");
            return;
        }
        let numselected = 0;
        
        if(this.state.imageList) {
            numselected = this.state.imageList.reduce((acc,val, currentIndex) => {
                if(val.selected) {
                    return acc + 1;
                }
                return acc;
            }, 0);
        }
        if(numselected < 3) {
            window.alert("Select images first");
            return;
        }
        //in orientation folder
        let checkPath = path.join(this.props.tempDir, 'Ori-'+this.state.orientationin);
        if(!fs.existsSync(checkPath)) {
            window.alert("Run Tapas first");
            return;
        }

        //measurements
        checkPath = path.join(this.props.tempDir, 'Measurements-S2D.xml');
        if(!fs.existsSync(checkPath)) {
            window.alert("Run SaisieBasc first");
            return;
        }
    }

    var commandarray = this.state.command.split(" ");

    this.setState({
        ...this.state, 
        batchIsRunning: true,
    })

    this.clearBatchState();
    this.batchState.orientationout = this.state.orientationout;

    this.props.setStatus(this.batchState);

    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.state.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    this.batch = bat;

    bat.stdout.on('data', (data) => {
        let status = displayProgress("SBGlobBascule", this.batchState, data, bat, thestart);
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, procstatus: status.procstatus};
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline
        }
        if(status.updateDisplay){
            this.props.setStatus(this.feedbackState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("SBGlobBascule", this.batchState, data, bat) ;
        this.batchState = {...this.batchState, stderr: status.stderr};
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline
        }
        this.props.setStatus(this.feedbackState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("SBGlobBascule", this.state, code, bat, thestart, this.props, this.state.command);
        this.batchState = {...this.batchState, procstatus: status.procstatus }
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: status.procstatus,
            updateRunListFile: true
        }

        if(status.sbglobbasculestep1ran)
            this.setState({...this.state, sbglobbasculestep1ran: true});
        this.props.setStatus(this.feedbackState)
    });
}

export function updateCampariCommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    if(changedItem==="campariout") {
        newState.campariout = newValue;
        // newState.apericloudCommand = 'mm3d AperiCloud ' + this.props.imageRegex + " " + newValue + (!newState.withCam ? " WithCam=0" : "");
        this.buildapericloudcommand(newState);
        newState.saisiemasqplyCommand = 'mm3d ' + (this.props.useSaisieMasqQT ? "SaisieMasqQT " : "SaisieMasq ") + " AperiCloud_" + newValue + ".ply";
    }

    this.buildCampriCommand(newState);

    if(changedItem==="thecampricommand") {
        newState.thecampricommand = newValue.replace(/\n/g,'');
        this.commandOverrideCampari = true;
    } else {
        this.commandOverrideCampari = false;
    }
    this.setState(newState);
}

export function updatecommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    if(changedItem==="orientationin") {
        newState.orientationin = newValue;
        newState.saisiebascCommand = 'mm3d SaisieBascQT ' + this.props.imageRegex + " " + newValue + " Measurements.xml";
    }
    if(changedItem==="orientationout") {
        newState.orientationout = newValue;
        newState.apericloudCommand = 'mm3d AperiCloud ' + this.props.imageRegex + " " + newState.campariout + (!newState.withCam ? " WithCam=0" : "");
    }
    if(changedItem==="exptxt") {
        newState.exptxt = !newState.exptxt;
    }
    if(changedItem==="postplan") {
        newState.postplan = !newState.postplan;
    }
    if(changedItem==="usedistFS") {
        newState.usedistFS = !newState.usedistFS;
    }
    if(changedItem==="distfs") {
        newState.distfs = newValue;
    }
    if(changedItem==="rep") {
        newState.rep = newValue;
        const validregex = /^-?[ijk]-?[ijk]$/
        if(validregex.test(newValue)) {
            newState.validrep = true;
        } else {
            newState.validrep = false;
        }
    }

    if(changedItem === "withCam") {
        newState.withCam = !newState.withCam;
        // newState.apericloudCommand = 'mm3d AperiCloud ' + this.props.imageRegex + " " + newState.campariout + (!newState.withCam ? " WithCam=0" : "");
        this.buildapericloudcommand(newState);
    }

    if(changedItem==="saisiemasqimgCommand") {
        newState.saisiemasqimgCommand = newValue;
        this.saisiemasqimgOverride = true;
    }

    if(changedItem === "saisiemasqplyCommand") {
        newState.saisiemasqplyCommand = newValue;
        this.saisiemasqplyOverride = true;
    }
    
    if(changedItem === "saisiebascCommand") {
        newState.saisiebascCommand = newValue.replace(/\n/g,'');
        this.saisiebascOverride = true;
    }

    this.buildcommand(newState);
    this.buildCampriCommand(newState)
    this.buildapericloudcommand(newState)

    if(changedItem==="thecommand") {
        newState.command = newValue.replace(/\n/g,'');
        this.commandOverride = true;
    } else {
        this.commandOverride = false;
    }

    this.setState(newState);
}