import React, {Component} from 'react';
import Display3D from './Display3D';
import Checkmark from './Checkmark';
import { prepSaisieMasq } from '../utility/mmutil';
import * as sbglobF from './methods/sbglobbascule-functions';

class SBGlobBascule extends Component {
    constructor(props) {
        super(props);

        this.lineheight = React.createRef();

        let orientationin = "All";
        let testOri = props.mm3dRunList.find(val => {
            if(val.name === "Tapas") {
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
            orientationin: orientationin,
            orientationout: "Basc",
            measures: "Measurements.xml",
            postplan: false,
            distfs: 1.0,
            usedistFS: false,
            command: 'mm3d SBGlobBascule "' + props.imageRegex + '" All Measurements-S2D.xml Basc PostPlan=NONE' ,
            bascule: props.bascule,
            imageRegex: props.imageRegex,
            campariout: "SBGlobOut",
            thecampricommand: 'mm3d Campari "' + props.imageRegex + '" Basc SBGlobOut',
            sbglobbasculestep1ran: false,
            enablePLY: false,
            saisiemasqimgCommand: 'mm3d '  + (props.useSaisieMasqQT ? "SaisieMasqQT " : "SaisieMasq ") + props.imageRegex,
            saisiemasqplyCommand: 'mm3d ' + (props.useSaisieMasqQT ? "SaisieMasqQT " : "SaisieMasq ") + " AperiCloud_SBGlobOut.ply",
            saisiebascCommand: 'mm3d SaisieBascQT ' + props.imageRegex + " " + orientationin + " Measurements.xml",
            apericloudCommand: '',
            withCam: true,
            rep: 'ki',
            validrep: true,
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

        // imports SBGlobBascule functions

        this.buildapericloudcommand = sbglobF.buildapericloudcommand.bind(this);
        this.buildCampriCommand = sbglobF.buildCampriCommand.bind(this);
        this.buildcommand = sbglobF.buildcommand.bind(this);
        this.copy2DXMLfile = sbglobF.copy2DXMLfile.bind(this);
        this.openSaisi = sbglobF.openSaisi.bind(this);
        this.openSaisieBasc = sbglobF.openSaisieBasc.bind(this);
        this.openSaisieMasq = sbglobF.openSaisieMasq.bind(this);
        this.runApericloud = sbglobF.runApericloud.bind(this);
        this.runCampari = sbglobF.runCampari.bind(this);
        this.runCommand = sbglobF.runCommand.bind(this);
        this.updateCampariCommand = sbglobF.updateCampariCommand.bind(this);
        this.updatecommand = sbglobF.updatecommand.bind(this);

        let commandarray = prepSaisieMasq("SBGlobBascule", this.state, props, false);
        this.state.saisiemasqimgCommand = 'mm3d ' + commandarray.join(" ");

        this.commandOverride = false;
        this.commandOverrideCampari = false;
        this.saisiebascOverride = false;
        this.saisiemasqplyOverride = false;
        this.saisiemasqimgOverride = false;

        // this.state.apericloudCommand = 'mm3d AperiCloud ' + props.imageRegex + " " + this.state.campariout + (!this.state.withCam ? " WithCam=0" : "");
        this.buildapericloudcommand(this.state)

        this.batchState = {
            stdout: "",
            stderr: "",
            elapsedTime: "00:00"
        }
        props.setStatus(this.batchState);
        props.updateOriCalOptions();

        this.props.updateMaskButtons();
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
        const newState = {
            ...this.state,
            ...nextProps
        }

        if(!this.commandOverride) {
            this.buildcommand(newState);
        }
        if(!this.commandOverrideCampari) {
            this.buildCampriCommand(newState);
        }

        if(nextProps.imageRegex !== this.props.imageRegex) {
            newState.saisiebascCommand = 'mm3d SaisieBascQT ' + nextProps.imageRegex + " " + newState.orientationin + " Measurements.xml";
            this.saisiebascOverride = false;
            this.buildapericloudcommand(newState);
            
            let commandarray = prepSaisieMasq("SBGlobBascule", newState, nextProps, false);
            newState.saisiemasqimgCommand = 'mm3d ' + commandarray.join(" ");
            this.saisiemasqimgOverride = false;
        }


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

        return(
            <div ref={this.lineheight} className="MicmacProc SBGlobBascule">
                <div className="Controls">
                    <h1 className="contexthelp"
                        title="scene based global orientation without ground control points"
                        data-help="SBGlobBasculeGeneral" data-position="center"
                        onContextMenu={this.props.helpcontext}>
                        {this.state.sbglobbasculeran ? <Checkmark className="title-ran"></Checkmark> : null}
                        SBGlobBascule <span style={{ fontSize: '0.5em' }}>scene based global</span></h1>



                    <button onClick={this.copy2DXMLfile}
                        title="for loading preprocessed tutorial measurement data">Copy 2D File</button>

                    <div className="label-input_group">
                        <label htmlFor="orientationin">Orientation In</label>
                        <select 
                            name="orientationin" id="orientationin" 
                            title="in orientation name"
                            value={this.state.orientationin}
                            onChange={this.updatecommand}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>

                    </div>

                    <div className="endsection">
                        <textarea
                            className={`command_input ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                            id="saisiebascCommand"
                            value={this.state.saisiebascCommand}
                            onChange={this.updatecommand}
                            rows="4"
                            wrap="soft"></textarea>

                        <button id="opensaisiebasc"
                            onClick={this.openSaisieBasc}
                            title="choose points in images to define the X axis, scale and origin of the space"
                            className="contexthelp" data-help="SaisieBasc" data-position="right"
                            onContextMenu={this.props.helpcontext}>Define Points</button>
                    </div>

                    <div className="endsection">
                        <p 
                            title="mask on 1 or more images to define the ground plane"
                            style={{fontSize:"1.2em"}}
                            className="contexthelp" data-help="SaisieMasqRun" data-position="right"
                            onContextMenu={this.props.helpcontext}
                        >Create ground masks below in the image list.</p>
                    </div>

                    <div className="endsection subgrid">
                        <div className="label-input_group">
                            <label>Text tie points</label>
                            <input
                                id="exptxt"
                                type="checkbox"
                                checked={this.state.exptxt}
                                onChange={this.updatecommand}
                                title="use text format tie points" />
                        </div>
                        <div className="label-input_group">
                            <label>Ground from mask(s)</label>
                            <input
                                id="postplan"
                                type="checkbox"
                                checked={this.state.postplan}
                                onChange={this.updatecommand}
                                title="at least one mask required to define ground plane" />
                        </div>

                        <div className="label-input_group">
                            <label>Use distance fs</label>
                            <input
                                id="usedistFS"
                                type="checkbox"
                                checked={this.state.usedistFS}
                                onChange={this.updatecommand}
                                title="Ech1 and Ech2 have been measured"
                            />

                            <label>Distfs</label>
                            <input
                                id="distfs"
                                type="number"
                                value={this.state.distfs}
                                step="0.1"
                                onChange={this.updatecommand}
                                disabled={!this.state.usedistFS}
                                title="Ech1 and Ech2 on 2 or more images required for distance measurement" />
                        </div>
                        <div className="label-input_group">
                            <label htmlFor="orientationout">orientation Out</label>
                            <input
                                id="orientationout"
                                type="text"
                                value={this.state.orientationout}
                                onChange={this.updatecommand} />
                        </div>

                        <div className="label-input_group">
                            <label htmlFor="rep"
                                title="Target coordinate system (Def = ki, ie normal is vertical)"
                                style={this.state.validrep ? null : { color: 'red' }}>
                                Target coord system</label>
                            <input id="rep"
                                type="text"
                                value={this.state.rep}
                                onChange={this.updatecommand} />
                        </div>

                        <textarea
                            className={`command_input ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                            id="thecommand"
                            value={this.state.command}
                            onChange={this.updatecommand}
                            rows="4"
                            wrap="soft"></textarea>
                        <button id="doit" onClick={this.runCommand}
                            style={{ position: 'relative' }}
                            title="select all images and run to process the measurements">
                            {this.state.sbglobbasculestep1ran ? <Checkmark className="button-ran2"></Checkmark> : null}Calculate</button>
                    </div>
                    <div className="label-input_group">
                        <label>Orientation Out</label>
                        <input type="text"
                            id="campariout"
                            value={this.state.campariout}
                            onChange={this.updateCampariCommand} />
                    </div>
                    <div className="endsection">
                        <textarea
                            id="thecampricommand"
                            className={`command_input ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                            value={this.state.thecampricommand}
                            onChange={this.updateCampariCommand}
                            rows="4"
                            wrap="soft"></textarea>
                        <button onClick={this.runCampari} style={{ position: 'relative' }}
                            title="update camera orientations from the processed measurements"
                            className="contexthelp" data-help="Campari" data-position="right"
                            onContextMenu={this.props.helpcontext}>
                            {this.state.sbglobbasculeran ? <Checkmark className="button-ran2"></Checkmark> : null}Apply</button>

                    </div>

                    <div className="label-input_group">
                        <label htmlFor="withCam">Include cameras</label>
                        <input
                            id="withCam"
                            type="checkbox"
                            title="include cameras represented by points"
                            checked={this.state.withCam}
                            onChange={this.updatecommand} />
                    </div>

                    <div className="endsection">
                        <textarea
                            className={`command_input command_readonly ${this.state.hidecommandinput ? "mincommand" : "height2"}`}
                            id="apericloudCommand"
                            value={this.state.apericloudCommand}
                            onChange={this.updatecommand}
                            rows="2"
                            wrap="soft"></textarea>

                        <button id="doapericloud" onClick={this.runApericloud} style={{ position: 'relative' }}
                            title="make sparse cloud">
                            {this.state.apericloudran ? <Checkmark className="button-ran2"></Checkmark> : null} 3D Preview</button>
                    </div>
                    <textarea
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height2"}`}
                        id="saisiemasqplyCommand"
                        value={this.state.saisiemasqplyCommand}
                        onChange={this.updatecommand}
                        rows="2"
                        wrap="soft" ></textarea>

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
                    helpcontext={this.state.helpcontext}
                    in_options={this.state.in_options}
                    appDisabled={this.props.appDisabled}>
                </Display3D>

            </div>
        )
    }
}

export default SBGlobBascule