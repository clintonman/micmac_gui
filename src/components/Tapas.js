import React, {Component} from 'react';
import Display3D from './Display3D';
import Checkmark from './Checkmark';
import * as tapasF from './methods/tapas-functions';
import "./Tapas.css";

const fs = window.require('fs');
const path = window.require('path');

class Tapas extends Component {
    constructor(props) {
        super(props);
        // console.log("tapas constructor");
        this.lineheight = React.createRef();
        //SH - suffix homol
        let SH = "";
        let testSH = props.mm3dRunList.find(val => {
            return val.sh && (val.name === "HomolFilterMasq");
        });

        if(testSH) {
            SH = testSH.sh;
        }
        testSH = props.mm3dRunList.find(val => {
            return val.orientation && (val.name === "Schnaps");
        });

        if(testSH) {
            SH = testSH.orientation;
        }

        this.lensSet = new Set();
        let twoLens = false;
        if(props.imageList.length !== 0) {
            props.imageList.forEach( img => {
                this.lensSet.add( img.exif.SubExif? +img.exif.SubExif.FocalLength: 0)
            });
        }

        if(this.lensSet.size > 1) {
            twoLens = true;
        }

        let Out = twoLens ? "CalLocal" : "Calib";

        this.fileregex = props.imageRegex
        this.state = {
            ...props,
            calibration: "calibration_local",
            mode: "RadialBasic",
            incalib: "Calib",
            outcalib: "All",
            command: 'mm3d Tapas RadialBasic "' + props.imageRegex + '" Out=' + Out,
            batchIsRunning: false,
            // useOldTapas: false,
            twoLens: twoLens,
            withCalib: twoLens,
            SH: SH,
            schnapsran: this.props.schnapsran,
            elapsedTime: "00:00",

            out_calibration_local: twoLens ? "CalLocal" : "Calib",
            out_calibration_detail: "CalDetail",

            in_orientation_local: "CalLocal",
            out_orientation_local: "OriLocal",

            in_orientation_final: "",
            out_orientation_final: "All",

            out_calib_orientation: "All",

            tapasran: props.tapasran,
            callocalran: false,
            caldetailran:false,
            orilocalran: false,
            orifinalran: false,
            orimanualran: false,
            apericloudran: false,
            enablePLY: false,

            saisiemasqplyCommand: '',
            apericloudCommand: '',
            withCam: true,

            clear_calilocal_disabled: false,
            clear_calidetail_disabled: false,
            clear_orilocal_disabled: false,
            clear_orifinal_disabled: false,
            frozenposes: '',
            frozencalibs: '',
            calibration_manual: false,
            in_calibration_manual: "",
            in_orientation_manual: "",
            fl_min: 0,
            fl_max: 0,
            out_orientation_manual: "All",
            in_options: [""],
            in_orientation_campari: "All",
            out_orientation_campari: "CampariOut",
            camparicommand: "mm3d Campari All CampariOut",
            cpi: 0,
            posefigee: false,
            focfree: false,
            ppfree: false,
            exptxt: false,
            lastOrientation: "",
            in_orientation_apericloud: "All"
        }

        //if tapioca exptxt update tapas exptxt
        let prevTapioca = props.mm3dRunList.find(val => {
            return (val.name === "Tapioca");
        });
        if(prevTapioca) {
            if(prevTapioca.command.match("ExpTxt=1")) {
                this.state.exptxt = true;
            }
        }
        // if tapioca added images and tapas has run before then set as AutoCal and 
        // jump to last option and set input as last tapas out and output as last tapas + "Add"
        // would Figee be better than AutoCal here?
        let addedImages = props.mm3dRunList.find(val => {
            if(!val.command) {
                return false;
            }
            return val.command.match("Pat2=") && (val.name === "Tapioca");
        });

        let prevTapas = props.mm3dRunList.find(val => {
            return (val.name === "Tapas");
        });

        if(addedImages && prevTapas) {
            this.state.calibration = "orientation_final";
            this.state.mode = "AutoCal"
            this.state.in_orientation_final = prevTapas.orientation;
            this.state.out_orientation_final = prevTapas.orientation + 'Add';
        }

        let overlapFound = false;
        let tapiocaCount = props.mm3dRunList.reduce((prev, curr) => {
            if(curr.command && curr.command.match("Tapioca"))
                return prev + 1;
            else
                return prev;
        }, 0);

        //check for overlapping selection - no overlap means potential separate calibration images
        if(tapiocaCount > 1) {
            //get regex for each tapioca run - 4th item in the command, has quotes
            let regexArr = props.mm3dRunList.reduce((prev, curr) => {
                if(curr.command && curr.command.match("Tapioca")) {
                    let regexA = curr.command.split('"');
                    prev.push(new RegExp(regexA[1]));
                }

                return prev;

            }, []);

            //check each image against each regex, if more than one matches then overlap found
            overlapFound = this.state.imageList.find(val => {
                let foundCount = regexArr.reduce((prev, curr) => {
                    if(val.name.match(curr)) {
                        return prev + 1;
                    } else {
                        return prev;
                    }
                }, 0);

                if(foundCount > 1) {
                    return true;
                }
                
                return false;
            });
        }

        if(!prevTapas && overlapFound) {
            this.state.calibration = "orientation_final";
            this.state.withCalib = false;
        }

        //check Ori files exist to enable clear buttons

        let dir;

        dir = path.join(this.state.tempDir,"Ori-" + this.state.out_calibration_local);
        if(!fs.existsSync(dir)) {
            this.state.clear_calilocal_disabled = true;
        }
        dir = path.join(this.state.tempDir,"Ori-" + this.state.out_calibration_detail);
        if(!fs.existsSync(dir)) {
            this.state.clear_calidetail_disabled = true;
        }
        dir = path.join(this.state.tempDir,"Ori-" + this.state.out_orientation_local);
        if(!fs.existsSync(dir)) {
            this.state.clear_orilocal_disabled = true;
        }
        dir = path.join(this.state.tempDir,"Ori-" + this.state.out_orientation_final);

        if(!fs.existsSync(dir)) {
            this.state.clear_orifinal_disabled = true;
        }

        // imports Tapas functions

        this.buildcommand = tapasF.buildcommand.bind(this);
        this.clearRun = tapasF.clearRun.bind(this);
        this.openSaisi = tapasF.openSaisi.bind(this);
        this.runApericloud = tapasF.runApericloud.bind(this);
        this.runCommand = tapasF.runCommand.bind(this);
        this.updatecommand = tapasF.updatecommand.bind(this);
        this.updateValue = tapasF.updateValue.bind(this);
        this.setFrozenPoses = tapasF.setFrozenPoses.bind(this);
        this.setFrozenCalibs = tapasF.setFrozenCalibs.bind(this);
        this.runCampariCommand = tapasF.runCampariCommand.bind(this);
        this.updatecamparicommand = tapasF.updatecamparicommand.bind(this);
        this.buildcamparicommand = tapasF.buildcamparicommand.bind(this);
        this.buildapericloudcommand = tapasF.buildapericloudcommand.bind(this);
        this.buildsaisiemasqcommand = tapasF.buildsaisiemasqcommand.bind(this);
        
        this.batchState = {
            stdout: "",
            stdoutline: "",
            stderr: "",
            er2: {},
            nn: {},
            residuals: [],
            elapsedTime: "00:00"
        }
        
        // this.state.saisiemasqplyCommand = 'mm3d ' + (props.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + this.state.out_orientation_final + ".ply";
        this.state.saisiemasqplyCommand = 'mm3d ' + (props.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + this.state.in_orientation_apericloud + ".ply";
        this.state.apericloudCommand = 'mm3d AperiCloud ' + props.imageRegex + " " + this.state.in_orientation_apericloud + (!this.state.withCam ? " WithCam=0" : "");
        this.state.camparicommand = 'mm3d Campari '  + props.imageRegex + " " + this.state.in_orientation_campari+ " " + this.state.out_orientation_campari;

        //use last orientation
        let lastOriRun = props.mm3dRunList.find(val => {
            return val.orientation && val.name !== "Apericloud";
        });
        if(lastOriRun) {
            this.state.lastOrientation = lastOriRun.orientation;
            this.state.in_orientation_campari = lastOriRun.orientation;
            this.state.in_orientation_apericloud = lastOriRun.orientation;
            this.state.saisiemasqplyCommand = 'mm3d ' + (props.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + lastOriRun.orientation + ".ply";
            this.state.apericloudCommand = 'mm3d AperiCloud ' + props.imageRegex + " " + lastOriRun.orientation + (!this.state.withCam ? " WithCam=0" : "");
            this.state.camparicommand = 'mm3d Campari '  + props.imageRegex + " " + lastOriRun.orientation + " " + this.state.out_orientation_campari;
        }
        
        this.feedbackState = {
            stdout: "",
            stdoutline: "",
            stderr: "",
            elapsedTime: "00:00",
            updateRunListFile: false
        }
        props.setStatus({...this.feedbackState});

        this.runOrientationOutput = Out;
        this.commandOverride = false;
        this.saisiemasqplyOverride = false;
        this.commandOverrideCampari = false;

        props.updateOriCalOptions();
    }

    clearBatchState = () => {
        this.batchState = {
            procstatus: "",
            stdout: "",
            stdoutline: "",
            stderr: "",
            er2: {},
            nn: {},
            residuals: [],
            elapsedTime: "00:00",
            simpleRegex: this.props.simpleRegex,
            updateRunListFile: false
        }
    }

    updateState = (newState) => {
        this.setState({...this.state, ...newState})
    }

    componentWillReceiveProps(nextProps) {
        // console.log(nextProps)
        const newState = {
            ...this.state,
            ...nextProps,
            Size: nextProps.imageWidth * this.state.sizescale
        }
        this.fileregex = nextProps.imageRegex;
        // if(!this.commandOverride) {
        if(!this.commandOverride && !nextProps.appDisabled) {
            this.buildcommand(newState);
        }

        if(!nextProps.appDisabled) {
            this.buildapericloudcommand(newState);
            this.buildsaisiemasqcommand(newState);
        }
        // if(!newState.withCam)
        //     newState.apericloudCommand = 'mm3d AperiCloud ' + nextProps.imageRegex + " " + newState.out_orientation_final + " WithCam=0";
        // else
        //     newState.apericloudCommand = 'mm3d AperiCloud ' + nextProps.imageRegex + " " + newState.out_orientation_final;
        this.setState(newState);
    }

    componentDidMount() {
        let lh = window.getComputedStyle(this.lineheight.current)["line-height"];
        if(lh === "normal") {
            lh = 1.2;
        }
        this.setState({...this.state, lineheight: lh});
    }

    render() {
        let homolPath = path.join(this.props.tempDir, 'Homol');
        
        return(
            <div ref={this.lineheight} className="MicmacProc Tapas">
            <div className="Controls">
                <h1 className="contexthelp" 
                    title="camera settings(calibration) and positions(orientation) relative to each other"
                    data-help="TapasGeneral" data-position="center" 
                    onContextMenu={this.props.helpcontext}>{this.state.tapasran ? <Checkmark className="title-ran"></Checkmark> : null}
                Tapas <span style={{fontSize: '0.5em',pointerEvents:'none'}}>camera calculations</span></h1>

                <div className="label-input_group">
                    <label htmlFor="SH">SH alternate input:</label>
                    <select 
                        name="SH" id="SH" 
                        title="alternate tie point data source generated from masked tie points or Schnaps reduction"
                        value={this.state.SH}
                        // style={{marginRight: "3em"}}
                        onChange={this.updatecommand}>
                        <option value=""></option>
                        <option value="MasqFiltered">Masked images</option>
                        <option value="_mini" disabled={!this.state.schnapsran}>Schnaps images</option>
                    </select>
                

                    <label htmlFor="mode">
                    <span className="contexthelp" data-help="TapasMode" data-position="center" 
                        onContextMenu={this.props.helpcontext}>Mode:</span>
                    </label>
                    <select 
                        name="mode" id="mode" 
                        title="Fraser most demanding -> RadialBasic least demanding"
                        value={this.state.mode}
                        // style={{marginRight: "3em"}}
                        onChange={this.updatecommand}
                        >
                        <option value="Fraser">Fraser</option>
                        <option value="FraserBasic">FraserBasic</option>
                        <option value="RadialExtended">RadialExtended</option>
                        <option value="RadialStd">RadialStd</option>
                        <option value="RadialBasic">RadialBasic</option>
                        <option value="FishEyeEqui">FishEyeEqui</option>
                        <option value="HemiEqui">HemiEqui</option>
                        <option value="AutoCal">AutoCal</option>
                        <option value="Figee">Figee</option>
                    </select>
                
                    <label>
                        <span className="contexthelp" data-help="TapasTwoLens" data-position="center" 
                        onContextMenu={this.props.helpcontext}>Two lens workflow</span>
                    </label>
                    <input
                        id="twoLens" 
                        type="checkbox" 
                        checked={this.state.twoLens}
                        onChange={this.updatecommand}
                         />
                    <label>_
                        <span className="contexthelp" data-help="TapasTwoLens" data-position="center" 
                        onContextMenu={this.props.helpcontext}
                        >with calibration</span>
                    </label>
                    <input
                        id="withCalib" 
                        type="checkbox" 
                        checked={this.state.withCalib}
                        onChange={this.updatecommand}
                         />

                {/* <label htmlFor="useOldTapas">Use Old Tapas</label>
                <input 
                    id="useOldTapas" 
                    type="checkbox" 
                    checked={this.state.useOldTapas} 
                    onChange={this.updatecommand}
                    title="use old version of Tapas"/> */}

                <label htmlFor="exptxt">Text tie points</label>
                <input 
                    id="exptxt" 
                    type="checkbox" 
                    checked={this.state.exptxt} 
                    onChange={this.updatecommand}
                    title="read text format tie points"/>

                </div>
                <div className="label-double-input_group">
                    <label title="focal length range to process [0,0]=all fl">FL min max:</label>
                    <div>
                        <input type="number" 
                            name="fl_min" 
                            id="fl_min" 
                            title="minimum focal length to process"
                            value={this.state.fl_min}
                            onChange={this.updatecommand} />
                        <input type="number" 
                        name="fl_max" 
                        id="fl_max" 
                        title="maximum focal length to process"
                        value={this.state.fl_max}
                        onChange={this.updatecommand} />
                    </div>
                </div>
                <div className="bundleGrid">
                    <h4 className="contexthelp" data-help="TapasOperation" data-position="center" 
                        onContextMenu={this.props.helpcontext}>Operation</h4>
                    <h4>Input</h4>
                    <h4>Output</h4>
                    <h4><button id="clear_ori" title="clear all Tapas run data" onClick={this.clearRun}>X</button></h4>

                    <label style={{justifySelf: "self-start", position:'relative'}}>
                        {this.state.callocalran ? <Checkmark className="button-ran3"></Checkmark> : null}
                        <input 
                            type="radio"  
                            value="calibration_local" 
                            id="calibration_local" 
                            checked={this.state.calibration==="calibration_local"} 
                            onChange={this.updatecommand}
                            title="choose a subset of images for calibration then press the run button" />
                        Calib local
                    </label>
                    <p>no input</p>
                    <input 
                        id="out_calibration_local" 
                        type="text" 
                        value={this.state.out_calibration_local}
                        onChange={this.updatecommand}/>
                    <button id="clear_calilocal" onClick={this.clearRun} disabled={this.state.clear_calilocal_disabled} >X</button>

                    <label style={{justifySelf: "self-start",position:'relative', color: this.state.twoLens ? "rgb(231,231,231)" : "gray"}}>
                        {this.state.caldetailran ? <Checkmark className="button-ran3"></Checkmark> : null}
                        <input 
                            type="radio"  
                            value="calibration_detail" 
                            id="calibration_detail" 
                            checked={this.state.calibration==="calibration_detail"} 
                            onChange={this.updatecommand}
                            title="choose a subset of the high focal length images for calibration then press the run button"
                            disabled={!this.state.twoLens}/>Calib detail
                    </label>
                    <p style={{color: this.state.twoLens ? "rgb(231,231,231)" : "gray"}}>no input</p>
                    <input 
                        id="out_calibration_detail" 
                        type="text" 
                        value={this.state.out_calibration_detail}
                        onChange={this.updatecommand}
                        disabled={!this.state.twoLens}/>
                    <button id="clear_calidetail" onClick={this.clearRun} disabled={this.state.clear_calidetail_disabled}>x</button>

                    <label style={{justifySelf: "self-start",position:'relative', color: this.state.twoLens ? "rgb(231,231,231)" : "gray"}}>
                        {this.state.orilocalran ? <Checkmark className="button-ran3"></Checkmark> : null}
                        <input 
                            type="radio"  
                            value="orientation_local" 
                            id="orientation_local" 
                            checked={this.state.calibration==="orientation_local"} 
                            onChange={this.updatecommand}
                            title="choose all the low focal length images used for 3d reconstruction then press the run button"
                            disabled={!this.state.twoLens} />Orient local
                    </label>
                    <input 
                        id="in_orientation_local" 
                        type="text" 
                        value={this.state.in_orientation_local}
                        onChange={this.updatecommand}
                        disabled={!this.state.twoLens}/>
                    <input 
                        id="out_orientation_local" 
                        type="text" 
                        value={this.state.out_orientation_local}
                        onChange={this.updatecommand}
                        disabled={!this.state.twoLens}/>
                    <button id="clear_orilocal" onClick={this.clearRun} disabled={this.state.clear_orilocal_disabled}>X</button>

                    <label style={{justifySelf: "self-start", position:'relative'}}>
                        {this.state.orifinalran ? <Checkmark className="button-ran3"></Checkmark> : null}
                        <input 
                            type="radio"  
                            value="orientation_final" 
                            id="orientation_final" 
                            title="choose all images used for 3d reconstruction and press the run button"
                            checked={this.state.calibration==="orientation_final"} 
                            onChange={this.updatecommand} />Orient final
                    </label>
                    <input 
                        id="in_orientation_final" 
                        type="text" 
                        
                        value={this.state.in_orientation_final}
                        onChange={this.updatecommand}/>
                    <input 
                        id="out_orientation_final" 
                        type="text" 
                        value={this.state.out_orientation_final}
                        onChange={this.updatecommand}/>
                    <button id="clear_orifinal" onClick={this.clearRun} disabled={this.state.clear_orifinal_disabled}>X</button>
                    
                    <label style={{justifySelf: "self-start", position:'relative'}}>
                        {this.state.orimanualran ? <Checkmark className="button-ran3"></Checkmark> : null}
                        <input 
                            type="radio"  
                            value="orientation_manual" 
                            id="orientation_manual" 
                            title="use manual inputs below"
                            checked={this.state.calibration==="orientation_manual"} 
                            onChange={this.updatecommand} />Manual
                    </label>
                    <p>input below</p>
                    <p>input below</p>
                </div>

                <div className="bundleManual">
                    <div className="label-input_group">
                        <label htmlFor="in_calibration_manual">Calibration In:</label>
                        <select 
                            name="in_calibration_manual" id="in_calibration_manual" 
                            title="in calibration name"
                            value={this.state.in_calibration_manual}
                            onChange={this.updatecommand}
                            disabled={this.state.calibration!=="orientation_manual"}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>
                    </div>
                    <div className="label-input_group">
                        <label htmlFor="in_orientation_manual">Orientation In:</label>
                        <select 
                            name="in_orientation_manual" id="in_orientation_manual" 
                            title="in orientation and calibration name"
                            value={this.state.in_orientation_manual}
                            onChange={this.updatecommand}
                            disabled={this.state.calibration!=="orientation_manual"}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>
                    </div>
                    <div className="label-input_group">
                        <label htmlFor="out_orientation_manual">Out:</label>
                    <input 
                            id="out_orientation_manual" 
                            type="text" 
                            value={this.state.out_orientation_manual}
                            onChange={this.updatecommand}
                            disabled={this.state.calibration!=="orientation_manual"}/>
                    </div>
                </div>

                <input id="frozenposes" className="command"
                        type="text" 
                        value={this.state.frozenposes}
                        onChange={this.updatecommand}
                        title="previous run pattern to add new images to"/>
                    <div className="Tapioca__two-buttons noborder">
                        <button style={{width:'12em'}}
                            onClick={this.setFrozenPoses} 
                            title="lock the orientations of select images from prior run"
                            className="contexthelp" data-help="TapasFrozenPoses" data-position="right" 
                                onContextMenu={this.props.helpcontext}>Select Frozen</button>
                        <label>frozen poses</label>
                    </div>
                <input id="frozencalibs" className="command"
                        type="text" 
                        value={this.state.frozencalibs}
                        onChange={this.updatecommand}
                        title="previous run pattern to add new images to"/>
                    <div className="Tapioca__two-buttons noborder">
                        <button style={{width:'12em'}}
                            onClick={this.setFrozenCalibs} 
                            title="lock the calibrations of select images from prior run"
                            className="contexthelp" data-help="TapasFrozenPoses" data-position="right" 
                            onContextMenu={this.props.helpcontext}>Select Frozen</button>
                        <label>frozen calibrations</label>
                    </div>

                <div className="endsection">
                    {/* <label className="left-label"  htmlFor="thecommand">Command</label> */}
                    <textarea 
                        id="thecommand"
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height6"}`}
                        value={this.state.command}
                        onChange={this.updatecommand}
                        wrap="soft"
                        rows="6"></textarea>
                    <button 
                        id="doit" 
                        onClick={this.runCommand}
                        disabled={this.state.batchIsRunning || !fs.existsSync(homolPath) }
                        style={{position:'relative'}}
                        title="select images and press to run"
                        className="contexthelp primary-button" data-help="TapasRun" data-position="right" 
                        onContextMenu={this.props.helpcontext}>
                        {this.state.tapasran ? <Checkmark className="button-ran2"></Checkmark> : null} Run
                    </button>
                </div>

                
                    <div className="label-input_group">
                        <label htmlFor="in_orientation_campari">Orientation In:</label>
                        <select 
                            name="in_orientation_campari" id="in_orientation_campari" 
                            title="in orientation name"
                            value={this.state.in_orientation_campari}
                            onChange={this.updatecamparicommand}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>
                    </div>
                    <div className="label-input_group">
                        <label htmlFor="out_orientation_campari">Out:</label>
                    <input 
                            id="out_orientation_campari" 
                            type="text" 
                            value={this.state.out_orientation_campari}
                            onChange={this.updatecamparicommand}/>
                    </div>

                    <div className="label-radio_group">
                    <input 
                            id="cpi0" 
                            name="cpi"
                            type="radio"
                            title="cpi"
                            checked={this.state.cpi===0}
                            value="0"
                            onChange={this.updatecamparicommand} />
                        <label htmlFor="cpi0" title="no calibration per image">None</label>

                        <input 
                            id="cpi1" 
                            name="cpi"
                            type="radio"
                            title="cpi"
                            checked={this.state.cpi===1}
                            value="1"
                            onChange={this.updatecamparicommand} />
                        <label htmlFor="cpi1" title="first calibration per image">CPI1</label>

                        <input 
                            id="cpi2" 
                            name="cpi"
                            type="radio"
                            title="cpi"
                            checked={this.state.cpi===2}
                            value="2"
                            onChange={this.updatecamparicommand} />
                        <label htmlFor="cpi2" title="subsequent calibration per image">CPI2</label>
                    </div>
                    
                    <div className="label-input_group">
                        <label htmlFor="posefigee">Lock poses</label>
                        <input 
                            id="posefigee" 
                            type="checkbox"
                            title="lock poses"
                            checked={this.state.posefigee}
                            onChange={this.updatecamparicommand} />
                    </div>
                    <div className="label-input_group">
                        <label htmlFor="focfree">Refine FL</label>
                        <input 
                            id="focfree" 
                            type="checkbox"
                            title="free focal length"
                            checked={this.state.focfree}
                            onChange={this.updatecamparicommand} />
                    </div>
                    <div className="label-input_group">
                        <label htmlFor="ppfree">Refine PP</label>
                        <input 
                            id="ppfree" 
                            type="checkbox"
                            title="free principle point"
                            checked={this.state.ppfree}
                            onChange={this.updatecamparicommand} />
                    </div>

                    <div className="endsection">
                    <textarea 
                        id="camparicommand"
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height6"}`}
                        value={this.state.camparicommand}
                        onChange={this.updatecamparicommand}
                        wrap="soft"
                        rows="6"></textarea>
                    <button 
                        id="doit" 
                        onClick={this.runCampariCommand}
                        disabled={this.state.batchIsRunning || !fs.existsSync(homolPath) }
                        style={{position:'relative'}}
                        title="select images and press to run"
                        className="contexthelp" data-help="Campari" data-position="right" 
                        onContextMenu={this.props.helpcontext}>
                        {this.state.campariran ? <Checkmark className="button-ran2"></Checkmark> : null} Refine
                    </button>

                </div>

                <div className="endsection">
                <div className="label-input_group-singlewide">
                        <label htmlFor="in_orientation_apericloud">Orientation In:</label>
                        <select 
                            name="in_orientation_apericloud" id="in_orientation_apericloud" 
                            title="in orientation name"
                            value={this.state.in_orientation_apericloud}
                            onChange={this.updateValue}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>
                    </div>
                    <div className="label-input_group-singlewide">
                        <label htmlFor="withCam">Include cameras</label>
                        <input 
                            id="withCam" 
                            type="checkbox"
                            title="include cameras represented by points"
                            checked={this.state.withCam}
                            onChange={this.updateValue} />
                    </div>

                    <textarea
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                        id="apericloudCommand"
                        value={this.state.apericloudCommand}
                        onChange={this.updateValue}
                        rows="4"
                        wrap="soft"></textarea>

                    <button id="doapericloud" 
                        onClick={this.runApericloud} style={{position:'relative'}}
                        className="contexthelp primary-button"
                        data-help="AperiCloudGeneral" data-position="center" 
                        onContextMenu={this.props.helpcontext}>
                        {this.state.apericloudran ? <Checkmark className="button-ran2"></Checkmark> : null}3D Preview</button>
                </div>

                    <textarea
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height2"}`}
                        id="saisiemasqplyCommand"
                        value={this.state.saisiemasqplyCommand}
                        onChange={this.updateValue}
                        rows="2"
                        wrap="soft"></textarea>
                    
                <button id="opensaisi" onClick={this.openSaisi}
                    className="contexthelp" data-help="SaisieMasqRun" data-position="right" 
                    onContextMenu={this.props.helpcontext}>Make 3D mask</button>
            </div>
            <Display3D
                plyReady={this.state.plyReady}
                plyFile={this.state.plyFile}
                doMesh={false}
                doLighting={false}
                tempDir={this.state.tempDir}
                imageList={this.state.imageList}
                mm3dRunList={this.state.mm3dRunList}
                enableApp={this.props.enableApp}
                enablePLY={this.state.enablePLY}
                updateParentState={this.updateState}
                max3dpoints={this.state.max3dpoints}
                helpcontext={ this.state.helpcontext}
                in_options={this.state.in_options}
                appDisabled={this.props.appDisabled}>
            </Display3D>

            </div>
        )
    }
}
export default Tapas