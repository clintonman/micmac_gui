import React from 'react';
import { displayProgress, displayErrors, endProgress } from '../../utility/batch';
import { prepSaisieMasq } from '../../utility/mmutil';

const electron = window.require('electron');
const shell = electron.shell;

const fs = window.require('fs');
const path = window.require('path');
const rimraf = window.require('rimraf');
const spawn = window.require('child_process').spawn;

export function buildcommand(newState) {
    let buildcommand = 'mm3d Tapioca ' + newState.mode + " ";

    buildcommand += '"' + this.fileregex + '"';

    if(newState.mode === "MulScale") {
        buildcommand += " " + newState.SmallSize;
    }

    if(newState.Size < this.props.imageWidth) {
        buildcommand += " " + newState.Size;
    } else {
        buildcommand += " -1";
    }

    if(newState.exptxt) {
        buildcommand += " ExpTxt=1";
    }
    //update schnaps, homolfiltermasq
    this.buildschnapscommand(newState);
    this.buildhomolfiltercommand(newState);

    if(newState.mode === "Line") {
        buildcommand += " " + newState.delta;
        if(newState.circle) {
            buildcommand += " Circ=1"
        }
    }
    // if(!newState.binarymode) {
    //     buildcommand += " ExpTxt=1";
    // }
    if(newState.detect !== "Sift") {
        buildcommand += " Detect=" + newState.detect;
    }
    if(newState.ratio !== 0.6) {
        buildcommand += " Ratio=" + newState.ratio;
    }

    if(newState.previouspattern) {
        buildcommand += ' Pat2="' + newState.previouspattern + '"';
    }

    newState.command = buildcommand;
}

export function buildschnapscommand(newState) {
    let schnapsCommand = 'mm3d Schnaps ' + this.fileregex;
    if(newState.homolfiltermasqran) {
        schnapsCommand += " HomolIn=MasqFiltered";
    }
    schnapsCommand += (newState.NbWin !== 1000 ? " NbWin=" + newState.NbWin : "");
    schnapsCommand += (newState.exptxt ? " ExpTxt=1" : "");
    newState.schnapsCommand = schnapsCommand;
}
export function buildhomolfiltercommand(newState) {
    let buildcommand = 'mm3d Tapioca HomolFilterMasq';
    buildcommand += " " + this.fileregex;
    if(newState.exptxt) {
        buildcommand += " ExpTxt=1" ;
    }
    newState.homolfiltermasqCommand = buildcommand;
}

export function clearBatchState() {
    this.batchState = {
        procstatus: "",
        stdout: "",
        stderr: "",
        elapsedTime: "00:00",
        updateRunListFile: false
    }
}

export function clearSchnaps() {
    rimraf(path.join(this.props.tempDir, "Homol_mini"), (err) => {
        this.clearBatchState();
        this.batchState.procstatus = "Homol_mini erased";
        this.batchState.updateRunListFile = false;
        this.batchState.schnapsran = false;
        if (err) {
            this.batchState.procstatus = err.message;
        }
        this.props.setStatus(this.batchState);
    });
}

export function clearTiePointFilter() {
    rimraf(path.join(this.props.tempDir, "HomolMasqFiltered"), (err) => {
        this.clearBatchState();
        this.batchState.procstatus = "HomolMasqFiltered erased";
        this.batchState.updateRunListFile = false;
        this.batchState.homolfiltermasqran = false;

        if (err) {
            this.batchState.procstatus = err.message;
        }
        this.props.setStatus(this.batchState);
    });
}

export function setPreviousPattern() {
    const newState = {...this.state};
    newState.previouspattern = this.state.imageRegex;
    this.setState(newState)
}

export function deleteFolderRecursive() {
    // maybe keep tmp folders, is faster and no real need to clear ?
    // this.props.deleteFolderRecursive(path.join(this.props.tempDir, "Tmp-MM-Dir"));
    rimraf(path.join(this.props.tempDir, "Homol"), (err) => {
        this.clearBatchState();
        this.batchState.procstatus = "Homol erased";
        this.batchState.updateRunListFile = false;
        if (err) {
            this.batchState.procstatus = err.message;
        }
        this.props.setStatus(this.batchState);
        rimraf(path.join(this.props.tempDir, "Homol_SRes"), (err) => {
            this.clearBatchState();
            this.batchState.procstatus = "Tapioca files erased";
            this.batchState.updateRunListFile = false;
            if (err) {
                this.batchState.procstatus = err.message;
            }
            this.props.setStatus(this.batchState);
        });
        rimraf(path.join(this.props.tempDir, "Pastis"), (err) => {
            this.clearBatchState();
            this.batchState.procstatus = "Pastis files erased";
            this.batchState.updateRunListFile = false;
            if (err) {
                this.batchState.procstatus = err.message;
            }
            this.props.setStatus(this.batchState);
        });
    });

}

// https://www.30secondsofcode.org/js/s/hsl-to-rgb
const HSLToRGB = (h, s, l) => {
    s /= 100;
    l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [255 * f(0), 255 * f(8), 255 * f(4)];
  };

export function loadTiePoints(newState) {
    //NOTE: some files PixelXDimension and PixelYDimension wrong - probably because images were scaled and exif not changed
    // let xdim = this.props.imageList[0].exif.SubExif.PixelXDimension;
    // let ydim = this.props.imageList[0].exif.SubExif.PixelYDimension;

    let color = "#ffffff";
    let headersize = 8
    let datasize = 44;// vector_size(int) + pds(double) + x0 + y0 + x1 + y1(4 doubles)
    let list_size, x2, y2, x1, y1, data;
    let pastis;
    
    if(newState.exptxt) {
        pastis = path.join(this.props.tempDir, newState.tiePointsSource, "Pastis"+ this.props.imageList[newState.tieimage0].name, this.props.imageList[newState.tieimage1].name + ".txt")
    } else {
        pastis = path.join(this.props.tempDir, newState.tiePointsSource, "Pastis"+ this.props.imageList[newState.tieimage0].name, this.props.imageList[newState.tieimage1].name + ".dat")

    }

    let newsvglines = [];
    let newtiedata = [];
    if(!fs.existsSync(pastis)) {
        console.log(pastis)
        console.log("no tiepoint data")
        return {svglines: newsvglines, tiedata: newtiedata};
    }

    let rawdata = []

    if(newState.exptxt) {
        data = fs.readFileSync(pastis, {encoding:'utf8', flag:'r'});
    } else {
        data = fs.readFileSync(pastis)
    }
    
    if(data && newState.exptxt) {
        rawdata = data.split(/\n/g);//note blank line at end of file
        console.log(rawdata[0])
        for(let i=0;i<rawdata.length-1;i++) {
            let pointvals = rawdata[i].split(/\s/g);
            if(!newState.tiepointpointportrait) {
                x1 = +pointvals[0];
                y1 = +pointvals[1];
                x2 = +pointvals[2];
                y2 = +pointvals[3];
                if(this.props.imageWidth < 720) {
                    x1 += (720-this.props.imageWidth)/2;
                    x2 += (720-this.props.imageWidth)/2
                } else {
                    x1 = x1 * 720/this.props.imageWidth;
                    y1 = y1 * 480/this.props.imageHeight;
                    x2 = x2 * 720/this.props.imageWidth;
                    y2 = y2 * 480/this.props.imageHeight;
                }
            } else {
                y1 = +pointvals[0];
                x1 = +pointvals[1];
                y2 = +pointvals[2];
                x2 = +pointvals[3];
                if(this.props.imageHeight < 720) {
                    y1 += (720-this.props.imageHeight)/2;
                    y2 += (720-this.props.imageHeight)/2;
                } else {
                    y1 = y1 * 480/this.props.imageHeight;
                    x1 = 720 - x1 * 720/this.props.imageWidth;
                    y2 = y2 * 480/this.props.imageHeight;
                    x2 = 720 - x2 * 720/this.props.imageWidth;
                }
            }

            let colorArr = HSLToRGB(Math.floor(Math.random() * 360), 100, 50);
            color = 'rgb(' + colorArr[0] + ',' + colorArr[1] + ',' + colorArr[2] + ')';
    
            newtiedata.push({x1,y1,x2,y2,color})
            newsvglines.push(<line key={i}
                x1={Math.floor(x1)} y1={Math.floor(y1)}
                x2={Math.floor(x2)} y2={Math.floor(y2)}
                strokeWidth="1.5"
                stroke={color} style={{opacity:"0.75"}}
                onClick={() => DeleteTiePoint(i)}/>)
        }
    }

    if(data && !newState.exptxt) {
        list_size = data.readInt32LE(4)
        for(var i = 0; i < list_size; i++) {
            if(!newState.tiepointpointportrait) {
                x1 = data.readDoubleLE(headersize + i*datasize + 12)
                y1 = data.readDoubleLE(headersize + i*datasize + 12 + 8)
                x2 = data.readDoubleLE(headersize + i*datasize + 12 + 16)
                y2 = data.readDoubleLE(headersize + i*datasize + 12 + 24)
                if(this.props.imageWidth < 720) {
                    x1 += (720-this.props.imageWidth)/2;
                    x2 += (720-this.props.imageWidth)/2
                } else {
                    x1 = x1 * 720/this.props.imageWidth;
                    y1 = y1 * 480/this.props.imageHeight;
                    x2 = x2 * 720/this.props.imageWidth;
                    y2 = y2 * 480/this.props.imageHeight;
                }
            } else {
                y1 = data.readDoubleLE(headersize + i*datasize + 12)
                x1 = data.readDoubleLE(headersize + i*datasize + 12 + 8)
                y2 = data.readDoubleLE(headersize + i*datasize + 12 + 16)
                x2 = data.readDoubleLE(headersize + i*datasize + 12 + 24)
                if(this.props.imageHeight < 720) {
                    y1 += (720-this.props.imageHeight)/2;
                    y2 += (720-this.props.imageHeight)/2;
                } else {
                    y1 = y1 * 480/this.props.imageHeight;
                    x1 = 720 - x1 * 720/this.props.imageWidth;
                    y2 = y2 * 480/this.props.imageHeight;
                    x2 = 720 - x2 * 720/this.props.imageWidth;
                }
            }

            let colorArr = HSLToRGB(Math.floor(Math.random() * 360), 100, 50);
            color = 'rgb(' + colorArr[0] + ',' + colorArr[1] + ',' + colorArr[2] + ')';
    
            newtiedata.push({x1,y1,x2,y2,color})
            newsvglines.push(<line key={i}
                x1={Math.floor(x1)} y1={Math.floor(y1)}
                x2={Math.floor(x2)} y2={Math.floor(y2)}
                // strokeWidth="1.5"
                stroke={color} 
                className="tpsvgline" style={{opacity:"0.75"}}/>)
        }
    }
    return {svglines: newsvglines, tiedata: newtiedata}
}

export function DeleteTiePoint(id) {

    let data, pastis, pastisTextFile;

    let source = this.state.tiePointsSource;
    let image0 = this.state.imageList[this.state.tieimage0].name;
    let image1 = this.state.imageList[this.state.tieimage1].name;

    pastis = path.join(this.state.tempDir, source, "Pastis" + image0, image1 + ".dat");
    pastisTextFile = path.join(this.state.tempDir, source, "Pastis" + image0, image1 + ".txt");

    if(this.state.exptxt) {
        pastis = pastisTextFile;
    }
    
    let newsvglines = [...this.state.svglines];
    let newtiedata = [...this.state.tiedata];
    newsvglines.splice(id, 1);
    newtiedata.splice(id, 1);

    if(!fs.existsSync(pastis)) {
        console.log(pastis)
        console.log("no tiepoint data")
        return;
    }
    
    if(this.state.exptxt) {
        data = fs.readFileSync(pastis, {encoding:'utf8', flag:'r'});
    } else {
        data = fs.readFileSync(pastis)
    }
    
    if(!data) {
        return;
    }

    let rawdata = [];
    let filedata = "";
    let x0, y0, x1, y1;
    const headersize = 8
    const datasize = 44;// vector_size(int) + pds(double) + x0 + y0 + x1 + y1(4 doubles)

    if(this.state.exptxt) {
        rawdata = data.split(/\n/g);
        rawdata.splice(id, 1);
        filedata = rawdata.join("\n");
        fs.writeFileSync(pastis, filedata);
        this.setState({...this.state, svglines: newsvglines, tiedata: newtiedata});
    } else {
        let list_size = data.readInt32LE(4)
        for(var i = 0; i < list_size; i++) {
            if(i===id) continue;
            x0 = data.readDoubleLE(headersize + i*datasize + 12).toFixed(6)
            y0 = data.readDoubleLE(headersize + i*datasize + 12 + 8).toFixed(6)
            x1 = data.readDoubleLE(headersize + i*datasize + 12 + 16).toFixed(6)
            y1 = data.readDoubleLE(headersize + i*datasize + 12 + 24).toFixed(6)

            let fileline = x0 + " " + y0 + " " + x1 + " " + y1 + " 1.000000";

            filedata += fileline + "\n"; //note final file extra newline at end to match original text file
        }
        fs.writeFileSync(pastisTextFile, filedata);
        //call mm3d Txt2Dat

        var commandarraytext = ["Txt2Dat",pastisTextFile,pastis];

        const bat = spawn(this.state.mm3dPath, commandarraytext, { cwd:this.state.tempDir });

        bat.stdout.on('data', (data) => {});

        bat.stderr.on('data', (data) => {
            window.alert("Error running Txt2Dat")
        });

        bat.on('exit', (code) => {
            if(code === 0) {
                this.setState({...this.state, svglines: newsvglines, tiedata: newtiedata});
            } else {
                window.alert("Binary conversion failed.")
            }
        });
    }
}

export function mulscaleSet() {
    if(!this.props.imageWidth) {
        return;
    }

    //DocMicMac.pdf pg 48
    //"With real images, I do not recommend the value −1 but rather a value corresponding to a scaling between 0.3 and 0.5."

    let sizescale = 0.5; //between 0.3 and 0.5
    let smallscale = sizescale * 0.25; // arbitrary small scale value
    let Size = Math.round(sizescale * this.props.imageWidth);
    let SmallSize = Math.round(smallscale * this.props.imageWidth);

    const newState = {
        ...this.state,
        Size: Size,
        sizescale: sizescale,
        SmallSize: SmallSize,
        smallscale: smallscale,
    };
    this.buildcommand(newState);
    this.validatecommand(newState);

    this.setState(newState);
}

export function openSaisi() {
    var thestart = new Date().getTime();
    
    if(!this.saisiemasqimgOverride) {
        let checkarray= prepSaisieMasq("Tapioca", this.state, this.props, true);
        if(checkarray.length === 0) {
            return;
        }
    }
    var commandarraytext = this.state.saisiemasqimgCommand.split(" ");
    
    this.clearBatchState();
    this.props.setStatus(this.batchState);

    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("SaisieMasqQT", this.batchState, data, bat, thestart)
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
        if(status.updateDisplay) {
            this.props.setStatus(this.batchState);
        }
    });

    bat.stderr.on('data', (data) => {
        this.props.disableApp();//only care about errors
        let status = displayErrors("SaisieMasqQT", this.batchState, data, bat)
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.props.setStatus(this.batchState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("SaisieMasqQT", this.batchState, code, bat, thestart, this.props)
        let newImageList = [...this.state.imageList]
        let selectedIndex = newImageList.findIndex(val => {
            return val.selected
        })
        newImageList[selectedIndex].masked = true;
        this.batchState = {...this.batchState, procstatus: status.procstatus, imageList: newImageList}
        this.props.setStatus(this.batchState)
    });

}

export function processImageMasks() {
    var thestart = new Date().getTime();
    // var commandarraytext = ["HomolFilterMasq", this.state.imageRegex, "ANM=1" ];
    var commandarraytext;
    if(!this.homolfiltermasqOverride) {

        if(this.state.exptxt) {
            commandarraytext = ["HomolFilterMasq", this.state.imageRegex, "ExpTxt=1" ];
        } else {
            commandarraytext = ["HomolFilterMasq", this.state.imageRegex ];
        }
        let numselected = 0;

        if(this.state.imageList) {
            numselected = this.state.imageList.reduce((acc,val, currentIndex) => {
                if(val.selected) {
                    console.log("reducing", currentIndex)
                    return acc + 1;
                }
                return acc;
            }, 0);
        }

        if(numselected <1) {
            window.alert("Select all images first");
            return;
        }

        if(this.state.globalmask !== '') {
            commandarraytext.push('GlobalMasq="' + this.state.globalmask + '"')
        }
    } else {
        commandarraytext = this.state.homolfiltermasqCommand.split(" ");
    }

    this.props.disableApp();

    this.clearBatchState();
    this.props.setStatus(this.batchState);

    this.props.disableApp();

    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });
    this.spawnedBatch = bat;

    bat.stdout.on('data', (data) => {
        let status = displayProgress("HomolFilterMasq", this.batchState, data, bat, thestart) ;
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
        if(status.updateDisplay) {
            this.props.setStatus(this.batchState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("HomolFilterMasq", this.batchState, data, bat);
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.props.setStatus(this.batchState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("HomolFilterMasq", this.batchState, code, bat, thestart, this.props, commandarraytext.join(" "));
        if(status.homolfiltermasqran) {
            let schnapsCommand = 'mm3d Schnaps ' + this.state.imageRegex;
            schnapsCommand += " HomolIn=MasqFiltered";
            schnapsCommand += (this.state.NbWin !== 1000 ? " NbWin=" + this.state.NbWin : "");
            schnapsCommand += (this.state.exptxt ? " ExpTxt=1" : "");
            this.setState({...this.state, homolfiltermasqran: status.homolfiltermasqran, schnapsCommand});
        } else {
            this.setState({...this.state, homolfiltermasqran: status.homolfiltermasqran});
        }
        this.batchState = {...this.batchState, procstatus: status.procstatus, updateRunListFile: true}
        this.props.setStatus(this.batchState)

    });
}

export function runCommand() {
    var thestart = new Date().getTime();

    if(!this.tapiocaOverride) {
        if(this.fileregex === "") {
            window.alert("Select image files first.");
            return;
        }
        if(this.state.imageList.length === 0) {
            window.alert("Select image files first.");
            return;
        }

        if(this.state.mode === "MulScale" && this.state.Size !== -1) {
            if(this.state.SmallSize >= this.state.Size) {
                window.alert("Size must be larger then small size.");
                return;
            }
        }
        if(!this.state.exifisset) {
            if(!window.confirm("Warning: EXIF data is not set and the final solve will fail. \n\nContinue anyway?")) {
                return;
            }
        }
    }

    var commandarray = this.state.command.split(" ");

    //remove " from file regular expression
    var commandarraytext = commandarray.map(function(item){
        return item.replace(/"/g,'');
    });

    //remove mm3d from the command array
    commandarraytext.splice(0,1);

    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });
    this.batch = bat;

    this.props.saveBatch(bat);

    this.clearBatchState();
    // this.batchState.batch = bat;
    this.props.setStatus(this.batchState);

    this.props.disableApp();

    bat.stdout.on('data', (data) => {
        let status = displayProgress("Tapioca", this.batchState, data, bat, thestart)
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
        if(status.updateDisplay) {
            this.props.setStatus(this.batchState)
        }

    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("Tapioca", this.batchState, data, bat)
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.props.setStatus(this.batchState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("Tapioca", this.batchState, code, bat, thestart, this.props, this.state.command)
        if(code !== 1) {
            let newtp = this.loadTiePoints(
                {
                    ...status, 
                    imageList: this.props.imageList, 
                    tieimage0: this.state.tieimage0, 
                    tieimage1: this.state.tieimage1,
                    tiePointsSource: this.state.tiePointsSource,
                    exptxt: this.state.exptxt
                });
            this.setState({svglines: newtp.svglines, tiedata: newtp.tiedata});
        }
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, procstatus: status.procstatus, tapiocaran: status.ran, updateRunListFile: true }
        this.props.setStatus(this.batchState)
    });
}

export function runSchnaps() {
    var thestart = new Date().getTime();

    var commandarraytext;

    if(!this.schnapsOverride) {
        if(!this.props.imageList || this.props.imageList.length === 0) {
            return;
        }
        let count = this.props.imageList.reduce((acc, val) => val.selected ? acc + 1 : acc, 0);
        if(count<3) {
            return;
        }

        commandarraytext = ["Schnaps", this.state.imageRegex ];

        let SH = ""; //suffix homol
        let testSH = this.props.mm3dRunList.find(val => {
            return val.sh && (val.name === "HomolFilterMasq");
        });

        if(testSH) {
            SH = testSH.sh;
        }
        if(SH === "MasqFiltered") {
            commandarraytext.push("HomolIn=MasqFiltered")
        }
        if(this.state.NbWin !== 1000) {
            commandarraytext.push("NbWin=" + this.state.NbWin);
        }
        if(this.state.exptxt) {
            commandarraytext.push("ExpTxt=1");
        }
    } else {
        commandarraytext = this.state.schnapsCommand.split(" ");
    }

    this.clearBatchState();
    this.props.setStatus(this.batchState);
    
    this.props.disableApp();
    const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });

    bat.stdout.on('data', (data) => {
        let status = displayProgress("Schnaps", this.batchState, data, bat, thestart) ;
        this.batchState = {...this.batchState, stderr: status.stderr, stdout: status.stdout, elapsedTime: status.elapsedTime}
        if(status.updateDisplay) {
            this.props.setStatus(this.batchState);
        }
    });

    bat.stderr.on('data', (data) => {
        let status = displayErrors("Schnaps", this.batchState, data, bat);
        this.batchState = {...this.batchState, stderr: status.stderr}
        this.props.setStatus(this.batchState)
    });

    bat.on('exit', (code) => {
        let status = endProgress("Schnaps", this.batchState, code, bat, thestart, this.props, commandarraytext.join(" "));
        this.batchState = {...this.batchState, procstatus: status.procstatus, updateRunListFile: true, schnapsran: status.ran}
        this.props.setStatus(this.batchState)
        shell.beep();
    });
}

export function setFullSize() {
    const newState = {
        ...this.state,
        Size: this.props.imageWidth,
        sizescale: 1.0
    };
    this.buildcommand(newState);
    this.validatecommand(newState);

    this.setState(newState);
}


export function setTiePoint(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state};

    if(changedItem === "tieimage0") {
        newState.tieimage0 = newValue;
        let newtp = this.loadTiePoints(newState);
        newState.svglines = newtp.svglines;
        newState.tiedata = newtp.tiedata;

        let imageName = newState.imageList[newValue].name;
        newState.saisieappuisinitCommand = `mm3d SaisieAppuisInitQT "${imageName}" NONE TiePointsList.txt TiePoints.xml`;
    }
    if(changedItem === "tieimage1") {
        newState.tieimage1 = newValue;
        let newtp = this.loadTiePoints(newState);
        newState.svglines = newtp.svglines;
        newState.tiedata = newtp.tiedata;
    }
    if(changedItem === "tiepointmix") {
        newState.tiepointmix = newValue;
    }
    if(changedItem === "tiepointSkip") {
        newState.tiepointSkip = 1;
        if(newValue > 0) {
            newState.tiepointSkip = newValue;
        }
    }
    if(changedItem === "tiepointpointportrait") {
        newState.tiepointpointportrait = !newState.tiepointpointportrait;
        let newtp = this.loadTiePoints(newState);
        newState.svglines = newtp.svglines;
        newState.tiedata = newtp.tiedata;
    }

    if(changedItem === "tiePointsSource") {
        newState.tiePointsSource = newValue;
        let newtp = this.loadTiePoints(newState);
        newState.svglines = newtp.svglines;
        newState.tiedata = newtp.tiedata;
    }
    // console.log("tp source",newState.tiePointsSource)
    this.setState(newState);
}

export function updatecommand(event) {
    // console.log("tapioca updatecommand")
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state}

    if(changedItem==="mode") {
        let smallscaleDisabled = true;
        let SmallSizeDisabled = true;
        let circleDisabled = true;
        let deltaDisabled = true;
        
        if(newValue === "MulScale") {
            smallscaleDisabled = false;
            SmallSizeDisabled = false;
            circleDisabled = true;
            deltaDisabled = true;

            newState.smallscale = 0.5 * newState.sizescale;
            newState.SmallSize = Math.round(0.5 * newState.sizescale * +this.props.imageWidth);
        }

        if(newValue === "Line") {
            smallscaleDisabled = true;
            SmallSizeDisabled = true;
            circleDisabled = false;
            deltaDisabled = false;
        }
        newState.smallscaleDisabled = smallscaleDisabled;
        newState.SmallSizeDisabled = SmallSizeDisabled;
        newState.circleDisabled = circleDisabled;
        newState.deltaDisabled = deltaDisabled;
        newState.mode = newValue;
    }

    if(changedItem==="Size") {
        newState.Size = +newValue;
        newState.sizescale = +newValue / +this.props.imageWidth;
    }

    if(changedItem==="exptxt") {
        newState.exptxt = !newState.exptxt;
    }

    if(changedItem === "sizescale") {
        newState.Size = Math.round(+newValue * +this.props.imageWidth);
        newState.sizescale = +newValue;
     }

     if(changedItem==="binarymode") {
         newState.binarymode = !newState.binarymode;
     }
     
     if(changedItem==="clearHomol") {
         newState.clearHomol = !newState.clearHomol;
     }

     if(changedItem === "SmallSize") {
        newState.SmallSize = +newValue;
        newState.smallscale = +newValue / +this.props.imageWidth;
    }
     if(changedItem=== "smallscale") {
        newState.smallscale = +newValue
        newState.SmallSize = Math.round(+newValue * +this.props.imageWidth);
     }

    if(changedItem === "delta") {
        newState.delta = +newValue;
    }

    if(changedItem === "circle") {
        newState.circle = !newState.circle;
    }

    if(changedItem === "detect") {
            newState.detect = newValue;
    }
    if(changedItem === "ratio") {
        newState.ratio = +newValue;
    }

    if(changedItem==="previouspattern") {
        newState.previouspattern = newValue;
    }

    this.buildcommand(newState);

    if(changedItem==="thecommand") {
        newState.command = newValue.replace(/\n/g,'');
        this.tapiocaOverride = true;
    } else {
        this.tapiocaOverride = false;
    }

    this.validatecommand(newState);

    this.setState(newState);
}

export function updateValue(event) {
    const changedItem = event.target.id;
    const newValue = event.target.value;
    const newState = {...this.state}

    if(changedItem==="globalmask") {
        newState.globalmask = newValue;
        // newState.homolfiltermasqCommand = 'mm3d HomolFilterMasq ' + this.state.imageRegex + (newValue ? 'GlobalMasq="' + newValue + '"' : "");
        this.buildhomolfiltercommand(newState);
    }

    if(changedItem==="NbWin") {
        newState.NbWin = +newValue;

        // let SH = ""; //suffix homol
        // let testSH = this.props.mm3dRunList.find(val => {
        //     return val.sh && (val.name === "HomolFilterMasq");
        // });

        // if(testSH) {
        //     SH = testSH.sh;
        // }
        // newState.schnapsCommand = 'mm3d Schnaps ' + this.state.imageRegex + (SH === "MasqFiltered" ? " HomolIn=MasqFiltered" : "") + (newState.NbWin !== 1000 ? " NbWin=" + newState.NbWin : "");
        this.buildschnapscommand(newState);
    }

    if(changedItem==="saisiemasqimgCommand") {
        newState.saisiemasqimgCommand = newValue;
        this.saisiemasqimgOverride = true;
    }

    if(changedItem==="homolfiltermasqCommand") {
        newState.homolfiltermasqCommand = newValue.replace(/\n/g,'');
        this.homolfiltermasqOverride = true;
    }

    if(changedItem==="schnapsCommand") {
        newState.schnapsCommand = newValue.replace(/\n/g,'');
    } 

    this.setState(newState);
}

export function validatecommand(newState) {
    //validate command values
    newState.commandError = false;
    if(this.tapiocaOverride) return;
    newState.stderr = "";

    if(newState.Size < 128) {
        newState.commandError = true;
        newState.stderr += " Size smaller than 128. ";
    }
    if(newState.sizescale > 1) {
        newState.commandError = true;
        newState.stderr += " Size larger than image. ";
    }
    if(newState.smallscale > 1) {
        newState.commandError = true;
        newState.stderr += " Small size larger than image. ";
    }

    if(newState.Size <= newState.SmallSize && newState.mode === "MulScale") {
        newState.commandError = true;
        newState.stderr += " Size smaller than small size. ";
    }
    if(newState.imageList.length === 0) {
        newState.commandError = true;
        newState.stderr += " No images loaded. ";
    } else {
        let count = newState.imageList.reduce((acc, val) => val.selected ? acc + 1 : acc, 0);
        if(count === 0) {
            newState.commandError = true;
            newState.stderr += " Select at least 1 image. ";
        }
    }
}
