import React from 'react';

let myResiduals;

export const displayProgress = (who, state, data, bat, thestart) => {
   var datastring = data.toString();
   let errorText = state.stderr;

   var tempOutLength = state.stdout.length;
   var tempOutBufferSize = 4096;

   let tempOut = state.stdout
    tempOut = state.stdout.substring(tempOutLength-tempOutBufferSize, tempOutLength);

   var tempErr = state.stderr;

   let needToPressEnter = false;

   var elapsedTimeRawSeconds = (new Date().getTime() - thestart) / 1000;
   let seconds = Math.floor(elapsedTimeRawSeconds % 60);
   let minutes = Math.floor(elapsedTimeRawSeconds / 60);
   let hours = Math.floor(minutes / 60);
   minutes = minutes - hours * 60;
   let elapsedTime = (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
   if(hours > 0) {
       elapsedTime = hours + ":" + elapsedTime;
   }


   if(who === "SetExif") {
       tempOut += data.toString()
   }


       if(who === "Tapas" || who==="Campari") {
           //RES:[kermit000.jpg][C] ER2 0.436916 Nn 96.2567 Of 374 Mul 184 Mul-NN 177 Time 0.02
               //| |  Residual = 0.470093 ;; Evol, Moy=2.35838e-06 ,Max=4.87034e-06
               //| |  Worst, Res 0.748274 for kermit006.jpg,  Perc 67.3913 for kermit006.jpg
               //| |  Cond , Aver 4.35403 Max 58.2671 Prop>100 0
               //--- End Iter 3 STEP 3
           // TODO make not mutate, is named array, see if this works - nope
           myResiduals = state.residuals; // mutate
           var dataArray = datastring.split("\n");
           tempOut = state.stdout;
           let er2 = state.er2;
           let nn = state.nn;
   
           let ext$ = state.simpleRegex.split("*")[1];
           let ext = "";
           if(ext$) {
               ext = ext$.split("$")[0];
           }
   
           //note need double \ for javascript
           // eslint-disable-next-line
           var matchesResidualstring = "^RES:\\[(.*" + ext + ")\\].*\\sER2\\s(\\d*\.\\d*)\\sNn\\s(\\d*\\.\\d*)";
           var matchesResidual = new RegExp(matchesResidualstring, "");
   
           for(var i=0;i<dataArray.length;i++) {
               if (matchesResidual.test(dataArray[i])) {
                   var found = dataArray[i].match(matchesResidual);
                   if(found[2] === "NaN") {
                       er2[found[1]] = 99.9;
                   } else {
                       er2[found[1]] = found[2];
                   }
                   nn[found[1]] = found[3];
   
                   tempOut += dataArray[i] + "\n"
               }
   
               //
               //**** **** ** ArBestCam=0 => not enough tie points - TODO add error saying so
   
               let fatalError = /Sorry, the following FATAL ERROR happened/
               if(fatalError.test(dataArray[i])) {
                   errorText += dataArray[i] + "\n";
               }
   
               //fatal error came through stdout
               let matchError = /Bye\s*\(press enter\)/;
               if (matchError.test(dataArray[i])) {
                   needToPressEnter = true
               }
   
               //press enter to continue from error/warning
               let matchWarning = /Warn tape enter to continue/;
               if (matchWarning.test(dataArray[i])) {
                   needToPressEnter = true;
               }
           }
   
           const OutLine = (myprops) => {
               let color = "red";
               if(myprops.val >= 1.5) {
                   color = "red"
               } else if(myprops.val < 1.5 && myprops.val > 1.0) {
                   color = "blue"
               } else {
                   color = "green"
               }
   
               let color2 = "orange";
               if(myprops.val2 > 95) {
                   color2 = "green"
               }
   
               let changedValue=false;

               if(myResiduals[myprops.image] && Math.abs(myResiduals[myprops.image] - myprops.val) > 0.001) {
                   changedValue=true;
               }
               myResiduals[myprops.image] = myprops.val;// in original mutate this array then replacing in state

               return(
                   <li style={{listStyle: 'none'}}>
                       [{myprops.image}] ER2: <span style={{'color': color, 'fontWeight': changedValue ? 'bold':'normal'}}>{myprops.val.toFixed(3)}</span>, Nn: <span style={{'color': color2}}>{myprops.val2.toFixed(2)}</span>
                   </li>
               );
           }
   
           const OutLines = () => {
               let mykeys = Object.keys(er2).sort();
               let mylines = mykeys.map(key => (<OutLine key={key} image={key} val={+er2[key]} val2={+nn[key]}/>))
               return (<ul>{mylines}</ul>)
           }
   
           if(needToPressEnter) {
               try{
                   bat.stdin.write("\n");
               } catch(err) {
                   console.log("unusual exit", err)
               }
           }
   
           return {
               ...state, 
               stdoutline: <OutLines />,
               er2: er2,
               nn: nn,
               stderr: errorText,
               residuals: myResiduals,
               elapsedTime: elapsedTime,
               updateDisplay: elapsedTime !== state.elapsedTime
           };
       }

       if(who==="Apericloud-Tapas") {
           tempOut += data.toString()
       }
   
       //TODO maybe make others more like tapas so can share more code and have more flexibility
       // or maybe note it is a special case -> predictable and useful output
   
       if(who === "Schnaps") {
           tempOut += data.toString()
       }
       if(who === "Tapioca-Image") {
           tempOut += data.toString()
       }
       
       if(who === "SBGlobBascule") {
           tempOut += data.toString()
       }
       if(who === "GCPBascule") {
           tempOut += data.toString()
       }
       if(who === "HomolFilterMasq") {
           tempOut += data.toString()
       }
       if(who === "SaisieBascQT") {
           tempOut += data.toString()
       }
       if(who === "SaisieMasqQT") {
           tempOut += data.toString()
       }
       
       if(who === "Apericloud") {
           tempOut += data.toString()
       }
   
       if(who === "Tequila") {
           tempOut += data.toString()
       }
   
       if(who === "C3DC") {
           // let matchesReduc2mm = /\(\d+ of \d+\)/;
           // if(matchesReduc2mm.test(datastring)) {
           //     tempOut += data.toString();
           // }
           let matchesNoguibal = /NO GUIMBAL/;
           if(matchesNoguibal.test(datastring)) {
               tempOut += data.toString()
           }
   
           let matchesReduc2mm = /Reduc2MM/;
           if(matchesReduc2mm.test(datastring)) {
               tempOut += data.toString()
           }
   
           let matchesDonemasq = /Done Masque for/;
           if(matchesDonemasq.test(datastring)) {
               tempOut += data.toString()
           }
   
           let matchesNuag = /Nuage/;
           if(matchesNuag.test(datastring)) {
               tempOut += data.toString()
           }
   
           let matchesResol = /Resol/;
           if(matchesResol.test(datastring)) {
               tempOut += data.toString()
           }
   
           let matchesSOM = /SOM GOT/;
           if(matchesSOM.test(datastring)) {
               tempOut += data.toString()
           }
       }

       if(who === "PIMs2Mnt") {
           tempOut += data.toString()
       }
       if(who === "Tawny") {
           tempOut += data.toString()
       }
   
       if(who === "TiPunch") {
           var matchesRE = /^Image/;
           if(matchesRE.test(datastring)) {
               tempOut += data.toString();
           }
   
           var matchesremov = /Remov/;
           if(matchesremov.test(datastring)) {
               tempOut += data.toString();
           }
   
           var matchesremov2 = /remov/;
           if(matchesremov2.test(datastring)) {
               tempOut += data.toString();
           }
   
           var matchesremoving = /Removing/;
           if(matchesremoving.test(datastring)) {
               tempErr = tempErr + "warning: long delay is normal behavior when filter option is used\n"
           }
   
           let matchAlreadyExists = /Do you want to replace it\? \(y\/n\)/;
           if (matchAlreadyExists.test(datastring)) {
               bat.stdin.write("y\n");
               console.log("press y and enter for replace file");
               //TODO - maybe do with popup dialog for real choice?
           }
       }
   
       if(who==="Tapioca") {
           //idea: have permanent and transitory stdout values or drive animation for ok glob and mpdcraw
           //conversion jpg to tif
           let matchesDcraw = /MpDcraw/;
           if(matchesDcraw.test(datastring)) {
               tempOut += datastring;
           }
   
           let matchesSift = /Sift/;
           if(matchesSift.test(datastring)) {
               tempOut += datastring;
           }
   
           //just to have some feedback
           let matchesOkGlob = /OK GLOB/;
           if(matchesOkGlob.test(datastring)) {
               tempOut += datastring;
           }
   
           var pointsmatchesRE = /(\d+)\spoints\s=>\s(\d+)\smatches/;
           if(pointsmatchesRE.test(datastring)) {
               var pointsfound = datastring.match(pointsmatchesRE);
               var ratio = pointsfound[2]/pointsfound[1]
   
               if(ratio > 0.9) {
                   console.log("possible error: " + ratio + data.toString())
                   tempErr = tempErr + "possible error: " + ratio  + data.toString();
               }
               tempOut += datastring;
           }
       }


   let fatalError = /Sorry, the following FATAL ERROR happened/
   if(fatalError.test(datastring)) {
       errorText += datastring + "\n";
           //fatal error came through stdout
       let matchError = /Bye\s*\(press enter\)/;
       if (matchError.test(datastring)) {
           needToPressEnter = true
       }
       tempErr = errorText
   }

   if(needToPressEnter) {
       try{
           bat.stdin.write("\n");
       } catch(err) {
           console.log("unusual exit", err)
       }
   }

   return {
       ...state, 
       stdout: tempOut,
       stderr: tempErr,
       elapsedTime: elapsedTime,
       updateDisplay: elapsedTime !== state.elapsedTime
   }
}