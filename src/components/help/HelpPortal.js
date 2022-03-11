import React from 'react';
import ReactDOM from 'react-dom';
import './Help.css';

class HelpPortal extends React.PureComponent {
    constructor(props) {
        super(props);
        // STEP 1: create a container <div>
        this.containerEl = document.createElement('div');
        this.externalWindow = null;
        this.containerEl.onclick = props.helpclose;
      }
      
      render() {
        // STEP 2: append props.children to the container <div> that isn't mounted anywhere yet
        return ReactDOM.createPortal(this.props.children, this.containerEl);
      }
    
      componentDidMount() {
        // STEP 3: open a new browser window and store a reference to it
        // this.externalWindow = window.open('', '', 'width=800,height=600,left=200,top=200,menubar=0,toolbar=0');
        // this.externalWindow = window.open('', 'MicMac Graphical User Interface', 'width=800,height=600,left=200,top=200');
        this.externalWindow = window.open('', '', 'popup');
        this.externalWindow.menubar = null;
        const docu = this.externalWindow.document;
  
        //TODO move this to the main window before release - note electron can no longer turn off menu for specific windows - see the internet
        // Menu.setApplicationMenu(null);
    
        // STEP 4: append the container <div> (that has props.children appended to it) to the body of the new window
        // this.externalWindow.document.body.appendChild(this.containerEl);
        docu.body.appendChild(this.containerEl);

        // Copy the only the Help.css styles into the new window
        // https://github.com/JakeGinnivan/react-popout/issues/15
        const stylesheets = Array.from(document.styleSheets);
        // stylesheets.forEach(styleSheet => {
          const styleSheet = stylesheets[stylesheets.length-1];
          // console.log(styleSheet)
            if (styleSheet.cssRules) { // for <style> elements
              // const newStyleEl = this.externalWindow.document.createElement('style');
              const newStyleEl = docu.createElement('style');
        
              Array.from(styleSheet.cssRules).forEach(cssRule => {
                // write the text of each rule into the body of the style element
                // newStyleEl.appendChild(this.externalWindow.document.createTextNode(cssRule.cssText));
                newStyleEl.appendChild(docu.createTextNode(cssRule.cssText));
              });
        
              // this.externalWindow.document.head.appendChild(newStyleEl);
              docu.head.appendChild(newStyleEl);
            }
        // });

        //handle x close button press
        this.externalWindow.addEventListener('beforeunload', (event) => {
            this.props.helpclose({target: {id:"helpclosebutton"}});
          })
      }
    
      componentWillUnmount() {
        // STEP 5: This will fire when this.state.showWindowPortal in the parent component becomes false
        // So we tidy up by closing the window
        this.externalWindow.close();
        // this.props.helpclose({target: {id:"helpclosebutton"}});
      }
}

export default HelpPortal
