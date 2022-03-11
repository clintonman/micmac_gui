import { displayProgress, displayErrors, endProgress } from '../../utility/batch';
import { prepSaisieMasq } from '../../utility/mmutil';

const fs = window.require('fs');
const path = window.require('path');
const spawn = window.require('child_process').spawn;

export function buildapericloudcommand(newState) {
    newState.apericloudCommand = 'mm3d AperiCloud "' + this.fileregex + '"';
    // newState.apericloudCommand += " " + newState.out_orientation_final;
    // newState.apericloudCommand += " " + newState.lastOrientation;
    newState.apericloudCommand += " " + newState.in_orientation_apericloud;
    newState.apericloudCommand += (newState.exptxt ? " ExpTxt=1" : "");
    newState.apericloudCommand += (!newState.withCam ? " WithCam=0" : "");
}

export function buildsaisiemasqcommand(newState) {
    // this.state.saisiemasqplyCommand = 'mm3d ' + (props.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + this.state.out_orientation_final + ".ply";

    newState.saisiemasqplyCommand = 'mm3d ' + (newState.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq");
    newState.saisiemasqplyCommand += " AperiCloud_" + newState.in_orientation_apericloud + ".ply";
}

export function buildcamparicommand(newState) {
    let buildcommand = 'mm3d Campari "' + this.fileregex + '"';
    buildcommand += " " + newState.in_orientation_campari;
    buildcommand += " " + newState.out_orientation_campari;

    if(newState.cpi === 1) {
        buildcommand += " CPI1=1"
    }
    if(newState.cpi === 2) {
        buildcommand += " CPI2=1"
    }
    if(newState.exptxt) {
        buildcommand += " ExpTxt=1";
    }
    if(newState.posefigee) {
        buildcommand += " PoseFigee=1"
    }
    if(newState.focfree) {
        buildcommand += " FocFree=1"
    }
    if(newState.ppfree) {
        buildcommand += " PPFree=1"
    }

    newState.camparicommand = buildcommand;
}

export function buildcommand(newState) {
    // console.log("tapas buildcommand")
    var buildcommand = 'mm3d Tapas ' + newState.mode + " ";
    if(newState.useOldTapas) {
        buildcommand = 'mm3d OldTapas ' + newState.mode + " ";
    }

    buildcommand += '"' + this.fileregex + '"';

    if(newState.exptxt) {
        buildcommand += " ExpTxt=1";
    }
    this.buildcamparicommand(newState);

    if(newState.calibration === "calibration_local") {
        buildcommand += " Out=" + newState.out_calibration_local;
        this.runOrientationOutput = newState.out_calibration_local;
    }

    if(newState.calibration === "calibration_detail") {
        buildcommand += " Out=" + newState.out_calibration_detail;
        this.runOrientationOutput = newState.out_calibration_detail;
    }

    if(newState.calibration === "orientation_local") {
        buildcommand += " InCal=" + newState.in_orientation_local + " Out=" + newState.out_orientation_local;
        this.runOrientationOutput = newState.out_orientation_local;
        //restrict focal length to wide angle lens
        let minval = 99999;
        this.lensSet.forEach(val => {
            if(val < minval) {
                minval = +val;
            }
        });
        buildcommand += " Focs=[" + (minval-1) + "," + (minval+1) + "]";
    }

    if(newState.calibration === "orientation_final") {
        if(newState.in_orientation_final !== "") {
            if(newState.twoLens || newState.frozenposes) {
                buildcommand += " InOri=" + newState.in_orientation_final + " Out=" + newState.out_orientation_final;
            } else {
                buildcommand += " InCal=" + newState.in_orientation_final + " Out=" + newState.out_orientation_final;
            }
        } else {
            buildcommand += " Out=" + newState.out_orientation_final;
        }
        this.runOrientationOutput = newState.out_orientation_final;
    }

    if(newState.calibration === "orientation_manual") {
        if(newState.in_calibration_manual !== "") {
            buildcommand += " InCal=" + newState.in_calibration_manual;
        }
        if(newState.in_orientation_manual !== "") {
            buildcommand += " InOri=" + newState.in_orientation_manual;
        }
        buildcommand += " Out=" + newState.out_orientation_manual;
        this.runOrientationOutput = newState.out_orientation_manual;
    }

    if(newState.SH !== "") {
        buildcommand += " SH=" + newState.SH;
    }

    

    if(newState.fl_min > 0 && newState.fl_max > 0 && newState.fl_max >= newState.fl_min) {
        buildcommand += " Focs=[" + newState.fl_min + "," + newState.fl_max + "]";
    }

    if(newState.frozenposes) {
        buildcommand += ' FrozenPoses="' + newState.frozenposes + '"';
    }

    if(newState.frozencalibs) {
        buildcommand += ' FrozenCalibs="' + newState.frozencalibs + '"';
    }

    newState.command = buildcommand;
}

//
    // ***** ***** *** TODO make popup/over til remove folder is done, also residual err will not update on images
    //
    export function clearRun(e) {
        let dir;
        if(e.target.id === "clear_calilocal") {
            dir = path.join(this.state.tempDir,"Ori-Calib");
            this.setState({callocalran: false});
        }
        if(e.target.id === "clear_calidetail") {
            dir = path.join(this.state.tempDir,"Ori-CalDetail");
            this.setState({caldetailran:false});
        }
        if(e.target.id === "clear_orilocal") {
            this.setState({orilocalran: false});
            dir = path.join(this.state.tempDir,"Ori-OriLocal");
        }
        if(e.target.id === "clear_orifinal") {
            this.setState({orifinalran: false});
            dir = path.join(this.state.tempDir,"Ori-All");
        }
        if(dir && fs.existsSync(dir)) {
            fs.rmdirSync(dir, { recursive: true });
            this.setState({[e.target.id + "_disabled"]:true});
        }
        if(e.target.id === "clear_ori") {
            this.setState({
                callocalran: false, 
                caldetailran:false, 
                orilocalran: false, 
                orifinalran: false,
                clear_calilocal_disabled: true,
                clear_calidetail_disabled: true,
                clear_orilocal_disabled: true,
                clear_orifinal_disabled: true
            });

            this.props.setStatus({tapasran: false})

            fs.readdir(this.state.tempDir, { withFileTypes: true }, (err, files) => {
                const directoriesInDIrectory = files
                    .filter((item) => item.isDirectory() && item.name.match(/Ori-/))
                    .map((item) => item.name);

                directoriesInDIrectory.forEach(dirr => {
                    let delpath = path.join(this.state.tempDir, dirr)
                    fs.rmdirSync(delpath, { recursive: true });
                })
            });
        }
    }

    export function openSaisi() {
        var thestart = new Date().getTime();

        this.clearBatchState();
        // this.batchState.orientation = this.state.out_orientation_final;
        this.batchState.orientation = this.state.in_orientation_apericloud;

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
        // const bat = spawnSync(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir, encoding:'utf8' });
        // console.log(bat.stdout);
        // return;
    
        bat.stdout.on('data', (data) => {
            let status = displayProgress("SaisieMasqQT-Tapas", this.batchState, data, bat, thestart)
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
            let status = displayErrors("SaisieMasqQT-Tapas", this.batchState, data, bat)
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
            let status = endProgress("SaisieMasqQT-Tapas", this.batchState, code, bat, thestart, this.props)
            this.batchState = {...this.batchState, procstatus: status.procstatus}
            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline,
                updateRunListFile: false
            }
            this.props.setStatus(this.feedbackState)
        });
    }

    export function runApericloud() {
        var thestart = new Date().getTime();

        if(!this.fileregex || this.fileregex === "regex goes here") {
            window.alert("Select image files first.");
            return;
        }
        
        // let oriPath = path.join(this.props.tempDir, 'Ori-'+this.state.out_orientation_final);
        let oriPath = path.join(this.props.tempDir, 'Ori-'+this.state.in_orientation_apericloud);
        if(!fs.existsSync(oriPath)) {
            window.alert("Run orientation first");
            return;
        }
        // let commandarray;
        // if(!this.state.withCam)
        //     commandarray = ["mm3d", "AperiCloud", this.props.imageRegex, this.state.out_orientation_final, "WithCam=0"];
        // else
        //     commandarray = ["mm3d", "AperiCloud", this.props.imageRegex, this.state.out_orientation_final];

        let commandarray = this.state.apericloudCommand.split(" ");
        //remove " from file regular expression
        let commandarraytext = commandarray.map(function(item){
            return item.replace(/"/g,'');
        });
        //remove mm3d from the command array
        commandarraytext.splice(0,1);
        console.log(this.props.mm3dPath, commandarraytext)

        this.setState({
            ...this.state, 
            batchIsRunning: true,
        })

        this.clearBatchState();
        // this.batchState.out_orientation_final = this.state.out_orientation_final;
        this.batchState.out_orientation_final = this.state.in_orientation_apericloud;

        this.props.setStatus(this.batchState);

        this.props.disableApp();
        const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

        bat.stdout.on('data', (data) => {
            let status = displayProgress("Apericloud-Tapas", this.batchState, data, bat, thestart);
            this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, procstatus: status.procstatus, elapsedTime: status.elapsedTime};
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
            let status = displayErrors("Apericloud-Tapas", this.batchState, data, bat) ;
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
            this.setState({
                ...this.state,
                plyReady: true,
                // plyFile: path.join(this.props.tempDir, 'AperiCloud_' + this.state.out_orientation_final +'.ply')
                plyFile: path.join(this.props.tempDir, 'AperiCloud_' + this.state.in_orientation_apericloud +'.ply')
            })

            let status = endProgress("Apericloud-Tapas", this.state, code, bat, thestart, this.props, commandarray.join(" "));
            this.batchState = {...this.batchState, procstatus: status.procstatus,
                plyReady: status.plyReady,
                plyFile: status.plyFile
            }
            
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

    export function runCommand() {
        var thestart = new Date().getTime();

        var commandarray = this.state.command.split(" ");

        if(!this.commandOverride) {
            var homolPath = path.join(this.props.tempDir, 'Homol');
            if(!fs.existsSync(homolPath)) {
                window.alert("Run Tapioca first");
                return;
            }
    
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
                window.alert("Select at least 3 images first");
                return;
            }

            // warn if less than 75% images selected for final
            if(this.state.calibration==="orientation_final" && numselected / this.state.imageList.length < 0.75) {
                if(!window.confirm("Less than 75% selected, continue?")) {
                    return;
                }
            }
        }

        this.setState({
            ...this.state, 
            batchIsRunning: true,
        })

        this.clearBatchState()
        this.batchState.orientation = this.runOrientationOutput;
        this.batchState.calibration = this.state.calibration;
        this.batchState.twoLens = this.state.twoLens;
        this.batchState.out_calibration_local = this.state.out_calibration_local;
        this.batchState.out_calibration_detail = this.state.out_calibration_detail;
        this.batchState.out_orientation_local = this.state.out_orientation_local;

        this.props.setStatus(this.batchState);

        //remove " from file regular expression
        var commandarraytext = commandarray.map(function(item){
            return item.replace(/"/g,'');
        });
        //remove mm3d from the command array
        commandarraytext.splice(0,1);
        console.log(this.props.mm3dPath, commandarraytext)

        this.props.disableApp();

        // detached: true no good for windows because cannot kill a process by pid in windows
        // const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir, detached: true });
        const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

        this.props.saveBatch(bat);

        let residuals = -1;

        bat.stdout.on('data', (data) => {
            let status = displayProgress("Tapas", this.batchState, data, bat, thestart);
            residuals = status.residuals;
            this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout,
                elapsedTime: status.elapsedTime,
                stdoutline: status.stdoutline,
                residuals: status.residuals
            }

            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline,
                updateRunListFile: false
            }
            if(status.updateDisplay){
                this.props.setStatus(this.feedbackState)
            }
        });

        bat.stderr.on('data', (data) => {
            let status = displayErrors("Tapas", this.batchState, data, bat) ;
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
            let status = endProgress("Tapas", this.batchState, code, bat, thestart, this.props, this.state.command, residuals);
            this.feedbackState = {...this.feedbackState, procstatus: status.procstatus, updateRunListFile: true}
            let newState = {...this.state};

            if(status.callocalran) {
                newState.callocalran = true;
                newState.clear_calilocal_disabled = false;
            }
            
            if(status.caldetailran) {
                newState.caldetailran = true;
                newState.clear_calidetail_disabled = false;
            }
            
            if(status.orilocalran) {
                newState.orilocalran = true;
                newState.clear_orilocal_disabled = false;
            }
            if(status.orifinalran) {
                newState.orifinalran = true;
                this.feedbackState.tapasran=true;
                newState.clear_orifinal_disabled = false;
            }
            if(status.in_orientation_final) newState.in_orientation_final = status.in_orientation_final;
            // newState.saisiemasqplyCommand = 'mm3d ' + (newState.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + newState.out_orientation_final + ".ply";
            // newState.saisiemasqplyCommand = 'mm3d ' + (newState.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + this.batchState.orientation + ".ply";
            this.buildsaisiemasqcommand(newState);
            
            newState.lastOrientation = this.batchState.orientation;
            newState.in_orientation_campari = this.batchState.orientation;
            newState.in_orientation_apericloud = this.batchState.orientation;
            this.buildapericloudcommand(newState);
            this.buildcamparicommand(newState);

            this.setState(newState)
            this.props.setStatus(this.feedbackState)
        });
    }
    export function runCampariCommand() {
        let thestart = new Date().getTime();

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

        let commandarray = this.state.camparicommand.split(" ");

        this.setState({
            ...this.state, 
            batchIsRunning: true
        })
        this.clearBatchState();
        this.batchState.campariout = this.state.out_orientation_campari;
    
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

        let residuals = -1;
    
        const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });
    
        bat.stdout.on('data', (data) => {
            const detailed = true
            let status = displayProgress("Campari", this.batchState, data, bat, thestart, detailed)
            residuals = status.residuals;
            this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime,
                stdoutline: status.stdoutline,
                residuals: status.residuals
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
            let status = endProgress("Campari", this.batchState, code, bat, thestart, this.props, this.state.camparicommand, residuals)
            this.batchState = {...this.batchState, procstatus: status.procstatus}
            this.feedbackState = {
                stdout: this.batchState.stdout,
                stderr: this.batchState.stderr,
                elapsedTime: this.batchState.elapsedTime,
                stdoutline: this.batchState.stdoutline,
                procstatus: this.batchState.procstatus,
                updateRunListFile: true
            }
            let newState = {...this.state};
            // newState.saisiemasqplyCommand = 'mm3d ' + (newState.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + newState.out_orientation_campari + ".ply";
            this.buildsaisiemasqcommand(newState);
            // newState.apericloudCommand = 'mm3d AperiCloud ' + newState.imageRegex + " " + newState.out_orientation_campari + (!newState.withCam ? " WithCam=0" : "");

            newState.lastOrientation = newState.out_orientation_campari;
            
            newState.in_orientation_campari = newState.out_orientation_campari;
            newState.in_orientation_apericloud = newState.out_orientation_campari;
            this.buildapericloudcommand(newState);
            this.buildcamparicommand(newState);

            this.setState(newState)

            this.props.setStatus(this.feedbackState)
        });
    }

    export function setFrozenPoses() {
        const newState = {...this.state};
        newState.frozenposes = this.state.imageRegex;
        this.setState(newState)
    }

    export function setFrozenCalibs() {
        const newState = {...this.state};
        newState.frozencalibs = this.state.imageRegex;
        this.setState(newState)
    }

export function updatecamparicommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};
    
    if(changedItem === "in_orientation_campari") {
        newState.in_orientation_campari = newValue;
    }
    if(changedItem === "out_orientation_campari") {
        newState.out_orientation_campari = newValue;
    }
    if(changedItem === "cpi0") {
        newState.cpi = 0;
    }
    if(changedItem === "cpi1") {
        newState.cpi = 1;
    }
    if(changedItem === "cpi2") {
        newState.cpi = 2;
    }
    if(changedItem === "posefigee") {
        newState.posefigee = !newState.posefigee;
    }
    if(changedItem === "focfree") {
        newState.focfree = !newState.focfree;
    }
    if(changedItem === "ppfree") {
        newState.ppfree = !newState.ppfree;
    }

    this.buildcamparicommand(newState);

    if(changedItem === "camparicommand") {
        newState.camparicommand = newValue.replace(/\n/g,'');
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

    if(changedItem === "SH") {
        newState.SH = newValue;
    }
    if(changedItem === "in_calibration_manual") {
        newState.in_calibration_manual = newValue;
    }
    if(changedItem === "in_orientation_manual") {
        newState.in_orientation_manual = newValue;
    }

    if(changedItem === "useOldTapas") {
        newState.useOldTapas = !newState.useOldTapas;
    }
    if(changedItem === "mode") {
        newState.mode = newValue;
    }

    if(changedItem === "calibration_local") {
        newState.calibration = newValue;
    }
    if(changedItem === "calibration_detail") {
        newState.calibration = newValue;
    }
    if(changedItem === "orientation_local") {
        newState.calibration = newValue;
    }
    if(changedItem === "orientation_final") {
        newState.calibration = newValue;
    }
    if(changedItem === "orientation_manual") {
        newState.calibration = newValue;
    }

    if(changedItem === "out_calibration_local") {
        newState.out_calibration_local = newValue;
    }
    if(changedItem === "out_calibration_detail") {
        newState.out_calibration_detail = newValue;
    }

    if(changedItem === "in_orientation_local") {
        newState.in_orientation_local = newValue;
    }
    if(changedItem === "out_orientation_local") {
        newState.out_orientation_local = newValue;
    }
    if(changedItem === "in_orientation_final") {
        newState.in_orientation_final = newValue;
    }
    if(changedItem === "out_orientation_final") {
        newState.out_orientation_final = newValue;
        newState.saisiemasqplyCommand = 'mm3d ' + (this.props.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + newValue + ".ply";
        newState.apericloudCommand = 'mm3d AperiCloud ' + this.props.imageRegex + " " + newValue + (!newState.withCam ? " WithCam=0" : "");
    }
    if(changedItem === "out_orientation_manual") {
        newState.out_orientation_manual = newValue;
        newState.saisiemasqplyCommand = 'mm3d ' + (this.props.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + newValue + ".ply";
        newState.apericloudCommand = 'mm3d AperiCloud ' + this.props.imageRegex + " " + newValue + (!newState.withCam ? " WithCam=0" : "");
    }

    if(changedItem === "twoLens") {
        newState.twoLens = !newState.twoLens;
        if(newState.twoLens) {
            newState.out_calibration_local = "CalLocal";
        } else {
            newState.out_calibration_local = "Calib";
        }
    }

    if(changedItem === "withCalib") {
        newState.withCalib = !newState.withCalib;
        if(newState.withCalib) {
            newState.in_orientation_local = "CalLocal";
            newState.calibration = "calibration_local";
        } else {
            newState.in_orientation_local = "";
            newState.calibration = "orientation_local";
        }
    }

    if(changedItem==="frozenposes") {
        newState.frozenposes = newValue;
    }

    if(changedItem==="frozencalibs") {
        newState.frozencalibs = newValue;
    }

    if(changedItem==="fl_min") {
        newState.fl_min = newValue;
    }
    if(changedItem==="fl_max") {
        newState.fl_max = newValue;
    }

    if(changedItem==="exptxt") {
        newState.exptxt = !newState.exptxt;
        this.buildapericloudcommand(newState);
    }

    this.buildcommand(newState);

    if(changedItem === "thecommand") {
        newState.command = newValue.replace(/\n/g,'');
        this.commandOverride = true;
    } else {
        this.commandOverride = false;
    }

    this.setState(newState);
}

export function updateValue(event) {
    const changedItem = event.target.id;
    const newState = {...this.state}
    
    if(changedItem === "saisiemasqplyCommand") {
        newState.saisiemasqplyCommand = event.target.value;
        this.saisiemasqplyOverride = true;
    }

    if(changedItem === "in_orientation_apericloud") {
        newState.in_orientation_apericloud = event.target.value;
        this.buildapericloudcommand(newState);
        this.buildsaisiemasqcommand(newState);
    }
    if(changedItem === "apericloudCommand") {
        newState.apericloudCommand = event.target.value;
    }

    if(changedItem === "withCam") {
        newState.withCam = !newState.withCam;
        //newState.apericloudCommand = 'mm3d AperiCloud ' + this.props.imageRegex + " " + newState.out_orientation_final + (!newState.withCam ? " WithCam=0" : "");
        this.buildapericloudcommand(newState);
    }

    this.setState(newState);
}