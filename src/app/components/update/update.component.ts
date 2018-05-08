import { Component, OnInit, isDevMode, ElementRef, ViewChild } from "@angular/core";
import { BrowserWindow } from "electron";
import { Router } from "@angular/router";

import { Socket } from "net";
import { ElectronService } from "../../providers/electron.service";

@Component({
	selector: "app-update",
	templateUrl: "./update.component.html",
	styleUrls: ["./update.component.scss"]
})
export class UpdateComponent implements OnInit {

	window: BrowserWindow;
	socket: Socket;
	fs: any;

	constructor(private electron: ElectronService, private router: Router) {
		this.window = electron.remote.getCurrentWindow();
		this.socket = electron.remote.getGlobal("socket");

		this.fs = electron.fs;
	}

	@ViewChild("spin") spin: ElementRef;

	ngOnInit() {

		if (!this.fs.existsSync("/Applications/Install macOS High Sierra.app")) {
			return this.router.navigateByUrl("/download");
		}

		this.beginUpdate();
	}

	beginUpdate() {

		this.socket.write("update");
		this.spin.nativeElement.classList.add("animate");

	}

}
