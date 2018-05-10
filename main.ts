import { app, BrowserWindow, ipcMain, Tray, nativeImage, Notification } from "electron";

import * as path from "path";
import * as net from "net";
import * as fs from "fs";
import * as url from "url";


if (process.argv.join(" ").includes("--serve")) {
	require("electron-reload")(__dirname, {
		electron: require(`${__dirname}/node_modules/electron`)
	});
}

declare var global;

class Main {

	assetsDirectory: string = "";

	tray = undefined;
	win = undefined;

	// janky way to load the config, this might be better in a singlton?
	// that way more error checking and such can be done
	config = JSON.parse(fs.readFileSync("/usr/local/updateUtil/config.json").toString());

	devToolsOpen = false;

	args = process.argv.slice(1);
	serve = this.args.some(val => val === "--serve");

	quitting = false;
	isMouseInTray = false;
	socketConnected = false;

	clientSocket: net.Socket;
	socketPath = "/var/run/updateUtil.sock";

	constructor() {
		// Don"t show the app in the dock
		app.dock.hide();

		this.assetsDirectory = this.serve ? path.join(__dirname, "src/assets") : path.join(__dirname, "dist/assets");

		global.config = this.config;

		app.on("ready", () => {
			this.createTray();
			this.createWindow();
		});

		// Quit the app when the window is closed
		app.on("window-all-closed", () => {
			app.quit();
		})

		// let the render proc tell us when to show the window
		ipcMain.on("show-window", (event, arg) => {
			this.showWindow();
		});

		this.createSocketClient();

		(process as NodeJS.EventEmitter).on("uncaughtException", (err) => {
			// keep errors silent for now
			// console.log(err.message);
		});


	}

	createSocketClient() {

		this.clientSocket = net.createConnection(this.socketPath);

		global.socket = this.clientSocket;

		this.clientSocket.on("error", (err) => {
			this.reconnectSocket();
		});

		this.clientSocket.on("connect", () => {
			console.log("Connected succesfully to the updateUtil daemon");

			this.socketConnected = true;
		});

		this.clientSocket.on("end", () => {
			console.log("Socket closed attempt reconnect method");
			this.reconnectSocket();
		});

		this.clientSocket.on("data", (data) => {
			// console.log(data.toString());

			// this.clientSocket.write(message);
		});
	}

	reconnectSocket() {
		this.socketConnected = false;

		const reconnectTimer = setInterval(() => {
			console.log("Attempt connection to backend daemon...");
			this.clientSocket = net.createConnection(this.socketPath, () => {
				console.log("reconnected killing timer");
				this.socketConnected = true;
				clearInterval(reconnectTimer);
			});

		}, 3000);
	}

	createTray() {

		this.tray = new Tray(path.join(this.assetsDirectory, "/img/ti.png"));

		this.tray.on("right-click", () => {
			this.devToolsOpen = !this.devToolsOpen;
			this.devToolsOpen ? this.win.openDevTools({ mode: "detach" }) : this.win.webContents.closeDevTools();
		});

		this.tray.on("double-click", () => {
			this.toggleWindow();
		});
		this.tray.on("click", () => {
			this.toggleWindow()
		});

		this.tray.on("mouse-enter", () => {
			this.isMouseInTray = true;
		});

		this.tray.on("mouse-leave", () => {
			this.isMouseInTray = false;
		});

		ipcMain.on("start-download", (event, arg) => {
			// disable for now
			// this.animateTrayIcon();
		});

		ipcMain.on("progress", (event, arg) => {
			this.tray.setTitle(arg.percent + "%");
		})

		ipcMain.on("download-finshed", (event, arg) => {
			console.log("Daemon reported that the downloaded is done");

			this.tray.setTitle("");
			// this.tray.setImage(path.join(this.assetsDirectory, "/img/ti.png"));
		})

	}

	animateTrayIcon() {
		let index = 0;
		let trayTimer = setInterval(() => {
			this.tray.setImage(path.join(this.assetsDirectory, `/img/frames/frame_${index}.png`))

			index++;
			if (index > 2) {
				index = 0;
			}
		}, 250);
	}

	createWindow() {

		this.win = new BrowserWindow({
			width: 400,
			height: 400,
			show: false,
			frame: false,
			fullscreenable: false,
			resizable: false,
			transparent: true,
			webPreferences: {
				backgroundThrottling: false
			}
		})

		if (this.serve) {
			this.win.loadURL("http://localhost:4200");
		} else {
			this.win.loadURL(url.format({
				pathname: path.join(__dirname, "dist/index.html"),
				protocol: "file:",
				slashes: true
			}));
		}

		// Hide the window when it loses focus
		this.win.on("blur", () => {

			if (this.devToolsOpen || this.isMouseInTray) {
				return;
			}

			this.win.hide();
		});

		const session = this.win.webContents.session;
		session.on("will-download", (event, item, webContents) => {

			// Set the save path, making Electron not to prompt a save dialog.
			item.setSavePath("/tmp/macOSInstaller.pkg");

		});


	}

	getWindowPosition() {
		const windowBounds = this.win.getBounds();
		const trayBounds = this.tray.getBounds();

		// Center window horizontally below the tray icon
		const x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2))

		// Position window 4 pixels vertically below the tray icon
		const y = Math.round(trayBounds.y + trayBounds.height + 2)

		return { x: x, y: y }
	}

	showWindow() {
		const position = this.getWindowPosition();
		this.win.setPosition(position.x, position.y, false);
		this.win.show();
		this.win.focus();
	}

	toggleWindow() {

		this.win.isVisible() ? this.win.hide() : this.showWindow();
	};

}

try {
	new Main();
} catch (e) {
	console.log(e);
}
