import {endProgress as endProgressTemp} from './endProgress';
import {displayProgress as displayProgressTemp} from './displayProgress';

//
// End Process
//

export const endProgress = endProgressTemp;

//
// Progress
//

export const displayProgress = displayProgressTemp;

//
// Errors
//

export const displayErrors = (who, state, data, bat) => {
    console.log("ERROR WILL ROBINSON: ", data.toString(),"END WILL ROBINSON ERROR");
    var tempErr = state.stderr;

    //Sony exif error filter out
    var tapiocaCheck = data.toString();
    if(tapiocaCheck.includes("Offset of directory Sony1, entry 0x2001 is out of bounds")) {
        return {...state, stderr:tempErr}
    }

    return {
        ...state,
        stderr: tempErr + "ERROR: \n" + data.toString() + "END ERROR\n"
    };
}