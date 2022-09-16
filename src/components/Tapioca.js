import React, {Component} from 'react';
import Checkmark from './Checkmark';
import { prepSaisieMasq } from '../utility/mmutil';
import TiePoints from './TiePoints';
import * as tapiocaF from './methods/tapioca-functions';
import './Tapioca.css';

const electron = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');
var xml2js = require('xml2js');

var ipcRenderer = electron.ipcRenderer;

// ^([a-zA-Z_]*)(.*?)\d+(\.jpg)$ => group1 and 2 name, group 3 extension
class Tapioca extends Component {
    constructor(props) {
        super(props);

        this.lineheight = React.createRef();

        let themode = "MulScale";
        
        let thefullsize = false;
        let thesmallscaleDisabled = false;
        let theSmallSizeDisabled = false;
        let theSizeScale = 0.5;
        let theSmaleScale = 0.25;

        // if small image, no default scaling
        if(props.imageWidth<1024) {
            themode = "All";
            theSizeScale = 1.0;
            theSmaleScale = 0.5;
            thefullsize = true;
            thesmallscaleDisabled = true;
            theSmallSizeDisabled = true;
        }

        var cmd = 'mm3d Tapioca ' + themode + ' ' + props.imageRegex + ' -1';
        
        this.fileregex = props.imageRegex
        this.state = {
            ...props,
            mode: themode,
            fullsize: thefullsize,
            Size: Math.round(props.imageWidth * theSizeScale),
            sizescale: theSizeScale,
            SmallSize: Math.round(props.imageWidth * theSmaleScale),
            smallscale: theSmaleScale,
            delta: 1,
            circle: false,
            binarymode: true,
            command: cmd,
            commandError: false,
            smallscaleDisabled: thesmallscaleDisabled,
            SmallSizeDisabled: theSmallSizeDisabled,
            circleDisabled: true,
            deltaDisabled: true,
            batchIsRunning: false,
            imageList: props.imageList,
            tiepointmix:0.5,
            svglines:[],
            tiedata: [],
            tieimage0: 0,
            tieimage1: 1,
            color:"#ff0000",
            tiePointsSource: "Homol",
            globalmask: '',
            tapiocaran: this.props.tapiocaran,
            homolfiltermasqran: false,
            help: null,
            tiepointSkip: 10,
            schnapsran: this.props.schnapsran,
            tiepointportrait: 0,
            tiepointpointportrait: false,
            NbWin: 1000,
            detect: "Sift",
            ratio: 0.6,
            saisiemasqimgCommand: 'mm3d '  + (props.useSaisieMasqQT ? 'SaisieMasqQT ' : 'SaisieMasq ') + '"' + props.imageRegex + '"',
            homolfiltermasqCommand: 'mm3d HomolFilterMasq ' + props.imageRegex,
            schnapsCommand: 'mm3d Schnaps ' + props.imageRegex,
            previouspattern: '',
            exptxt: false,
            saisieappuisinitCommand: 'mm3d SaisieAppuisInitQT "et002.jpg" NONE TiePointsList.txt TiePoints.xml',
            enhanceContrast: false
        }

        if(props.imageList.length > 0) {
            this.state.saisieappuisinitCommand = 'mm3d SaisieAppuisInitQT "' + props.imageList[0].name + '" NONE TiePointsList.txt TiePoints.xml'
        }

        //if TiePointslist.txt exists read TiePoints-S2D.xml to get point names for tieimage0 and 1
        if(props.imageList.length > 0) {

            let tpl = path.join(props.tempDir, "TiePointsList.txt");

            if(fs.existsSync(tpl)) {
                //read xml points
                let tp2d = path.join(props.tempDir, "TiePoints-S2D.xml");

                if(fs.existsSync(tp2d)) {
                    var parser = new xml2js.Parser();
                    let data = fs.readFileSync(tp2d, {encoding: 'utf8', flag: 'r'});
                    if(data) {
                        parser.parseString(data, (err, result) => {
                            let image0data = result.SetOfMesureAppuisFlottants.MesureAppuiFlottant1Im[0];
                            let image1data = result.SetOfMesureAppuisFlottants.MesureAppuiFlottant1Im[1];
                            let image0 = image0data.NameIm[0];
                            let image1 = image1data.NameIm[0];

                            let image0index = props.imageList.findIndex(val => {
                                return (val.name === image0);
                            });
                            let image1index = props.imageList.findIndex(val => {
                                return (val.name === image1);
                            });

                            this.state.tieimage0 = image0index;
                            this.state.tieimage1 = image1index;
                            this.state.saisieappuisinitCommand = `mm3d SaisieAppuisInitQT "${image0}" NONE TiePointsList.txt TiePoints.xml`;
                        });
                    }
                }
            }
        }

        //if tapioca exptxt update tapas exptxt
        let prevTapioca = props.mm3dRunList.find(val => {
            return (val.name === "Tapioca");
        });
        if(prevTapioca) {
            if(prevTapioca.command.match("ExpTxt=1")) {
                this.state.exptxt = true;
                this.state.homolfiltermasqCommand += " ExpTxt=1";
                this.state.schnapsCommand += " ExpTxt=1";
            }
        }

        // imports Tapioca functions

        this.buildschnapscommand = tapiocaF.buildschnapscommand.bind(this);
        this.buildhomolfiltercommand = tapiocaF.buildhomolfiltercommand.bind(this);
        this.buildcommand = tapiocaF.buildcommand.bind(this);
        this.clearBatchState = tapiocaF.clearBatchState.bind(this);
        this.clearSchnaps = tapiocaF.clearSchnaps.bind(this);
        this.clearTiePointFilter = tapiocaF.clearTiePointFilter.bind(this);
        this.deleteFolderRecursive = tapiocaF.deleteFolderRecursive.bind(this);
        this.loadTiePoints = tapiocaF.loadTiePoints.bind(this);
        this.mulscaleSet = tapiocaF.mulscaleSet.bind(this);
        this.openSaisi = tapiocaF.openSaisi.bind(this);
        this.processImageMasks = tapiocaF.processImageMasks.bind(this);
        this.runCommand = tapiocaF.runCommand.bind(this);
        this.runSchnaps = tapiocaF.runSchnaps.bind(this);
        this.setFullSize = tapiocaF.setFullSize.bind(this);
        this.setTiePoint = tapiocaF.setTiePoint.bind(this);
        this.updatecommand = tapiocaF.updatecommand.bind(this);
        this.updateValue = tapiocaF.updateValue.bind(this);
        this.validatecommand = tapiocaF.validatecommand.bind(this);
        this.setPreviousPattern = tapiocaF.setPreviousPattern.bind(this);
        this.DeleteTiePoint = tapiocaF.DeleteTiePoint.bind(this);

        let commandarray = prepSaisieMasq("Tapioca", this.state, props, false);
        this.state.saisiemasqimgCommand = commandarray.join(" ");

        this.batch = null;
        this.tapiocaOverride = false;
        this.schnapsOverride = false;
        this.homolfiltermasqOverride = false;
        this.saisiemasqimgOverride = false;

        this.batchState = {
            procstatus: "",
            stdout: "",
            stderr: "",
            elapsedTime: "00:00",
            updateRunListFile: false
        }
        props.setStatus(this.batchState);

        if(props.tapiocaran) {
            let newtp = this.loadTiePoints(this.state);
            this.state.svglines = newtp.svglines;
            this.state.tiedata = newtp.tiedata;
        }

        this.props.updateMaskButtons();
    }

    setOrientation = (event) => {
        this.setState({tiepointportrait: event.target.value})
    }

    selectGlobalMask = () => {
        let res = ipcRenderer.sendSync('imagetif-dialog', this.props.tempDir);
    
        if(!res) {
            return
        }
        const newState = {...this.state}
        newState.globalmask= path.basename(res[0]);
        newState.homolfiltermasqCommand = 'mm3d HomolFilterMasq ' + this.state.imageRegex + ' GlobalMasq="' + path.basename(res[0]) + '"' ;
        this.setState(newState)
      }

    componentWillReceiveProps(nextProps) {
        const newState = {
            ...this.state,
            ...nextProps,
            Size: Math.round(nextProps.imageWidth * this.state.sizescale)
        }

        this.fileregex = nextProps.imageRegex;
        if(!this.tapiocaOverride) {
            this.buildcommand(newState);
            this.validatecommand(newState);
        }

        if(nextProps.imageRegex !== this.props.imageRegex) {
            this.buildhomolfiltercommand(newState);
            this.homolfiltermasqOverride = false;
            this.buildschnapscommand(newState);
            this.schnapsOverride = false;
        }

        let commandarray = prepSaisieMasq("Tapioca", newState, nextProps, false);
        newState.saisiemasqimgCommand = commandarray.join(" ");
        this.saisiemasqimgOverride = false;

        this.setState(newState);
    }

    componentDidMount() {
        let lh = window.getComputedStyle(this.lineheight.current)["line-height"];
        if(lh === "normal") {
            lh = 1.2;
        }
        this.setState({...this.state, lineheight: lh});
    }

    // https://stackoverflow.com/questions/48617331/scroll-to-bottom-of-the-page-when-data-added-in-body-dynamically-in-react-js
    componentDidUpdate() {
        const stdouttag = document.getElementById("stdouttag")
        stdouttag.scrollTop = stdouttag.scrollHeight;
    }
    
    render() {

        return (
            <div ref={this.lineheight} className="MicmacProc Tapioca">
    
                <div className="Controls">
                    <h1 className="contexthelp"
                        title="find matching points between image pairs"
                        data-help="TapiocaGeneral" data-position="center" 
                        onContextMenu={this.props.helpcontext}>
                    {this.state.tapiocaran ? <Checkmark className="title-ran"></Checkmark> : null }
                    Tapioca <span style={{fontSize: '0.5em'}}>tie points and matching</span>
                    </h1>
                    <div className="label-input_group-single" style={{marginTop:"1em", marginBottom:"1em", fontSize:"1.2em"}}>
                        <label htmlFor="mode">
                                <span className="contexthelp" data-help="TapiocaMode" data-position="right" 
                                onContextMenu={this.props.helpcontext}>Mode:</span>
                        </label>
                            <select 
                                name="mode" 
                                id="mode" 
                                value={this.state.mode}
                                onChange={this.updatecommand}
                                title="All - search all&#10;MulScale - low res search as starting point&#10;Line - search adjacent images">
                                <option value="All">All</option>
                                <option value="MulScale">MulScale</option>
                                <option value="Line">Line</option>
                                <option value="File" disabled>File</option>
                                <option value="Graph" disabled>Graph</option>
                            </select>
                    </div>

                        <button onClick={this.mulscaleSet}
                            title="suggest values for reducing image size for point matching">suggest scale</button>
                        <button id="fullsizebutton" onClick={this.setFullSize}
                            title="set the image size to full scale for final matching">set fullsize final</button>

                    <div className="tapioca-group4">
                        <div className="label-input_group">
                            <label htmlFor="Size">Image size</label>
                                <input 
                                    id="Size" 
                                    type="number" 
                                    value={+this.state.Size} 
                                    onChange={this.updatecommand}
                                    title="resize images to this width before final search"
                                    min="128" />
                        </div>
                        <div className="label-input_group2">
                            <input 
                                id="sizescale" 
                                type="number" 
                                max="1.0" 
                                min="0.01" 
                                step="0.01" 
                                value={+this.state.sizescale} 
                                onChange={this.updatecommand}
                                title="working image resize scale, recommend between 0.3 and 0.5" />
                            <label htmlFor="sizescale" className="rightlabel">image scale</label>
                        </div>
                    </div>

                    <div className="tapioca-group4">
                        <div className="label-input_group">
                            <label htmlFor="SmallSize">small size</label>
                                <input id="SmallSize" 
                                    type="number" 
                                    value={+this.state.SmallSize} 
                                    onChange={this.updatecommand}
                                    disabled={this.state.SmallSizeDisabled}
                                    title="resize images to this width before the initial search"
                                    min="64"/>
                        </div>

                        <div className="label-input_group2">
                            <input id="smallscale" 
                                type="number" 
                                max="0.9" 
                                min="0.01" 
                                step="0.01" 
                                value={+this.state.smallscale} 
                                onChange={this.updatecommand}
                                disabled={this.state.smallscaleDisabled}
                                title="" />
                            <label htmlFor="smallscale" className="rightlabel">small scale</label>
                        </div>
                    </div>

                    <div className="tapioca-group4">
                    <div className="label-input_group">
                        <label htmlFor="delta">Line delta</label>
                        <input id="delta" 
                            type="number" 
                            min="1"
                            value={this.state.delta} 
                            onChange={this.updatecommand}
                            disabled={this.state.deltaDisabled} title="number of adjacent images to search"/>

                    </div>
                    <div className="label-input_group2">
                        <input id="circle" 
                            type="checkbox"
                            style={{justifySelf: "end"}}
                            checked={this.state.circle} 
                            onChange={this.updatecommand}
                            disabled={this.state.circleDisabled} 
                            title="line mode where start and end are adjacent images"/>
                        <label htmlFor="circle" className="rightlabel">Line circular</label>
                    </div>
                    
                </div>

                <div className="tapioca-group4">
                    <div className="label-input_group">
                        <label htmlFor="">method
                        </label>
                        <select 
                            name="detect" 
                            id="detect" 
                            value={this.state.detect}
                            onChange={this.updatecommand}
                            style={{width: "4.8em"}}
                            title="tie point detection method: digeo faster but less reliable">
                            <option value="Digeo">Digeo</option>
                            <option value="Sift">Sift</option>
                        </select>

                    </div>
                </div>
                <div className="tapioca-group4">
                    <div className="label-input_group">
                        <label htmlFor="">Ratio</label>
                        <input 
                            id="ratio" 
                            type="number" 
                            max="1.0" 
                            min="0.01" 
                            step="0.01" 
                            value={+this.state.ratio} 
                            onChange={this.updatecommand}
                            title="lower means that you want less ambiguity (and less points)" />
                    </div>
                </div>
                <div className="tapioca-group4">
                <div className="label-input_group">
                        <label htmlFor="circle">Text format</label>
                        <input id="exptxt" 
                            type="checkbox"
                            checked={this.state.exptxt} 
                            onChange={this.updatecommand}
                            title="export results as text format files"/>
                    </div>
                    </div>
                    <div className="tapioca-group4">
                <div className="label-input_group">
                        <label htmlFor="circle">Enhance contrast</label>
                        <input id="enhanceContrast" 
                            type="checkbox"
                            checked={this.state.enhancedContrast} 
                            onChange={this.updatecommand}
                            title="increase the contrast of images before processing"/>
                    </div>
                    </div>
                    <textarea id="previouspattern" className={`command ${this.state.hidecommandinput ? "mincommand" : "height2"}`}
                        value={this.state.previouspattern}
                        onChange={this.updatecommand}
                        title="previous run pattern to add new images to"
                        rows="2"
                        wrap="soft"></textarea>
                    <div className="Tapioca__two-buttons noborder">
                        <button style={{width:'12em'}}
                            onClick={this.setPreviousPattern} 
                            title="select images from prior run"
                            className="contexthelp" data-help="TapiocaCombine" data-position="right" 
                                onContextMenu={this.props.helpcontext}>Select Previous</button>
                        <div title="use to select prior run images" >previous image regex</div>
                    </div>

                    <textarea id="thecommand" className={`command ${this.state.hidecommandinput ? "mincommand" : "height6"}`} 
                        value={this.state.command}
                        onChange={this.updatecommand}
                        title="command that will be run"
                        rows="6"
                        wrap="soft"></textarea>

                    <div className="Tapioca__two-buttons noborder endsection">
                        <button 
                            id="doit" 
                            className='primary-button'
                            onClick={this.runCommand}
                            title="run tie point matching"
                            style={{position:'relative'}}
                            disabled={this.state.commandError || this.state.batchIsRunning}>
                            {this.state.tapiocaran ? <Checkmark id="tapioca-button-ran"></Checkmark> : null} Run
                        </button>
                        <button
                            title="remove previous tie points run - delete Homol_SRes and Homol folders"
                            onClick={this.deleteFolderRecursive}
                            >Clear previous</button>
                    </div>

                    <p 
                        title="create a mask image for filtering tie points"
                        style={{marginBottom:"1.5em", fontSize:"1.2em"}}
                        className="contexthelp griditemleft" data-help="SaisieMasqRun" data-position="right" 
                        onContextMenu={this.props.helpcontext}
                    >Create masks below in the image list.</p>

                    <input type="text"
                        className="command_input"
                        id="globalmask"
                        value={this.state.globalmask}
                        onChange={this.updateValue}
                        title="preexisting mask file to be use on all images"/>

                    <button style={{width:'12em'}}
                        className="griditemleft"
                        onClick={this.selectGlobalMask} 
                        title="select a preexisting mask file to be use on all images">Select global mask</button>

                    <textarea
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                        id="homolfiltermasqCommand"
                        value={this.state.homolfiltermasqCommand}
                        onChange={this.updateValue}
                        wrap="soft"
                        rows="4"></textarea>

                    <div className="Tapioca__two-buttons noborder endsection">
                        <button onClick={this.processImageMasks} 
                            title="filter tie points based on previously created mask"
                            style={{position:'relative'}}
                            className="contexthelp" data-help="HomolfilterMasq" data-position="right" 
                            onContextMenu={this.props.helpcontext}
                            >
                            { this.state.homolfiltermasqran ? <Checkmark id="tapioca-button-ran"></Checkmark> : null}
                            Process masks</button>
                        <button onClick={this.clearTiePointFilter} 
                            title="clear filter tie points"
                            className="contexthelp" data-help="HomolfilterMasq" data-position="right" 
                            onContextMenu={this.props.helpcontext}
                            >
                            Clear Filter</button>
                    </div>

                    <div className="label-input_group">
                        <label htmlFor="NbWin">NbWin</label>
                            <input id="NbWin" 
                                type="number" 
                                value={+this.state.NbWin} 
                                onChange={this.updateValue}
                                title="'Minimal homol points in each picture', smaller value seems to have less effect?"
                                min="10"/>
                    </div>

                    <textarea
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                        id="schnapsCommand"
                        value={this.state.schnapsCommand}
                        onChange={this.updateValue}
                        rows="4"
                        wrap="soft"></textarea>

                <div className="Tapioca__two-buttons noborder">
                    <button className="contexthelp" data-help="Schnaps" data-position="right" 
                            onContextMenu={this.props.helpcontext}
                            onClick={this.runSchnaps}
                            style={{position:'relative'}}
                            title="tie point reduction">
                            {this.state.schnapsran ? <Checkmark id="schnaps-button-ran"></Checkmark> : null}
                            Run Schnaps</button>
                    <button className="contexthelp" data-help="Schnaps" data-position="right" 
                            onContextMenu={this.props.helpcontext}
                            onClick={this.clearSchnaps}
                            title="clear schnaps run">
                            Clear Schnaps</button>
                            </div>

                </div>
                <TiePoints
                    imageList={this.state.imageList}
                    tempDir={this.props.tempDir}
                    tieimage0={this.state.tieimage0}
                    tieimage1={this.state.tieimage1}
                    setTiePoint={this.setTiePoint}
                    tiepointmix={this.state.tiepointmix}
                    svglines={this.state.svglines}
                    svgcircles={this.state.svgcircles}
                    tiedata={this.state.tiedata}
                    imageWidth={this.props.imageWidth}
                    imageHeight={this.props.imageHeight}
                    tiePointsSource={this.state.tiePointsSource}
                    tiepointSkip={this.state.tiepointSkip}
                    tiepointportrait={this.state.tiepointportrait}
                    tiepointpointportrait={this.state.tiepointpointportrait}
                    setOrientation={this.setOrientation}
                    exptxt={this.state.exptxt}
                    DeleteTiePoint={this.DeleteTiePoint}
                    saisieappuisinitCommand={this.state.saisieappuisinitCommand}
                    mm3dPath={this.props.mm3dPath}
                    disableApp={this.props.disableApp}
                    enableApp={this.props.enableApp}
                    hidecommandinput={this.state.hidecommandinput}>
                </TiePoints>
                
            </div>

        )
    }
}
export default Tapioca