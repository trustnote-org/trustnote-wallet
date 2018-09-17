'use strict';

angular.module('trustnoteApp.controllers').controller('preferencesController', function ($rootScope, profileService) {
    var self = this;

    self.showPubKey = function () {
        var fc = profileService.focusedClient;

        if (fc.isPrivKeyEncrypted()) {
            profileService.insistUnlockFC(null, true, function (err) {
                if (err)
                    return;
                else
                    $rootScope.go('preferences.preferencesCold')
            });
        }
        else
            $rootScope.go('preferences.preferencesCold')
    };
});
