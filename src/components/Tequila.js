import React, {Component} from 'react';
import Display3D from './Display3D';
import Checkmark from './Checkmark';
import * as tequilaF from './methods/tequila-functions';



class Tequila extends Component {
    constructor(props) {
        super(props);

        this.lineheight = React.createRef();

        let c3dcmode = "QuickMac";
        let testMode = props.mm3dRunList.find(val => {
            return val.mode;
        });

        if(testMode) {
            c3dcmode = testMode.mode;
        }

        let orientationin = "All";
        let testOri = props.mm3dRunList.find(val => {
            if(val.name === "C3DC") {
                return val.orientation;
            } else {
                return false;
            }
        });

        if(testOri) {
            orientationin = testOri.orientation;
        }

        let ply = "C3DC_QuickMac_mesh.ply";
        let testPly = props.mm3dRunList.find(val => {
            return val.plyFile && val.name === "TiPunch";
        });

        if(testPly) {
            ply = testPly.plyFile;
        }

        this.fileregex = props.imageRegex;
        //convert capture () to [] - needed for tequila
        //remove - now it breaks tequila
        // this.fileregex = this.fileregex.replace("(","[");
        // this.fileregex = this.fileregex.replace(")","]");

        this.state = {
            ...props,
            plyFile: ply,
            orientation: orientationin,
            mode: "Pack",
            binarymode: true,
            optim: false,
            lambda: 0.01,
            lambdaDisabled: true,
            iter: 2,
            iterDisabled: true,
            sz: 4096,
            scale: 2,
            qual: 70,
            angle: 90,
            crit: "Angle",
            command: 'mm3d Tequila ' + props.imageRegex + ' Ori-' + orientationin + '/ C3DC_' + c3dcmode + '_mesh.ply Mode=Pack Bin=1',
            batchIsRunning: false,
            fatalErrorFlag: false,
            plyReady: false,
            plyDisplayFile: null,
            plyTexture: null,
            tempDir: props.tempDir,
            imageList: props.imageList,
            enablePLY: false,
            show3d: false,
            out: 'C3DC_' + c3dcmode + '_mesh_textured.ply',
            texture: 'C3DC_' + c3dcmode + '_mesh_UVtexture.jpg'
        }

        // imports Tequila functions

        this.buildcommand = tequilaF.buildcommand.bind(this);
        this.GetTimeStamp = tequilaF.GetTimeStamp.bind(this);
        this.plyFileDialog = tequilaF.plyFileDialog.bind(this);
        this.runCommand = tequilaF.runCommand.bind(this);
        this.updatecommand = tequilaF.updatecommand.bind(this);


        let testPrevRun = props.mm3dRunList.find(val => {
            return val.name === "Tequila";
        });
        if(testPrevRun) {
            //console.log("previous run")
            //console.log(GetTimeStamp());
            const timestamp = this.GetTimeStamp();
            this.state.out = 'C3DC_' + c3dcmode + '_mesh_textured' + timestamp + '.ply';
            this.state.texture = 'C3DC_' + c3dcmode + '_mesh_UVtexture' + timestamp + '.jpg';
            this.state.command = 'mm3d Tequila ' + props.imageRegex + ' Ori-' + orientationin + 
                                '/ C3DC_' + c3dcmode + '_mesh.ply Out=' + this.state.out + 
                                ' Mode=Pack Bin=1 Texture=' + this.state.texture;
        }

        this.batchState = {
            stdout: "",
            stdoutline: "",
            stderr: "",
            fatalErrorFlag: false,
            elapsedTime: "00:00"
        }

        this.commandOverride = false;

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
            ...nextProps
        }
        this.fileregex = nextProps.imageRegex;
        //convert capture () to [] - needed for tequila
        //no longer true?messing up tequila now
        // this.fileregex = this.fileregex.replace("(","[");
        // this.fileregex = this.fileregex.replace(")","]");
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
            <div ref={this.lineheight} className="MicmacProc Tequila">
            <div className="Controls">
                <h1 className="contexthelp"
                    title="UV texture image for a mesh"
                    data-help="TequilaGeneral" data-position="center" 
                    onContextMenu={this.props.helpcontext}>
                    {this.state.tequilaran ? <Checkmark className="title-ran"></Checkmark> : null}
                    Tequila <span style={{fontSize: '0.5em'}}>uv texture image</span>
                </h1>

                <button 
                    id="plyfiledialog" 
                    className='genbutton'
                    onClick={this.plyFileDialog}
                    title="select the ply file generated from the TiPunch run">choose ply file</button>
                <div style={{alignSelf:'center'}} id="plyfile">{this.state.plyFile}</div>
                <div className="label-input_group">
                    <label htmlFor="orientation">Orientation</label>
                    {/* <input id="orientation" type="text" 
                        value={this.state.orientation}
                        style={{width: "8em"}}
                        onChange={this.updatecommand}/> */}
                    <select 
                            name="orientation" id="orientation" 
                            title="in orientation name"
                            style={{width: "8em"}}
                            value={this.state.orientation}
                            onChange={this.updatecommand}>
                            {this.state.in_options.map((cp, index) => {
                                return <option key={index} value={cp}>{cp}</option>
                            })}
                        </select>
                </div>

                <div className="label-input_group">
                    <label htmlFor="mode">
                        <span className="contexthelp" data-help="TextureMode" data-position="right" 
                        onContextMenu={this.props.helpcontext}>Mode:</span>
                    </label>
                    <select name="mode" id="mode" 
                        value={this.state.mode} 
                        style={{width: "8em"}}
                        onChange={this.updatecommand}>
                        <option value="Pack">Pack</option>
                        <option value="Basic">Basic</option>
                    </select>
                </div>

                    <div className="graphcut">
                        <p className="contexthelp" data-help="GraphCut" data-position="right" 
                        onContextMenu={this.props.helpcontext}>Graph cut optimization</p>
                        <div className="label-input_group">
                            <label htmlFor="optim">enable</label>
                            <input id="optim" type="checkbox"
                                checked={this.state.optim}
                                onChange={this.updatecommand}
                                title="texture artifact reduction"
                                disabled={this.state.mode==="Basic"}/>
                        </div>

                        <div className="label-input_group">
                            <label htmlFor="lambda">weighting factor</label>
                            <input id="lambda" type="number" max="0.1" min="0.001" step="0.001"
                                title="lambda weighting factor"
                                value={this.state.lambda}
                                onChange={this.updatecommand}
                                disabled={this.state.lambdaDisabled}/>
                        </div>

                        <div className="label-input_group">
                            <label htmlFor="iter"># Iteration steps</label>
                            <input id="iter" type="number" min="1" 
                                value={this.state.iter}
                                onChange={this.updatecommand}
                                disabled={this.state.iterDisabled}/>
                        </div>
                    </div>

                    <div className="label-input_group">
                        <label htmlFor="sz">Max texture size</label>
                        <input id="sz" type="number" min="128" 
                            value={this.state.sz}
                            onChange={this.updatecommand}/>
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
                        <label htmlFor="qual">JPG quality</label>
                        <input id="qual" type="number" max='100' min="10" 
                            value={this.state.qual}
                            onChange={this.updatecommand}/>
                    </div>
                    <div className="label-input_group">
                        <label htmlFor="angle">
                            <span className="contexthelp" data-help="Angle" data-position="right" 
                            onContextMenu={this.props.helpcontext}>Max angle</span>
                        </label>
                        <input 
                            id="angle" type="number" max='180' min="-180" 
                            value={this.state.angle}
                            onChange={this.updatecommand}
                            title='max angle between face normal and viewing direction'/>
                    </div>

                    <div className="label-input_group">
                        <label htmlFor="crit">
                            <span className="contexthelp" data-help="TequilaCrit" data-position="right" 
                            onContextMenu={this.props.helpcontext}>Texture choice criteria</span>
                        </label>
                        <select name="crit" id="crit" title="texture choosing criteria"
                            value={this.state.crit}
                            style={{width: "8em"}}
                            onChange={this.updatecommand}>
                            <option value="Angle">Angle</option>
                            <option value="Stretch">Stretch</option>
                            <option value="AAngle">AAngle</option>
                        </select>
                    </div>

                    <div className="label-input_group">
                        <label htmlFor="binarymode">Binary</label>
                        <input 
                            id="binarymode"
                            type="checkbox"
                            checked={this.state.binarymode}
                            onChange={this.updatecommand}
                            title="create binary format ply point cloud file"/>
                    </div>

                <label htmlFor=""><span style={{display:"inline-block", width:"4em"}}>Out</span>
                <input type="text"
                    id="out"
                    title="output ply file"
                    value={this.state.out}
                    style={{width: "24em"}}
                    onChange={this.updatecommand}/></label>

                <label htmlFor=""><span style={{display:"inline-block", width:"4em"}}>Texture</span>
                <input type="text"
                    id="texture"
                    title="texture must be unique for each run to display properly"
                    value={this.state.texture}
                    style={{width: "24em"}}
                    onChange={this.updatecommand}/></label>

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
                    title="choose subset of images and run">
                    {this.state.tequilaran ? <Checkmark className="button-ran2"></Checkmark> : null}Run</button>
            </div>
                <Display3D 
                    plyReady={this.state.plyReady}
                    plyFile={this.state.plyDisplayFile}
                    doMesh={true}
                    doLighting={true}
                    plyTexture={this.state.plyTexture}
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

export default Tequila