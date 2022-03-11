import { displayProgress, displayErrors, endProgress } from '../../utility/batch';
import { prepSaisieMasq } from '../../utility/mmutil';
const spawn = window.require('child_process').spawn;
const path = window.require('path');
const fs = window.require('fs');
const electron = window.require('electron');
var ipcRenderer = electron.ipcRenderer;

export function buildcommand(newState) {
    var buildcommand = 'mm3d C3DC ' + newState.mode + ' ';

    buildcommand += '"' + this.fileregex + '" ' + newState.orientation;

    if(newState.exptxt) {
        buildcommand += " ExpTxt=1";
    }

    if(!newState.binarymode) {
        buildcommand += " Bin=0";
    }

    if(newState.usemask && newState.orientation !== "") {
        buildcommand += " Masq3D=AperiCloud_" + newState.orientation + "_selectionInfo.xml";
    }

    if(newState.usegpu) {
        buildcommand += " UseGpu=1";
    }

    newState.command = buildcommand;

    if(!this.commandOverridePims) {
        newState.pims2mntCommand = 'mm3d PIMs2Mnt ' + newState.mode + ' DoOrtho=1';
        if(newState.localRepair)
            newState.pims2mntCommand += ' Repere=LocalRepair.xml Pat="' + this.fileregex + '"';
    }
}

export function exportMeshlab() {
    var thestart = new Date().getTime();

    var commandarray;

    if(!this.apero2meshlabOverride) {

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
            window.alert("Select all images first");
            return;
        }

        var command = 'mm3d Apero2Meshlab "' + this.props.imageRegex + '" ' + this.state.orientation + ' UnDist=0';

        commandarray = command.split(" ");
    } else {
        commandarray = this.state.apero2meshlabCommand.split(" ");
    }


    this.clearBatchState();
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
        let status = displayProgress("Apero2Meshlab", this.batchState, data, bat, thestart) ;
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
        let status = displayErrors("Apero2Meshlab", this.batchState, data, bat) ;
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
        let status = endProgress("Apero2Meshlab", this.batchState, code, bat, thestart, this.props, command);
        this.batchState = {...this.batchState, procstatus: status.procstatus, stdout: status.stdout };

        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        this.props.setStatus(this.feedbackState);
        this.setState({
            ...this.state,
            meshlabfile: path.join(this.props.tempDir, 'meshlabRast-' + this.state.orientation, 'meshlabProj.mlp'),
            meshlabplyfile: path.join(this.props.tempDir, 'C3DC_' + this.state.mode + '.ply')
        })

    });
}

export function openSaisi() {
    var thestart = new Date().getTime();
    
    let checkarray= prepSaisieMasq("C3DC", this.state, this.props, true);
    if(checkarray.length === 0) {
        return;
    }

    var commandarraytext = this.state.saisiemasqimgCommand.split(" ");
    commandarraytext.shift();//remove mm3d

    this.batchState.stdout = "";
    this.batchState.stderr = "";
    this.batchState.procstatus = "";
    this.batchState.updateRunListFile = false;

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

export function pims2mnt() {
    var thestart = new Date().getTime();

    //
    //**** **** ** TODO check bascule and c3dc have run
    //

    this.clearBatchState();
    this.props.setStatus(this.batchState);

    var commandarray = this.state.pims2mntCommand.split(" ");
    
    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.props.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("PIMs2Mnt", this.batchState, data, bat, thestart) ;
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime};
        if(status.updateDisplay){
            this.props.setStatus(this.batchState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("PIMs2Mnt", this.batchState, data, bat) ;
        this.batchState = {...this.batchState, stderr: status.stderr};
        this.props.setStatus(this.batchState);
    });

    bat.on('exit', (code) => {
        let status = endProgress("PIMs2Mnt", this.batchState, code, bat, thestart, this.props, this.state.pims2mntCommand);
        this.batchState = {...this.batchState, procstatus: status.procstatus, stdout: status.stdout, updateRunListFile: true };
        this.props.setStatus(this.batchState);
    });
}

export function runCommand() {
    var thestart = new Date().getTime();

    if(!this.commandOverride) {
        let numselected = 0;
        if(this.state.imageList) {
            numselected = this.state.imageList.reduce((acc,val, currentIndex) => {
                if(val.selected) {
                    // console.log("reducing", currentIndex)
                    return acc + 1;
                }
                return acc;
            }, 0);
        }

        if(numselected <3) {
            window.alert("Select all images first");
            return;
        }
        
        var oriPath = path.join(this.props.tempDir, 'Ori-'+this.state.orientation);
        if(!fs.existsSync(oriPath)) {
            window.alert("Run Tapas first");
            return;
        }
    }

    //check history for last c3dc
    //if not same orientation as current then erase PIMs-mode folder to avoid error:
    //"Multiple orientation use in PIMS"
    let previousC3DC = this.state.mm3dRunList.find(val => {
        return val.name === "C3DC";
    });
    if(previousC3DC && previousC3DC.orientation !== this.state.orientation) {
        const pimsFolder = path.join(this.props.tempDir, "PIMs-" + this.state.mode);
        // console.log(pimsFolder)
        if(fs.existsSync(pimsFolder)) {
            const rimraf = window.require('rimraf');

            rimraf(pimsFolder, (err) => {
                if (err) throw err;
            });

        }
    }
    
    var commandarray = this.state.command.split(" ");

    this.setState({
        ...this.state, 
        batchIsRunning: true,
    })

    this.clearBatchState();
    this.props.setStatus(this.batchState);

    this.batchState.orientation = this.state.orientation;
    this.batchState.mode = this.state.mode;

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

    this.props.saveBatch(bat);

    bat.stdout.on('data', (data) => {
        let status = displayProgress("C3DC", this.batchState, data, bat, thestart) ;
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
        let status = displayErrors("C3DC", this.batchState, data, bat) ;
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
        let status = endProgress("C3DC", this.batchState, code, bat, thestart, this.props, this.state.command);
        this.batchState = {...this.batchState, procstatus: status.procstatus};
        this.setState({
            ...this.state,
            plyReady: status.plyReady,
            plyFile: status.plyFile,
            enablePLY: status.c3dcran ? true : false
        })
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        if(status.c3dcran) {
            this.feedbackState.c3dcran = true;
        }
        this.props.setStatus(this.feedbackState);
        //clear forest and statue temp files
        let ar_regex = /^AR1-.*Masq1_Glob\.tif|^AR2-.*Masq1_Glob\.tif/
        let directoryItems = fs.readdirSync(this.state.tempDir);
        directoryItems.forEach((elem) => {
            if(ar_regex.test(elem)) {
                let currentFile = path.join(this.state.tempDir, elem);
                fs.unlinkSync(currentFile);
            }
        });
    });

}

export function runRepair() {
    //need save to history - image used as mask to use in PIMs2Mnt
    // mm3d Pims2MNT MicMac DoOrtho=1 Repere=Repere-Facade1.xml Pat="facade1.*JPG"
    //also add checkbox in c3dc for gcp repair - no just pass props cause no way know pat=?

    var thestart = new Date().getTime();

    if(!this.replocCommandOverride) {
        if(!this.state.imageRegex || this.state.imageRegex === "regex goes here" || this.state.imageRegex === "empty selection") {
            window.alert("Select image files first.");
            return;
        }

        if(this.state.imageList.length === 0) {
            window.alert("Select images first.");
            return;
        }
    }

    //
    //***** ***** ** TODO need more than 1 image check here
    //

    let commandarray = this.state.thereplocbasculecommand.split(" ");

    this.setState({
      ...this.state, 
      batchIsRunning: true
    });
    this.clearBatchState();

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
        let detailed = true;
        let status = displayProgress("RepLocBascule", this.batchState, data, bat, thestart, detailed)
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
        let status = displayErrors("RepLocBascule", this.batchState, data, bat)
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
        let status = endProgress("RepLocBascule", this.batchState, code, bat, thestart, this.props, this.state.thereplocbasculecommand)
        this.batchState = {...this.batchState, procstatus: status.procstatus}
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        this.props.setStatus(this.feedbackState);
        this.setState({
            ...this.state, 
            localRepair: true
          });
        
    });
}

export function runTawny() {

    var thestart = new Date().getTime();

    if(!this.commandOverrideTawny) {
        var pimsorthoPath = path.join(this.props.tempDir, 'PIMs-ORTHO');
        if(!fs.existsSync(pimsorthoPath)) {
            window.alert("Run PIMs2Mnt first");
            return;
        }
    }

    this.clearBatchState();
    this.props.setStatus(this.batchState);

    var commandarray = this.state.tawnycommand.split(" ");
    
    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });
    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    this.props.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("Tawny", this.batchState, data, bat, thestart) ;
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime};
        if(status.updateDisplay){
            this.props.setStatus(this.batchState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("Tawny", this.batchState, data, bat) ;
        this.batchState = {...this.batchState, stderr: status.stderr};
        this.props.setStatus(this.batchState);
    });

    bat.on('exit', (code) => {
        let status = endProgress("Tawny", this.batchState, code, bat, thestart, this.props, this.state.tawnycommand);
        this.batchState = {...this.batchState, procstatus: status.procstatus, stdout: status.stdout, updateRunListFile: true };
        this.props.setStatus(this.batchState);
    });
}

export function saveDepthmap() {
    let sourceFile = path.join(this.props.tempDir,"PIMs-TmpBasc","PIMs-Merged_Prof.tif");
    if(!fs.existsSync(sourceFile)) {
        window.alert("Run PIMs2Mnt first");
        return;
    }
    // var filename = dialog.showSaveDialogSync({
    //     filters: [
    //         {name: 'Tiff(tif)', extensions: ['tif', 'TIF']}
    //     ]
    //   });
      let filename = ipcRenderer.sendSync('savetif-dialog', null);
  
      if(!filename) {
        return;
      }
    
    fs.copyFile(sourceFile, filename, (err) => {
        if(err) throw(err);
    });
}

export function saveOrtho() {
    let sourceFile = path.join(this.props.tempDir,"PIMs-ORTHO","Orthophotomosaic.tif");
    if(!fs.existsSync(sourceFile)) {
        window.alert("Run Tawny first");
        return;
    }
    // var filename = dialog.showSaveDialogSync({
    //     filters: [
    //         {name: 'Tif(tif)', extensions: ['tif', 'TIF']}
    //     ]
    //   });
      let filename = ipcRenderer.sendSync('savetif-dialog', null);
  
      if(!filename) {
        return;
      }
      
    fs.copyFile(sourceFile, filename, (err) => {
        if(err) throw(err);
    });
}

export function updatecommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state}

    if(changedItem==="mode") {
        newState.mode = newValue;
        this.commandOverridePims = false;
    }
    newState.plyFile = path.join(this.props.tempDir, 'C3DC_' + newState.mode + '.ply');

    if(changedItem==="orientation") {
        newState.orientation = newValue;
        newState.apero2meshlabCommand = 'mm3d Apero2Meshlab "' + this.props.imageRegex + '" ' + newValue + ' UnDist=0';
        this.apero2meshlabOverride = false;
    }

    if(changedItem==="binarymode") {
        newState.binarymode = !newState.binarymode;
    }

    if(changedItem==="exptxt") {
        newState.exptxt = !newState.exptxt;
        this.buildReplocCommand(newState);
    }

    if(changedItem==="usemask") {
        newState.usemask = !newState.usemask;
    }

    if(changedItem==="usegpu") {
        newState.usegpu = !newState.usegpu;
    }

    if(changedItem==="localRepair") {
        newState.localRepair = !newState.localRepair;
        this.commandOverridePims = false;
    }

    if(changedItem==="saisiemasqimgCommand") {
        newState.saisiemasqimgCommand = newValue;
    }

    this.buildcommand(newState);

    if(changedItem==="thecommand") {
        newState.command = newValue.replace(/\n/g,'');
        this.commandOverride = true;
    } else {
        this.commandOverride = false;
    }

    if(changedItem==="pims2mntCommand") {
        newState.pims2mntCommand = newValue;
        this.commandOverridePims = true;
    }
    
    if(changedItem==="tawnycommand") {
        newState.tawnycommand = newValue.replace(/\n/g,'');
        this.commandOverrideTawny = true;
    }
    
    if(changedItem==="apero2meshlabCommand") {
        newState.apero2meshlabCommand = newValue.replace(/\n/g,'');
        this.apero2meshlabOverride = true;
    }
    this.setState(newState);
}

export function updateReplocCommand(event) {
    const changedItem = event.target.id;
    let newValue = event.target.value;
    const newState = {...this.state};

    if(changedItem==="orthocyl") {
        newValue = !newState[changedItem];
    }
    newState[changedItem] = newValue;

    this.buildReplocCommand(newState);

    if(changedItem==="thereplocbasculecommand") {
        newState.thereplocbasculecommand = newValue.replace(/\n/g,'');
        this.replocCommandOverride = true;
    } else {
        this.replocCommandOverride = false;
    }
    console.log(newState.thereplocbasculecommand)
    this.setState(newState);
}