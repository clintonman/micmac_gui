import React, {Component} from 'react';
import Display3D from './Display3D';
import Checkmark from './Checkmark';

import { prepSaisieMasq } from '../utility/mmutil';
import * as c3dcF from './methods/c3dc-functions';

const fs = window.require('fs');
const path = window.require('path');

const {clipboard} = window.require('electron');

class C3DC extends Component {
    constructor(props) {
        super(props);

        this.fileregex = props.imageRegex;

        this.lineheight = React.createRef();

        let orientation = "All";
        let testOri = props.mm3dRunList.find(val => {
            if(val.name === "Tapas" || val.name === "Campari") {
                return val.orientation;
            } else {
                return false;
            }
        });

        if(testOri) {
            orientation = testOri.orientation;
        }

        let masq = false;
        let command = 'mm3d C3DC QuickMac "' + props.imageRegex + '" ' + orientation;
        let masqpath = path.join(props.tempDir, "AperiCloud_" + orientation + "_selectionInfo.xml");
        if(fs.existsSync(masqpath)) {
            masq = true;
            command = 'mm3d C3DC QuickMac "' + props.imageRegex + '" All Masq3D=AperiCloud_' + orientation + '_selectionInfo.xml'
        }

        let pims2mntCommand = 'mm3d PIMs2Mnt QuickMac DoOrtho=1';
        
        this.state = {
            ...props,
            mode: "QuickMac",
            binarymode: true,
            exptxt: false,
            orientation: orientation,
            usegpu: false,
            usemask: masq,
            command: command,
            batchIsRunning: false,
            plyReady: false,
            plyFile: path.join(props.tempDir, 'C3DC_QuickMac.ply'),
            tempDir: props.tempDir,
            imageList: props.imageList,
            pims2mntCommand: pims2mntCommand,
            tawnycommand: 'mm3d Tawny PIMs-ORTHO',
            meshlabfile: '',
            meshlabplyfile: '',
            localRepair: false,
            enablePLY: false,
            thereplocbasculecommand: "mm3d RepLocBascule images CampariOut HOR LocalRepair.xml PostPlan=_MasqPlane",
            apero2meshlabCommand: 'mm3d Apero2Meshlab "' + props.imageRegex + '" ' + orientation + ' UnDist=0',
            saisiemasqimgCommand: 'mm3d ' + (props.useSaisieMasqQT ? "SaisieMasqQT " : "SaisieMasq ") + props.imageRegex + " Post=_MasqPlane",
            bascline: 'HOR',
            orthocyl: false,
            lineheight: 1
        }

        //if tapioca exptxt update exptxt
        let prevTapioca = props.mm3dRunList.find(val => {
            return (val.name === "Tapioca");
        });
        if(prevTapioca) {
            if(prevTapioca.command.match("ExpTxt=1")) {
                this.state.exptxt = true;
            }
        }

        // imports C3DC functions

        this.buildcommand = c3dcF.buildcommand.bind(this);
        this.exportMeshlab = c3dcF.exportMeshlab.bind(this);
        this.openSaisi = c3dcF.openSaisi.bind(this);
        this.pims2mnt = c3dcF.pims2mnt.bind(this);
        this.runCommand = c3dcF.runCommand.bind(this);
        this.runRepair = c3dcF.runRepair.bind(this);
        this.runTawny = c3dcF.runTawny.bind(this);
        this.saveDepthmap = c3dcF.saveDepthmap.bind(this);
        this.saveOrtho = c3dcF.saveOrtho.bind(this);
        this.updatecommand = c3dcF.updatecommand.bind(this);
        this.updateReplocCommand = c3dcF.updateReplocCommand.bind(this);

        let commandarray = prepSaisieMasq("C3DC", this.state, props, false);
        this.state.saisiemasqimgCommand = "mm3d " + commandarray.join(" ");

        this.commandOverride = false;
        this.commandOverridePims = false;
        this.commandOverrideTawny = false;
        this.replocCommandOverride = false;
        this.apero2meshlabOverride = false;

        this.batchState = {
            stdout: "",
            stdoutline: "",
            stderr: "",
            fatalErrorFlag: false,
            elapsedTime: "00:00"
        }

        props.updateOriCalOptions();
    }

    clearBatchState = () => {
        this.batchState = {
            procstatus: "",
            stdout: "",
            stdoutline: "",
            stderr: "",
            elapsedTime: "00:00",
            updateRunListFile: false
        }
    }

    // "RepLocBascule singleimage CampariOut HOR LocalRepair.xml Postplan=_MasqPlane"
    buildReplocCommand = (newState) => {
        let buildcommand;
        buildcommand = 'mm3d RepLocBascule "' + newState.imageRegex +  '" ';
        // buildcommand += newState.orientation + " HOR LocalRepair.xml PostPlan=_MasqPlane";
        buildcommand += newState.orientation + " " + newState.bascline + " LocalRepair.xml";
        buildcommand += (newState.exptxt ? " ExpTxt=1" : "");
        buildcommand += " PostPlan=_MasqPlane";
        if(newState.orthocyl) {
            buildcommand += " OrthoCyl=1"
        }

        newState.thereplocbasculecommand = buildcommand;
    }

    componentWillReceiveProps(nextProps) {
        const newState = {
            ...this.state,
            ...nextProps,
            Size: nextProps.imageWidth * this.state.sizescale
        }
        this.fileregex = nextProps.imageRegex;
        if(!this.commandOverride) this.buildcommand(newState);
        if(!this.replocCommandOverride ) {
            this.buildReplocCommand(newState);
        }
        newState.apero2meshlabCommand = 'mm3d Apero2Meshlab "' + nextProps.imageRegex + '" ' + newState.orientation + ' UnDist=0';
        this.apero2meshlabOverride = false;
        // newState.saisiemasqimgCommand = 'mm3d ' + (nextProps.useSaisieMasqQT ? "SaisieMasqQT " : "SaisieMasq ") + nextProps.imageRegex + " Post=_MasqPlane"
        let commandarray = prepSaisieMasq("C3DC", newState, nextProps, false);
        newState.saisiemasqimgCommand = "mm3d " + commandarray.join(" ");
        this.setState(newState);
    }

     // https://stackoverflow.com/questions/48617331/scroll-to-bottom-of-the-page-when-data-added-in-body-dynamically-in-react-js
     componentDidUpdate() {
        const stdouttag = document.getElementById("stdouttag")
        stdouttag.scrollTop = stdouttag.scrollHeight;
    }

    componentDidMount() {
        let lh = window.getComputedStyle(this.lineheight.current)["line-height"];
        if(lh === "normal") {
            lh = 1.2;
        }
        // console.log(lh)
        this.setState({...this.state, lineheight: lh});
    }

    updateState = (newState) => {
        this.setState({...this.state, ...newState})
    }

    render() {
        let oriPath = path.join(this.props.tempDir, 'Ori-'+this.state.orientation);
        return(
            <div ref={this.lineheight} className="MicmacProc C3DC">
                <div className="Controls">
                    <h1 className="contexthelp"
                        title="generate 3d point cloud"
                        data-help="C3DCGeneral" data-position="center" 
                        onContextMenu={this.props.helpcontext}>
                    {this.state.c3dcran ? <Checkmark className="title-ran"></Checkmark> : null}
                        C3DC <span style={{fontSize: '0.5em'}}>dense point cloud</span></h1>
                    <div className="label-input_group">
                        <label htmlFor="usemask">Use mask</label>
                        <input 
                            type="checkbox" 
                            id="usemask" 
                            title="use mask - comes from sasiemasq run on apericloud ply file"
                            checked={this.state.usemask}
                            onChange={this.updatecommand}/>
                    </div>

                    <div className="label-input_group">
                        <label htmlFor="mode">
                            <span className="contexthelp" data-help="C3DCMode" data-position="right" 
                            onContextMenu={this.props.helpcontext}>Mode:</span>
                        </label>
                        <select 
                            name="mode" 
                            id="mode"
                            title="quickmac=lowest, micmac=medium, bigmac=high, statue='better but slower'"
                            value={this.state.mode}
                            onChange={this.updatecommand}
                            >
                            <option value="QuickMac">QuickMac</option>
                            <option value="MicMac">MicMac</option>
                            <option value="BigMac">BigMac</option>
                            <option value="Forest">Forest</option>
                            <option value="Statue">Statue</option>
                        </select>
                    </div>

                    <div className="label-input_group">
                        <label htmlFor="orientation">Orientation</label>
                        {/* <input id="orientation" type="text" 
                            value={this.state.orientation}
                            onChange={this.updatecommand}/> */}
                        <select 
                            name="orientation" id="orientation" 
                            title="in orientation name"
                            value={this.state.orientation}
                            onChange={this.updatecommand}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>
                    </div>

                    <div className="label-input_group">
                    <label htmlFor="exptxt">Text tie points </label>
                    <input 
                        id="exptxt" 
                        type="checkbox"
                        checked={this.state.exptxt}
                        onChange={this.updatecommand}
                        title="use text tie point files"/>
                    </div>
                    
                    <div className="label-input_group">
                    <label htmlFor="binarymode">Binary </label>
                    <input 
                        id="binarymode" 
                        type="checkbox"
                        checked={this.state.binarymode}
                        onChange={this.updatecommand}
                        title="create binary format ply point cloud file"/>
                    </div>

                    <div className="label-input_group">
                    <label htmlFor="usegpu">Use GPU </label>
                    <input 
                        id="usegpu" 
                        type="checkbox"
                        checked={this.state.usegpu}
                        onChange={this.updatecommand}
                        title="Use cuda gpu"/>
                    </div>

                    <div className="endsection">
                    <textarea id="thecommand"
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                        value={this.state.command}
                        onChange={this.updatecommand}
                        wrap="soft"
                        rows="4"></textarea>
                    <button 
                        id="doit" 
                        className='genbutton primary-button'
                        onClick={this.runCommand}
                        disabled={this.state.batchIsRunning || !fs.existsSync(oriPath) }
                        style={{position:'relative'}}
                        title="select images for point cloud then run">
                        {this.state.c3dcran ? <Checkmark className="button-ran2"></Checkmark> : null}Dense Cloud</button>

                </div>

                <h3>Meshlab</h3>
                <div className="endsection">
                <textarea
                    className={`command ${this.state.hidecommandinput ? "mincommand" : "height2"}`}
                    id="apero2meshlabCommand"
                    value={this.state.apero2meshlabCommand}
                    onChange={this.updatecommand}
                    rows="2"
                    wrap="soft"></textarea>

                <button onClick={this.exportMeshlab}
                    className="contexthelp genbutton" data-help="Meshlab" data-position="right" 
                    onContextMenu={this.props.helpcontext}
                    >
                    export meshlab</button>

                <p className="clipboardcopy">{this.state.meshlabfile}</p>
                <button className="clipboardcopy genbutton" onClick={()=>clipboard.writeText(this.state.meshlabfile)}
                    title="copy the meshlab project file path to the clipboard"
                    disabled={this.state.meshlabfile ? false : true}>Copy path</button>

                <p className="clipboardcopy">{this.state.meshlabplyfile}</p>
                <button className="clipboardcopy genbutton" onClick={()=>clipboard.writeText(this.state.meshlabplyfile)}
                    title="copy the ply file path to the clipboard"
                    disabled={this.state.meshlabplyfile ? false : true}>Copy ply path</button>
                    </div>

                <h3>Orthophoto</h3>
                <input type="text"
                    className={`command_input ${this.state.hidecommandinput ? "command_hidden" : ""}`}
                    id="saisiemasqimgCommand"
                    value={this.state.saisiemasqimgCommand}
                    onChange={this.updatecommand}/>

                <button onClick={this.openSaisi} title="mask an image for face direction of orthophoto"
                    className="contexthelp" data-help="SaisieMasqRun" data-position="left" 
                    onContextMenu={this.props.helpcontext}>Mask an image</button>

                <div className="label-input_group">
                    <label htmlFor="bascline">
                        <span>Line:</span>
                    </label>
                    <select 
                        name="bascline" 
                        id="bascline"
                        title="type of line, HOR horizontal, HORVy Y vertical, NONE not used"
                        value={this.state.bascline}
                        onChange={this.updateReplocCommand}
                        >
                        <option value="HOR">HOR</option>
                        <option value="HORVy">HORVy</option>
                        <option value="NONE">NONE</option>
                    </select>
                </div>

                <div className="label-input_group">
                    <label htmlFor="">Ortho cylindrical</label>
                    <input type="checkbox" 
                        name="orthocyl" 
                        id="orthocyl"
                        title="coordinate system is in ortho-cylindrical mode?"
                        checked={this.state.orthocyl}
                        onChange={this.updateReplocCommand}/>
                </div>

                <textarea
                    id="thereplocbasculecommand"
                    title='"RepLocBascule images orientation HOR/HORVy/NONE xmloutput Pstplan=_MasqPlan"'
                    className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                    value={this.state.thereplocbasculecommand}
                    onChange={this.updateReplocCommand}
                    rows="4"
                    wrap="soft"></textarea>
                <button
                    onClick={this.runRepair}
                    className="contexthelp" data-help="RepLocBascule" data-position="left" 
                    onContextMenu={this.props.helpcontext}
                    >RepLocBascule</button>
                <div className="label-input_group">
                    <label htmlFor="">Local repair</label>
                    <input type="checkbox" 
                        name="" 
                        id="localRepair"
                        title="use local repair from GCPBascule"
                        checked={this.state.localRepair}
                        onChange={this.updatecommand}/>
                </div>
                <input
                    id="pims2mntCommand"
                    className={`command_input ${this.state.hidecommandinput ? "command_hidden" : ""}`}
                    type="text" 
                    value={this.state.pims2mntCommand}
                    onChange={this.updatecommand}/>
                <div className="C3DC__two-buttons" style={{marginBottom: "2em"}}>
                    <button onClick={this.pims2mnt}
                        title="PIMs2Mnt merges individual depth maps in a global digital surface (or elevation) model."
                        className="contexthelp" data-help="PIMs2Mnt" data-position="right" 
                        onContextMenu={this.props.helpcontext}>PIMs2Mnt</button>
                    <button onClick={this.saveDepthmap} title="save depth map">Save depth map</button>
                </div>

                    <input id="tawnycommand" 
                        type="text"
                        className={`command_input ${this.state.hidecommandinput ? "command_hidden" : ""}`}
                        value={this.state.tawnycommand} 
                        onChange={this.updatecommand}/>
                    <div className="C3DC__two-buttons">
                        <button
                            onClick={this.runTawny}
                            title="merge orthophotos to create orthophotomosaic"
                            className="contexthelp" data-help="PIMs2Mnt" data-position="right" 
                        onContextMenu={this.props.helpcontext}>Tawny</button>
                        <button
                            onClick={this.saveOrtho}
                            title="save Orthophotomosaic">Save photomosaic</button>
                    </div>
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

export default C3DC