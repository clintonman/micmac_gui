const electron = window.require('electron');
const fs = window.require('fs');
const path = window.require('path');

var ipcRenderer = electron.ipcRenderer;

export const updateMaskStatus = function() {
// console.log("updateMaskStatus")
// console.log(this)
  if(this.state.imageList.length === 0) return;

  const newImageList = [...this.state.imageList];
  let maskFound = false;
  newImageList.forEach(img => {

    let basename = path.basename(img.name, ".jpg");

    let tifname = path.join(this.state.tempDir, basename + "_Masq.tif")

    if(fs.existsSync(tifname)) {
      maskFound = true;
      img.masked = true;
    }

    basename = path.basename(img.name, ".JPG");

    tifname = path.join(this.state.tempDir, basename + "_Masq.tif")

    if(fs.existsSync(tifname)) {
      maskFound = true;
      img.masked = true;
    }
  });

  if(!maskFound) return;

  this.setState({
    ...this.state,
    imageList: newImageList
  })
};

//res and selected are already sorted at this point

export const computeImageRegEx = function(res, selected) {
    const newImageListLocal = [];
    let number = 0;
    let min = 0;

    updateMaskStatus.apply(this);

    if (selected.every(val => val === false)) {
      return "empty selection";
    }

    let filenumberArray = [];

    const MatchFileNumberMinIndex = (filecount) => {
      return filecount.key === fullname + min;
    };

    const UpdateFileNumMinMax = (filenums)=>{
      if (filenums.key === fullname + min) {
        if (filenums.max < number) {
          filenums.max = number;
        }

        if (filenums.min > number) {
          filenums.min = number;
        } 
      }
    };

    for (let i=0;i<res.length;i++) {
      let datastring = path.basename(res[i]);
      newImageListLocal.push({name: datastring});
      var extArray = datastring.split(".");
      //capture a single character between a and z, zero or more times greedy
      //capture a single character between 0 and unlimited times lazy
      //capture a digit between 1 and unlmited times greedy
      //match period, file extension and end of the string
      // note \\ needed by javascript to get single \
      var matchesREstring = "^([a-zA-Z_]*)(.*?)(\\d+)\\." + extArray[extArray.length-1]+ "$";
      var matchesRE = new RegExp(matchesREstring, "");
      var fullname = ""

      //build regex based on previous captures
      if (matchesRE.test(datastring)) {
        var found = datastring.match(matchesRE);
        if (found[1]) {
          fullname += found[1];
        }
        if (found[2]) {
          fullname += found[2];
        }
        number = found[3];
        if (!selected[i]) {
          min = number;
        }
        // let index = filenumberArray.findIndex((filecount) => {
        //   return filecount.key === fullname + min;
        // });
        let index = filenumberArray.findIndex(MatchFileNumberMinIndex);
        if (index === -1 && selected[i]) {
          min = number
          filenumberArray.push({key: fullname + min, name: fullname, max: number, min: number})
        }
        // filenumberArray.forEach((filenums)=>{
        //   if (filenums.key === fullname + min) {
        //     if (filenums.max < number) {
        //       filenums.max = number;
        //     }

        //     if (filenums.min > number) {
        //       filenums.min = number;
        //     } 
        //   }
        // });
        filenumberArray.forEach(UpdateFileNumMinMax);
      }
    }

    var theext = "." + extArray[extArray.length-1];
    var fullregex = filenumberArray.reduce((acc, val, curind, arr)=>{

      // var res = acc + val.name + toRegexRange(val.min, val.max, {capture: true}) + theext;
      var res = ipcRenderer.sendSync('toregex-range', [acc, val.name, val.min, val.max, theext]);
      //convert capture () to [] - needed for tequila
      // res = res.replace("(","[");
      // res = res.replace(")","]");
      if (curind !== arr.length-1) {
        res += "|";
      }
      return res;
    },"");

    return fullregex;
  }

  export const selectDeselect = function(e, name) {
    const newImageList = [...this.state.imageList];
    let lastimageselected = this.state.lastimageselected;
    let previmageselected = this.state.lastimageselected;
    let found = newImageList.find((elem, index) => {
      if(elem.name === name) lastimageselected = index;
      return elem.name === name;
    })

    found.selected = !found.selected;

    let spread = 0;
    if(lastimageselected !== -1) {
      spread = Math.abs(lastimageselected - previmageselected);
    }

    if(spread > 1 && e.shiftKey) {
      if(lastimageselected > previmageselected) {
        for(let i = previmageselected + 1; i < lastimageselected; i++) {
          newImageList[i].selected = !newImageList[i].selected;
        }
      } else {
        for(let i = lastimageselected + 1; i < previmageselected; i++) {
          newImageList[i].selected = !newImageList[i].selected;
        }
      }
    }

    //get regex for selected images
    let res = [];
    let selected = [];
    newImageList.forEach((elem) => {
      res.push(elem.name);
      selected.push(elem.selected)
    });

    let fileregex = this.computeImageRegEx(res, selected);

    this.setState({
      ...this.state,
      imageList: newImageList,
      imageRegex: fileregex,
      lastimageselected: lastimageselected,
      regexError: false
    })
  }

  export const selectAllImages = function() {
    const oldImageList = [...this.state.imageList];
    const newImageList = oldImageList.map(imageData => {
      imageData.selected = true;
      return imageData;
    });

    //get regex for selected images
    let res = [];
    let selected = [];
    newImageList.forEach((elem) => {
      res.push(elem.name);
      selected.push(elem.selected)
    });

    let fileregex = this.computeImageRegEx(res, selected);

    this.setState({
      ...this.state,
      imageList: newImageList,
      imageRegex: fileregex,
      regexError: false
    });
  }

  export const clearImageSelection = function() {
    const oldImageList = [...this.state.imageList];
    const newImageList = oldImageList.map(imageData => {
      imageData.selected = false;
      return imageData;
    });

    //get regex for selected images
    let res = [];
    let selected = [];
    newImageList.forEach((elem) => {
      res.push(elem.name);
      selected.push(elem.selected)
    });

    let fileregex = this.computeImageRegEx(res, selected);

    this.setState({
      ...this.state,
      imageList: newImageList,
      imageRegex: fileregex,
      regexError: false
    });
  }

  export const defaultCalibrationImageSelection = function() {
    if(!this.state.tapiocaran) return;

    const oldImageList = [...this.state.imageList];
    let count = 5;
    let res = [];
    let selected = [];
    const newImageList = oldImageList.map(imageData => {
      imageData.selected = false;
      if(count > 0) {
        imageData.selected = true;
      }
      res.push(imageData.name);
      selected.push(imageData.selected);
      count--;
      return imageData;
    });

    let fileregex = this.computeImageRegEx(res, selected);

    this.setState({
      ...this.state,
      imageList: newImageList,
      imageRegex: fileregex,
      regexError: false
    });
  }

  export const defaultMeshingImageSelection = function() {
    if(!this.state.c3dcran) return;

    const oldImageList = [...this.state.imageList];
    // let count = 10;
    const delta = oldImageList.length / 10;
    let imageindex = 0;
    let acc = 0;
    let res = [];
    let selected = [];

    oldImageList.forEach(elem => elem.selected = false);

    for(let count=0;count<10;count++) {
      oldImageList[imageindex].selected = true;
      acc += delta;
      imageindex = Math.round(acc);
    }
    const newImageList = oldImageList.map(imageData => {
      res.push(imageData.name);
      selected.push(imageData.selected);
      return imageData;
    });

    let fileregex = this.computeImageRegEx(res, selected);

    this.setState({
      ...this.state,
      imageList: newImageList,
      imageRegex: fileregex,
      regexError: false
    });
  }

  export const invertImageSelection = function() {
    const oldImageList = [...this.state.imageList];
    const newImageList = oldImageList.map(imageData => {
      if(imageData.selected) {
        imageData.selected = false;
      } else {
        imageData.selected = true;
      }
      return imageData;
    });

    //get regex for selected images
    let res = [];
    let selected = [];
    newImageList.forEach((elem) => {
      res.push(elem.name);
      selected.push(elem.selected)
    });

    let fileregex = this.computeImageRegEx(res, selected);

    this.setState({
      ...this.state,
      imageList: newImageList,
      imageRegex: fileregex,
      regexError: false
    });
  }

  export const setImageRegex = function(regex) {
    try {
      var theRegex = new RegExp(regex);
    } catch(e) {
      console.log(e)
      this.setState({
        ...this.state,
        imageRegex: regex,
        regexError: true
      });
      return;
    }

    let oldImageList = [...this.state.imageList];
    const newImageList = oldImageList.map(imageData => {
      if(theRegex.test(imageData.name)) {
        imageData.selected = true;
      } else {
        imageData.selected = false;
      }
      return imageData;
    });

    this.setState({
      ...this.state,
      imageRegex: regex,
      imageList: newImageList,
      regexError: false
    });
  }