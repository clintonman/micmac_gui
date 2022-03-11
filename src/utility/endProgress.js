// const electron = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');

let previousMode;

export const endProgress = (who, state, code, bat, thestart, props, thecommand, myResiduals) => {
   var theend = new Date().getTime();
   var timed = (theend - thestart) / 1000;

   let result = who + " completed. " + timed + " seconds";
    if(code !== 0) {
        result += ", with errors"
    }

   let newState = {...state, procstatus: result, batchIsRunning: false};

   props.enableApp();

   if(who === "SetExif") {
       if(code === 0) {
           let val = {
               name: "SetExif", command: thecommand
           }
           props.updateMM3dRunList(val);
           newState.homolfiltermasqran = true;
       }
       return newState;
   }

   if(who === "HomolFilterMasq") {
       newState = {
           ...newState,
           homolfiltermasqran: false
       }

       if(code === 0) {
           let val = {
               name: "HomolFilterMasq",
               sh: "MasqFiltered", command: thecommand
           }
           props.updateMM3dRunList(val);
           let sourceFolder = path.join(props.tempDir, "HomolMasqFiltered");
           if( fs.existsSync(sourceFolder)) {
               newState.homolfiltermasqran = true;
            } else {
               newState.homolfiltermasqran = false;
           }
       }
       return newState;
   }

   if(who === "Tapioca") {
       newState = {
           ...newState,
           ran: false
       }

       if(code === 0) {
           let val = {name: "Tapioca", command: thecommand}
           props.updateMM3dRunList(val);
           newState.ran = true;
       }
       return newState;
   }

   if(who === "Schnaps") {
       if(code !== 0) {
           return newState;
       }

       if(code === 0) {
           let val = {name: "Schnaps", orientation: "_mini", command: thecommand}
           props.updateMM3dRunList(val);
       }
       return {
           ...newState,
           ran: true,
           SH: "_mini"
       }
   }

   if(who === "Tapas") {
       if(code === 0) {
           let val = {
               name: "Tapas",
               orientation: state.orientation,
               command: thecommand
           }
           props.updateMM3dRunList(val);
           props.updateOriCalOptions();
       }

       props.updateResidualError(myResiduals);

       // official book says use AutoCal at this point, but that results in fatal error unless OldTapas is used
       if(state.twoLens && code === 0 && state.calibration === "calibration_detail") {
           newState.mode = "Figee";
           if(code === 0) newState.caldetailran = true;
           else newState.caldetailran = false;
       }
       
       if(state.calibration === "calibration_local" && !state.twoLens) {
           newState.in_orientation_final = state.out_calibration_local;
           if(code === 0) newState.callocalran = true;
           else newState.callocalran = false;
       }

       if(state.calibration === "calibration_local" && state.twoLens) {
           previousMode = newState.mode;// save for orientation final step
           if(code === 0) newState.callocalran = true;
           else newState.callocalran = false;
       }

       if(state.calibration === "orientation_local" && state.twoLens) {
           // copy orientation detail xml file into Ori-OriLocal
           // Ori-CalDetail/AutoCalxxxx.xml to Ori-OriLocal folder

           let sourceFolder = path.join(props.tempDir, "Ori-" + state.out_calibration_detail);
           let destFolder = path.join(props.tempDir, "Ori-" + state.out_calibration_local);
           let filename = "";

           if( fs.existsSync(sourceFolder) && fs.existsSync(destFolder) ) {
               //find first file starting with AutoCal_Foc
               fs.readdirSync(sourceFolder).forEach((file) => {
                   if(file.substring(0, 11) === "AutoCal_Foc" && filename === "") {
                       filename = file;
                   }
               });

               if(filename !== "") {
                   let data = fs.readFileSync(path.join(sourceFolder, filename));
                   fs.writeFileSync(path.join(destFolder, filename), data);
               }
           }

           if(code === 0) {
               newState.orilocalran = true;
               newState.in_orientation_final = state.out_orientation_local;
           }
           else newState.orilocalran = false;

           if(previousMode) {
               newState.mode = previousMode;
           }
       }

       if(state.calibration === "orientation_final") {
           if(code === 0) newState.orifinalran = true;
           else newState.orifinalran = false;
       }

       if(state.calibration !== "orientation_final" && state.twoLens) {
           newState.in_orientation_final = newState.out_orientation_local;
       }

       return newState;

   }

   if(who==="Apericloud") {
       newState = {
           ...newState,
           plyReady: true,
           plyFile: path.join(props.tempDir, 'AperiCloud_' + state.orientation +'.ply'),
           apericloudran: false
       }

       if(code === 0) {
           let val = {
               name: "Apericloud",
               orientation: state.orientation,
               plyFile: 'AperiCloud_'+state.orientation+'.ply',
               command: thecommand
           }
           props.updateMM3dRunList(val);
           newState.apericloudran = true;
       }

       props.setPlyFile('AperiCloud_'+state.orientation+'.ply');

       return newState;
   }

   if(who==="Apericloud-Tapas") {
       newState = {
           ...newState,
           plyReady: true,
           plyFile: path.join(props.tempDir, 'AperiCloud_' + state.orientation +'.ply'),
           apericloudran: false
       }

       if(code === 0) {
           let val = {
               name: "Apericloud",
            //    orientation: state.out_orientation_final,
            //    plyFile: 'AperiCloud_'+state.out_orientation_final+'.ply',
               orientation: state.in_orientation_apericloud,
               plyFile: 'AperiCloud_'+state.in_orientation_apericloud+'.ply',
               command: thecommand
           }
           props.updateMM3dRunList(val);
           newState.apericloudran = true;
       }

        //    props.setPlyFile('AperiCloud_'+state.out_orientation_final+'.ply');

           return newState;
   }

   if(who==="Apericloud-SBGlobBascule") {
       newState = {
           ...newState,
           plyReady: true,
           plyFile: path.join(props.tempDir, 'AperiCloud_' + state.orientation +'.ply'),
           apericloudran: false
       }

       if(code === 0) {
           let val = {
               name: "Apericloud",
               orientation: state.orientation,//needed for display3d?
               plyFile: 'AperiCloud_'+state.orientation+'.ply',
               command: thecommand
           }
           props.updateMM3dRunList(val);
           newState.apericloudran = true;
       }

       props.setPlyFile('AperiCloud_'+state.orientation+'.ply');

       return newState;
   }

   if(who === "SaisieMasqQT-AperiCloud") {
       if(code === 0) {
           let val = {
               name: "SaisieMasqQT",
               orientation: state.orientation
           }
           props.updateMM3dRunList(val);
       }
   }

   if(who === "SaisieMasqQT-SBGlobBascule") {
       if(code === 0) {
           let val = {
               name: "SaisieMasqQT",
               orientation: state.orientation
           }
           props.updateMM3dRunList(val);
       }
   }

   if(who === "SaisieBascQT") {
       if(code === 0) {
           let val = {
               name: "SaisieBascQT",
               command: thecommand
           }
           props.updateMM3dRunList(val);
       }
       return newState;
   }

   if(who === "SaisieAppuisInitQT") {
       if(code === 0) {
           let val = {
               name: "SaisieAppuisInitQT",
               command: thecommand
           }
           props.updateMM3dRunList(val);
       }
       return newState;
   }

   if(who === "SaisieAppuisPredicQT") {
       if(code === 0) {
           let val = {
               name: "SaisieAppuisPredicQT",
               command: thecommand
           }
           props.updateMM3dRunList(val);
       }
       return newState;
   }

   if(who === "GCPBascule") {
       if(code === 0) {
           let val = {
               name: "GCPBascule",
               command: thecommand
           }
           props.updateMM3dRunList(val);
       }
       return newState;
   }

   if(who === "RepLocBascule") {
       if(code === 0) {
           let val = {
               name: "RepLocBascule",
               command: thecommand
           }
           props.updateMM3dRunList(val);
       }
       return newState;
   }

   if(who === "SBGlobBascule") {
       newState = {
           ...newState,
           sbglobbasculestep1ran: false
       }

       if(code === 0) {
           let val = {
               name: "SBGlobBascule",
               orientation: state.orientationout,
               command: thecommand
           }
           newState.sbglobbasculestep1ran = true;
           props.updateMM3dRunList(val);
       }

       return newState;
   }
   if(who === "Campari") {
       newState = {
           ...newState,
           campariran: false
       }

       if(code === 0) {
           let val = {
               name: "Campari",
               orientation: state.campariout,
               command: thecommand
           }
           props.updateMM3dRunList(val);
           props.updateOriCalOptions();
           newState.campariran = true;
       }
       props.updateResidualError(myResiduals);

       return newState; 
   }

   if(who === "C3DC") {
       newState = {
           ...newState,
           plyReady: true,
           plyFile: path.join(props.tempDir, 'C3DC_' + state.mode + '.ply'),
           c3dcran: false
       }

       if(code === 0) {
           let val = {
               name: "C3DC",
               orientation: state.orientation,
               mode: state.mode,
               plyFile: 'C3DC_'+state.mode+'.ply',
               command: thecommand
           }
           props.updateMM3dRunList(val);
           newState.c3dcran = true;
       }

       props.setPlyFile('C3DC_'+state.mode+'.ply')

       return newState;
   }

   if(who === "Apero2Meshlab") {
       if(code === 0) {
           let val = {
               name: "Apero2Meshlab",
               command: thecommand
           }
           props.updateMM3dRunList(val);
       }

       // raw file created does not have valid image path because images are not copied - gives error instead
       let meshlabfile = path.join(props.tempDir, "meshlabRast-" + state.orientation, "meshlabProj.mlp");

       let data = fs.readFileSync(meshlabfile, 'utf8');

       let fnregex = /fileName="/g;
       let newdata = data.replace(fnregex, 'fileName="../')

       fs.writeFileSync(meshlabfile, newdata);

       return {
           ...newState,
           stdout: "Note: on windows, non-fatal errors can be ignored.\nFatal error can come from a Tapas mode that is not RadialBasic, RadialStd or RadialExtended.",
           batchIsRunning: false
       }
   }

   if(who === "PIMs2Mnt") {
       if(code === 0) {
           let val = {
               name: "PIMs2Mnt",
               command: thecommand
           }
           props.updateMM3dRunList(val);
       }

       return newState;
   }

   if(who === "Tawny") {
       if(code === 0) {
           let val = {
               name: "Tawny",
               command: thecommand
           }
           props.updateMM3dRunList(val);
       }

       return newState;
   }

   if(who === "TiPunch") {
       newState = {
           ...newState,
           plyReady: true,
        //    plyDisplayFile: path.join(props.tempDir, 'C3DC_' + state.mode +'_mesh.ply'),
           plyDisplayFile: path.join(props.tempDir, 'C3DC_' + state.mode + '_poisson_depth' + state.depth + '.ply'),
           tipunchran: false
       }

       if(code === 0) {
           let val = {
               name: "TiPunch",
               depth: state.depth,
               mode: state.mode,
            //    plyFile: 'C3DC_' + state.mode +'_mesh.ply',
               plyFile: 'C3DC_' + state.mode + '_poisson_depth' + state.depth + '.ply',
               command: thecommand
           }
           props.updateMM3dRunList(val);
           newState.tipunchran = true;
       }

       props.setPlyFile(state.plyFile);

       return newState;
   }

   if(who === "Tequila") {
       newState = {
           ...newState,
           plyReady: true,
           plyDisplayFile: path.join(props.tempDir, state.plyFile),
           tequilaran: false
       }

       if(code === 0) {
           let val = {
               name: "Tequila",
               orientation: state.orientation,
               command: thecommand
           }
           props.updateMM3dRunList(val);
           newState.tequilaran = true;
       }
       
       return newState;
   }
   
   return newState;
}
