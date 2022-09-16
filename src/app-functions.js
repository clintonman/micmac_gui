// import exif from "jpeg-exif";
import * as ImageSelect from './components/methods/ImageSelectionCode';
const electron = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');
const spawn = window.require('child_process').spawn;
const process = window.require('process');

const shell = electron.shell;

var ipcRenderer = electron.ipcRenderer;

export function updateOriCalOptions() {
  // get ori folders to populate manual operation dropdowns
  let directoryItems = fs.readdirSync(this.state.tempDir);

  if(directoryItems.length > 0) {
      let inOptions = [""];
      directoryItems.forEach((elem) => {
        let currentFile = path.join(this.state.tempDir, elem);
        let stats = fs.lstatSync(currentFile);
        if(stats.isDirectory() && elem.match(/Ori-/)) {
          let name = elem.split("-")[1];
          if(name !== "InterneScan") {
              inOptions.push(name);
          }
        }
      });
      this.setState({...this.state, in_options: inOptions});
  };
}

export function clearAllFiles() {
    this.startClearingFiles = true;
    this.setState({...this.state, busy: true, exifisset: false});
  }

  export function clearAllFiles2() {
    this.deleteFilesCountdown = 0;
      
    let directoryItems = fs.readdirSync(this.state.tempDir);

    if(directoryItems.length > 0) {
      this.disableApp();
    }
    directoryItems.forEach((elem) => {
      let currentFile = path.join(this.state.tempDir, elem);
      fs.lstat(currentFile, (err, stats) => {
        // console.log(currentFile)
        if (err) throw err;
        if(stats.isFile()) {
          this.deleteFilesCountdown++;
          fs.unlink(currentFile, (err) => {
            // console.log("unlink")
            this.deleteFilesCountdown--;
            this.checkFilesDeleted()
            if (err) throw err;
          });
        }
        // if(stats.isDirectory(currentFile)) {
        if(stats.isDirectory()) {
         this.deleteFilesCountdown++;
          ipcRenderer.send('rim-raf', currentFile);
          this.deleteFilesCountdown--;
          this.checkFilesDeleted();
        }
      });
    });

    this.setState({
        ...this.state,
        exifisset: false,
        imageList:[],
        totalNumImages: 0,
        mm3dRunList: [],
        tapiocaran: false,
        tapasran: false,
        sbglobbasculeran: false,
        gcpbasculeran: false,
        apericloudran: false,
        c3dcran: false,
        tipunchran: false,
        tequilaran: false,
        schnapsran: false,
        imagesloaded: false,
        busy: directoryItems.length === 0 ? false: true}
    );
    if(this.state.beep) shell.beep();
  }

export function closeFeedback() {
    this.setState({
      ...this.state,
      showfeedback:false,
      stdoutline: "",
      stdout:"",
      stderr:"",
      procstatus:"",
      elapsedTime: "00:00",
      busy: false
    })
}

export function disableApp() {
    this.setState({
      ...this.state,
      appDisabled: true,
      showfeedback: true
    })
  }

  export function enableApp() {
    this.batch = null;
    this.setState({
      ...this.state,
      appDisabled: false
    })
  }
 
  export function helpcontext(e) {
    let helpname = e.target.dataset.help;
    let position = e.target.dataset.position;
    console.log(helpname)
    var rect = e.target.getBoundingClientRect();
    this.setState({...this.state, help: {name:helpname, rect: rect, position: position}})
  }

  export function helpclose(e) {
    console.log("helpclose", e.target.id);
    if(e.target.id === "helpclosebutton") {
      this.setState({...this.state, help: null});
    }
  }

  export function loadRunState() {
    fs.readFile(path.join(this.state.tempDir, "runstate.json"), (err, data) => {
      //if (err) throw err;
      if(!err) {
        let runlist = JSON.parse(data);
        //recover from disabled app state
        if(runlist.appDisabled) {
          runlist.appDisabled = false;
          runlist.updateRunListFile = false;
        }
        //recover dont update state file
        if(runlist.updateRunListFile) {
          runlist.updateRunListFile = false;
        }
        //output to blank
        runlist.stdoutline = "";

        this.setState(runlist);
      }
    });
  }

  export function maskImage(image) {
    // console.log("maskImage in app-functions")
    // console.log(image)
    // console.log(this.props.location.pathname)
    let theSaisie = this.state.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq"; //QT not working in linux for image masking, ply is ok
    // console.log(theSaisie)
    let commandarraytext = [];
    if(this.props.location.pathname === "/tapioca") {
      commandarraytext = [theSaisie, image];
    }
    if(this.props.location.pathname === "/sbglobbascule") {
      commandarraytext = [theSaisie, image, "Post=_MasqPlane"];
    }
    if(this.props.location.pathname === "/c3dc") {
      commandarraytext = [theSaisie, image, "Post=_MasqRep"];
    }
    if(commandarraytext.length === 0) {
      window.alert("Images can only be masked in the Tapioca, SBGlobBascule and C3DC tabs.")
      ImageSelect.updateMaskStatus.call(this);
      return;
    }

    this.batchState = {
      procstatus: "starting mask process...",
      stdout: "",
      stderr: "",
      elapsedTime: "00:00",
      updateRunListFile: false
  }
  setStatus.call(this, this.batchState);

    const bat = spawn(this.state.mm3dPath, commandarraytext, { cwd:this.state.tempDir });

    bat.stdout.on('data', (data) => {
        // let status = displayProgress("SaisieMasqQT", this.batchState, data, bat, thestart)
        // this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
        // if(status.updateDisplay) {
        //     this.props.setStatus(this.batchState);
        // }
    });

    bat.stderr.on('data', (data) => {
        this.props.disableApp();//only care about errors
        // let status = displayErrors("SaisieMasqQT", this.batchState, data, bat)
        // this.batchState = {...this.batchState, stderr: status.stderr}
        // this.props.setStatus(this.batchState)
    });

    bat.on('exit', (code) => {
        // let status = endProgress("SaisieMasqQT", this.batchState, code, bat, thestart, this.props)
        // let newImageList = [...this.state.imageList]
        // let selectedIndex = newImageList.findIndex(val => {
        //     return val.selected
        // })
        // newImageList[imageIndex].masked = true;
        // this.batchState = {...this.batchState, procstatus: status.procstatus, imageList: newImageList}
        // this.setStatus({imageList: newImageList})
        this.batchState = {
          procstatus: "",
          stdout: "",
          stderr: "",
          elapsedTime: "",
          updateRunListFile: false
      }
      setStatus.call(this, this.batchState);
        console.log(this)
        ImageSelect.updateMaskStatus.call(this);
    });
  }

  export function mm3dFileDialog() {
    let res = ipcRenderer.sendSync('show-dialog', 'openFile');

    if(res) {
        var mm3d = path.join(path.dirname(res[0]), path.basename(res[0], path.extname(res[0])));
        // ipcRenderer.send('set-setting', ['mm3dPath', mm3d]);
        let setupIsValid = false;
        if(fs.existsSync(mm3d) && fs.existsSync(this.state.tempDir)) {
          console.log(path.basename(mm3d))
          if(path.basename(mm3d) === "mm3d") {
            setupIsValid = true;
          }
        }
        //windows ".exe", not needed for linux mac
        if(fs.existsSync(mm3d + ".exe") && fs.existsSync(this.state.tempDir)) {
          console.log(path.basename(mm3d))
          if(path.basename(mm3d) === "mm3d") {
            setupIsValid = true;
            if(process.platform === 'win32') {
              window.alert("Restart MicMac GUI to finish setting the path.");
            }
          }
        }
        if(setupIsValid) {
          ipcRenderer.send('set-setting', ['mm3dPath', mm3d]);
          this.setState({
            ...this.state,
            mm3dPath: mm3d,
            validSetup:setupIsValid
          });
        }
    }
  }
  export function ffmpegDialog() {
    let res = ipcRenderer.sendSync('show-dialog', 'openFile');

    if(res) {
        var ffmpegPath = path.join(path.dirname(res[0]), path.basename(res[0], path.extname(res[0])));
        
        let setupIsValid = false;
        if(fs.existsSync(ffmpegPath)) {
          console.log(path.basename(ffmpegPath))
          if(path.basename(ffmpegPath) === "ffmpeg") {
            setupIsValid = true;
          }
        }
        //windows .exe
        if(fs.existsSync(ffmpegPath + ".exe")) {
          console.log(path.basename(ffmpegPath))
          if(path.basename(ffmpegPath) === "ffmpeg") {
            setupIsValid = true;
            if(process.platform === 'win32') {
              window.alert("Restart MicMac GUI to finish setting the path.");
            }
          }
        }
        console.log(setupIsValid)

        if(setupIsValid) {
          ipcRenderer.send('set-setting', ['ffmpegPath', ffmpegPath]);
          this.setState({
            ...this.state,
            ffmpegPath: ffmpegPath,
            validSetup:setupIsValid
          });
        }
    }
  }

  export function setStatus(status) {
    this.setState({...this.state, ...status}, () => {
      //write run list to disc
      if(this.state.updateRunListFile) {
        let data = JSON.stringify(this.state, null, 2);
        fs.writeFile(path.join(this.state.tempDir, "runstate.json"), data, (err) => {
          if (err) throw err;
        });
      }
    })
  }

  export function tempFolderDialog() {
    let res = ipcRenderer.sendSync('show-dialog', 'openDirectory');

    if(res) {
        if(fs.readdirSync(res[0]).length !== 0) {
          if(!window.confirm("Folder is not empty. Continue anyway?")) {
            return;
          }
        }

        ipcRenderer.send('set-setting', ['tempPath', res[0]]);
        let setupIsValid = false;
        if(fs.existsSync(this.state.mm3dPath) && fs.existsSync(this.state.tempDir)) {
          if(path.basename(this.state.mm3dPath) === "mm3d") {
            setupIsValid = true;
          }
        }
        //windows "".exe" not needed for linus mac?
        if(fs.existsSync(this.state.mm3dPath + ".exe") && fs.existsSync(this.state.tempDir)) {
          if(path.basename(this.state.mm3dPath) === "mm3d") {
            setupIsValid = true;
          }
        }
        this.setState({
          ...this.state,
          tempDir: res[0],
          validSetup:setupIsValid
        });
    }
  }

  export function updateMM3dRunList(val) {
    const newState = {...this.state}
    newState.mm3dRunList.unshift(val);
    this.setState(newState);
    if(this.state.beep)
      shell.beep();
  }

  export function updateResidualError(residuals) {
    let newimageList = [...this.state.imageList];
    for (let res in residuals) {
      let index = this.state.imageList.findIndex((elem) => {
        return res === elem.name;
      })
      newimageList[index].tapasRes = residuals[res];
    }

    this.setState({
      ...this.state,
      imageList: newimageList
    });
  }