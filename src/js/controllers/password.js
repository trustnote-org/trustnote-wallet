'use strict';

angular.module('trustnoteApp.controllers').controller('passwordController',
    function ($rootScope, $timeout, profileService, gettext) {

        var self = this;

        var refPassword;
        self.checkPassClose = profileService.checkPassClose;
        self.isVerification = false;

        self.close = function (cb) {
            profileService.clickCancel = true;
            return cb(gettext('No password given'));
        };

        self.set = function (isSetup, cb) {
            self.error = false;
            profileService.clickCancel = false;
            // set password: first input
            if (isSetup && !self.isVerification) {
                document.getElementById("passwordInput").focus();
                self.isVerification = true;
                refPassword = self.password;
                self.password = null;
                $timeout(function () {
                    $rootScope.$apply();
                })
                return;
            }
            // set password: confirm password
            if (isSetup) {
                if (refPassword != self.password) {
                    self.error = gettext('Passwords do not match');
                    self.isVerification = false;
                    self.password = null;
                    refPassword = null;
                    return;
                }
            }
            return cb(null, self.password);
        };
    });