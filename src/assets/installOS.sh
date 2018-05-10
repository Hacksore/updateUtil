#!/bin/bash

user=$(whoami)

# Current logged in user
currentUser=$(/bin/ls -l /dev/console | /usr/bin/awk '{ print $3 }')

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


# try unloading ithe plist first
launchctl bootout "gui/$userID" "/Library/LaunchAgents/com.apple.install.osinstallersetupd.plist" | log

# remove it before writing the file
rm -f "/Library/LaunchAgents/com.apple.install.osinstallersetupd.plist" | log

cat << EOP > /Library/LaunchAgents/com.apple.install.osinstallersetupd.plist
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
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
</plist>
EOP

# Set the permission on the file just made.
/usr/sbin/chown root:wheel /Library/LaunchAgents/com.apple.install.osinstallersetupd.plist | log
/bin/chmod 644 /Library/LaunchAgents/com.apple.install.osinstallersetupd.plist | log

# Load this LaunchAgent as the current user for FV reboots
# try as the current user?
# Get the userID
echo "Loading osinstallersetupd as gui/$userID ($currentUser)" | log
userID=$(id -u "$currentUser")
launchctl bootstrap "gui/$userID" /Library/LaunchAgents/com.apple.install.osinstallersetupd.plist | log

##############################################
# End FileVault Authenticated Reboots
##############################################

# Start the install in the background
"$applicationPath/Contents/Resources/startosinstall" \
--applicationpath "$applicationPath" \
--nointeraction \
--agreetolicense | log &

exit 0