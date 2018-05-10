import * as net from "net";
import * as fs from "fs";

import { spawn, exec, execSync } from "child_process";

import * as request from "request";
import * as progress from "request-progress";

import * as moment from "moment";
import * as path from "path";

import * as TimeFormat from "hh-mm-ss";

function humanFileSize(bytes) {
	const thresh = 1024;
	if (Math.abs(bytes) < thresh) {
		return bytes + " B";
	}
	const units = ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

	let u = -1;
	do {
		bytes /= thresh;
		++u;
	} while (Math.abs(bytes) >= thresh && u < units.length - 1);
	return bytes.toFixed(1) + " " + units[u];
}

export class DaemonHandler {

	unixServer;
	isDev = process.argv.join(" ").includes("--dev");

	socket: net.Socket;
	socketPath = "/var/run/updateUtil.sock";
	pid = process.pid;

	config = JSON.parse(fs.readFileSync("/usr/local/updateUtil/config.json").toString());

	installerScript = path.join(__dirname, "src/assets/installOS.sh");
	scriptPath = "/usr/local/updateUtil";

	// TODO: rework
	// This will eventually be where we store the downloaded PKG
	// "/tmp" is dangerous as a skilled user can place a malicaious package and do anything :(
	downloadLocation = "/usr/local/updateUtil/macOSDownload.pkg";

	constructor() {
		const devMode = this.isDev ? "\x1b[33m(Development Mode)\x1b[0m" : "";
		console.log("updateUtil daemon loaded! " + devMode);

		this.createShellScript();

		/* I'm thinking this wont work if this proc is a LaunchDaemon with keepalive set to true
		try {
			const lookup = execSync("pgrep updateUtilDaemon");
			const pids = lookup.toString().trim().split("\n");

			// kill any other daemons that are not this pid
			execSync("kill -9 " + pids.join(" "));
		} catch (e) {
			console.log("No additional updateUtilDaemons running");
		}
		*/

		// remove the socket if it's already existing
		if (fs.existsSync(this.socketPath)) {
			fs.unlinkSync(this.socketPath);
		}

		this.unixServer = net.createServer();
		this.unixServer.listen(this.socketPath);

		// probably need to figure out how to permission this right
		fs.chmodSync(this.socketPath, "666");

		this.unixServer.on("connection", socket => {
			this.socket = socket;

			socket.on("data", this.onData.bind(this));

			socket.on("timeout", () => {
				// this likely wont happen but it's here for good measure
				console.log("client timeout");
				this.socket = null;
			});

			socket.on("end", () => {
				console.log("client end");
				this.socket = null;
			});

		});

	}


	// TODO: get data back to client
	downloadPKG() {

		console.log("Start download: " + this.config.downloadURL);
		const req = request(this.config.downloadURL);
		progress(req)
			.on("response", res => {

				const totalBytes = res.headers["content-length"];
				const jsonString = JSON.stringify({
					downloadInfo: {
						totalSize: humanFileSize(totalBytes)
					}
				});

				this.socket.write(jsonString);

			})
			.on("progress", state => {

				if (this.socket == null || this.socket.write == null) {
					console.log("Stopping the download as something went wrong with client...");
					req.abort();
					return;
				}

				const eta = TimeFormat.fromS(state.time.remaining || 0);

				this.socket.write(JSON.stringify({
					downloadProgress: {
						eta: eta,
						speed: humanFileSize(state.speed),
						percent: Math.floor(state.percent * 100),
						transferred: humanFileSize(state.size.transferred)
					}
				}));

			})
			.on("error", err => console.log(err))
			.on("end", () => {
				console.log("Download completed, send packet to tray app");

				const jsonString = JSON.stringify({
					downloadComplete: true
				});
				this.socket.write(jsonString);

				// extract pkg
				this.extractPKG();
			})
			.pipe(fs.createWriteStream(this.downloadLocation));
	}

	invokeUpdate() {
		if (this.isDev) {
			const script = fs.readFileSync(__dirname + "/src/assets/installOS.sh").toString();
			console.log("Emulate startosinstall:");
			console.log(script);
			return;
		}

		spawn(this.scriptPath + "/installOS.sh", [
			// TODO: make this a config option
			"/Applications/Install macOS High Sierra.app"
		]);
	}

	extractPKG() {
		console.log("Start PKG extraction");
		// install pkg
		exec(`installer -pkg ${this.downloadLocation} -target /`, (err, stdout, stderr) => {
			if (err) {
				return console.log("Error extracting PKG...");
			}

			console.log(stdout);

			this.socket.write("extractFinished");
		});
	}

	onData(data: any) {
		const command = data.toString();

		switch (command) {
			case "update":
				this.invokeUpdate();
				break;
			case "download":
				this.downloadPKG();
				break;
			case "test":
				console.log("Got test command");
				break;
		}
	}

	// Create the installer script
	createShellScript() {

		console.log("Script Path: " + this.installerScript);

		const data = fs.readFileSync(__dirname + "/src/assets/installOS.sh").toString();

		if (!fs.existsSync(this.scriptPath)) {
			console.log("Need to make: " + this.scriptPath);
			fs.mkdirSync(this.scriptPath);
		}

		fs.writeFileSync(this.scriptPath + "/installOS.sh", data);
		fs.chmodSync(this.scriptPath + "/installOS.sh", 0x770);

	}

}

const instance = new DaemonHandler();
