import { Component, OnInit, NgZone, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { BrowserWindow, IpcRenderer } from 'electron';
import { Route } from '@angular/compiler/src/core';
import { Router } from '@angular/router';
import { spawn, exec } from "child_process";
import { ElectronService } from '../../providers/electron.service';
import { Socket } from 'net';

const moment = require('moment');

function humanFileSize(bytes, si) {
	var thresh = si ? 1000 : 1024;
	if (Math.abs(bytes) < thresh) {
		return bytes + ' B';
	}
	var units = si
		? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
		: ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB'];
	var u = -1;
	do {
		bytes /= thresh;
		++u;
	} while (Math.abs(bytes) >= thresh && u < units.length - 1);
	return bytes.toFixed(1) + ' ' + units[u];
}

@Component({
	selector: 'app-download',
	templateUrl: './download.component.html',
	styleUrls: ['./download.component.scss']
})

export class DownloadComponent implements OnInit {

	window: BrowserWindow;
	config;

	downloadProgress: number = 0;
	status: String = "";
	speed: String = "";

	// TODO: rework this cluster fuck variable name nightmare

	lastBytesRecieved: number = 0;
	totalBytesRecieved: number = 0;
	bytesPerSecond: number = 0;
	downloadSpeed: String = "";
	downloadSize: String = "";
	currentDownloadProgress: String = "";
	startTime: number = 0;
	totalBytes: number = 0;
	eta: String = "";

	ipcRenderer: IpcRenderer;

	socket: Socket;

	@ViewChild('frame') iframe: ElementRef;

	constructor(private electron: ElectronService, private ngZone: NgZone, private router: Router) {
		this.window = electron.remote.getCurrentWindow();
		this.config = electron.remote.getGlobal("config");
		this.socket = electron.remote.getGlobal("socket");

		this.ipcRenderer = electron.ipcRenderer;

		this.socket.on("data", (buffer) => {
			let message = buffer.toString();
			console.log("I got data from server: " + message);

			if (message === "extractFinished") {
				this.router.navigateByUrl("/beginUpdate");
			}
		});

	}

	setProgressBar(progress: number) {
		progress = progress <= 0 ? progress : progress / 100;

		this.window.setProgressBar(progress);
	}

	ngOnInit() {

		//this.ipcRenderer.send("show-window");

		setInterval(() => {
			this.bytesPerSecond = this.totalBytesRecieved - this.lastBytesRecieved;
			this.lastBytesRecieved = this.totalBytesRecieved;

			// ETA still a mess :D 
			const elapsedTime = (new Date().getTime()) - this.startTime;
			const chunksPerTime = this.bytesPerSecond / elapsedTime;
			const estimatedTotalTime = this.totalBytes / chunksPerTime;
			const timeLeftInSeconds = (estimatedTotalTime - elapsedTime) / 1000;
			this.eta = moment.unix(timeLeftInSeconds).format('h:mm:ss')

			this.downloadSpeed = humanFileSize(this.bytesPerSecond, true);

		}, 1000)


		// hacky solution, might want to look at using request lib instead

		// I think we can get away from the daemon doing the download
		// as long as we do a check sum to validate the bits we could be ok idk
		const winRef = window.open(this.config.downloadURL, "DL", "left=10000, top=100000, width=10, height=10, visible=none");

		const session = this.window.webContents.session;
		session.on('will-download', (event, item, webContents) => {

			//alert("Download has begun, please wait...");
			this.ipcRenderer.send("show-window");

			this.startTime = item.getStartTime();
			this.totalBytes = item.getTotalBytes();

			this.downloadSize = humanFileSize(item.getTotalBytes(), true);

			this.electron.ipcRenderer.send("start-download");

			item.on('updated', (event, state) => this.ngZone.run(() => {
				if (state === 'progressing') {
					this.status = "Downloading";
					this.totalBytesRecieved = item.getReceivedBytes();
					this.downloadProgress = Math.floor((item.getReceivedBytes() / item.getTotalBytes()) * 100);
					this.currentDownloadProgress = humanFileSize(item.getReceivedBytes(), true);

					// send the progress status to the main process 
					this.ipcRenderer.send("progress", {
						percent: this.downloadProgress
					})

					this.setProgressBar(this.downloadProgress);
				}
			}));
			item.once('done', (event, state) => this.ngZone.run(() => {
				if (state === 'completed') {
					this.status = "Completed";
					console.log('Download successfully')

					this.socket.write("extract");

					// send the progress status to the main process 
					this.ipcRenderer.send("download-finished");

				} else {
					console.log(`Download failed: ${state}`)
				}
			}));
		});

	}

}
