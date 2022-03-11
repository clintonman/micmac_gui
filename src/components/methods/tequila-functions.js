import { displayProgress, displayErrors, endProgress } from '../../utility/batch';
import { computeImageRegEx } from './ImageSelectionCode';

const fs = window.require('fs');
const path = window.require('path');
const spawn = window.require('child_process').spawn;
const electron = window.require('electron');

let ipcRenderer = electron.ipcRenderer;

export function buildcommand(newState) {
    var buildcommand = 'mm3d Tequila ';

    buildcommand += '"' + this.fileregex + '"';

    buildcommand += ' Ori-' + newState.orientation + '/ ';

    buildcommand += newState.plyFile + ' ';

    if(newState.out !== path.basename(newState.plyFile, '.ply') + '_textured.ply') {
        buildcommand += 'Out=' + newState.out + ' ';
    }

    buildcommand += "Mode=" + newState.mode;

    if(!newState.binarymode) {
        buildcommand += " Bin=0";
    }

    if(newState.optim) {
        newState.lambdaDisabled = false;
        newState.iterDisabled = false;
        buildcommand += " Optim=1";
        console.log(Math.abs(newState.lambda - 0.01));
        if(Math.abs(newState.lambda - 0.01) > 0.0001) {
            buildcommand += " Lambda=" + newState.lambda;
        }

        if(+newState.iter !== 2) {
            buildcommand += " Iter=" + newState.iter;
        }
    } else {
        newState.lambdaDisabled = true;
         newState.iterDisabled = true;
    }

    if(newState.texture !== path.basename(newState.plyFile, '.ply') + '_UVtexture.jpg') {
        buildcommand += " Texture=" + newState.texture;
    }

    if(+newState.sz !== 4096) {
        buildcommand += " Sz=" + newState.sz;
    }
    if(+newState.scale !== 2) {
        buildcommand += " Scale=" + newState.scale;
    }
    if(+newState.qual !== 70) {
        buildcommand += " QUAL=" + newState.qual;
    }
    if(+newState.angle !== 90) {
        buildcommand += " Angle=" + newState.angle;
    }
    if(newState.crit !== "Angle") {
        buildcommand += " Crit=" + newState.crit;
    }

    newState.command = buildcommand;
}

export function GetTimeStamp() {
    var theDate = new Date();
	//var y = theDate.getYear();
	//var mo = theDate.getMonth() + 1;
	var d = theDate.getDate();
	var h = theDate.getHours();
	var mi = theDate.getMinutes();
	var s = theDate.getSeconds();

	//if(mo < 10) mo = "0" + mo;
	if(d < 10) d = "0" + d;
	if(h < 10) h = "0" + h;
	if(mi < 10) mi = "0" + mi;
	if(s < 10) s = "0" + s;

	// var timestamp = "_" + y + mo + d + h + mi + s;
	var timestamp = "_" + d + h + mi + s;

    return timestamp;
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
    
    this.buildcommand(newState);
    this.setState(newState)
  }

export function runCommand() {
    var thestart = new Date().getTime();

    this.setState({
        ...this.state, 
        batchIsRunning: true,
        showit: false
    });

    this.clearBatchState();
    this.batchState.updateRunListFile = false;

    this.props.setStatus(this.batchState);

    this.batchState.orientation = this.state.orientation
    this.batchState.plyFile = this.state.plyFile

    var plyPath = path.join(this.props.tempDir, this.state.plyFile)

    // var commandarray = this.state.command.split(" ");

    if(!this.commandOverride) {
        if(!fs.existsSync(plyPath)) {
            window.alert("Run TiPunch first");
            return;
        }

        if(this.state.imageList.length === 0) {
            window.alert("Load image files first.");
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

    //NOTE - DO SAME FOR THUMBNAILS?
    //rename image files to get around the "more than 2 ranges" bug
    let ext;
    const thumbs = path.join(this.props.tempDir,"thumbnails");
    this.state.imageList.forEach(img => {
        if(!img.selected) {
            let imgfile = path.join(this.props.tempDir, img.name);
            // console.log(imgfile)
            ext = path.extname(imgfile);
            let newfile = path.basename(imgfile, ext)
            let newpath = path.join(this.props.tempDir, newfile);
            // console.log(newpath)
            if(fs.existsSync(imgfile)) {
                fs.renameSync(imgfile, newpath);
            }
            //thumbnails
            imgfile = path.join(thumbs, img.name);
            newpath = path.join(thumbs, newfile);
            if(fs.existsSync(imgfile)) {
                fs.renameSync(imgfile, newpath);
            }
        }
    });

    this.batchState.plyFile = this.state.out;

    //remove " from file regular expression
    // var commandarraytext = commandarray.map(function(item){
    //     return item.replace(/"/g,'');
    // });
    //replace regex with simple all regex
    let commandarraytext = this.state.command.split(" ");
    // commandarraytext[2] = ".*" + ext;// TOO SIMPLE
    //get regex for all images
    let res = [];
    let selected = [];
    this.state.imageList.forEach((elem) => {
      res.push(elem.name);
      selected.push(true);
    });

    commandarraytext[2] = computeImageRegEx.call(this, res, selected);

    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    //tequila bug - need to remove jpg portion of texture name or get no texture file
    let textureIndex = commandarraytext.findIndex((val) =>  val.startsWith("Texture="));
    if(textureIndex !== -1) {
        commandarraytext[textureIndex] = 
            path.basename(commandarraytext[textureIndex], path.extname(commandarraytext[textureIndex])) + '.';
    }

    this.props.disableApp();

    //clear thumbnail images - interferes with run if all images not selected
    // const dir = path.join(this.props.tempDir,"thumbnails");
    // if(fs.existsSync(dir)) {
    //     fs.rmdirSync(dir, { recursive: true });
    // }

    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("Tequila", this.batchState, data, bat, thestart) ;
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
        let status = displayErrors("Tequila", this.batchState, data, bat) ;
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
        let status = endProgress("Tequila", this.batchState, code, bat, thestart, this.props, this.state.command);
        this.batchState = {...this.batchState, procstatus: status.procstatus};
        // this.setState({
        //     ...this.state,
        //     plyReady: status.plyReady,
        //     plyDisplayFile: status.plyDisplayFile,
        //     plyTexture: status.plyTexture,
        //     enablePLY: status.tequilaran ? true : false
        // });
        let newState = {
            ...this.state,
            plyReady: status.plyReady,
            plyDisplayFile: status.plyDisplayFile,
            plyTexture: status.plyTexture,
            enablePLY: status.tequilaran ? true : false
        };
        if(status.tequilaran) {
            this.feedbackState.tequilaran = true;
            const timestamp = GetTimeStamp();

            let c3dcmode = this.props.mm3dRunList.find(val => val.mode).mode;

            newState.out = 'C3DC_' + c3dcmode + '_mesh_textured' + timestamp + '.ply';
            newState.texture = 'C3DC_' + c3dcmode + '_mesh_UVtexture' + timestamp + '.jpg';
        }
       
        this.feedbackState = {
            stdout: this.batchState.stdout,
            stderr: this.batchState.stderr,
            elapsedTime: this.batchState.elapsedTime,
            stdoutline: this.batchState.stdoutline,
            procstatus: this.batchState.procstatus,
            updateRunListFile: true
        }
        
        this.setState(newState);
        this.props.setStatus(this.feedbackState);

        //restore image file extensions
        this.state.imageList.forEach(img => {
        if(!img.selected) {
            let imgfile = path.join(this.props.tempDir, img.name);
            let ext = path.extname(imgfile);
            let newfile = path.basename(imgfile, ext)
            let newpath = path.join(this.props.tempDir, newfile);
            if(fs.existsSync(newpath)) {
                fs.renameSync(newpath, imgfile);
            }
            //thumbnails
            imgfile = path.join(thumbs, img.name);
            newpath = path.join(thumbs, newfile);
            if(fs.existsSync(newpath)) {
                fs.renameSync(newpath, imgfile);
            }
        }
    });
    });
}

export function updatecommand(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state}

    if(changedItem==="mode") {
        newState.mode = newValue;
        if(newValue==="Basic") {
            newState.optim = false;
        }
    }
    if(changedItem==="orientation") {
        newState.orientation = newValue;
    }

    if(changedItem==="binarymode") {
        newState.binarymode = !newState.binarymode;
    }

    if(changedItem==="plyFile") {
        newState.plyFile = newValue;
    }

    if(changedItem==="optim") {
        newState.optim = !newState.optim;
    }

    if(changedItem==="lambda") {
        newState.lambda = newValue;
    }
    if(changedItem==="iter") {
        newState.iter = newValue;
    }
    if(changedItem==="sz") {
        newState.sz = newValue;
    }
    if(changedItem==="scale") {
        newState.scale = newValue;
    }
    if(changedItem==="qual") {
        newState.qual = newValue;
    }
    if(changedItem==="angle") {
        newState.angle = newValue;
    }
    if(changedItem==="crit") {
        newState.crit = newValue;
    }
    if(changedItem==="out") {
        newState.out = newValue;
    }
    if(changedItem==="texture") {
        newState.texture = newValue;
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