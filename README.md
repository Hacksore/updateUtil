![Test](https://i.imgur.com/pSCbFES.png)
# updateUtil
A simplistic tray application that will help Mac administrators distribute macOS updates to non-admin users.

![status](https://travis-ci.org/Hacksore/updateUtil.svg?branch=master)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/updateUtil/Lobby)
![deps](https://david-dm.org/hacksore/updateUtil.svg)

![OS X 10.12 Client Tested](https://img.shields.io/badge/OS%20X%2010.12-OK-brightgreen.svg)
![macOS 10.13 Client Tested](https://img.shields.io/badge/macOS%2010.13-OK-brightgreen.svg)
![macOS 10.13 Installer Tested](https://img.shields.io/badge/High%20Sierra%20Installer-OK-brightgreen.svg)

# How it works? 
**Tray Application (Runs as user)**

The GUI tray application is what the user will see. They can use this application to start the download and automated install of the macOS update.

**Daemon (Runs as root)**

This is what the GUI sends commands to in order for the standard user to execute binaries which require elevation.

# Running locally for development
Install the depencies and then you can start the application. 

``` bash
npm install
npm start
```

The app also requires the daemon to be running which you can start in development mode. Ensure you have ran the build command for the daemon `npm run build:daemon`.

```bash
./updateUtilDaemon --dev
```
Note: the binary is expected to be running as root so please make sure to invoke it as so.

# Building 
To build the app run the following npm command.

`npm run buildapp`

# Packaging 
To build a packaged installer run the following npm command.

`npm run pkg`

# Roadmap
Some of the things this project aims to acomplish.
- [x] Downloads macOS update
- [x] Installs macOS update
- [x] Configuration
	- [x] Download URL
	- [ ] Tray Icon
	- [ ] Remote loaded config
	- [ ] Custom Screen Info
- [ ] Notifications
- [ ] Prevent user interaction (optional)
- [ ] Deferment (optional)

# Contribute 
Feel free to help with this project 😎