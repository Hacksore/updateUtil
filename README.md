![Test](https://i.imgur.com/pSCbFES.png)
# updateUtil
An Electron app that will help IT push macOS updates to non-admin users.

![status](https://travis-ci.org/Hacksore/updateUtil.svg?branch=master)
[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg)](https://gitter.im/updateUtil/Lobby)
![deps](https://david-dm.org/hacksore/updateUtil.svg)

# Roadmap
Some of the things I'd like to accomplish with this project. Keep in mind that all these features currently done are rather poor implementations and have potential security ricks associated with them. One of the big challenges and focus points of the project will also be security.
- [x] Download update
- [x] Installs update
- [x] Configuration for download
- [ ] Notifications
- [ ] Deferment
- [ ] Check for updates
- [ ] Auto update

# How it works? 
**Tray App (Runs as user)**

The GUI tray application is what the user will see. They can use this application to start the download and automated install of the macOS update.

![screenshot1](https://i.imgur.com/iGbmTuC.png)
![screenshot2](https://i.imgur.com/ZvFUtt9.png)


**Daemon (Runs as root)**

This is what the GUI will send commands to in order for the standard user to execute binaries which require elevation.

# Running locally for development

`npm install`

`npm start`

# Contribute 
Feel free to help with this project 😎