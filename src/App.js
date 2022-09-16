import React, { Component } from 'react';
import {Switch, Route, NavLink, withRouter, Redirect} from 'react-router-dom';

// import exif from "jpeg-exif";

import './App.css';
import Setup from './components/Setup';
import ImageSelection from './components/ImageSelection';
import Tapioca from './components/Tapioca';
import Tapas from './components/Tapas';
import Apericloud from './components/Apericloud';
import C3DC from './components/C3DC';
import Tipunch from './components/Tipunch';
import Tequila from './components/Tequila';
import SBGlobBascule from './components/SBGlobBascule';
import GCPBascule from './components/GCPBascule';
import Checkmark from './components/Checkmark';
import Help from './components/help/Help';

import HelpPortal from './components/help/HelpPortal';

import * as ImageSelect from './components/methods/ImageSelectionCode';
import * as ImageFile from './components/methods/ImageFileCode';
import {
  clearAllFiles,
  clearAllFiles2,
  closeFeedback,
  disableApp, enableApp,
  helpclose, helpcontext,
  loadRunState, mm3dFileDialog,
  setStatus, tempFolderDialog, updateMM3dRunList,
  updateOriCalOptions,
  updateResidualError,
  maskImage
} from './app-functions';

// run in 2 steps
// 1. npm start - wait and ignore web browser
// 2. npm run electron-dev-win
// 2. npm run electron-dev-linux

// avoid using bash shell on windows - gives mystery errors

//sample code hack to access electron from react code
//import electron from 'electron';

const electron = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');

// const shell = electron.shell;

var ipcRenderer = electron.ipcRenderer;

let mm3dPath = ipcRenderer.sendSync('get-setting', 'mm3dPath');
let tempDir = ipcRenderer.sendSync('get-setting', 'tempPath');
let max3dpoints = ipcRenderer.sendSync('get-setting', 'max3dpoints');

const process = window.require('process');
const globalEnv = process.env;

//stop drag and drop default action for whole document
document.ondragover = (ev) => { ev.preventDefault() }
document.ondrop = (ev) => { ev.preventDefault() }

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      mm3dPath: mm3dPath,
      tempDir: tempDir,
      imageList: [],
      imageWidth: 1920,
      imageHeight: 1080,
      defaultPlyFile: "",
      poissonDepth: 8,
      imageRegex: "regex goes here",
      simpleRegex: "basic regex goes here", // only used to match file extension in tapas and campari feedback
      totalNumImages: 0,
      procstatus: "",
      mm3dRunList: [],
      appDisabled: false,
      stderr:"",
      stdout:"",
      showfeedback:false,
      elapsedTime: "00:00",
      tapiocaran: false,
      tapasran: false,
      sbglobbasculeran: false,
      gcpbasculeran: false,
      apericloudran: false,
      c3dcran: false,
      tipunchran: false,
      tequilaran: false,
      lastimageselected: -1,
      busy: false,
      useSaisieMasqQT: true,
      imagesloaded: false,
      updateRunListFile: false,
      beep: false,
      schnapsran: false,
      hidecommandinput: true,
      regexError: false,
      exifisset: false,
      validSetup: false,
      in_options: [""],
      fps: 1
    }

    if(fs.existsSync(this.state.mm3dPath) && fs.existsSync(this.state.tempDir)) {
      if(path.basename(this.state.mm3dPath) === "mm3d") {
        this.state.validSetup = true;
      }
    }
    //windows .exe not needed for linus mac?
    if(fs.existsSync(this.state.mm3dPath + ".exe") && fs.existsSync(this.state.tempDir)) {
      if(path.basename(this.state.mm3dPath) === "mm3d") {
        this.state.validSetup = true;
      }
    }

    if(max3dpoints) {
      this.max3dpoints = max3dpoints;
    } else {
      // this.max3dpoints = 900;
      this.max3dpoints = 1234567;
    }
    this.batch = null;
    this.asyncFilesActive = false;
    this.deleteFilesCountdown = 0;
    this.timeoutID = null;
    this.startClearingFiles = false;
    this.startLoadingFiles = false;
    this.startLoadingVideo = false;

    //only need globalEnv if windows, linux works fully without it, if needed think linux list is ':' delimited path
    if(process.platform === 'win32') {
      this.globalEnv = globalEnv;
      this.globalEnv.Path = globalEnv.Path + ";" + path.dirname(mm3dPath) + ";";
      this.globalEnv.Path += path.join(path.resolve(path.dirname(mm3dPath), '..'),'binaire-aux','windows') + ";" ;
      // this.globalEnv.Path += "C:\\micmac_win\\binaire-aux\\SiftGpu\\win32;"
      this.globalEnv.Path += path.join(path.resolve(path.dirname(mm3dPath), '..'),'binaire-aux','SiftGpu','x64') + ";" ;
    }

    if(process.platform === 'darwin') {
      this.globalEnv = globalEnv;
      this.globalEnv.Path = process.env.PATH + ":/opt/local/bin:/opt/local/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/X11/bin";

      process.env.PATH = this.globalEnv.Path
      console.log(process.env.PATH);
    }

    //imports - image tasks
    this.computeImageRegEx = ImageSelect.computeImageRegEx;
    this.selectDeselect = ImageSelect.selectDeselect.bind(this);
    this.selectAllImages = ImageSelect.selectAllImages.bind(this);
    this.clearImageSelection = ImageSelect.clearImageSelection.bind(this);
    this.defaultCalibrationImageSelection = ImageSelect.defaultCalibrationImageSelection.bind(this);
    this.defaultMeshingImageSelection = ImageSelect.defaultMeshingImageSelection.bind(this);
    this.invertImageSelection = ImageSelect.invertImageSelection.bind(this);
    this.setImageRegex = ImageSelect.setImageRegex.bind(this);
    this.updateMaskStatus = ImageSelect.updateMaskStatus.bind(this);

    this.imageLoad = ImageFile.imageLoad.bind(this);
    this.imageDialog = ImageFile.imageDialog.bind(this);
    this.imageDrop = ImageFile.imageDrop.bind(this);
    this.convertVideo = ImageFile.convertVideo.bind(this);
    this.videoDialog = ImageFile.videoDialog.bind(this, this.state.fps);
  }

  saveBatch = (bat) => { this.batch = bat; }

  // note spawning detached opens a command window, if close window then all grandchildren stop
  // so if can close the cmd window would work for windows
  stopBatch = () => {
    if(this.batch) {
      //only kills direct child process - grandchildren continue
      //this.batch.kill();
      // process kill not compatible with windows, may work in linux and mac
      // from docs, "Windows platforms will throw an error if the pid is used to kill a process group."
      // https://azimi.me/2014/12/31/kill-child_process-node-js.html
      // process.kill(-this.batch.pid);

      //tree-kill module works no need for detached spawn
      ipcRenderer.send('tree-kill', this.batch.pid);
      this.enableApp();
    }
  }

  disableApp = disableApp.bind(this);

  enableApp = enableApp.bind(this);

  closeFeedback = closeFeedback.bind(this);

  helpcontext = helpcontext.bind(this);

  helpclose = helpclose.bind(this);

  updateMM3dRunList = updateMM3dRunList.bind(this);

  setMaxPoints = (max3dpoints) => {
    // console.log("setMaxPoints called")
    ipcRenderer.send('set-setting', ['max3dpoints', max3dpoints]);
    this.max3dpoints = max3dpoints;
  }

  maskImage = maskImage.bind(this);

  mm3dFileDialog = mm3dFileDialog.bind(this);

  tempFolderDialog = tempFolderDialog.bind(this);

  componentDidUpdate(){
    if(this.startClearingFiles) {
      this.startClearingFiles = false;
      this.clearAllFiles2();
    }
    if(this.startLoadingFiles) {
      this.startLoadingFiles = false;
      this.imageLoad(this.res);
    }
    if(this.startLoadingVideo) {
      this.startLoadingVideo = false;
      let res2 = this.convertVideo(this.res);
      this.startLoadingFiles = false;
      this.imageLoad(res2);
    }
  }

  clearAllFiles = clearAllFiles.bind(this);

  clearAllFiles2 = clearAllFiles2.bind(this);

  checkFilesDeleted = () => {
    // console.log(this.deleteFilesCountdown)
    if(this.deleteFilesCountdown === 0) {
      this.setState({...this.state, procstatus: "done deleting files and folders", busy: false});
    }
  }

  setPlyFile = (path) => {
    this.setState({
      ...this.state,
      defaultPlyFile: path
    });
  }

  setPoissonDepth = (depth) => {
    this.setState({
      ...this.state,
      poissonDepth: depth
    });
  }

  updateOriCalOptions = updateOriCalOptions.bind(this);

  updateResidualError = updateResidualError.bind(this);

  setStatus = setStatus.bind(this);

  loadRunState = loadRunState.bind(this);

  updateFPS = (event) => {
    this.setState({
      ...this.state,
      fps: event.target.value
    })
  }

  render() {
    const commonProps = {
      mm3dPath: this.state.mm3dPath,
      tempDir: this.state.tempDir,
      imageList: this.state.imageList,
      imageRegex: this.state.imageRegex,
      enableApp: this.enableApp,
      disableApp: this.disableApp,
      exifisset: this.state.exifisset,
      updateOriCalOptions: this.updateOriCalOptions,
      in_options: this.state.in_options
    };

    const pageProps = {
      helpcontext: this.helpcontext,
      hidecommandinput: this.state.hidecommandinput,
      mm3dRunList: this.state.mm3dRunList,
      setStatus: this.setStatus,
      updateMM3dRunList: this.updateMM3dRunList
    };

    return (
      <div className="App" spellCheck="false">
        <header className="App-header">
          <h1 style={{color:this.state.busy ? 'red': 'white'}}>MicMac GUI</h1>
          <nav>

            {/* <ul className={this.state.exifisset ? "theLinks" : "disableLinks"}> */}
            <ul className="theLinks">
              <NavLink to="/setup" activeClassName="current-link">
                {this.state.imagesloaded ? <Checkmark className="link-check"></Checkmark> : null}
                Start</NavLink>
                <NavLink to="/tapioca" activeClassName="current-link">
                {this.state.tapiocaran ? <Checkmark className="link-check"></Checkmark> : null}
                Tapioca</NavLink>
              <NavLink to="/tapas" activeClassName="current-link">
                {this.state.tapasran ? <Checkmark className="link-check"></Checkmark> : null}
                Tapas</NavLink>
              <NavLink to="/apericloud" activeClassName="current-link">
                {this.state.apericloudran ? <Checkmark className="link-check"></Checkmark> : null}
                Apericloud</NavLink>
              <NavLink to="/sbglobbascule" activeClassName="current-link">
                {this.state.sbglobbasculeran ? <Checkmark className="link-check"></Checkmark> : null}
                SBGlobBascule</NavLink>
              <NavLink to="/gcpbascule" activeClassName="current-link">
                {this.state.gcpbasculeran ? <Checkmark className="link-check"></Checkmark> : null}
                GCPBascule</NavLink>
              <NavLink to="/c3dc" activeClassName="current-link">
                {this.state.c3dcran ? <Checkmark className="link-check"></Checkmark> : null}
                C3DC</NavLink>
              <NavLink to="/tipunch" activeClassName="current-link">
                {this.state.tipunchran ? <Checkmark className="link-check"></Checkmark> : null}
                Tipunch</NavLink>
              <NavLink to="/tequila" activeClassName="current-link">
                {this.state.tequilaran ? <Checkmark className="link-check"></Checkmark> : null}
                Tequila</NavLink>
            </ul>
          </nav>

        </header>

        <div className="Main-Section">
            <Switch>
              {/* <Route exact path="/" render={null} /> */}
              <Redirect exact path="/" to="/setup"/>
              <Route path="/setup" render = {(props) => (
                <Setup
                  {...commonProps}
                  {...pageProps}
                  clearAllFiles={this.clearAllFiles}
                  selectMm3dPath={this.mm3dFileDialog}
                  useSaisieMasqQT={this.state.useSaisieMasqQT}
                  globalEnv={this.globalEnv}
                  selectTempPath = {this.tempFolderDialog}
                  startImageDialog={this.imageDialog}
                  loadRunState={this.loadRunState}
                  beep={this.state.beep}
                  max3dpoints={this.max3dpoints}
                  setMaxPoints={this.setMaxPoints}
                  setupIsValid={this.state.validSetup}
                  startVideoDialog={this.videoDialog}
                  fps={this.state.fps}
                  updateFPS={this.updateFPS}>
                </Setup>
              )}/>

              <Route path="/tapioca" render = {(props) => (
                <Tapioca
                  {...commonProps}
                  {...pageProps}
                  imageWidth={this.state.imageWidth}
                  imageHeight={this.state.imageHeight}
                  deleteFolderRecursive={this.deleteFolderRecursive}
                  appDisabled={this.state.appDisabled}
                  totalNumImages={this.state.totalNumImages}
                  tapiocaran={this.state.tapiocaran}
                  useSaisieMasqQT={this.state.useSaisieMasqQT}
                  schnapsran={this.state.schnapsran}
                  saveBatch={this.saveBatch}
                  updateMaskButtons={this.updateMaskStatus}>
                </Tapioca>
              )}/>

              <Route path='/tapas' render={(props) => (
                <Tapas
                  {...commonProps}
                  {...pageProps}
                  simpleRegex={this.state.simpleRegex}
                  updateResidualError={this.updateResidualError}
                  appDisabled={this.state.appDisabled}
                  setPlyFile={this.setPlyFile}
                  tapasran={this.state.tapasran}
                  defaultCalibrationImageSelection={this.defaultCalibrationImageSelection}
                  schnapsran={this.state.schnapsran}
                  useSaisieMasqQT={this.state.useSaisieMasqQT}
                  saveBatch={this.saveBatch}
                  max3dpoints={this.max3dpoints}>
                </Tapas>
              )}/>

              <Route path='/apericloud' render={(props) => (
                <Apericloud
                 {...commonProps}
                 {...pageProps}
                  setPlyFile={this.setPlyFile}
                  appDisabled={this.state.appDisabled}
                  apericloudran={this.state.apericloudran}
                  saveBatch={this.saveBatch}
                  useSaisieMasqQT={this.state.useSaisieMasqQT}
                  max3dpoints={this.max3dpoints}>
                </Apericloud>
              )}/>

              <Route path='/sbglobbascule' render={(props) => (
                <SBGlobBascule
                 {...commonProps}
                 {...pageProps}
                  setPlyFile={this.setPlyFile}
                  simpleRegex={this.state.simpleRegex}
                  appDisabled={this.state.appDisabled}
                  imageWidth={this.state.imageWidth}
                  sbglobbasculeran={this.state.sbglobbasculeran}
                  updateResidualError={this.updateResidualError}
                  useSaisieMasqQT={this.state.useSaisieMasqQT}
                  saveBatch={this.saveBatch}
                  max3dpoints={this.max3dpoints}
                  updateMaskButtons={this.updateMaskStatus}>
                </SBGlobBascule>
              )}/>
              <Route path='/gcpbascule' render={(props) => (
                <GCPBascule
                 {...commonProps}
                 {...pageProps}
                  setPlyFile={this.setPlyFile}
                  simpleRegex={this.state.simpleRegex}
                  updateResidualError={this.updateResidualError}
                  appDisabled={this.state.appDisabled}
                  imageWidth={this.state.imageWidth}
                  gcpbasculeran={this.state.gcpbasculeran}
                  history={props.history}
                  saveBatch={this.saveBatch}>
                </GCPBascule>
              )}/>

              <Route path='/c3dc' render={(props) => (
                <C3DC
                 {...commonProps}
                 {...pageProps}
                  setPlyFile={this.setPlyFile}
                  appDisabled={this.state.appDisabled}
                  c3dcran={this.state.c3dcran}
                  globalEnv={this.globalEnv}
                  useSaisieMasqQT={this.state.useSaisieMasqQT}
                  saveBatch={this.saveBatch}
                  max3dpoints={this.max3dpoints}
                  updateMaskButtons={this.updateMaskStatus}>
                </C3DC>
                )}/>
              <Route path='/tipunch' render={(props) => (
                <Tipunch
                  {...commonProps}
                  {...pageProps}
                  setPlyFile={this.setPlyFile}
                  setPoissonDepth={this.setPoissonDepth}
                  appDisabled={this.state.appDisabled}
                  tipunchran={this.state.tipunchran}
                  defaultMeshingImageSelection={this.defaultMeshingImageSelection}
                  saveBatch={this.saveBatch}
                  max3dpoints={this.max3dpoints}>
                </Tipunch>)}/>
              <Route path='/tequila' render={(props) => (
                <Tequila
                  {...commonProps}
                  {...pageProps}
                  setPlyFile={this.setPlyFile}
                  poissonDepth={this.state.poissonDepth}
                  appDisabled={this.state.appDisabled}
                  tequilaran={this.state.tequilaran}
                  saveBatch={this.saveBatch}
                  max3dpoints={this.max3dpoints}>
                </Tequila>)}/>
            </Switch>

        </div>
          <ImageSelection
            {...commonProps}
            helpcontext={ this.helpcontext}
            startImageDialog={this.imageDialog}
            selectDeselect={this.selectDeselect}
            imageWidth={this.state.imageWidth}
            selectAllImages={this.selectAllImages}
            invertImageSelection={this.invertImageSelection}
            clearImageSelection={this.clearImageSelection}
            setImageRegex={this.setImageRegex}
            totalNumImages={this.state.totalNumImages}
            imageDrop={this.imageDrop}
            appDisabled={this.state.appDisabled}
            procstatus={this.state.procstatus}
            elapsedTime={this.state.elapsedTime}
            regexError={this.state.regexError}
            updateMaskStatus={this.updateMaskStatus}
            maskImage={this.maskImage}>
          </ImageSelection>

          {!this.state.help ? null :
            <HelpPortal helpclose={this.helpclose}>
              <Help help={this.state.help}></Help>
            </HelpPortal>
          }
          <div id="busy" style={this.state.appDisabled || this.state.busy ? {display:"block"} : {display:"none"}}>
            <svg id="busy-mm"  viewBox="-40 30 300 180" >
              <defs>
                  <path
                  id="m-path"
                  d="m 51.320726,187.3773 c -3.98166,-1.0708 -6.83523,-3.22188 -8.94747,-6.7448 -2.3344,-3.8934 -2.20262,-0.0445 -2.10107,-61.36091 l 0.0913,-55.092236 0.69824,-1.844371 c 0.38402,-1.014414 1.37242,-2.886566 2.19642,-4.160334 2.42202,-3.744065 7.24519,-6.541966 12.10088,-7.01968 4.89198,-0.481282 10.38491,1.591924 14.21087,5.363634 2.46022,2.425346 3.79115,4.613176 9.87409,16.23141 2.28029,4.355286 4.58645,8.665721 5.1248,9.578785 0.53835,0.913048 2.31371,4.244287 3.94521,7.402788 1.63153,3.1585 4.43449,8.456588 6.2288,11.773544 6.137924,11.34648 8.047794,14.95017 8.047794,15.18523 0,0.65939 4.77234,8.63429 5.25946,8.78889 1.11938,0.35528 1.96267,-0.74911 5.01179,-6.56347 1.70189,-3.24533 3.09434,-5.99162 3.09434,-6.10288 0,-0.11124 1.07693,-2.1509 2.39316,-4.53255 1.31625,-2.38167 4.12676,-7.63095 6.24559,-11.665076 2.11881,-4.034128 6.34869,-12.029038 9.3997,-17.766435 3.05104,-5.737396 6.30344,-11.903283 7.22756,-13.701961 4.05501,-7.892452 6.81305,-10.816522 12.38587,-13.131435 1.59927,-0.664326 2.52069,-0.815891 5.05286,-0.83115 8.70418,-0.05245 15.183,5.202501 16.7938,13.621428 0.72149,3.770766 0.71678,107.426509 -0.005,110.833639 -1.36273,6.43254 -4.96905,10.11091 -11.55824,11.78917 -2.53298,0.64514 -7.12592,0.49434 -9.69375,-0.31828 -4.02862,-1.27491 -8.02914,-5.18199 -9.5922,-9.36819 l -0.77446,-2.07416 -0.0644,-26.67548 c -0.0487,-20.19038 -0.15943,-26.7901 -0.45558,-27.14692 -0.78549,-0.94645 -1.08343,-0.48916 -8.19959,12.58464 -1.70785,3.13766 -5.26507,9.8123 -7.90494,14.83255 -4.97296,9.45716 -6.59809,12.06146 -9.01068,14.4399 -3.70951,3.657 -10.50845,4.96157 -15.68457,3.00951 -4.570254,-1.72357 -7.692694,-5.33555 -12.490254,-14.44853 -1.62402,-3.08484 -3.6928,-6.92905 -4.59729,-8.5427 -0.90448,-1.61366 -2.2012,-3.96079 -2.88162,-5.21585 -0.68041,-1.25506 -1.77981,-3.23545 -2.44309,-4.40086 -0.66327,-1.16542 -2.05219,-3.80594 -3.08647,-5.86783 -1.03428,-2.06189 -2.25971,-4.15434 -2.72317,-4.64989 -0.76089,-0.81358 -0.89168,-0.85201 -1.34782,-0.39609 -0.44489,0.4447 -0.5246,3.58523 -0.66815,26.32825 l -0.16299,25.82332 -1.09195,2.71222 c -1.27596,3.16924 -3.87348,6.22102 -6.52193,7.66249 -3.6234,1.9721 -9.50337,2.70212 -13.37586,1.66067 z"
                  />
              </defs>
              <g>
                <g

                  id="white-group">
                  <use href="#m-path" className="slideright" />
                  <use href="#m-path" className="slideleft"/>
                </g>
                <g

                  id="cyan-group">
                    <use href="#m-path" className="slideright" />
                </g>
                <g
                  id="red-group">
                    <use href="#m-path" className="slideleft"/>
                </g>
                <g

                  id="purple-group">
                  <use href="#m-path" className="slideright" />
                  <use href="#m-path" className="slideleft"/>
                </g>
              </g>
          </svg>
          </div>
        <div className="feedback" style={this.state.showfeedback ? {display:"block"} : {display:"none"}}>
            <button disabled={this.state.appDisabled} onClick={this.closeFeedback}>Close</button>
            <button disabled={!this.state.appDisabled} onClick={this.stopBatch}>Stop Run</button>
            <pre id="stderrtag">{this.state.stderr}</pre>
            <pre id="stdouttag">{this.state.stdout}{this.state.stdoutline}</pre>
          </div>
      </div>
    );
  }
}

export default withRouter(App);
