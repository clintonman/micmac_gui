const fs = window.require('fs');
const path = window.require('path');
const process = window.require('process');

export const prepSaisieMasq = (who, state, props, alertsActive) => {
    let commandarraytext = [];
    let selectedIndex;
    let numselected = 0;

    let theSaisie = state.useSaisieMasqQT ? "SaisieMasqQT" : "SaisieMasq"; //QT not working in linux for image masking, ply is ok

    if(who === "AperiCloud") {
        var plyfile = "AperiCloud_" + state.orientation + ".ply";

        var plyPath = path.join(props.tempDir, plyfile);
        if(!fs.existsSync(plyPath) && alertsActive) {
            window.alert(plyfile + " does not exist. Run Apericloud first");
            return [];
        }

        return ["SaisieMasqQT", plyfile];// press esc if get stuck?
    }

    if(state.imageWidth <128 && alertsActive) {
        window.alert("Image is too small to open safely");
        return [];
    }

    if(state.imageList) {
        numselected = state.imageList.reduce((acc,val, currentIndex) => {
            if(val.selected) {
                selectedIndex = currentIndex;
                return acc + 1;
            }
            return acc;
        }, 0);
    }

    if(numselected !== 1) {
        if(alertsActive)
            window.alert("Must select 1 image")
        return [];
    } 

    if(state.imageWidth <1024 && alertsActive && process.platform === 'win32') {
        if(!window.confirm("Image maybe too small to open on Windows machines. Proceed anyway?")) {
            return [];
        }
     }
    // imgPath = path.join(props.tempDir, state.imageList[selectedIndex].name);
    if(who === "Tapioca") {
        commandarraytext = [theSaisie, state.imageList[selectedIndex].name];
    }

    if(who === "SBGlobBascule") {
        // _MasqPlane - so different from Homol masking _Mask
        // commandarraytext = [theSaisie, imgPath, "Post=_MasqPlane"];
        commandarraytext = [theSaisie, state.imageList[selectedIndex].name, "Post=_MasqPlane"];
    }
    if(who === "C3DC") {
        // _MasqPlane - so different from Homol masking _Mask
        // commandarraytext = [theSaisie, imgPath, "Post=_MasqPlane"];
        commandarraytext = [theSaisie, state.imageList[selectedIndex].name, "Post=_MasqRep"];
    }

    return commandarraytext;
}