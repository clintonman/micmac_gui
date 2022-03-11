import React from 'react';
import setuphelp from './setup-help';
import tapiocahelp from './tapioca-help';
import tapashelp from './tapas-help';
import sbglobbasculehelp from './sbglobbascule-help';
import gcpbasculehelp from './gcpbascule-help';
import apericloudhelp from './apericloud-help';
import c3dchelp from './c3dc-help';
import tipunchhelp from './tipunch-help';
import tequilahelp from './tequila-help';

import saisiemasqhelp from './saisiemasq-help';
import display3dhelp from './display3d-help';
import imagelisthelp from './imagelist-help';

let helpstuff = {};
helpstuff = {
    // ...helpstuff,
    ...setuphelp,
    ...tapiocahelp,
    ...tapashelp,
    ...sbglobbasculehelp,
    ...gcpbasculehelp,
    ...apericloudhelp,
    ...saisiemasqhelp,
    ...c3dchelp,
    ...tipunchhelp,
    ...tequilahelp,
    ...display3dhelp,
    ...imagelisthelp
};
// console.log(display3dhelp)

//TODO add positioning code
const Help = (props) => {
    if(!props.help) return null;
    // console.log(window.innerWidth, window.innerHeight)
    // console.log(document.documentElement.clientWidth, document.documentElement.clientHeight)
    let windowArea = window.innerWidth * window.innerHeight;
    let fontSize = windowArea / 100000;
    if(fontSize < 8) fontSize = 8;
    let helpStyle = {
        top:'0',
        // right:props.help.rect.left, 
        // fontSize: fontSize + 'px',
        // left:props.help.rect.right
    }
    // let helpWidth = 0.4*window.innerWidth;
    // if(props.help.position === "left") {
    //     helpStyle.right = window.innerWidth - props.help.rect.left;
    // } else {
    //     helpStyle.left = props.help.rect.right ;
    // }

    return(
        <div className="help-display" style={helpStyle}>

                <div>
                    {helpstuff[props.help.name]}    
                </div>
            <button id="helpclosebutton">Close</button>
        </div> 
    );
}
export default Help
