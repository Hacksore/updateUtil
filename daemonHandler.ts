import * as net from "net";
import * as fs from "fs";

import { spawn, exec, execSync } from "child_process";

export class DaemonHandler {

	unixServer;
	isDev = process.argv.join(" ").includes("--dev");

	socket: net.Socket;

	constructor() {
		console.log("daemon loaded! DEV: " + this.isDev);

		const path = "/tmp/macOSUpdate";

		// todo: check if any other daemon is running and killall
		// cant just blindly run this as we would kill this proc lol
		//execSync("killall daemonHandler");

		if (fs.existsSync("/tmp/macOSUpdate")) {
			fs.unlinkSync(path);
		}

		this.unixServer = net.createServer();

		// move this away from temp for security in the future
		this.unixServer.listen(path);

		fs.chmodSync(path, "777");

		this.unixServer.on('connection', socket => {
			//socket.write("test");
			this.socket = socket;
			socket.on("data", this.onData.bind(this));
		});

	}

	invokeUpdate() {
		if (this.isDev) {
			return console.log("invoke: startosinstall");
		}

		spawn("/tmp/installOS.sh", [
			"/Applications/Install macOS High Sierra.app"
		]);
	}

	// TODO: make this work
	extractPKG() {
		console.log("Extracting PKG");
		// install pkg
		exec("installer -pkg /tmp/macOSInstaller.pkg -target /", (err, stdout, stderr) => {
			this.socket.write("extractFinished");
		});
	}

	onData(data: any) {
		let command = data.toString();

		switch (command) {
			case "update":
				this.invokeUpdate();
				break;
			case "extract":
				this.extractPKG();
				break;
			case "test":
				console.log("Got test command")
				break;
		}
	}

}

new DaemonHandler();
