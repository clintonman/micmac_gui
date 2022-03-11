import React, {Component} from 'react';
import './ImageCard.css';

// const electron = window.require('electron');
const path = window.require('path');
const fs = window.require('fs');
const sharp = window.require('sharp');

class ImageCard extends Component {
    constructor(props) {
        super(props);
        let color;

        if(props.tapasRes >= 1.5) {;
            color = "red";
        } else if(props.tapasRes < 1.5 && props.tapasRes > 1.0) {
            color = "blue";
        } else if(props.tapasRes > 0.01) {
            color = "green";
        } else if(props.tapasRes < 0) {
            color = "rgb(51, 50, 50)"
        } else {
            color = "red"
        }

        const imagePath = path.join(props.path, props.name);
        const fullImagePath = path.join(props.path, "thumbnails", props.name);

        //create thumbnails folder
        const thumbnailsFolder = path.join(props.path, "thumbnails");
        if(!fs.existsSync(thumbnailsFolder)) {
            fs.mkdirSync(thumbnailsFolder);
        }

        let sharpcomplete = false;
        let loadedImage = false;
        if(fs.existsSync(fullImagePath)) {
            sharpcomplete = true;
            loadedImage = true;
        }
        // console.log(props.maskImage)

        this.state = {
            ...props,
            loadedImage: loadedImage,
            color: color,
            imagePath: imagePath,
            fullImagePath: fullImagePath,
            sharpcomplete: sharpcomplete
        }
    }

    componentWillReceiveProps(nextProps) {

        let color;

        if(nextProps.tapasRes >= 1.5) {
            color = "red";
        } else if(nextProps.tapasRes < 1.5 && nextProps.tapasRes > 1.0) {
            color = "blue";
        } else if(nextProps.tapasRes > 0.01) {
            color = "green";
        } else if(nextProps.tapasRes < 0) {
            color = "rgb(51, 50, 50)"
        } else {
            color = "red"
        }

        const newState = {
            ...this.state,
            ...nextProps,
            color: color
        }
        this.setState(newState);
    }

    maskImageHere = () => {
        this.props.maskImage(this.state.name);
    }

    render() {

        if(!fs.existsSync(this.state.fullImagePath) && !this.state.sharpcomplete) {
            this.setState({sharpcomplete: true});
            sharp(this.state.imagePath)
                .resize(256, 192, { fit:"fill" })
                .toFile(this.state.fullImagePath)
                    .then(info => this.setState({ loadedImage: true }))
                    .catch(err => console.log(err));
        }
    
        return (
            <div className="card" style={{backgroundColor:this.state.color}}>
                <div className="card_image">
                    {this.state.loadedImage ? <img src={'file:///' + this.state.fullImagePath} alt="" />:null}
                </div>
                <div className="card-data">
                    <p className="card_name contexthelp" data-help="imageinfo" data-position="center" onContextMenu={this.state.helpcontext}>{this.state.name}</p>
                    <div className="card_info">
                        <p className="contexthelp" data-help="imageinfo" data-position="center" onContextMenu={this.state.helpcontext}>fl: {this.state.exif.SubExif?parseFloat(this.state.exif.SubExif.FocalLength).toFixed(2):'NA'}</p>
                        <p><button 
                            style={{width:"1.5em"}}
                            title="mask this image"
                            className="contexthelp" data-help="SaisieMasqRun" data-position="right" 
                            onContextMenu={this.props.helpcontext}
                            onClick={this.maskImageHere}>{this.state.masked ? 'M': ''}</button></p>
                        <p className="contexthelp" data-help="imageinfo" data-position="center" onContextMenu={this.state.helpcontext}>res: {parseFloat(this.state.tapasRes).toFixed(2)}</p>
                    </div>
                </div>
                <svg style={{position:'absolute', top:'0', width: '100%', height:'70%'}} viewBox="0 0 256 256" preserveAspectRatio="none"
                 onClick={ (e) => this.state.selectDeselect(e, this.state.name)}>
                    {/* <g style={{fill:'none',stroke:'#ff2200',strokeWidth:'8px',strokeOpacity:this.state.selected ? 0 : 1}}> */}
                    <g style={{fill:'none',stroke:'rgb(255,32,0)',strokeWidth:'8px',strokeOpacity:this.state.selected ? 0 : 1}}>
                        <path id="path4518"
                            d="M 3.9285714,3.8571403 252.85714,251.35714" />
                        <path id="path4520"
                            d="M 253.92857,3.5000003 4.6428572,252.07143" />
                    </g>
                </svg>
            </div>
        )
    }
}
export default ImageCard

