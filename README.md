# micmac_gui
Graphical user interface for the MicMac Photogrammetry software collection

The main javascript libraries used to create the GUI are Electron, React and Threejs. The packager is setup for Windows 64bit, Debian Linux and OSX. The OSX version does have some issues that may be because of the old age of the Mac used to develop and test it, a 2006 machine running OSX 10.11.6

Information on MicMac can be found on their wiki page, https://micmac.ensg.eu/index.php/Accueil

The homepage for this project can be found here, http://clintons3d.com/plugins/other/micmacgui/index.html
&nbsp;

&nbsp;

## MicMac Linux Mint Installation
These steps were adapted from https://micmac.ensg.eu/index.php/Install_MicMac_Ubuntu , https://github.com/micmacIGN/micmac and https://askubuntu.com/questions/1335184/qt5-default-not-in-ubuntu-21-04

Under Linux (Ubuntu) distribution the installation procedure is as follows:

- Open a terminal
- Install dependencies:
	```bash
	sudo apt-get install git cmake make ccache imagemagick libimage-exiftool-perl exiv2 proj-bin libx11-dev
	```
	```bash
	sudo apt-get install build-essential
	```
	```bash
	sudo apt-get install qtbase5-dev qtchooser qt5-qmake qtbase5-dev-tools
	```
- Clone the repository:
	```bash
	git clone https://github.com/micmacIGN/micmac.git
	```
- Access the folder:
	```bash
	cd micmac
	```
- Create a directory for building intermediate files and access it:
	```bash
	mkdir build && cd build
	```
- Generate makefiles:
	```bash
	cmake ../ -DWITH_QT5=1
	```
- Compile:
	```bash
	make install -j N
	```
	- N is the number of CPUs on the machine and can be retrieved by typing `nproc --all`

- Add binaries to the `PATH` (**change to the actual micmac bin path**):
	```bash
	echo 'export PATH=/home/src/micmac/bin:$PATH' >> ~/.bashrc
	```
- Restart the terminal to begin using mm3d commands
&nbsp;

&nbsp;


## MicMac GUI Development Setup
These steps are for Mint Linux:

- Open a terminal
- Install nvm (Node Version Manager) - instructions are from https://nodejs.org/en/download/package-manager:
	```bash
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
	```
- Restart the terminal
- Download and install Node.js
	```bash
	nvm install 22
	```
- Verifies the right Node.js and npm version is in the environment (v22.11.0 and 10.9.0, Nov 2 2024)
	```bash
	node -v
	```
	```bash
	npm -v
	```
- Clone it
	```bash
	git clone https://github.com/clintonman/micmac_gui.git
	```
- Install it
	```bash
	cd micmac_gui
	```
	```bash
	npm install
	```
&nbsp;

&nbsp;

## Run MicMac GUI in Development Mode
The App.js has instructions to run in dev mode

Ignore the browser error - "TypeError: window.require is not a function"

```bash
npm start
```
```bash
npm run electron-dev-linux
```

The mm3d path must be set before any controls will work

ctrl-shift-I will show the chrome dev tools

&nbsp;

---

__IMPORTANT : When developing on Windows use the Command Prompt terminal. Do not use a bash terminal.__

---

&nbsp;

&nbsp;


## Build MicMac GUI installer

Building the app requires Yarn which is included with Node. 
Activate it
```bash
corepack enable
```

The build command
```bash
yarn electron:package:linux
```

After the build the dist folder will contain the deb installer file.
