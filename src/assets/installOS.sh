#!/bin/bash

user=$(whoami)

# Current logged in user
currentUser=$(/bin/ls -l /dev/console | /usr/bin/awk '{ print $3 }')

# Get the userID
userID=$(id -u "$currentUser")

# Path to the installer
applicationPath="$1"

# Create log file
logfile="/Users/$currentUser/Library/Logs/macos_update.log"
touch "$logfile"

function log {
	while read -r line; do
		time=$(date +"%m-%d-%y %r")
		echo "[$time] $line"
		echo "[$time] $line" >> "$logfile"
	done
}

# Check who the script is running as for debug
echo "Running Script As: $user" | log

##############################################
# FileVault Authenticated Reboots
##############################################

echo "<?xml version='1.0' encoding'UTF-8'?>
<!DOCTYPE plist PUBLIC '-//Apple//DTD PLIST 1.0//EN' 'http://www.apple.com/DTDs/PropertyList-1.0.dtd'>
<plist version='1.0'>
<dict>
    <key>Label</key>
    <string>com.apple.install.osinstallersetupd</string>
    <key>LimitLoadToSessionType</key>
    <string>Aqua</string>
    <key>MachServices</key>
    <dict>
        <key>com.apple.install.osinstallersetupd</key>
        <true/>
    </dict>
    <key>TimeOut</key>
    <integer>Aqua</integer>
    <key>OnDemand</key>
    <true/>
    <key>ProgramArguments</key>
    <array>
        <string>$applicationPath/Contents/Frameworks/OSInstallerSetup.framework/Resources/osinstallersetupd</string>
    </array>
</dict>
</plist>" > "/Library/LaunchAgents/com.apple.install.osinstallersetupd.plist"

# Set the permission on the file just made.
/usr/sbin/chown root:wheel /Library/LaunchAgents/com.apple.install.osinstallersetupd.plist
/bin/chmod 644 /Library/LaunchAgents/com.apple.install.osinstallersetupd.plist

# Load this LaunchAgent as the current user for FV reboots
launchctl bootstrap "gui/$userID" /Library/LaunchAgents/com.apple.install.osinstallersetupd.plist

##############################################
# End FileVault Authenticated Reboots
##############################################

# Start the install in the background
"$applicationPath/Contents/Resources/startosinstall" \
--applicationpath "$applicationPath" \
--agreetolicense | log &

exit 0