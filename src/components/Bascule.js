import React, { Component } from 'react';

import SBGlobBascule from './SBGlobBascule';
import GCPBascule from './GCPBascule';

class Bascule extends Component {
    constructor(props) {
        super(props);
        console.log("bascule constructor");
        console.log("props", props)
        console.log(props.mm3dRunList);
        this.state = {
          ...props,
          bascule: "GCPBascule"
        //   bascule: "SBGlobBascule"
        }
    }

    changebascule = (event) => {
      let newval = event.target.value;

      this.setState({
        ...this.state,
        bascule: newval
      });
    }

    componentWillReceiveProps(nextProps) {
      console.log("nextProps", nextProps);

      const newState = {
          ...this.state,
          ...nextProps
      };
      this.fileregex = nextProps.imageRegex;
      this.setState(newState);
  }

    render() {
      console.log("bascule")
      let myprops = {...this.props};
      console.log(myprops)
        return(
            <div>
                <h1>Bascule <span style={{fontSize: '0.5em'}}>optional global orientation</span></h1>
                <fieldset disabled={this.props.appDisabled}>
                <label htmlFor="">
                    <input 
                        type="radio"  
                        value="SBGlobBascule" 
                        id="SBGlobBascule" 
                        checked={this.state.bascule==="SBGlobBascule"} 
                        onChange={this.changebascule} />
                    SBGlobBascule 
                </label><br></br>
                <label htmlFor="">
                    <input 
                        type="radio"  
                        value="GCPBascule" 
                        id="GCPBascule" 
                        checked={this.state.bascule==="GCPBascule"} 
                        onChange={this.changebascule} />
                    GCPBascule 
                </label>

                <div>
                    <SBGlobBascule
                    {...this.state}>
                    </SBGlobBascule>

                    <GCPBascule
                    {...this.state}>
                    </GCPBascule>
                </div>
                </fieldset>
                <div className="notes">
                    if image is small masking will fail or crash, if fail can keep trying if crash must manually kill it
                </div>
            </div>
        )
    }
}

export default Bascule;