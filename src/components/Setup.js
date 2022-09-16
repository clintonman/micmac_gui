import React, {Component} from 'react';
import * as setupF from './methods/setup-functions';

const electron = window.require('electron');

const shell = electron.shell;

const RunList = setupF.RunList;

const Camera = setupF.Camera;

class Setup extends Component {
    constructor(props) {
        super(props);

        this.lineheight = React.createRef();

        this.state = {
            cameras: [],
            imageRegex: props.imageRegex,
            f: 35,
            f35: 35,
            cam: "Custom Cam",
            setexifcommand: 'mm3d SetExif "' + props.imageRegex + '" Cam="Custom Cam" F=35 F35=35',
            imageList: props.imageList,
            useSaisieMasqQT: props.useSaisieMasqQT,
            beep: props.beep,
            hidecommandinput: props.hidecommandinput,
            max3dpoints: props.max3dpoints,
            exifisset: props.exifisset
        }

        // imports Setup functions

        this.AddCamera = setupF.AddCamera.bind(this);
        this.RemoveCamera = setupF.RemoveCamera.bind(this);
        this.clearSettingsFiles = setupF.clearSettingsFiles.bind(this);
        this.DeleteRunState = setupF.DeleteRunState.bind(this);
        this.editCameraDatabase = setupF.editCameraDatabase.bind(this);
        this.importCameraDatabase = setupF.importCameraDatabase.bind(this);
        this.openTerminal = setupF.openTerminal.bind(this);
        this.saveCameraDB = setupF.saveCameraDB.bind(this);
        this.setexif = setupF.setexif.bind(this);
        this.setMaxPoints = setupF.setMaxPoints.bind(this);
        this.updateCameraEntry = setupF.updateCameraEntry.bind(this);
        this.updateExifCommand = setupF.updateExifCommand.bind(this);
        this.updateValue = setupF.updateValue.bind(this);

        this.batchState = {
            stdout: "",
            stdoutline: "",
            stderr: "",
            fatalErrorFlag: false,
            elapsedTime: "00:00"
        }
    }

    openFileBrowser = () => { shell.openPath(this.props.tempDir); }

    buildexifcommand = (newState) => {
        newState.setexifcommand = 'mm3d SetExif "' + newState.imageRegex + '" Cam="' + newState.cam + '"';
        newState.setexifcommand += ' F=' + newState.f + ' F35=' + newState.f35;
    }

    componentWillReceiveProps(nextProps) {
        const newState = {
            ...this.state,
            imageRegex: nextProps.imageRegex,
            imageList: nextProps.imageList,
            useSaisieMasqQT: nextProps.useSaisieMasqQT,
            beep: nextProps.beep,
            hidecommandinput: nextProps.hidecommandinput,
            validSetup: nextProps.validSetup
        }
        this.buildexifcommand(newState);
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
        return (
            <div ref={this.lineheight} className="MicmacProc Setup">
                <div className="Controls">
                    <h1 title="load images, setup and utilities" className="contexthelp"
                        data-help="SetupGeneral" data-position="center" 
                        onContextMenu={this.props.helpcontext}>
                        Start <span style={{fontSize: '0.5em'}}>load images and setup</span>
                    </h1>
                    <div className="Controls__section">
                        <h3>Files and Images</h3>
                        <div className="Setup__two-buttons">
                            <button onClick={this.props.clearAllFiles} className="contexthelp" data-help="micmacFiles" data-position="right" 
                                    onContextMenu={this.props.helpcontext} title="clear temporary working files"
                                    disabled={!this.props.setupIsValid}>Clear files</button>
                            <button 
                                onClick={this.props.startImageDialog} 
                                className="contexthelp primary-button" data-help="loadimages" data-position="right" 
                                    onContextMenu={this.props.helpcontext}
                                title="first image is treated as perpendicular to the z axis. images are sorted by the numerical portion of their name"
                                disabled={!this.props.setupIsValid}
                            >
                                Copy Images
                            </button>
                        </div>
                        <div>
                            <label htmlFor="cam">FPS</label>
                            <input type="number" name="fps" id="fps" max="4" min="0.01" step="0.01" value={this.props.fps} onChange={this.props.updateFPS}/>
                            <button
                                onClick={() => this.props.startVideoDialog(this.props.fps)}
                            >
                                Load Video
                            </button>
                        </div>
                    </div>

                    <div className="Controls__section">
                        <h3>Run State</h3>
                        <div className="Setup__two-buttons">
                            <button onClick={this.props.loadRunState} title="load run state" disabled={!this.props.setupIsValid}>Load state</button>
                            <button onClick={this.DeleteRunState} title="delete run state file" disabled={!this.props.setupIsValid}>Delete state</button>
                        </div>
                    </div>
                    <div className="Controls__section">
                        <h3>Open Window</h3>
                        <div className="Setup__two-buttons">
                            <button onClick={this.openTerminal} title="open a terminal to the working folder" disabled={!this.props.setupIsValid}>terminal</button>
                            <button onClick={this.openFileBrowser} title="open file browser to the working folder" disabled={!this.props.setupIsValid}>file browser</button>
                        </div>
                    </div>

                    <div className="Controls__section">
                        <h3>Camera Database</h3>
                        <div className="Setup__two-buttons">
                            <button onClick={this.importCameraDatabase}  className="contexthelp" data-help="CameraDB" data-position="right" 
                                onContextMenu={this.props.helpcontext}
                                title="import camera data to the user camera database"
                                disabled={!this.props.setupIsValid}>import</button>
                            <button onClick={this.editCameraDatabase} title="open/create the user camera database" disabled={!this.props.setupIsValid}>edit</button>
                        </div>
                    </div>
                    <div className="Controls__section">
                        <h3 title="set exif information on the copied images">Set Image Data</h3>
                        <div className="ImageDataGrid">
                            <label htmlFor="cam">Camera model</label><input type="text" id="cam" title="camera model name" value={this.state.cam} onChange={this.updateExifCommand}/>
                            <label htmlFor="f">Focal length</label><input type="number" title="focal length" id="f" value={this.state.f} onChange={this.updateExifCommand}/>
                            <label htmlFor="f35">35mm equiv</label><input type="number" id="f35" title="35mm equivalent focal length" value={this.state.f35} onChange={this.updateExifCommand}/>
                        </div>
                        
                        <textarea 
                            id="setexifcommand"
                            className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                            type="text"
                            value={this.state.setexifcommand}
                            onChange={this.updateExifCommand}
                            readOnly={this.state.hidecommandinput}
                            wrap="soft"
                            rows="4"></textarea>
                        <button className="ImageDataButton" 
                            onClick={this.setexif} 
                            title="save custom exif data into the selected images"
                            disabled={!this.props.setupIsValid}>SetExif</button>


                    </div>
                        {/* <div className="Controls__section">
                            <label htmlFor="exifisset">Override EXIF lock
                            <input type="checkbox" name="exifisset" id="exifisset"  value={this.state.exifisset} onChange={this.updateExifCommand}/>
                            </label>
                        </div> */}

                    <div className="Controls__section misc" style={{border:"none"}}>
                        <label htmlFor="">
                        <span>Use SaisieMasqQT</span>
                            <input type="checkbox" 
                                id="useSaisieMasqQT" 
                                checked={this.state.useSaisieMasqQT} 
                                onChange={(e) =>this.props.setStatus({useSaisieMasqQT: !this.state.useSaisieMasqQT})}
                                title="deselect to use the older SaisieMasq"/>
                        </label>
 
                        <label htmlFor="">
                        <span>Beep on complete</span>
                            <input type="checkbox" 
                                id="beep" 
                                checked={this.state.beep} 
                                onChange={(e) =>this.props.setStatus({beep: !this.state.beep})}
                                title="beep active"/>
                        </label>
                        <label htmlFor="">
                        <span>Minimize command inputs</span>
                            <input type="checkbox" 
                                id="hidecommandinput" 
                                checked={this.state.hidecommandinput}
                                onChange={(e) =>this.props.setStatus({hidecommandinput: !this.state.hidecommandinput})}
                                title="hide command inputs"/>
                        </label>
                        <div>
                            <label htmlFor="">Max points
                                <input type="number"
                                    style={{width:"7em"}}
                                    name=""
                                    id="max3dpoints"
                                    min={0}
                                    step={1000}
                                    defaultValue={this.props.max3dpoints}/>
                            </label>
                            <button onClick={this.setMaxPoints}>Set Max Points</button>
                        </div>
                        <div>
                            <div className="Controls__section" style={{border:"none"}}>
                                <h3 style={{margin: "1em 0"}}>File Paths</h3>

                                    <p>{this.props.mm3dPath}</p>
                                    <button
                                        style={{marginBottom: "1em"}}
                                        onClick={this.props.selectMm3dPath}
                                        title="set the path for the mm3d binary">mm3d path</button>
                                    <p>{this.props.tempDir}</p>
                                    <button 
                                        style={{marginBottom: "1em"}}
                                        onClick={this.props.selectTempPath}
                                        title="set the temporary files path">temp path</button>

                            </div>
                        </div>
                        <button onClick={this.clearSettingsFiles} title="remove user settings files">Remove Settings</button>
                    </div>
                    
                </div>
                <div className="data__area">
                    <RunList mm3dRunList = {this.props.mm3dRunList}></RunList>
                    <Camera 
                        cameras={this.state.cameras} 
                        updateCameraEntry={this.updateCameraEntry}
                        saveCameraDB={this.saveCameraDB}
                        AddCamera={this.AddCamera}
                        RemoveCamera={this.RemoveCamera}>
                    </Camera>
                </div>

            </div>
        )
    }
}
export default Setup;