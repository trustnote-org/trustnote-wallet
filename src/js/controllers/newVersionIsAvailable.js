'use strict';

angular.module('copayApp.controllers').controller('newVersionIsAvailable', function ($scope, $modalInstance, go, newVersion, backButton) {

	$scope.version = newVersion.version;
	if(newVersion.msg)
		$scope.msg = newVersion.msg;
	
	document.removeEventListener('backbutton', backButton.back, false);

	$scope.openDownloadLink = function () {
		var link = '';


		//  if (navigator && navigator.app) {
		//    link = 'https://play.google.com/store/apps/details?id=org.trustnote.wallet';
		// if (newVersion.version.match('t$'))
		//  link += '.testnet';
		//  }
		//  else {
		//    link = 'https://github.com/trustnote/trustnote/releases/tag/v' + newVersion.version;
		//  }

		var appPlatform = '/application.html';
		// if (typeof (process.platform) !== "undefined") {
		// 	switch (process.platform) {
		// 		case 'win32':
		// 			appPlatform = "/trustnote/trustnote-win64.exe";
		// 			break;
		// 		case 'linux':
		// 			appPlatform = "/trustnote/trustnote-linux64.zip";
		// 			break;
		// 		case 'darwin':
		// 			appPlatform = '/trustnote/trustnote-osx64.dmg';
		// 			break;
		// 	}
		// } else {
		// 	if (window.cordova.platformId === "android")
		// 		appPlatform = "/trustnote/trustnote.apk"
		// 	if (window.cordova.platformId === "ios")
		// 		appPlatform = "#download"
		// }
		link = 'https://trustnote.org' + appPlatform;

		//go.openExternalLink(link);
		if (typeof nw !== 'undefined')
			nw.Shell.openExternal(link);
		else
			cordova.InAppBrowser.open(link, '_system');
		$modalInstance.close('closed result');
		if (navigator && navigator.app)
			navigator.app.exitApp();
		else if (process.exit)
			process.exit();
	};

	$scope.later = function () {
		$modalInstance.close('closed result');
	};
});
