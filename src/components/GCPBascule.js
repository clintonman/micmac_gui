import React, {Component} from 'react';
import Checkmark from "./Checkmark";
import * as gcpbasculeF from './methods/gcpbascule-functions';
import './GCPBascule.css';

const GCPinput = (props) => {
    let values = props.gcp.map((cp, index) => {
        // console.log(cp)
        return (
            <li key={index}>
                <label>#
                <input type="text"
                    id="name"
                    title="must be unique name"
                    value={cp.name}
                    onChange={(event) => props.updateGCPinput(event, cp, index)}/>
                </label>
                <label>X
                <input type="number"
                    id="x"
                    value={cp.x}
                    onChange={(event) => props.updateGCPinput(event, cp, index)}/>
                </label>
                
                <label>Y
                <input type="number"
                    id="y"
                    value={cp.y}
                    onChange={(event) => props.updateGCPinput(event, cp, index)}/>
                </label>

                <label>Z
                <input type="number"
                    id="z"
                    value={cp.z}
                    onChange={(event) => props.updateGCPinput(event, cp, index)}/>
                </label>
                
                <button onClick={(event) => props.deletePoint(index)} title="delete line">X</button>
            </li>
        )
    });

    return (
        <div className="pointedit">
            <ul style={{listStyleType: 'none', padding:0}}>
                {values}
            </ul>
            <button onClick={props.addPoint} 
                title="add new GCP measurement"
                data-help="GCPBasculeAddGCP" data-position="center" 
                className="contexthelp"
                onContextMenu={props.helpcontext}>Add new point</button>
            <br/>
            <button onClick={props.saveMeasurements} style={{position:'relative'}}
                title="save measurements into the project"
                data-help="SaveMeasurements" data-position="center" 
                className="contexthelp"
                onContextMenu={props.helpcontext}>
            {props.createmeasurementsran ? <Checkmark className="button-ran2"></Checkmark> : null}Create measurements files(txt and xml)</button>
        </div>
    );
}

const SaisieAppuisInit = gcpbasculeF.SaisieAppuisInit;

class GCPBascule extends Component {
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
            orientationout: "BascOri",
            measures: "Measurements-S2D.xml",
            gcpfile: "My3Dpoints.xml",
            command: 'mm3d GCPBascule "' + props.imageRegex + '" All BascOri My3Dpoints.xml Measurements-S2D.xml',
            bascule: props.bascule,
            onsitegcpfile: "",
            onsitegcpxml: "OnSiteMeasure",
            gcp:[],
            initPoints:[],
            gcpbascinitout: "GCPBascInitOut",
            thebascinitcommand: 'mm3d GCPBascule "' + props.imageRegex + '" All GCPBascInitOut OnSiteMeasure.xml InitialImageMeasurements-S2D.xml',
            gcpbascpredicout: "GCPBascPredicOut",
            thebascprediccommand: 'mm3d GCPBascule "' + props.imageRegex + '" All GCPBascPredicOut OnSiteMeasure.xml PredicImageMeasurements-S2D.xml',
            campariout: "CampariOut",
            thecampricommand: 'mm3d Campari "' + props.imageRegex + '" GCPBascPredicOut CampariOut GCP=[OnSiteMeasure.xml,0.2,PredicImageMeasurements-S2D.xml,0.5]',
            uncertainty: 0.2,
            uncertaintyPixel: 0.5,
            createmeasurementsran: false,
            gcpbascinitran: false,
            saisieappuispredicran: false,
            gcpbascpredicran: false,
            usecamparigcp: true,
            saisieappuispredicCommand: 'mm3d SaisieAppuisPredicQT "'  + props.imageRegex + ' GCPBascInitOut OnSiteMeasure.xml PredicImageMeasurements.xml',
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

        // imports GCPBascule functions

        this.addPoint = gcpbasculeF.addPoint.bind(this);
        this.buildCampriCommand = gcpbasculeF.buildCampriCommand.bind(this);
        this.buildcommand = gcpbasculeF.buildcommand.bind(this);
        this.buildSaisieAppuisPredicQTCommand = gcpbasculeF.buildSaisieAppuisPredicQTCommand.bind(this);
        this.copy2DXMLfile = gcpbasculeF.copy2DXMLfile.bind(this);
        this.deletePoint = gcpbasculeF.deletePoint.bind(this);
        this.openSaisieAppuispredicQT = gcpbasculeF.openSaisieAppuispredicQT.bind(this);
        this.openTextfile = gcpbasculeF.openTextfile.bind(this);
        this.openXMLfile = gcpbasculeF.openXMLfile.bind(this);
        this.runAppuisInit = gcpbasculeF.runAppuisInit.bind(this);
        this.runBascCommand = gcpbasculeF.runBascCommand.bind(this);
        this.runCampari = gcpbasculeF.runCampari.bind(this);
        this.selectPoint = gcpbasculeF.selectPoint.bind(this);
        this.saveMeasurements = gcpbasculeF.saveMeasurements.bind(this);
        this.setRegex = gcpbasculeF.setRegex.bind(this);
        this.updateAppuisInit = gcpbasculeF.updateAppuisInit.bind(this);
        this.updateBascInitcommand = gcpbasculeF.updateBascInitcommand.bind(this);
        this.updateBascPredicCommand = gcpbasculeF.updateBascPredicCommand.bind(this);
        this.updateCampariCommand = gcpbasculeF.updateCampariCommand.bind(this);
        this.updatecommand = gcpbasculeF.updatecommand.bind(this);
        this.updateGCPinput = gcpbasculeF.updateGCPinput.bind(this);

        this.bascinitCommandOverride = false;
        this.bascpredicCommandOverride = false;
        this.campriCommandOverride = false;
        this.saisieappuispredicOverride = false;

        this.batchState = {
            stdout: "",
            stderr: "",
            elapsedTime: "00:00",
            updateRunListFile: false
        }
        props.setStatus(this.batchState);

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

    componentWillReceiveProps(nextProps) {
        const newState = {
            ...this.state,
            ...nextProps
        }

        if(!this.bascinitCommandOverride ) {
            this.buildcommand(newState, true);
        }
        if(!this.bascpredicCommandOverride ) {
            this.buildcommand(newState, false);
        }
        if(!this.campriCommandOverride ) {
            this.buildCampriCommand(newState);
        }

        this.buildSaisieAppuisPredicQTCommand(newState);

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
            <div ref={this.lineheight} className="MicmacProc GCPBascule">
                <div className="readwritecontrols" >
                    <h1 className="contexthelp"
                        title="global orientation from ground control points"
                        data-help="GCPBasculeGeneral" data-position="center" 
                        onContextMenu={this.props.helpcontext}
                    >{this.state.gcpbasculeran ? <Checkmark className="title-ran"></Checkmark> : null}
                    GCPBascule <span style={{fontSize: '0.5em'}}>control point global</span></h1>
                    
                    <div>
                        <button onClick={this.openTextfile}
                            data-help="GCPBasculeGCPtext" data-position="center" 
                            className="contexthelp"
                            onContextMenu={this.props.helpcontext}>Open GCP text</button>
                        <label>
                            <input 
                                id="onsitegcpfile" 
                                type="text" 
                                value={this.state.onsitegcpfile}
                                onChange={this.updatecommand}
                                title="name of imported text gcp file excluding the file extension" />
                        </label>
                    </div>
                    <div>
                        <button onClick={this.openXMLfile}
                            className="contexthelp"
                            data-help="GCPBasculeGCPxml" data-position="center" 
                            onContextMenu={this.props.helpcontext}>Open GCP xml</button>
                        <label>
                            <input 
                                id="onsitegcpxml" 
                                type="text" 
                                value={this.state.onsitegcpxml}
                                onChange={this.updatecommand}
                                title="name of the imported xml gcp file excluding the file extension" />
                        </label>
                    </div>

                    <h3 style={{marginTop:"1em"}}>Measurement Points</h3>
                    <GCPinput 
                        gcp={this.state.gcp} 
                        updateGCPinput={this.updateGCPinput}
                        addPoint={this.addPoint}
                        deletePoint={this.deletePoint}
                        saveMeasurements={this.saveMeasurements}
                        createmeasurementsran={this.state.createmeasurementsran}
                        hoverhelpdelayed={this.props.hoverhelpdelayed}
                        hoverhelpoff={this.props.hoverhelpoff}
                        helpcontext={this.props.helpcontext}>
                    </GCPinput>

                    <div className='label-input_group'>
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
                </div>

                <div className="Controls">

                    <button 
                        style={{width: "60%",marginBottom: "15px"}}
                        onClick={this.copy2DXMLfile}
                        title="for loading preprocessed measurement data into PredicImageMeasurements-S2D.xml">
                            Import Final 2D Measurements File
                    </button>
                    {/* <h3 style={{width:"100%", borderTop:"1px solid yellow", margin:"10px", paddingTop:"5px", textAlign:"center"}}></h3> */}
                    <div className="endsection">
                        <h3>Define Initial 2D Image Points</h3>
                        <SaisieAppuisInit
                            gcp={this.state.gcp}
                            initPoints={this.state.initPoints}
                            selectPoint={this.selectPoint}
                            setRegex={this.setRegex}
                            updateAppuisInit={this.updateAppuisInit}
                            runAppuisInit={this.runAppuisInit}
                            hoverhelpdelayed={this.props.hoverhelpdelayed}
                            hoverhelpoff={this.props.hoverhelpoff}
                            helpcontext={this.props.helpcontext}
                            hidecommandinput={this.props.hidecommandinput}>
                        </SaisieAppuisInit>
                    </div>
                    <h3>Process Initial 2D measurements</h3>

                    <label>Orientation Out
                        <input type="text"
                            id="gcpbascinitout"
                            value={this.state.gcpbascinitout}
                            onChange={this.updateBascInitcommand}/>
                    </label>
  
                    <div className="endsection">
                    <textarea 
                        id="thebascinitcommand"
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                        value={this.state.thebascinitcommand}
                        onChange={this.updateBascInitcommand}
                        rows="4"
                        wrap="soft"></textarea>
                    <button 
                        id="doitbascinit"
                        className="contexthelp"
                        title="choose all images then press to get initial bascule"
                        onClick={() => this.runBascCommand(true)}
                        style={{position:'relative'}}
                        data-help="GCPBasculeInitRun" data-position="left" 
                        onContextMenu={this.props.helpcontext}>
                        {this.state.gcpbascinitran ? <Checkmark className="button-ran2"></Checkmark> : null}Initial Points</button>
                    </div>

                    <h3>Define 2D Points continued</h3>

                    <div className="endsection">
                        <textarea
                            className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                            id="saisieappuispredicCommand"
                            value={this.state.saisieappuispredicCommand}
                            onChange={this.updatecommand}
                            rows="4"
                            wrap="soft"></textarea>
                        <button
                            id="opensaisieappuispredictqt"
                            className="contexthelp"
                            title="select all images with measurement points visible then press to run"
                            onClick={() => {this.openSaisieAppuispredicQT()}}
                            style={{position:'relative'}}
                            data-help="SaisieAppuisPredicQT" data-position="left" 
                            onContextMenu={this.props.helpcontext}>
                            {this.state.saisieappuispredicran ? <Checkmark className="button-ran2"></Checkmark> : null}Validate Points</button>
                    </div>
                    
                    <h3>Process Final 2D measurements</h3>

                    <label htmlFor="gcpbascpredicout">Orientation Out
                        <input 
                            id="gcpbascpredicout" 
                            type="text" 
                            value={this.state.gcpbascpredicout}
                            onChange={this.updateBascPredicCommand}/>
                    </label>

                    <textarea 
                        id="thebascprediccommand"
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
                        value={this.state.thebascprediccommand}
                        onChange={this.updateBascPredicCommand}
                        rows="4"
                        wrap="soft"></textarea>
                    <button
                        id="doit"
                        className="contexthelp genbutton"
                        title="select all images then press to run final bascule"
                        onClick={() => this.runBascCommand(false)}
                        style={{position:'relative'}}
                        data-help="GCPBasculePredicRun" data-position="left" 
                        onContextMenu={this.props.helpcontext}>
                         {this.state.gcpbascpredicran ? <Checkmark className="button-ran2"></Checkmark> : null}Basc Predic</button>
                </div>

                <div className="controlscampari">
                    <h3>Apply Measurements</h3>
                    <label>Text tie points
                        <input 
                            id="exptxt" 
                            type="checkbox"
                            checked={this.state.exptxt}
                            onChange={this.updateCampariCommand}
                            title="use text tie points"
                            style={{marginBottom: "0.5em"}}
                            />
                    </label>
                    <label>Use GCP param
                        <input 
                            id="usecamparigcp" 
                            type="checkbox"
                            checked={this.state.usecamparigcp}
                            onChange={this.updateCampariCommand}
                            title="use GCP option"
                            style={{marginBottom: "0.5em"}}
                            />
                    </label>
                    <label>Orientation Out
                    <input type="text"
                        id="campariout"
                        value={this.state.campariout}
                        onChange={this.updateCampariCommand}/>
                    </label>
                    <label>measurement uncertainty
                    <input type="number"
                        id="uncertainty"
                        max="10.0" 
                        min="0.01" 
                        step="0.01"
                        value={this.state.uncertainty}
                        onChange={this.updateCampariCommand}/>
                    </label>

                    <label>pixel uncertainty
                    <input type="number"
                        id="uncertaintyPixel"
                        max="10.0" 
                        min="0.01" 
                        step="0.01"
                        value={this.state.uncertaintyPixel}
                        onChange={this.updateCampariCommand}/>
                    </label>
      
                    <div className="endsection">
                    <textarea
                        id="thecampricommand"
                        className={`command ${this.state.hidecommandinput ? "mincommand" : "height8"}`}
                        value={this.state.thecampricommand}
                        onChange={this.updateCampariCommand}
                        rows="8"
                        wrap="soft"></textarea>
                    <button onClick={this.runCampari} style={{position:'relative'}}
                        title="Campari is a tool for compensation of heterogeneous measures (tie points and ground control points). By default, the bundle adjustment computed by Campari only affects camera orientation."
                        className="contexthelp" data-help="Campari" data-position="left" 
                        onContextMenu={this.props.helpcontext}>
                    {this.state.gcpbasculeran ? <Checkmark className="button-ran2"></Checkmark> : null}Run Campari</button>
                    </div>
                    
                    <button onClick={() => this.props.history.push("/apericloud")}>3D Preview</button>

                </div>

            </div>
        )
    }
}

export default GCPBascule