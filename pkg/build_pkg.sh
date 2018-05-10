#!/bin/bash

# Name of the package.
DATE=$(date +%m%d%y)

BUILD=$(openssl rand -hex 12 | head -c 5)

# Package version number.
VERSION=$(node -p -e "require('./package.json').version")

NAME="updateUtil_${VERSION}_${BUILD}"

# Once installed the identifier is used as the filename for a receipt files in /var/db/receipts/.
IDENTIFIER="com.hacksore.updateUtil"

# The location to copy the contents of files.
INSTALL_LOCATION="pkg/tmp"

# create build dir if does not exisit
if [ ! -d "build/" ]; then
	mkdir build
fi

# clear tmp
rm -rf pkg/tmp/usr/local/updateUtil

# copy app
rsync -a "app-builds/mac/updateUtil.app" "pkg/tmp/usr/local/updateUtil"

# copy config
if [ ! -f "pkg/config.json" ]; then
	cp "pkg/config.default.json" "pkg/config.json"
fi

cp "pkg/config.json" "pkg/tmp/usr/local/updateUtil/config.json"

# Remove any extended attributes (ACEs).
/usr/bin/xattr -rc $INSTALL_LOCATION/
/usr/bin/pkgbuild \
    --root $INSTALL_LOCATION/ \
    --install-location "/" \
    --scripts pkg/scripts/ \
    --identifier "$IDENTIFIER" \
    --version "$VERSION" \
    "build/$NAME.pkg"
	

# find developer installer key
certID=$(security find-identity -v | grep "Developer ID Installer" | awk -F'"' '$0=$2' | head -1)

# sign pkg
productsign --sign "$certID" "build/$NAME.pkg" "build/${NAME}_signed.pkg"