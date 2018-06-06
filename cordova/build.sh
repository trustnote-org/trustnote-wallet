#! /bin/bash
#
# Usage:
# sh ./build.sh --android --reload
#
#
# Check function OK
checkOK() {
	if [ $? != 0 ]; then
		echo "${OpenColor}${Red}* ERROR. Exiting...${CloseColor}"
		exit 1
	fi
}

# Configs
BUILDDIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT="$BUILDDIR/../../trustnotebuilds/project-$1"

if [ ! -d "$BUILDDIR/../../trustnotebuilds" ]; then
  mkdir -p $BUILDDIR/../../trustnotebuilds
fi

CURRENT_OS=$1

if [ -z "CURRENT_OS" ]
then
 echo "Build.sh ANDROID|IOS"
fi

CLEAR=false
DBGJS=false

if [[ $2 == "--clear" || $3 == "--clear" ]]
then
	CLEAR=true
fi

if [[ $2 == "--dbgjs" || $3 == "--dbgjs" ]]
then
	DBGJS=true
fi


echo "${OpenColor}${Green}* Checking dependencies...${CloseColor}"
command -v cordova >/dev/null 2>&1 || { echo >&2 "Cordova is not present, please install it: sudo npm install -g cordova."; exit 1; }
#command -v xcodebuild >/dev/null 2>&1 || { echo >&2 "XCode is not present, install it or use [--android]."; exit 1; }

# Create project dir
if $CLEAR
then
	if [ -d $PROJECT ]; then
		rm -rf $PROJECT
	fi
fi

echo "Build directory is $BUILDDIR"
echo "Project directory is $PROJECT"


if [ ! -d $PROJECT ]; then
	cd $BUILDDIR
	echo "${OpenColor}${Green}* Creating project... ${CloseColor}"
	cordova create ../../trustnotebuilds/project-$1 org.trustnote.testwallet TrustNote-test
	checkOK

	cd $PROJECT

	if [ $CURRENT_OS == "ANDROID" ]; then
		echo "${OpenColor}${Green}* Adding Android platform... ${CloseColor}"
		cordova platforms add android
		checkOK
	fi

	if [ $CURRENT_OS == "IOS" ]; then
		echo "${OpenColor}${Green}* Adding IOS platform... ${CloseColor}"
		cordova platforms add ios
		checkOK
	fi

	echo "${OpenColor}${Green}* Installing plugins... ${CloseColor}"

#  cordova plugin add https://github.com/florentvaldelievre/virtualartifacts-webIntent.git
#  checkOK

	if [ $CURRENT_OS == "IOS" ]; then
		cordova plugin add https://github.com/trustnote/phonegap-plugin-barcodescanner.git
		checkOK

		cordova plugin add cordova-plugin-exitapp-ios
		checkOK
	else
#		cordova plugin add cordova-plugin-android-support-v4-jar
#		checkOK

#		cordova plugin add https://github.com/joyious/phonegap-plugin-barcodescanner.git
		cordova plugin add https://github.com/phonegap/phonegap-plugin-barcodescanner.git
	fi
	checkOK

	cordova plugin add cordova-plugin-statusbar
	checkOK

	cordova plugin add cordova-plugin-customurlscheme --variable URL_SCHEME=ttt
	checkOK

	cordova plugin add cordova-plugin-inappbrowser
	checkOK

	cordova plugin add cordova-plugin-x-toast && cordova prepare
	checkOK

	cordova plugin add https://github.com/trustnote/CordovaClipboard.git
	checkOK

	cordova plugin add https://github.com/EddyVerbruggen/SocialSharing-PhoneGap-Plugin.git && cordova prepare
	checkOK

	cordova plugin add cordova-plugin-spinner-dialog
	checkOK

	cordova plugin add cordova-plugin-dialogs
	checkOK

#	cordova plugin add cordova-plugin-network-information
#	checkOK

	cordova plugin add cordova-plugin-console
	checkOK

# 	cordova plugin add cordova-plugin-uniquedeviceid
# 	checkOK

	cordova plugin add cordova-plugin-file
	checkOK

	cordova plugin add cordova-plugin-touch-id && cordova prepare
	checkOK

#	cordova plugin add cordova-plugin-transport-security
#	checkOK

	cordova plugin add cordova-ios-requires-fullscreen
	checkOK

	cordova plugin add https://github.com/trustnote/cordova-sqlite-plugin.git
	checkOK

	cordova plugin add cordova-plugin-device-name
	checkOK

	if [ $CURRENT_OS == "ANDROID" ]; then
	cordova plugin add https://github.com/kakegu/PushPlugin.git
	checkOK
	fi
	
	cordova plugin add https://github.com/joyious/MFileChooser.git
	checkOK

fi

if $DBGJS
then
	echo "${OpenColor}${Green}* Generating trustnote bundle (debug js)...${CloseColor}"
	cd $BUILDDIR/..
	grunt cordova
	checkOK
else
	echo "${OpenColor}${Green}* Generating trustnote bundle...${CloseColor}"
	cd $BUILDDIR/..
	grunt cordova-prod
	checkOK
fi

echo "${OpenColor}${Green}* Copying files...${CloseColor}"
cd $BUILDDIR/..
mkdir $PROJECT/www
cp -af public/** $PROJECT/www
checkOK

echo "${OpenColor}${Green}* Copying initial database...${CloseColor}"
cp node_modules/trustnote-common/initial.trustnote.sqlite $PROJECT/www
cp node_modules/trustnote-common/initial.trustnote-light.sqlite $PROJECT/www
checkOK

node $BUILDDIR/replaceForPartialClient.js $PROJECT
rm $PROJECT/www/partialClient.html
checkOK

cd $BUILDDIR

cp config.xml $PROJECT/config.xml
checkOK

if [ $CURRENT_OS == "ANDROID" ]; then
	echo "Android project!!!"
	
	cat $BUILDDIR/android/android.css >> $PROJECT/www/css/trustnote.css

	mkdir -p $PROJECT/platforms/android/app/src/main/res/xml/
	checkOK

#  cp android/AndroidManifest.xml $PROJECT/platforms/android/AndroidManifest.xml
#  checkOK
	
	cp android/build-extras.gradle $PROJECT/platforms/android/build-extras.gradle
	checkOK

#	cp android/project.properties $PROJECT/platforms/android/project.properties
#	checkOK

	cp -R android/res/* $PROJECT/platforms/android/app/src/main/res
	checkOK
fi

if [ $CURRENT_OS == "IOS" ]; then

	echo "IOS project!!!"

	cp -R ios $PROJECT/../
	checkOK
#  mkdir -p $PROJECT/platforms/ios
#  checkOK
#
#  cp ios/Trustnote-Info.plist $PROJECT/platforms/ios/Trustnote-Info.plist
#  checkOK
#
#  mkdir -p $PROJECT/platforms/ios/Trustnote/Resources/icons
#  checkOK
#
#  mkdir -p $PROJECT/platforms/ios/Trustnote/Resources/splash
#  checkOK
#
#  cp -R ios/icons/* $PROJECT/platforms/ios/Trustnote/Resources/icons
#  checkOK
#
#  cp -R ios/splash/* $PROJECT/platforms/ios/Trustnote/Resources/splash
#  checkOK
fi




