import React from 'react'

// const electron = window.require('electron');
const rimraf = window.require('rimraf');
const spawn = window.require('child_process').spawn;
const fs = window.require('fs');
const path = window.require('path');
var xml2js = require('xml2js');

const ClearTiePoints = (props) => {

  rimraf(path.join(props.tempDir, "Tmp-SaisieAppuis"), (err) => {
  });

  let tp2d = path.join(props.tempDir, "TiePoints-S2D.xml");

  if(fs.existsSync(tp2d)) {
    fs.unlink(tp2d, (err) => {
      if (err) throw err;
    });
  }
  
  let tp3d = path.join(props.tempDir, "TiePoints-S3D.xml");

  if(fs.existsSync(tp3d)) {
    fs.unlink(tp3d, (err) => {
      if (err) throw err;
    });
  }

  let tpl = path.join(props.tempDir, "TiePointsList.txt");

  if (fs.existsSync(tpl)) {
    fs.unlink(tpl, (err) => {
      if (err) throw err;
    });
  }

}

const UpdateTiePoints = (props) => {

  //read xml points
  let filename = path.join(props.tempDir, "TiePoints-S2D.xml");

  if(!fs.existsSync(filename)) {
      window.alert("TiePoints-S2D.xml file does not exist.")
      return;
  }

  var parser = new xml2js.Parser();
  let x0, y0, x1, y1;

  fs.readFile(filename, (err, data) => {
    parser.parseString(data, (err, result) => {
      console.log(result);
      let image0data = result.SetOfMesureAppuisFlottants.MesureAppuiFlottant1Im[0];
      let image1data = result.SetOfMesureAppuisFlottants.MesureAppuiFlottant1Im[1];
      let image0 = image0data.NameIm[0];
      let image1 = image1data.NameIm[0];
      console.log(image0)
      console.log(image1)
      let filedata = "";
      if(image0data.OneMesureAF1I.length !== image1data.OneMesureAF1I.length) {
        window.alert("Unequal number of validated points. Run Edit to validate points.");
        return;
      }
      for(let i=0;i<image0data.OneMesureAF1I.length;i++) {
        let pointsArr0 = image0data.OneMesureAF1I[i].PtIm[0].split(" ");
        let pointsArr1 = image1data.OneMesureAF1I[i].PtIm[0].split(" ");

        //need round to 6 figures and add weight value of 1.000000
        x0 = (+pointsArr0[0]).toFixed(6);
        y0 = (+pointsArr0[1]).toFixed(6);
        x1 = (+pointsArr1[0]).toFixed(6);
        y1 = (+pointsArr1[1]).toFixed(6);

        let fileline = x0 + " " + y0 + " " + x1 + " " + y1 + " 1.000000";
        // console.log(fileline);
        filedata += fileline + "\n"; //note final file extra newline at end to match original text file
      }
      // console.log(filedata)
      // let textfilename = image1 + ".txt";
      // console.log(textfilename)
      let pastisTextFile = path.join(props.tempDir, props.tiePointsSource, "Pastis" + image0, image1 + ".txt");
        fs.writeFile(pastisTextFile, filedata, (err) => {
          // window.alert("Pastis text file " + pastisTextFile + " updated");

          if(!props.exptxt) {
            // console.log("convert text to dat")
            let pastisDataFile = path.join(props.tempDir, props.tiePointsSource, "Pastis" + image0, image1 + ".dat");
            // var commandarraytext = ["mm3d","Txt2Dat",pastisTextFile,pastisDataFile];
            var commandarraytext = ["Txt2Dat",pastisTextFile,pastisDataFile];
            // console.log(commandarraytext)

            const bat = spawn(props.mm3dPath, commandarraytext, { cwd:props.tempDir });
            // console.log(bat)

            bat.stdout.on('data', (data) => {
            });

            bat.stderr.on('data', (data) => {
                window.alert("Error running Txt2Dat")
            });

            bat.on('exit', (code) => {
                if(code === 0) {
                  window.alert("Tie point file updated.")
                } else {
                  window.alert("Binary conversion failed.")
                }
                ClearTiePoints(props);
                // force redraw of points
                let ev = {};
                ev.target = {};
                ev.target.id = "tieimage0";
                ev.target.value = props.tieimage0;
                props.setTiePoint(ev);
            });
          }
      });
      
    });
  });

}

const PrepTiePoints = (props) => {
  let image0 = props.imageList[props.tieimage0].name
  let image1 = props.imageList[props.tieimage1].name

  if(image0 === image1) {
    return;
  }

  let source = props.tiePointsSource;
  let tempDir = props.tempDir;

  let pastis = path.join(tempDir, source, "Pastis" + image0, image1 + ".dat");

  if(props.exptxt) {
    pastis = path.join(tempDir, source, "Pastis" + image0, image1 + ".txt");
  }
  // console.log(pastis)
  if(!fs.existsSync(path.join(tempDir, source))) {
    window.alert("No tiepoint data found for any images found.")
    return;
  }
  if(!fs.existsSync(pastis)) {
    if(!window.confirm("No tiepoint data found.\nCreate a dummy file to work with?")) {
      return;
    } else {
      // console.log(path.resolve(__dirname));
      // console.log(__dirname);
      // console.log(path.resolve(__filename));
      // console.log(path.resolve("./"));
      // console.log(path.join(__dirname,"template","dummy.jpg.txt"))
      // console.log(process.cwd())
      // return;
      //create folder if needed
      let newfolder = path.join(tempDir, source, "Pastis" + image0)
      if(!fs.existsSync(newfolder)) {
        fs.mkdirSync(newfolder);
      }
      //copy text or binary dummy and rename it
      if(props.exptxt) {
        // fs.copyFileSync("./template/dummy.jpg.txt", pastis);
        // fs.copyFileSync(path.join(__dirname, "template", "dummy.jpg.txt"), pastis);
        
        fs.copyFileSync(path.join(path.resolve("./"), "src", "template", "dummy.jpg.txt"), pastis);
      } else {
        // fs.copyFileSync("./template/dummy.jpg.dat", pastis);
        fs.copyFileSync(path.join(path.resolve("./"), "src", "template", "dummy.jpg.dat"), pastis);
      }
    }
  }

  let headersize = 8
  let datasize = 44;// vector_size(int) + pds(double) + x0 + y0 + x1 + y1(4 doubles)
  let list_size, x1, y1, x0, y0, data;
  let rawdata = []

  if(props.exptxt) {
      data = fs.readFileSync(pastis, {encoding:'utf8', flag:'r'});
  } else {
      data = fs.readFileSync(pastis)
  }

  if(!data) {
    return;
  }

  let tplist ="";

  let obj = { SetOfMesureAppuisFlottants: [] }
  let maf0 = { MesureAppuiFlottant1Im: [] }
  let maf1 = { MesureAppuiFlottant1Im: [] }
  
  let objappend0 = []
  objappend0.push({NameIm: image0});

  let objappend1 = []
  objappend1.push({NameIm: image1});

  if(props.exptxt) {
    rawdata = data.split(/\n/g);//note blank line at end of file
    // console.log(rawdata[0])
    for(let i=0;i<rawdata.length-1;i++) {
      let onemcont0 = {};
      let onemcont1 = {};
      let pointvals = rawdata[i].split(/\s/g);
      x0 = pointvals[0];
      y0 = pointvals[1];
      x1 = pointvals[2];
      y1 = pointvals[3];

      let ptname = "tp" + i;

      onemcont0.NamePt = ptname;
      onemcont0.PtIm = x0 + " " + y0;
      objappend0.push({OneMesureAF1I: onemcont0});

      onemcont1.NamePt = ptname;
      onemcont1.PtIm = x1 + " " + y1;
      objappend1.push({OneMesureAF1I: onemcont1});

      tplist += ptname + "\n";
    }
  }

  if(!props.exptxt) {
    list_size = data.readInt32LE(4)
    for(var i = 0; i < list_size; i++) {
      let onemcont0 = {};
      let onemcont1 = {};
      x0 = data.readDoubleLE(headersize + i*datasize + 12);
      y0 = data.readDoubleLE(headersize + i*datasize + 12 + 8);
      x1 = data.readDoubleLE(headersize + i*datasize + 12 + 16);
      y1 = data.readDoubleLE(headersize + i*datasize + 12 + 24);

      let ptname = "tp" + i;

      onemcont0.NamePt = ptname;
      onemcont0.PtIm = x0 + " " + y0;
      objappend0.push({OneMesureAF1I: onemcont0});

      onemcont1.NamePt = ptname;
      onemcont1.PtIm = x1 + " " + y1;
      objappend1.push({OneMesureAF1I: onemcont1});

      tplist += ptname + "\n";
    }
  }

  maf0.MesureAppuiFlottant1Im.push(...objappend0);
  maf1.MesureAppuiFlottant1Im.push(...objappend1);
  obj.SetOfMesureAppuisFlottants.push(maf0)
  obj.SetOfMesureAppuisFlottants.push(maf1)

  var builder = new xml2js.Builder();
  var xml = builder.buildObject(obj);

  let filename = path.join(tempDir, "TiePoints-S2D.xml")
  fs.writeFile(filename, xml, (err) => {
  });

  //write dummy TiePoints-S3D.xml here ...
  // <DicoAppuisFlottant></DicoAppuisFlottant>
  obj = {DicoAppuisFlottant:""};
  xml = builder.buildObject(obj);
  filename = path.join(tempDir, "TiePoints-S3D.xml")
  fs.writeFile(filename, xml, (err) => {
  });

  //write list file
  filename = path.join(tempDir, "TiePointsList.txt")
  fs.writeFile(filename, tplist, (err) => {
  });

  //open appuise and wait

  var commandarraytext = props.saisieappuisinitCommand.split(" ");
  commandarraytext.shift();//remove mm3d from start

  const bat = spawn(props.mm3dPath, commandarraytext, { cwd:props.tempDir });

  bat.stdout.on('data', (data) => {
  });

  bat.stderr.on('data', (data) => {
      window.alert("Error running SaisieAppuisInitQT")
  });

  bat.on('exit', (code) => {
      if(code === 0) {
          WriteGlobFile(props);
      } else {
        window.alert("SaisieAppuisInitQT did not exit cleanly.")
        ClearTiePoints(props);
      }
  });

}

function WriteGlobFile(props) {
  let image0 = props.imageList[props.tieimage0].name
  let image1 = props.imageList[props.tieimage1].name

  let source = props.tiePointsSource;
  let tempDir = props.tempDir;

  let pastis = path.join(tempDir, source, "Pastis" + image0, image1 + ".dat");

  if(props.exptxt) {
    pastis = path.join(tempDir, source, "Pastis" + image0, image1 + ".txt");
  }
  console.log(pastis)
  if(!fs.existsSync(pastis)) {
    console.log("no tiepoint data")
    return;
  }


  let data;
  let dataLength;

  if(props.exptxt) {
      data = fs.readFileSync(pastis, {encoding:'utf8', flag:'r'});
  } else {
      data = fs.readFileSync(pastis)
  }

  if(!data) {
    return;
  }

  let glob = {
    SetPointGlob: {
      PointGlob: []
    }
  }

  let globappend = glob.SetPointGlob.PointGlob;

  if(props.exptxt) {
    dataLength = data.split(/\n/g).length - 1;//note blank line at end of file
  } else {
    dataLength = data.readInt32LE(4);
  }

  for(let i=0;i<dataLength;i++) {
    let ptname = "tp" + i;
    let glob = {
      Type: "eNSM_Pts",
      Name: ptname,
      NumAuto: i,
      SzRech: 3
    };
    globappend.push(glob)
  }

  let builder = new xml2js.Builder();
  let xml = builder.buildObject(glob);
  let filename = path.join(tempDir, "Tmp-SaisieAppuis", "Tmp-SL-Glob-TiePoints.xml")
  fs.writeFile(filename, xml, (err) => {
  });
}

const EditTiePoints = (event,props) => {

  var commandarraytext = props.saisieappuisinitCommand.split(" ");
  commandarraytext.shift();//remove mm3d from start

  // if(event.target.id === "tie1edit") {
  //   commandarraytext[1] = '"' + props.imageList[props.tieimage1].name + '"';
  // } else if(event.target.id === "tie0edit") {
  //   commandarraytext[1] = '"' + props.imageList[props.tieimage0].name + '"';
  // } else {
    commandarraytext[1] = '"' + props.imageList[props.tieimage1].name + '|' + props.imageList[props.tieimage0].name + '"';
  // }

  const bat = spawn(props.mm3dPath, commandarraytext, { cwd:props.tempDir });

  bat.stdout.on('data', (data) => {
  });

  bat.stderr.on('data', (data) => {
      window.alert("Error running SaisieAppuisInitQT");
  });

  bat.on('exit', (code) => {
  });
}

const SVGLines = (props) => {
    return(props.svglines ? props.svglines.filter((val, index) => {
        if(index % props.tiepointSkip === 0)
            return true;
        else
            return false;
    }) : <line x1="50" y1="50" x2="100" y2="100" stroke="red" />);
}

const SVGCircles = (props) => {
    if(!props.tiedata) return <circle cx="50" cy="50" r="4" stroke="red" fill="none" />;
    return props.tiedata.map((val,index) => {
        return (<circle 
                    key={index} 
                    cx={Math.floor(val.x1 + (val.x2-val.x1)*props.tiepointmix)} 
                    cy={Math.floor(val.y1 + (val.y2-val.y1)*props.tiepointmix)} 
                    r="2" 
                    stroke={val.color} 
                    fill={val.color}
                    className="tpsvgcircle"
                    onClick={() => props.DeleteTiePoint(index)} />)
    }).filter((val, index) => {
        if(index % props.tiepointSkip === 0)
            return true;
        else
            return false;
    })
}

const TiePoints = (props) => {
    let linevals = props.imageList.map((val, index) => {
        return (
            <option key={val.name} value={index}>{val.name}</option>
        )
    });
    

    if(linevals.length < 2) {
        return (
            <div className="TiePoints">
            <div className="imagepreview_data">
                <ul>
                    <li>NA</li>
                  <li>focal length: <br/>NA</li>
                  <li>f#: <br/>NA</li>
                  <li>shutter spd: <br/>NA</li>
                  <li>residual: <br/>NA</li>
                </ul>
              </div>
          <div className="tiepoint-image-section">

            <svg className="svg-viewbox" viewBox="0 30 220 180" >
              <defs>
                  <path
                  id="m-path"
                  d="m 51.320726,187.3773 c -3.98166,-1.0708 -6.83523,-3.22188 -8.94747,-6.7448 -2.3344,-3.8934 -2.20262,-0.0445 -2.10107,-61.36091 l 0.0913,-55.092236 0.69824,-1.844371 c 0.38402,-1.014414 1.37242,-2.886566 2.19642,-4.160334 2.42202,-3.744065 7.24519,-6.541966 12.10088,-7.01968 4.89198,-0.481282 10.38491,1.591924 14.21087,5.363634 2.46022,2.425346 3.79115,4.613176 9.87409,16.23141 2.28029,4.355286 4.58645,8.665721 5.1248,9.578785 0.53835,0.913048 2.31371,4.244287 3.94521,7.402788 1.63153,3.1585 4.43449,8.456588 6.2288,11.773544 6.137924,11.34648 8.047794,14.95017 8.047794,15.18523 0,0.65939 4.77234,8.63429 5.25946,8.78889 1.11938,0.35528 1.96267,-0.74911 5.01179,-6.56347 1.70189,-3.24533 3.09434,-5.99162 3.09434,-6.10288 0,-0.11124 1.07693,-2.1509 2.39316,-4.53255 1.31625,-2.38167 4.12676,-7.63095 6.24559,-11.665076 2.11881,-4.034128 6.34869,-12.029038 9.3997,-17.766435 3.05104,-5.737396 6.30344,-11.903283 7.22756,-13.701961 4.05501,-7.892452 6.81305,-10.816522 12.38587,-13.131435 1.59927,-0.664326 2.52069,-0.815891 5.05286,-0.83115 8.70418,-0.05245 15.183,5.202501 16.7938,13.621428 0.72149,3.770766 0.71678,107.426509 -0.005,110.833639 -1.36273,6.43254 -4.96905,10.11091 -11.55824,11.78917 -2.53298,0.64514 -7.12592,0.49434 -9.69375,-0.31828 -4.02862,-1.27491 -8.02914,-5.18199 -9.5922,-9.36819 l -0.77446,-2.07416 -0.0644,-26.67548 c -0.0487,-20.19038 -0.15943,-26.7901 -0.45558,-27.14692 -0.78549,-0.94645 -1.08343,-0.48916 -8.19959,12.58464 -1.70785,3.13766 -5.26507,9.8123 -7.90494,14.83255 -4.97296,9.45716 -6.59809,12.06146 -9.01068,14.4399 -3.70951,3.657 -10.50845,4.96157 -15.68457,3.00951 -4.570254,-1.72357 -7.692694,-5.33555 -12.490254,-14.44853 -1.62402,-3.08484 -3.6928,-6.92905 -4.59729,-8.5427 -0.90448,-1.61366 -2.2012,-3.96079 -2.88162,-5.21585 -0.68041,-1.25506 -1.77981,-3.23545 -2.44309,-4.40086 -0.66327,-1.16542 -2.05219,-3.80594 -3.08647,-5.86783 -1.03428,-2.06189 -2.25971,-4.15434 -2.72317,-4.64989 -0.76089,-0.81358 -0.89168,-0.85201 -1.34782,-0.39609 -0.44489,0.4447 -0.5246,3.58523 -0.66815,26.32825 l -0.16299,25.82332 -1.09195,2.71222 c -1.27596,3.16924 -3.87348,6.22102 -6.52193,7.66249 -3.6234,1.9721 -9.50337,2.70212 -13.37586,1.66067 z"
                  />
              </defs>
              <g>
                <g
                  id="white-group">
                  <use href="#m-path" className="slideright" />
                  <use href="#m-path" className="slideleft"/>
                </g>
                <g
                  
                  id="cyan-group">
                    <use href="#m-path" className="slideright" />
                </g>
                <g
                  id="red-group">
                    <use href="#m-path" className="slideleft"/>
                </g>
                <g
                  
                  id="purple-group">
                  <use href="#m-path" className="slideright" />
                  <use href="#m-path" className="slideleft"/>
                </g>
              </g>
          </svg>
          </div>
          <div className="imagepreview_data">
            <ul>
                <li>NA</li>
              <li>focal length: <br/>NA</li>
              <li>f#: <br/>NA</li>
              <li>shutter spd: <br/>NA</li>
              <li>residual: <br/>NA</li>
            </ul>
          </div>
        </div>
        )
    }


    let fl0 = 'NA';
    let fl35_0 = 'NA';
    let fnum0 = 'NA';
    let et0 = 'NA';
    let res0 = 'NA'
    let model0 = 'NA';
    if(props.imageList[props.tieimage0]) {
        var exifinfo0 = props.imageList[props.tieimage0].exif;
        model0 = exifinfo0.Model;
        if(exifinfo0.SubExif && exifinfo0.SubExif.FocalLength)
            fl0 = parseFloat(exifinfo0.SubExif.FocalLength).toFixed(2) ;
        if(exifinfo0.SubExif && exifinfo0.SubExif.FocalLengthIn35mmFilm)
            fl35_0 = parseFloat(exifinfo0.SubExif.FocalLengthIn35mmFilm).toFixed(2) ;
        if(exifinfo0.SubExif && exifinfo0.SubExif.FNumber)
            fnum0 = parseFloat(exifinfo0.SubExif.FNumber).toFixed(2) ;
        if(exifinfo0.SubExif && exifinfo0.SubExif.ExposureTime)
            et0 = parseFloat(exifinfo0.SubExif.ExposureTime).toFixed(3);
        res0 = parseFloat(props.imageList[props.tieimage0].tapasRes).toFixed(2);
      }
      
      let fl1 = 'NA';
      let fl35_1 = 'NA';
      let fnum1 = 'NA';
      let et1 = 'NA';
      let res1 = 'NA';
      let model1 = 'NA';
      if(props.imageList[props.tieimage1]) {
        var exifinfo1 = props.imageList[props.tieimage1].exif;
        model1 = exifinfo1.Model;
        if(exifinfo1.SubExif && exifinfo1.SubExif.FocalLength)
        fl1 = parseFloat(exifinfo1.SubExif.FocalLength).toFixed(2) ;
        if(exifinfo1.SubExif && exifinfo1.SubExif.FocalLengthIn35mmFilm)
        fl35_1 = parseFloat(exifinfo1.SubExif.FocalLengthIn35mmFilm).toFixed(2) ;
        if(exifinfo1.SubExif && exifinfo1.SubExif.FNumber)
        fnum1 = parseFloat(exifinfo1.SubExif.FNumber).toFixed(2) ;
        if(exifinfo1.SubExif && exifinfo1.SubExif.ExposureTime)
        et1 = parseFloat(exifinfo1.SubExif.ExposureTime).toFixed(3);
        res1 = parseFloat(props.imageList[props.tieimage1].tapasRes).toFixed(2);
      }
      // console.log(exifinfo0)
      // console.log(exifinfo1)
      let image0width = 720;
      let image0height = 480;
      let image1width = 720;
      let image1height = 480;

      let image0rotate = "";
      let image1rotate = "";
      //orientation 6=90, 3=180, 8=270, reverse for svg image transform
      if(exifinfo0.Orientation === 6) {
        image0rotate = "rotate(270,240,240)";
        image0width = 480;
        image0height = 720;
      }
      if(exifinfo0.Orientation === 3) {
        // image0rotate = "rotate(180,360,360)";
        // image0rotate = "rotate(180,240,240)";
        image0rotate = "rotate(180,360,240)";
      }
      if(exifinfo0.Orientation === 8) {
        image0rotate = "rotate(90,360,360)";
        image0width = 480;
        image0height = 720;
      }
      if(exifinfo1.Orientation === 6) {
        image1rotate = "rotate(270,240,240)";
        image1width = 480;
        image1height = 720;
      }
      if(exifinfo1.Orientation === 3) {
        // image1rotate = "rotate(180,360,360)";
        // image1rotate = "rotate(180,240,240)";
        image1rotate = "rotate(180,360,240)";
      }
      if(exifinfo1.Orientation === 8) {
        image1rotate = "rotate(90,360,360)";
        image1width = 480;
        image1height = 720;
      }

      // console.log(props.tiepointportrait)
      if(+props.tiepointportrait === 90) {
        console.log("manual rotate")
        image0rotate = "rotate(90,360,360)";
        image0width = 480;
        image0height = 720;
        image1rotate = "rotate(90,360,360)";
        image1width = 480;
        image1height = 720;
      }
      if(+props.tiepointportrait === 180) {
        // image0rotate = "rotate(180,360,360)";
        // image1rotate = "rotate(180,360,360)";
        image0rotate = "rotate(180,360,240)";
        image1rotate = "rotate(180,360,240)";
      }
      if(+props.tiepointportrait === 270) {
        image0rotate = "rotate(270,240,240)";
        image0width = 480;
        image0height = 720;
        image1rotate = "rotate(270,240,240)";
        image1width = 480;
        image1height = 720;
      }
    // let adjustedOpacity = Math.asin((props.tiepointmix-0.5)*2)/Math.PI + 0.5 

    // let widthheight = 'width="720" height="480"';
    // if(props.tiepointportrait) {
    //   widthheight = 'width="480" height="720" transform="rotate(90,360,360)"';
    // }

    return (
        <div className="TiePoints">
        <div className="imagepreview_data">
            <ul>
                <li>{model0}</li>
              <li>focal length: <br/><span>{fl0}</span></li>
              <li>f#: <br/><span>{fnum0}</span></li>
              <li>exp time: <br/><span>{et0}</span></li>
              <li>residual: <br/><span>{res0}</span></li>
              <li>fl 35mm: <br/><span>{fl35_0}</span></li>
            </ul>
          </div>

      <div className="tiepoint-image-section">
        <svg className="svg-viewbox" viewBox="0 0 720 480">
          <filter id="svgHueRotate1">
            <feColorMatrix type="hueRotate" values="90" />
          </filter>
          <filter id="svgHueRotate2">
            <feColorMatrix type="hueRotate" values="270" />
          </filter>
            <image
                href={'file:///' + path.join(props.tempDir, props.imageList[props.tieimage0] ? props.imageList[props.tieimage0].name : './MM.svg')}
                // width={props.tiepointportrait ? "480" : "720"}
                // height={props.tiepointportrait ? "720" : "480"}
                // transform={props.tiepointportrait ? "rotate(90,360,360)" : null}
                width={image0width}
                height={image0height}
                transform={image0rotate ? image0rotate : null}
                style={{filter: "url(#svgHueRotate1)", opacity: 1 - Math.asin((props.tiepointmix-0.5)*2)/Math.PI + 0.5 }}/>
            <image onClick={() => console.log("svg image 2")} 
                href={'file:///' + path.join(props.tempDir, props.imageList[props.tieimage1] ? props.imageList[props.tieimage1].name : './MM.svg')}
                // width={props.tiepointportrait ? "480" : "720"}
                // height={props.tiepointportrait ? "720" : "480"}
                // transform={props.tiepointportrait ? "rotate(90,360,360)" : null} 
                width={image1width}
                height={image1height}
                transform={image1rotate ? image1rotate : null}
                style={{filter: "url(#svgHueRotate2)", opacity: Math.asin((props.tiepointmix-0.5)*2)/Math.PI + 0.5}} />
            <SVGLines svglines={props.svglines} tiepointSkip={props.tiepointSkip}></SVGLines>
            <SVGCircles 
              // tiepointmix={props.tiepointmix} 
              // tiedata={props.tiedata} 
              // tiepointSkip={props.tiepointSkip}
              // DeleteTiePoint={props.DeleteTiePoint}
              {...props}></SVGCircles>
        </svg>
      
      </div>

      <div className="imagepreview_data">
        <ul>
            <li>{model1}</li>
              <li>focal length: <br/><span>{fl1}</span></li>
              <li>f#: <br/><span>{fnum1}</span></li>
              <li>exp time: <br/><span>{et1}</span></li>
              <li>residual: <br/><span>{res1}</span></li>
              <li>fl 35mm: <br/><span>{fl35_1}</span></li>
        </ul>
      </div>
      
      <div className = "tiepoint-slide">
      <div>
        {/* <label htmlFor="">Portrait image
          <input type="checkbox" id="tiepointportrait" 
              title="portrait image correction"
              style={{marginRight:"1em"}}
              value={props.tiepointportrait} onChange={props.setOrientation}/>
        </label> */}
        <label htmlFor="">Manual rotate
          <input type="number" id="tiepointportrait" 
              title="portrait image correction"
              min="0"
              max="270"
              step="90"
              style={{width: "4em", marginRight: "1em"}}
              value={props.tiepointportrait} onChange={props.setOrientation}/>
        </label>
        <label htmlFor="">Portrait TP
          <input type="checkbox" id="tiepointpointportrait" 
              title="portrait tie point correction"
              style={{marginRight:"1em"}}
              value={props.tiepointpointportrait} onChange={props.setTiePoint}/>
        </label>
      </div>
      <div style={{color:'#ffffff'}}>
          <label htmlFor="" style={{marginRight:"1em"}}>Source
            <select name="tiePointsSource" id="tiePointsSource" 
              value={props.tiePointsSource} 
              onChange={props.setTiePoint}
              title="tie point set selection"
            >
              <option value="Homol">Default</option>
              <option value="Homol_mini">Schnaps reduction</option>
              <option value="HomolMasqFiltered">Mask filtered</option>
            </select>
          </label>
          
          
          <span>{props.tiedata.length} tie points</span>
      </div>
      <div>
        <label htmlFor="" style={{marginLeft: '4em', marginRight: '3em'}}>Tie point skip
            <input type="number" id="tiepointSkip" style={{width: '4em'}} 
                min="1"
                title="number of points to skip"
                value={props.tiepointSkip} onChange={props.setTiePoint}/>
          </label>
      </div>
          <select className="tieimage" name="tieimage0" id="tieimage0" 
            value={props.imageList[props.tieimage0] ? props.tieimage0 : 0} 
            title="choose image" 
            onChange={props.setTiePoint}>
            {linevals}
          </select>
          
          <input type="range" 
            style={{width: '100%'}} id="tiepointmix" 
            min='0'
            max='1.0'
            step='any'
            value={props.tiepointmix} onChange={props.setTiePoint}/>
          <select className="tieimage" name="tieimage1" id="tieimage1" 
            value={props.imageList[props.tieimage1] ? props.tieimage1 : 0} 
            title="choose image" 
            onChange={props.setTiePoint}>
            {linevals}
          </select>
          <div className="tieedit">
            <button 
              title="create tiepoints xml files for editing"
              onClick={() => PrepTiePoints(props)}>Prep</button>
         
              <button 
                id="tiebothedit"
                title="edit tiepoints on both images"
                onClick={(e) => EditTiePoints(e,props)}>Edit</button>
            <button 
              title="apply tie point changes and clear temp files"
              onClick={() => UpdateTiePoints(props)}>Update</button>
            <button 
              title="clear temp edit files"
              onClick={() => ClearTiePoints(props)}>Cancel</button>
          </div>
          <textarea
            // className={`command ${this.state.hidecommandinput ? "mincommand" : "height4"}`}
            className={`command ${props.hidecommandinput ? "mincommand" : "height2"}`}
            // className="command height2"
            id="saisieappuisinitCommand"
            value={props.saisieappuisinitCommand}
            // onChange={this.updateValue}
            readOnly
            wrap="soft"
            rows="2"></textarea>
        </div>
        
    </div>

    );
}
export default TiePoints