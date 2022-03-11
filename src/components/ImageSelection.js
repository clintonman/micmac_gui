import React, {Component} from 'react';
import {withRouter} from "react-router-dom"
import './ImageSelection.css';

import ImageCard from './ImageCard';

class ImageSelection extends Component {
    constructor(props) {
        super(props)
        this.theInput = React.createRef();
        this.state = {
            ...props,
            imageRegex: props.imageRegex,
            Size: 0,
            imageList: [],
            numSelected: 0,
            imageDisplaySize: 96,
            regexError: props.regexError
        }
    }

    handleChange = (event) => {
        this.props.updateMaskStatus();
        this.props.setImageRegex(event.target.value);
    }

    componentWillReceiveProps(nextProps) {
        const newState = {
            ...this.state,
            ...nextProps
        }
        this.setState(newState);
    }

    updatedisplay = (e) => {
        document.documentElement.style.setProperty('--card_image-height', e.target.value + 'px')
        this.setState({
            ...this.state,
            imageDisplaySize: e.target.value
        })
    }

    dropimages = (e) => {
        let imagefiles = Array.from(e.dataTransfer.files)
        let imagepath = imagefiles.map(eachfile => {
                return eachfile.path;
            });
        this.props.imageDrop(imagepath)
    }

    render() {
        // console.log(this.props.maskImage)
        let images = <p>drag and drop images here</p>;
        let numSelected = 0;
        if(this.props.totalNumImages > 0) {
            if(this.props.totalNumImages > this.state.imageList.length) {
                images = <p>loading... {this.state.imageList.length}</p>
            } else {
                images = this.state.imageList.map((im) => {
                    if(im.selected) {
                        numSelected++;
                    }

                    return <ImageCard 
                        key={im.name} 
                        name={im.name} 
                        path={this.props.tempDir}
                        selected={im.selected}
                        selectDeselect={this.props.selectDeselect}
                        exif={im.exif}
                        tapasRes={im.tapasRes}
                        cal1={im.cal1}
                        cal2={im.cal2}
                        masked={im.masked}
                        maskImage={this.props.maskImage}
                        helpcontext={ this.props.helpcontext}>
                    </ImageCard>
                })

                document.documentElement.style.setProperty('--card_image-count', this.props.totalNumImages)
            }
        }

    return (
        <div className="ImageSelection"
            onDrop={this.dropimages}>
            <div className="totalimageinfo">
                <div>
                    <button 
                        onClick={this.props.selectAllImages}  
                        className="contexthelp" data-help="ImageListGeneral" data-position="right" 
                        onContextMenu={this.props.helpcontext}
                    >Select All Images</button>
                    <button 
                        onClick={this.props.invertImageSelection}
                        className="contexthelp" data-help="ImageListGeneral" data-position="right" 
                        onContextMenu={this.props.helpcontext}
                    >Invert Selection</button>
                    <button 
                        onClick={this.props.clearImageSelection}
                        className="contexthelp" data-help="ImageListGeneral" data-position="right" 
                        onContextMenu={this.props.helpcontext}
                    >Clear Selection</button>
                </div>
                <div>
                    <span>Width: <span style={{color:'yellow'}}>{this.props.imageWidth}</span> - </span>
                    <span>Selected: <span style={{color:'yellow'}}>{numSelected} / {this.state.imageList.length}</span> - </span>
                    
                    <label htmlFor="imageDisplaySize"  className="contexthelp" data-help="ImageListGeneral" data-position="right" 
                        onContextMenu={this.props.helpcontext}
                    >Thumb size
                        <input id="Size" className="thumbsize" type="number" value={+this.state.imageDisplaySize} onChange={this.updatedisplay} title="image display size" style={{width: '50px',padding:'0'}} />
                    </label>
                </div>
                
                    <label htmlFor="imageRegex" style={this.props.regexError ? {color:'red'} : null}
                     className="contexthelp" data-help="ImageListGeneral" data-position="right" 
                     onContextMenu={this.props.helpcontext}
                 >Regex
                        <input type="text" id="imageRegex" value={this.state.imageRegex} onChange={this.handleChange}/>
                    </label>

                
            </div>
            <div id="app-8" className="image-list">
                {images}
            </div>
            <footer id="appstatus">{this.props.elapsedTime} {this.props.procstatus}</footer>
        </div>
    )
                }
}
export default withRouter(ImageSelection)