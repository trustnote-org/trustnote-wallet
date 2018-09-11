'use strict';

angular.module('trustnoteApp.controllers').controller('preferencesController', function ($rootScope, profileService) {
    var self = this;

    self.showPubKey = function () {
        profileService.checkPassClose = false;
        var fc = profileService.focusedClient;

        if (fc.isPrivKeyEncrypted()) {
            profileService.passWrongUnlockFC(null, function (err) {
                if (err == 'cancel') {
                    profileService.checkPassClose = true;
                } else if (err) {
                    return;
                }
                else {
                    $rootScope.go('preferences.preferencesCold')
                }
            });
            return;
        }

        $rootScope.go('preferences.preferencesCold')
    };
});
