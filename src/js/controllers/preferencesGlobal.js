'use strict';

angular.module('trustnoteApp.controllers').controller('preferencesGlobalController', function ($scope, $rootScope, $log, configService, uxLanguage, profileService) {

    $scope.encrypt = !!profileService.profile.xPrivKeyEncrypted;

    this.init = function () {
        var config = configService.getSync();
        this.deviceName = config.deviceName;
        this.myDeviceAddress = require('trustnote-pow-common/wallet/device.js').getMyDeviceAddress();
        this.hub = config.hub;
        this.showHub = false;
        this.clickTimesToShowHub = 3;
        this.currentLanguageName = uxLanguage.getCurrentLanguageName();
    };

    // 点击我的地址三次显示修改hub选项
    this.ClickToShowHub = function () {
        this.clickTimesToShowHub--;
        if (this.clickTimesToShowHub <= 0) {
            this.showHub = true;
        }
    };

    var unwatchEncrypt = $scope.$watch('encrypt', function (val) {
        var fc = profileService.focusedClient;
        if (!fc) return;

        if (val && !fc.hasPrivKeyEncrypted()) { // lock
            $rootScope.$emit('Local/NeedsPassword', true, null, function (err, password) {
                if (err || !password) {
                    $scope.encrypt = false;
                    return;
                }
                profileService.setPrivateKeyEncryptionFC(password, function () {
                    $rootScope.$emit('Local/NewEncryptionSetting');
                    $scope.encrypt = true;
                });
            });
        } else { // unlock
            if (!val && fc.hasPrivKeyEncrypted()) {
                profileService.insistUnlockFC(null, true, function (err) {
                    if (err) {
                        $scope.encrypt = true;
                        return;
                    }
                    profileService.disablePrivateKeyEncryptionFC(function (err) {
                        if (err) {
                            $scope.encrypt = true;
                            $log.error(err);
                            return;
                        }

                        $rootScope.$emit('Local/NewEncryptionSetting');
                        $scope.encrypt = false;
                    });
                })
            }
        }
    });

    $scope.$on('$destroy', function () {
        unwatchEncrypt();
    });
});
