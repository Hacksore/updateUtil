#!/bin/bash

# Name of the package.
DATE=$(date +%m%d%y)

# Package version number.
VERSION=$(node -p -e "require('./package.json').version")

NAME="updateUtil_${VERSION}_${DATE}"

# Once installed the identifier is used as the filename for a receipt files in /var/db/receipts/.
IDENTIFIER="com.macOS.updateUtil"

# The location to copy the contents of files.
INSTALL_LOCATION="pkg/tmp"

# copy app
rsync -a "app-builds/mac/macOS Update.app" "pkg/tmp/usr/local/macOSUpdate"

mkdir build

# Remove any extended attributes (ACEs).
/usr/bin/xattr -rc $INSTALL_LOCATION/
/usr/bin/pkgbuild \
    --root $INSTALL_LOCATION/ \
    --install-location "/" \
    --scripts scripts/ \
    --identifier "$IDENTIFIER" \
    --version "$VERSION" \
    "build/$NAME.pkg"
	