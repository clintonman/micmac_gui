import React, {Component} from 'react';
import Display3D from "./Display3D";
import Checkmark from "./Checkmark";
import * as apericloudF from './methods/apericloud-functions';

const fs = window.require('fs');
const path = window.require('path');

class Apericloud extends Component {
    constructor(props) {
        super(props);

        this.lineheight = React.createRef();

        this.fileregex = props.imageRegex

        let orientationin = "All";
        let testOri = props.mm3dRunList.find(val => {
            if(val.name === "Tapas" || val.name === "Campari") {
                return val.orientation;
            } else {
                return false;
            }
        });

        if(testOri) {
            orientationin = testOri.orientation;
        }

        this.state = {
            ...props,
            binarymode: true,
            withcam: true,
            orientation: orientationin,
            command: 'mm3d AperiCloud "' + props.imageRegex + '" ' + orientationin + ' WithCam=0',
            batchIsRunning: false,
            plyReady: false,
            plyFile: null,
            tempDir: props.tempDir,
            imageList: props.imageList,
            elapsedTime: "00:00",
            enablePLY: false,
            saisiemasqplyCommand: '',
            in_options: [""],
            exptxt: false
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

        // imports Apericloud functions

        this.buildcommand = apericloudF.buildcommand.bind(this);
        this.openSaisi = apericloudF.openSaisi.bind(this);
        this.runCommand = apericloudF.runCommand.bind(this);
        this.updatecommand = apericloudF.updatecommand.bind(this);

        this.commandOverride = false;
        this.saisiemasqplyOverride = false;

        this.state.saisiemasqplyCommand = 'mm3d ' + (props.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq") + " AperiCloud_" + orientationin + ".ply";

        this.batchState = {
            stdout: "",
            stdoutline: "",
            stderr: "",
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
            elapsedTime: "00:00"
        }
    }

    updateState = (newState) => {
        this.setState({...this.state, ...newState})
    }

    componentWillReceiveProps(nextProps) {
        const newState = {
            ...this.state,
            ...nextProps,
            Size: nextProps.imageWidth * this.state.sizescale
        }
        this.fileregex = nextProps.imageRegex;
        this.buildcommand(newState);
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
        let oriPath = path.join(this.props.tempDir, 'Ori-'+this.state.orientation);
        return(
            <div ref={this.lineheight} className="MicmacProc Apericloud">
            <div className="Controls">
                <h1 className="contexthelp"
                    title="low density cloud 3d model preview"
                    data-help="AperiCloudGeneral" data-position="center" 
                    onContextMenu={this.props.helpcontext}
                >
                    {this.state.apericloudran ? <Checkmark className="title-ran"></Checkmark> : null}
                    Apericloud <span style={{fontSize: '0.5em'}}>sparse point cloud</span></h1>
 
                <div className="label-input_group">
                    <label htmlFor="orientationin">Orientation In</label>
                        <select 
                            name="orientationin" id="orientationin" 
                            title="in orientation name"
                            value={this.state.orientation}
                            onChange={this.updatecommand}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>
                </div>

                <div className="label-input_group">
                    <label htmlFor="exptxt">Text tie points</label>
                    <input 
                        id="exptxt" 
                        type="checkbox" 
                        checked={this.state.exptxt}
                        onChange={this.updatecommand}
                        title="read text format tie points" />
                </div>
                <div className="label-input_group">
                    <label htmlFor="binarymode">Binary</label>
                    <input 
                        id="binarymode" 
                        type="checkbox" 
                        checked={this.state.binarymode}
                        onChange={this.updatecommand}
                        title="create binary format ply point cloud file" />
                </div>

                <div className="label-input_group">
                    <label htmlFor="withcam">Include cameras</label>
                    <input 
                        id="withcam" 
                        type="checkbox"
                        title="include cameras represented by points"
                        checked={this.state.withcam}
                        onChange={this.updatecommand} />
                </div>
                <div className="endsection">
                    <textarea 
                        id="command" 
                        type="text" 
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height6"}`}
                        value={this.state.command}
                        onChange={this.updatecommand}
                        rows="6"
                        wrap="soft"></textarea>
                    <button 
                        id="doit" 
                        className='primary-button'
                        onClick={this.runCommand}
                        disabled={this.state.batchIsRunning || !fs.existsSync(oriPath) }
                        title="select all images for point cloud and run"
                        style={{position:'relative'}}>
                        {this.state.apericloudran ? <Checkmark className="button-ran2"></Checkmark> : null}3D Preview</button>
                </div>

                    <textarea
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height2"}`}
                        id="saisiemasqplyCommand"
                        value={this.state.saisiemasqplyCommand}
                        onChange={this.updatecommand}
                        rows="2"
                        wrap="soft"></textarea>

                <button className="contexthelp" data-help="SaisieMasqRun" data-position="right" 
                            onContextMenu={this.props.helpcontext}
                            id="opensaisi" onClick={this.openSaisi}
                            >Make 3D mask</button><br/>
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

export default Apericloud