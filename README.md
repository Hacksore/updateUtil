![Test](https://i.imgur.com/pSCbFES.png)
# updateUtil
An Electron app that will help IT push macOS updates to non-admin users.

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
## Tray App (Runs as user)
The GUI tray application is what the user will see. They can use this application to start the download and automated install of the macOS update.

### Daemon (Runs as root)
This is what the GUI will send commands to in order for the standard user to execute binaries which require elevation.

# Contribute 
Feel free to help with this project 😎