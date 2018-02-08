VERSION=`cut -d '"' -f2 $BUILDDIR/../version.js`


cordova-base:
	grunt dist-mobile

# ios:  cordova-base
# 	make -C cordova ios
# 	open cordova/project/platforms/ios/Copay
#
# android: cordova-base
# 	make -C cordova run-android
#
# release-android: cordova-base
# 	make -C cordova release-android

ios-prod:
	cordova/build.sh IOS --clear
	cd ../trustnotebuilds/project-IOS && cordova build ios
#	open ../trustnotebuilds/project-IOS/platforms/ios/trustnote.xcodeproj

ios-debug:
	cordova/build.sh IOS --dbgjs
	cd ../trustnotebuilds/project-IOS && cordova build ios
	open ../trustnotebuilds/project-IOS/platforms/ios/TrustNote.xcodeproj

android:
	cordova/build.sh ANDROID
	cd ../trustnotebuilds/project-ANDROID && cordova build android 2>&1 >/dev/null
	mv ../trustnotebuilds/project-ANDROID/platforms/android/build/outputs/apk/android-debug.apk ../trustnotebuilds/trustnote.apk

android-prod:
	cordova/build.sh ANDROID --clear
#	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd ../trustnotebuilds/project-ANDROID && cordova run android --device
	
android-prod-fast:
	cordova/build.sh ANDROID
	cd ../trustnotebuilds/project-ANDROID && cordova run android --device

android-debug:
	cordova/build.sh ANDROID --dbgjs --clear
#	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd ../trustnotebuilds/project-ANDROID && cordova run android --device

android-debug-fast:
	cordova/build.sh ANDROID --dbgjs
#	cp ./etc/beep.ogg ./cordova/project/plugins/phonegap-plugin-barcodescanner/src/android/LibraryProject/res/raw/beep.ogg
	cd ../trustnotebuilds/project-ANDROID && cordova run android --device
#	cd ../trustnotebuilds/project-ANDROID && cordova build android

win32: 
	grunt.cmd desktop
	cp -r node_modules ../trustnotebuilds/TrustNote/win32/
	grunt.cmd inno32

win64: 
	grunt.cmd desktop
	cp -r node_modules ../trustnotebuilds/TrustNote/win64/
	grunt.cmd inno64

linux64:
	grunt desktop
	cp -r node_modules ../trustnotebuilds/TrustNote/linux64/
	grunt linux64
	
osx64:
	grunt desktop
	cp -r node_modules ../trustnotebuilds/TrustNote/osx64/TrustNote.app/Contents/Resources/app.nw/
	#mkdir -p ../trustnotebuilds/TrustNote/osx64/app
	#cp -R ../trustnotebuilds/TrustNote/osx64/TrustNote.app ../trustnotebuilds/TrustNote/osx64/app/
	#ln -s /Applications ../trustnotebuilds/TrustNote/osx64/app/
	#hdiutil create -srcfolder ../trustnotebuilds/TrustNote/osx64/app/  -fs HFS+J -volname 'TrustNote' ../trustnote-osx64.dmg
	#mv ../trustnote-osx64.dmg ../trustnotebuilds/
	#rm -rf ../trustnotebuilds/TrustNote/osx64/app
	grunt dmg
