import { Component, OnInit, NgZone, Input, ViewChild, ElementRef, AfterViewInit } from "@angular/core";
import { BrowserWindow, IpcRenderer } from "electron";
import { Route } from "@angular/compiler/src/core";
import { Router } from "@angular/router";
import { spawn, exec } from "child_process";
import { ElectronService } from "../../providers/electron.service";
import { Socket } from "net";

const moment = require("moment");

function humanFileSize(bytes, si) {
	const thresh = si ? 1000 : 1024;
	if (Math.abs(bytes) < thresh) {
		return bytes + " B";
	}
	const units = si
		? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
		: ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
	let u = -1;
	do {
		bytes /= thresh;
		++u;
	} while (Math.abs(bytes) >= thresh && u < units.length - 1);
	return bytes.toFixed(1) + " " + units[u];
}

@Component({
	selector: "app-download",
	templateUrl: "./download.component.html",
	styleUrls: ["./download.component.scss"]
})

export class DownloadComponent implements OnInit {

	window: BrowserWindow;
	config;


	ipcRenderer: IpcRenderer;
	socket: Socket;

	// vars download
	eta: String;
	currentPercent: Number;
	transferred: String = "";
	totalSize: String = "";
	speed: String = "";
	status: String = "";

	@ViewChild("frame") iframe: ElementRef;

	constructor(private electron: ElectronService, private ngZone: NgZone, private router: Router) {
		this.window = electron.remote.getCurrentWindow();
		this.config = electron.remote.getGlobal("config");
		this.socket = electron.remote.getGlobal("socket");

		this.ipcRenderer = electron.ipcRenderer;

		this.socket.on("data", (buffer) => this.ngZone.run(() => {
			const message = buffer.toString();

			// TODO: rework this into json
			if (message === "extractFinished") {
				return this.router.navigateByUrl("/beginUpdate");
			}

			const json = JSON.parse(message);
			if (json == null) {
				return;
			}

			if (json.downloadInfo !== undefined) {
				this.totalSize = json.downloadInfo.totalSize;
			}

			if (json.downloadProgress !== undefined) {
				this.eta = json.downloadProgress.eta;
				this.currentPercent = json.downloadProgress.percent;
				this.transferred = json.downloadProgress.transferred;
				this.speed = json.downloadProgress.speed;

				// update progress for tray icon
				this.ipcRenderer.send("progress", {
					percent: this.currentPercent
				});
			}

			if (json.downloadComplete !== undefined) {
				this.downloadComplete();

			}

		}));

	}

	downloadComplete() {
		this.status = "complete";

		const notify = new Notification("Download compelete", {
			body: "Download has completed successfuly"
		});

		// tell main when download is done
		this.ipcRenderer.send("download-finshed", {});
	}

	ngOnInit() {

		// tell daemon to start download

		// might try waiting a second ot start dowload
		this.socket.write("download");


	}

}
