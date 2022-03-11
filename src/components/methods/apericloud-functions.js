import { displayProgress, displayErrors, endProgress } from '../../utility/batch';
import { prepSaisieMasq } from '../../utility/mmutil';

const fs = window.require('fs');
const path = window.require('path');
const spawn = window.require('child_process').spawn;

export function buildcommand(newState) {
    console.log("apericloud buildcommand")
    var buildcommand = 'mm3d AperiCloud ';

    buildcommand += '"' + this.fileregex + '" ' + newState.orientation;

    if(newState.exptxt) {
        buildcommand += " ExpTxt=1";
    }
    if(!newState.binarymode) {
        buildcommand += " Bin=0";
    }

    if(!newState.withcam) {
        buildcommand += " WithCam=0";
    }

    newState.command = buildcommand;
}

export function openSaisi() {
    var thestart = new Date().getTime();

    // let commandarraytext = prepSaisieMasq("AperiCloud", this.state, this.props)
    // if(commandarraytext.length === 0) {
    //     return;
    // }
    if(!this.saisiemasqplyOverride) {
        let checkarray= prepSaisieMasq("AperiCloud", this.state, this.props, true);
        if(checkarray.length === 0) {
            return;
        }
    }
    var commandarraytext = this.state.saisiemasqplyCommand.split(" ");
    commandarraytext.shift();//remove 'mm3d'

    this.props.disableApp();

    this.clearBatchState();
    this.batchState.updateRunListFile = false;
    this.props.setStatus(this.batchState);
    this.batchState.orientation = this.state.orientation;

    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("SaisieMasqQT-AperiCloud", this.batchState, data, bat, thestart)
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime};
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
        let status = displayErrors("SaisieMasqQT-AperiCloud", this.batchState, data, bat)
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            updateRunListFile: false
        }
        this.props.setStatus(this.feedbackState);
    });

    bat.on('exit', (code) => {
        let status = endProgress("SaisieMasqQT-AperiCloud", this.batchState, code, bat, thestart, this.props)
        this.batchState = {...this.batchState, procstatus: status.procstatus}
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
}

export function runCommand() {
    var thestart = new Date().getTime();

    if(!this.commandOverride) {
        if(this.state.imageList.length === 0) {
            window.alert("Load images first.");
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
        if(numselected <3) {
            window.alert("Select images first");
            return;
        }
    }

    var commandarray = this.state.command.split(" ");

    let oriPath = path.join(this.props.tempDir, 'Ori-'+this.state.orientation);
    if(!fs.existsSync(oriPath)) {
        window.alert("Run Tapas first");
        return;
    }

    this.setState({
        ...this.state, 
        batchIsRunning: true,
    })

    this.clearBatchState();
    this.batchState.updateRunListFile = false;
    
    this.props.setStatus(this.batchState);

    this.batchState.orientation = this.state.orientation;

    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.props.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("Apericloud", this.batchState, data, bat, thestart);
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime};
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
        let status = displayErrors("Apericloud", this.batchState, data, bat) ;
        this.batchState = {...this.batchState, stderr: status.stderr};
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            updateRunListFile: false
        }
        this.props.setStatus(this.feedbackState);
    });

    bat.on('exit', (code) => {
        let status = endProgress("Apericloud", this.batchState, code, bat, thestart, this.props, this.state.command);
        this.batchState = {...this.batchState, procstatus: status.procstatus};
        this.setState({
            ...this.state,
            plyReady: status.plyReady,
            plyFile: status.plyFile,
            enablePLY: status.apericloudran ? true : false
        })
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        if(status.apericloudran) {
            this.feedbackState.apericloudran = true;
        }
        this.props.setStatus(this.feedbackState);
    });

}

//
    //***** ***** ** TODO disable sasimask button until ply file exists
    //
    export function updatecommand(event) {
        const changedItem = event.target.id;
        const newValue = event.target.value;
        const newState = {...this.state}

        if(changedItem==="orientationin") {
            newState.orientation = newValue;
            newState.saisiemasqplyCommand = 'mm3d ' + (this.props.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + newValue + ".ply";
            this.saisiemasqplyOverride = false;
        }

        if(changedItem==="exptxt") {
            newState.exptxt = !newState.exptxt;
        }
        if(changedItem==="binarymode") {
            newState.binarymode = !newState.binarymode;
        }

        if(changedItem==="withcam") {
            newState.withcam = !newState.withcam;
        }

        if(changedItem === "saisiemasqplyCommand") {
            newState.saisiemasqplyCommand = newValue;
            this.saisiemasqplyOverride = true;
        }

        this.buildcommand(newState);

        if(changedItem==="command") {
            newState.command = newValue.replace(/\n/g,'');
            this.commandOverride = true;
        } else {
            this.commandOverride = false;
        }

        this.setState(newState);
    }