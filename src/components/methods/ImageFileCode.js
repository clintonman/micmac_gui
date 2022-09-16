import exif from "jpeg-exif";
const fs = window.require('fs');
const path = window.require('path');
const electron = window.require('electron');

const shell = electron.shell;

const xml2js = window.require('xml2js');

const spawnSync = window.require('child_process').spawnSync;

var ipcRenderer = electron.ipcRenderer;

export const imageDrop = function(rawimagepaths) {
    //test for jpg and tif extensions
    let imagepaths = rawimagepaths.filter((thepath) => {
      return ['.jpg', '.JPG', '.tif', '.TIF'].includes(path.extname(thepath))
    })
    if (imagepaths.length > 0) {
      this.res = imagepaths;
      this.startLoadingFiles = true;
      this.setState({...this.state, busy: true, procstatus:"loading images"});
    }
  }
  
  export const imageDialog = function() {
    this.res = ipcRenderer.sendSync('image-dialog', null);

    if(this.res) {
      this.startLoadingFiles = true;
      this.setState({...this.state, busy: true, procstatus:"loading images"});
    }
  }
  export const videoDialog = function (fps) {
    this.res = ipcRenderer.sendSync('video-dialog', null);

    if(this.res) {
      // this.startLoadingFiles = true;
      // this.setState({...this.state, busy: true, procstatus:"loading video images"});
      console.log("loading",this.res);
      console.log("fps",fps)
      // TODO run ffmpeg and save files where? same place
      this.startLoadingVideo = true;
      this.setState({...this.state, busy: true, procstatus:"loading video images"});
    }
  }
  export const convertVideo = function(res) {
    if (!res) {
      return;
    }

    console.log(res[0])
    console.log(this.state.fps)

    //here do ffmpeg command
    var thecommand = "C:\\Programs\\ffmpeg\\bin\\ffmpeg"
    var commandarraytext = [];
    // commandarraytext.push("C:\\Programs\\ffmpeg\\bin\\ffmpeg.exe");
    commandarraytext.push("-i");
    commandarraytext.push(res[0]);
    commandarraytext.push("-vf");
    commandarraytext.push("fps=" + this.state.fps);
    // var bn = path.basename(res[0].split(".")[0]);// TODO better way get name without extension
    var basename = path.parse(res[0]).name + "%3d.jpg";
    var fullpath = path.join(path.dirname(res[0]) ,"extracted", basename)
    console.log(basename)
    console.log(fullpath)
    commandarraytext.push(fullpath);
    console.log(commandarraytext.join(" "))

    //create extracted folder
    const extractedFolder = path.join(path.dirname(res[0]), "extracted");
    if(!fs.existsSync(extractedFolder)) {
      fs.mkdirSync(extractedFolder);
    } else {
      //TODO clear the folder contents
    }

    // const bat = spawn(this.props.mm3dPath, commandarraytext, { cwd:this.props.tempDir });
    const bat = spawnSync(thecommand, commandarraytext);
    console.log(bat)
    //if bat.status == 0 then good
    //TODO load the images
    //create array of image paths then call imageLoad
    if(bat.status !== 0) {
      // think can pass error through stdout: outState
      this.setState({...this.state, appDisabled: false, busy: false})
    }

    //get folder contents list
    let directoryItems = fs.readdirSync(extractedFolder);
    console.log(directoryItems)
    let res2 = directoryItems.map((item) => {
      return path.join(extractedFolder, item);
    });
    console.log(res2)
    // this.setState({...this.state, appDisabled: false, busy: false})
    return res2;

  }

export const imageLoad = function(res) {
    // console.log("imageload")
    if (!res) {
      return;
    }

    //create thumbnails folder
    const thumbnailsFolder = path.join(this.state.tempDir, "thumbnails");
    if(!fs.existsSync(thumbnailsFolder)) {
      fs.mkdirSync(thumbnailsFolder);
    }

    //remove images without numbers in the name
    let numRegex = /\d/;
    res = res.filter(val => {
      return numRegex.test(val)
    });

    var largestNum = 0;

    // sort numerically by base file name and find largest number
    var extArray = res[0].split(".");

    //only accept same extension as first image
    res = res.filter(val => {
      let extA = val.split(".");
      return extA[extA.length-1] === extArray[extArray.length-1];
    });
    
    res.sort((afile, bfile) => {
      //get clean base name
      // eslint-disable-next-line
      var afilebase = path.basename(afile).replace(/[^a-zA-Z0-9\._]/g,"");
      // eslint-disable-next-line
      var bfilebase = path.basename(bfile).replace(/[^a-zA-Z0-9\._]/g,"");
      
      //use regex to get numberical portion of file name
      var matchesREstring = "^([a-zA-Z_]*)(.*?)(\\d+)\\." + extArray[extArray.length-1]+ "$";
      var matchesRE = new RegExp(matchesREstring, "");

      var anumber = 0;
      var bnumber = 0;

      if (matchesRE.test(afilebase)) {
        var anummatch = afilebase.match(matchesRE);
        anumber = +anummatch[3];
      }
      if (matchesRE.test(bfilebase)) {
        var bnummatch = bfilebase.match(matchesRE);
        bnumber = +bnummatch[3];
      }
      if(anumber>largestNum) largestNum = anumber;
      if(bnumber>largestNum) largestNum = bnumber;

      return anummatch && bnummatch ? anummatch[3].localeCompare(bnummatch[3],'kn', {numeric: true}) : false;
    });

    // eslint-disable-next-line
    const resbasenameclean = res.map(val => path.basename(val).replace(/[^a-zA-Z0-9\._]/g,""));

    var largestNumLength = largestNum.toString().length;

    let selected = [];
    const cleanbasenamepadded = resbasenameclean.map((val) => {
      var newstring = '';
      var thematch;
      var matchesREstring = "^([a-zA-Z_]*)(.*?)(\\d+)\\." + extArray[extArray.length-1]+ "$";
      var matchesRE = new RegExp(matchesREstring, "");
      if (matchesRE.test(val)) {
        thematch = val.match(matchesRE);
        newstring = thematch[1] + thematch[2] + thematch[3].padStart(largestNumLength, '0');
      }
      selected.push(true);
      return newstring + "." + extArray[extArray.length-1]
    });

    //load images

    const newImageList = [];
    
    // var dimensions = sizeOf(res[0]);
    var dimensions = ipcRenderer.sendSync('size-of', res[0]);
    
    extArray = res[0].split(".");

    //compute image regex
    let fileregex = this.computeImageRegEx(cleanbasenamepadded, selected);

    //deep copy of image list
    const oldImageList = JSON.parse(JSON.stringify(this.state.imageList));

    this.setState({
      ...this.state,
      imageList: newImageList,
      imageWidth: Math.max(dimensions.width,dimensions.height),
      imageHeight: Math.min(dimensions.width,dimensions.height),
      totalNumImages: res.length,
      imageRegex: fileregex,
      simpleRegex:  ".*" + extArray[extArray.length-1],
      appDisabled: true,
      showfeedback: true,
      stdout: "",
      stderr: "",
      procstatus: "",
      exifisset: false
    });

    let lensSet = new Set();
    for (let i=0;i<res.length;i++) {
      fs.readFile(res[i], (err, data) => {
        fs.writeFile(path.join(this.state.tempDir, cleanbasenamepadded[i]), data, (err) => {
          if(err) throw(err);
          // console.log("wrote file", cleanbasenamepadded[i])
          //read exifdata must come after writing the file - it alters the data
          let exifdata = exif.fromBuffer(data);
          //search old image and use it's data if found
          let oldObject = oldImageList.find(elem => {
            return elem.name === cleanbasenamepadded[i];
          });
          if(oldObject) {
            newImageList[i] = {...oldObject};
          } else {
            newImageList[i] = {name: cleanbasenamepadded[i], selected: true, cal1: false, cal2: false, exif:exifdata, tapasRes: -1.0, masked: false};
          }
          lensSet.add( exifdata.SubExif ? +exifdata.SubExif.FocalLength : 0);
          // console.log("camera", i);
          if(i===this.state.totalNumImages-1) {
            // console.log("last image", lensSet);
            if(lensSet.size === 2) {
              window.alert("2 focal lengths found in the images");
            }
            if(lensSet.size > 2) {
              window.alert("more than 2 focal lengths found in the images");
            }
          }

          // final image check camera against database
          if(i !== res.length-1) return;
          this.setState({
            ...this.state,
            imageList: newImageList,
            imagesloaded: true
          });
          if(this.state.beep) shell.beep();

          let mm3dParentPath = path.dirname(path.dirname(this.state.mm3dPath));
          let xmluserpath = path.join(mm3dParentPath, "include", "XML_User");
          let xmlmicmacpath = path.join(mm3dParentPath, "include", "XML_MicMac");

          let parseString = xml2js.parseString;
          // let parseString = ipcRenderer.sendSync('xml2-js', 0);

          //check default database
          let xmldata, index;
          let outState = "";
          let camArray = [];
          let foundExactMatch = false;
          let cameraDB = path.join(xmlmicmacpath, 'DicoCamera.xml');
          
          if(fs.existsSync(cameraDB)) {
            xmldata = fs.readFileSync(cameraDB, 'utf8');

            parseString(xmldata, function (err, result) {
                camArray = result.MMCameraDataBase.CameraEntry;
                index = camArray.findIndex(val => {
                  return exifdata.Model === (""+val.Name).trim()
                });
                if(index !== -1) {
                  foundExactMatch = true;
                  outState += 'Found "' + camArray[index].Name + '" in the MicMac camera database.';
                } else {
                  outState += "Did not find match for " + exifdata.Model + " in the MicMac camera database.";
                  index = camArray.findIndex(val => {
                    return exifdata.Model?exifdata.Model.toLowerCase() === (""+val.Name).trim().toLowerCase():-1
                  });
                  if(index !== -1) {
                    outState += '\nFound similar "' + camArray[index].Name + '" for image exif data "' + exifdata.Model + '"'; 
                  }
                }
            });
          }
          if(foundExactMatch) {
            // display report found in default database
            this.setState({...this.state, stdout: outState, appDisabled: false, busy: false, exifisset: true})
            return;
          }
          //check user custom database
          cameraDB = path.join(xmluserpath, 'DicoCamera.xml');
          if(fs.existsSync(cameraDB)) {
            xmldata = fs.readFileSync(cameraDB, 'utf8');

            parseString(xmldata, function (err, result) {
                camArray = result.MMCameraDataBase.CameraEntry;
                index = camArray.findIndex(val => {
                  return exifdata.Model === (""+val.Name).trim()
                });
                if(index !== -1) {
                  foundExactMatch = true;
                  outState += '\nFound "' + camArray[index].Name + '" in the User camera database.';
                } else {
                  outState += "\nDid not find match for " + exifdata.Model + " in the User camera database.";
                  index = camArray.findIndex(val => {
                    return exifdata.Model?exifdata.Model.toLowerCase() === (""+val.Name).trim().toLowerCase():-1
                  });
                  if(index !== -1) {
                    outState += '\nFound similar "' + camArray[index].Name + '" for image exif data "' + exifdata.Model + '"';
                  }
                }
  
            });
          }
          if(foundExactMatch) {
            // display report found in default database
            this.setState({...this.state, stdout: outState, appDisabled: false, busy: false, exifisset: true})
            return;
          }
          //35mm equiv
          let exifisset = false;
          if(exifdata.SubExif && exifdata.SubExif.FocalLengthIn35mmFilm) {
            outState += '\nFound 35mm equivalent of ' + exifdata.SubExif.FocalLengthIn35mmFilm + 'mm in the image exif.';
            exifisset = true;
          } else {
            outState += '\n\nERROR:\nDid not find 35mm equivalent in image exif.\nCamera must be added to the database or exif data added to the images.';
          }

          this.setState({...this.state, stdout: outState, appDisabled: false, busy:false, exifisset: exifisset});

        });
      });
    }
  }