import React, {Component} from 'react';
import Display3D from './Display3D';
import Checkmark from './Checkmark';
import * as tipunchF from './methods/tipunch-functions';

class Tipunch extends Component {
    constructor(props) {
        super(props);

        this.lineheight = React.createRef();

        let mode = "QuickMac";
        let testMode = props.mm3dRunList.find(val => {
            return val.mode;
        });

        if(testMode) {
            mode = testMode.mode;
        }

        let ply = "C3DC_QuickMac.ply";
        let testPly = props.mm3dRunList.find(val => {
            return val.plyFile && val.name === "C3DC";
        });

        if(testPly) {
            ply = testPly.plyFile;
        }

        this.fileregex = props.imageRegex

        this.state = {
            ...props,
            plyFile: ply,
            binarymode: true,
            filterval: false,
            mode: mode,
            depth: 8,
            scale: 2,
            ffb: true,
            command: 'mm3d TiPunch ' + ply + ' Pattern="'  + props.imageRegex + '" Filter=0 Mode=' + mode + ' FFB=1',
            batchIsRunning: false,
            fatalErrorFlag: false,
            plyReady: false,
            plyDisplayFile: null,
            tempDir: props.tempDir,
            imageList: props.imageList,
            enablePLY: false
        }

        // imports TiPunch functions

        this.buildcommand = tipunchF.buildcommand.bind(this);
        this.plyFileDialog = tipunchF.plyFileDialog.bind(this);
        this.runCommand = tipunchF.runCommand.bind(this);
        this.updatecommand = tipunchF.updatecommand.bind(this);

        //select meshing images 10 images
        // if(this.state.imageList.length > 12) {
        //     props.defaultMeshingImageSelection();
        // }

        this.commandOverride = false;

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
        if(this.state.filterval) {
            this.batchState.stderr = "warning filter option will not provide feedback while running\n"
        }
    }

    updateState = (newState) => {
        this.setState({...this.state, ...newState})
    }

    componentWillReceiveProps(nextProps) {
        const newState = {
            ...this.state,
            ...nextProps
        }
        this.fileregex = nextProps.imageRegex;
        if(!this.commandOverride) this.buildcommand(newState);
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
        return(
            <div ref={this.lineheight} className="MicmacProc TiPunch">
            <div className="Controls">

                <h1 className="contexthelp"
                    title="create a mesh from a point cloud"
                data-help="TiPunchGeneral" data-position="center" 
                onContextMenu={this.props.helpcontext}>
                {this.state.tipunchran ? <Checkmark className="title-ran"></Checkmark> : null}
                Tipunch <span style={{fontSize: '0.5em'}}>create a mesh</span></h1>
                
                <button 
                    id="plyfiledialog" 
                    className='genbutton'
                    onClick={this.plyFileDialog}
                    title="select the ply file generated from the C3DC run">choose ply file</button>
                <div id="plyFile" style={{alignSelf: 'center'}}>{this.state.plyFile}</div>
                <input type="text"
                    id="plyFile"
                    value={this.state.plyFile}
                    onChange={this.updatecommand} />
                <div className="label-input_group">
                    <label htmlFor="binarymode">Binary</label>
                    <input 
                        id="binarymode" 
                        type="checkbox" 
                        checked={this.state.binarymode}
                        onChange={this.updatecommand}
                        title="create binary format ply point cloud file"
                        />
                </div>
                
                <div className="label-input_group">
                    <label htmlFor="depth">depth</label>
                    <input 
                        id="depth" 
                        type="number" 
                        value={this.state.depth}
                        onChange={this.updatecommand}
                        title="depth of voxel grid(def 2^8x2^8x2^8)"/>

                </div>
                <div className="label-input_group">
                    <label htmlFor="mode">C3DC Mode</label>
                    <input type="text"
                        id="mode"
                        value={this.state.mode}
                        onChange={this.updatecommand}
                        title="mode used in c3dc run"/>

                </div>
                <div className="label-input_group">
                    <label htmlFor="scale">Scale</label>
                    <input 
                        id="scale" 
                        type="number" 
                        value={this.state.scale}
                        onChange={this.updatecommand}
                        title="Z-buffer downscale factor"/>
                </div>

                <div className="label-input_group">
                    <label htmlFor="filterval">filter</label>
                    <input 
                        id="filterval" 
                        type="checkbox" 
                        checked={this.state.filterval}
                        onChange={this.updatecommand}
                    />
                </div>
                <div className="label-input_group">
                    <label htmlFor="ffb">Filter from border</label>
                    <input 
                        id="ffb" 
                        type="checkbox" 
                        checked={this.state.ffb}
                        onChange={this.updatecommand}
                        />
                </div>

                <textarea
                    id="thecommand" 
                    className={`command ${this.state.hidecommandinput ? "mincommand" : "height10"}`}
                    value={this.state.command}
                    onChange={this.updatecommand}
                    wrap="soft"
                    rows="10"></textarea>
                <button 
                    id="doit" 
                    className='genbutton primary-button'
                    onClick={this.runCommand}
                    disabled={this.state.batchIsRunning }
                    style={{position:'relative'}}
                    title="choose 10 to 12 images then run to create the mesh">
                    {this.state.tipunchran ? <Checkmark className="button-ran2"></Checkmark> : null} Run</button>

            </div>

                <Display3D 
                    plyReady={this.state.plyReady}
                    plyFile={this.state.plyDisplayFile}
                    doMesh={true}
                    doLighting={true}
                    meshExport={this.props.meshExport}
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


export default Tipunch