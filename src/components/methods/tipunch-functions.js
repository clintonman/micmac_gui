import { displayProgress, displayErrors, endProgress } from '../../utility/batch';

const fs = window.require('fs');
const path = window.require('path');
const spawn = window.require('child_process').spawn;
const electron = window.require('electron');

let ipcRenderer = electron.ipcRenderer;

export function buildcommand(newState) {
    console.log("tipunch buildcommand")
    var buildcommand = 'mm3d TiPunch ';

    buildcommand += newState.plyFile;

    buildcommand += ' Pattern="' + this.fileregex + '"';

    if(!newState.binarymode) {
        buildcommand += " Bin=0";
    }

    if(+newState.depth !== 8) {
        buildcommand += " Depth=" + newState.depth;
    }

    //tipunch not defaulting properly so make explicit
    if(newState.filterval) {
        buildcommand += " Filter=1";
    } else {
        buildcommand += " Filter=0";
    }
    
    buildcommand += ' Mode=' + newState.mode;

    if(+newState.scale !== 2) {
        buildcommand += " Scale=" + newState.scale;
    }

    if(newState.ffb) {
        buildcommand += " FFB=1";
    } else {
        buildcommand += " FFB=0";
    }

    newState.command = buildcommand;
}

export function plyFileDialog() {
    // var res = dialog.showOpenDialog({
    //   properties: ['openFile'],
    //   defaultPath: this.props.tempDir,
    //   filters: [
    //     {name: 'Point Cloud', extensions: ['ply', 'PLY']},
    //     {name: 'All Files', extensions: ['*']}
    // ]
    // });
    let res = ipcRenderer.sendSync('openply-dialog', this.props.tempDir);

    if(!res) {
        return
    }
    const newState = {...this.state}
    newState.plyFile= path.basename(res[0]);
    newState.mode = newState.plyFile.split(".")[0].split("_")[1];
    this.buildcommand(newState);
    this.setState(newState)
  }

export function runCommand() {
    var thestart = new Date().getTime();

    var plyPath = path.join(this.props.tempDir, this.state.plyFile)
    
    if(!this.commandOverride) {
        if(!fs.existsSync(plyPath)) {
            window.alert("Run Apericloud or C3DC first");
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

        if(numselected === 0) {
            window.alert("Select 1 or more images first");
            return;
        }

        if(this.state.imageList.length > 12 && (numselected < 8 || numselected > 12)) {
            if(!window.confirm("Typically choose 8 to 12 images, proceed anyway?")) {
                return;
            }
        }
    }

    var commandarray = this.state.command.split(" ");

    //
    //**** ***** **TODO - if filter option needs image pattern - check this cause seems to run without it
    //

    this.setState({
        ...this.state, 
        batchIsRunning: true,
    })

    this.clearBatchState();
    this.props.setStatus(this.batchState);

    this.batchState.mode = this.state.mode;
    this.batchState.depth = this.state.depth;

    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.props.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("TiPunch", this.batchState, data, bat, thestart) ;
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
        let status = displayErrors("TiPunch", this.batchState, data, bat) ;
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
        let status = endProgress("TiPunch", this.batchState, code, bat, thestart, this.props, this.state.command);
        this.batchState = {...this.batchState, procstatus: status.procstatus};
        this.setState({
            ...this.state,
            plyReady: status.plyReady,
            plyDisplayFile: status.plyDisplayFile,
            enablePLY: status.tipunchran ? true : false
        })
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        if(status.tipunchran)
            this.feedbackState.tipunchran = true;
        this.props.setStatus(this.feedbackState);
    });

}

export function updatecommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state}

    if(changedItem === "plyFile") {
        newState.plyFile = newValue;
    }

    if(changedItem === "depth") {
        newState.depth = newValue;
    }

    if(changedItem === "scale") {
        newState.scale = newValue;
    }

    if(changedItem === "binarymode") {
        newState.binarymode = !newState.binarymode;
    }

    if(changedItem === "filterval") {
        newState.filterval = !newState.filterval;
    }

    if(changedItem === "mode") {
        newState.mode = newValue;
    }

    if(changedItem === "ffb") {
        newState.ffb = !newState.ffb;
    }

    this.buildcommand(newState);

    if(changedItem==="thecommand") {
        newState.command = newValue.replace(/\n/g,'');
        this.commandOverride = true;
    } else {
        this.commandOverride = false;
    }

    this.setState(newState);
}