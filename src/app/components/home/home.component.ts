import { Component, OnInit, isDevMode } from "@angular/core";
import * as fs from "fs";
import { ipcRenderer, shell } from "electron";

@Component({
	selector: "app-home",
	templateUrl: "./home.component.html",
	styleUrls: ["./home.component.scss"]
})
export class HomeComponent implements OnInit {
	devMode: boolean;
	test: object;

	constructor() { }

	ngOnInit() {
		this.devMode = isDevMode();

	}


}
