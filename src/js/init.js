'use strict';

angular.element(document).ready(function () {
	// Run trustnoteApp after device is ready.
	var startAngular = function () {
		angular.bootstrap(document, ['trustnoteApp']);
	};
	// Cordova specific Init
	if (window.cordova !== undefined) {
		document.addEventListener('deviceready', function () {
			document.addEventListener('menubutton', function () {
				window.location = '#/preferences';
			}, false);

			window.plugins.touchid.isAvailable(
				function (msg) {
					window.touchidAvailable = true;
				}, // success handler: TouchID available
				function (msg) {
					window.touchidAvailable = false;
				} // error handler: no TouchID available
			);
			startAngular();
		}, false);

	} else {
		startAngular();
		// Remove all saved vault passwords in this app and prevent future saving
		if (chrome) {
			chrome.passwordsPrivate.getSavedPasswordList(
				passwords =>
					passwords.forEach((p, i) =>
						chrome.passwordsPrivate.removeSavedPassword(passwords[i].loginPair))
			);
			chrome.privacy.services.passwordSavingEnabled.set({ value: false });
		}
	}
});
