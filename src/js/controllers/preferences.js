'use strict';

angular.module('trustnoteApp.controllers').controller('preferencesController', function ($scope, $rootScope, $log, configService, profileService) {
    var self = this;

    this.init = function () {
        var config = configService.getSync();
        this.unitName = config.wallet.settings.unitName;
        $scope.spendUnconfirmed = config.wallet.spendUnconfirmed;
        var fc = profileService.focusedClient;
        if (fc) {
            this.externalSource = null;
        }
    };

    var unwatchSpendUnconfirmed = $scope.$watch('spendUnconfirmed', function (newVal, oldVal) {
        if (newVal == oldVal) return;
        var opts = {
            wallet: {
                spendUnconfirmed: newVal
            }
        };
        configService.set(opts, function (err) {
            $rootScope.$emit('Local/SpendUnconfirmedUpdated');
            if (err) $log.debug(err);
        });
    });

    $scope.$on('$destroy', function () {
        unwatchSpendUnconfirmed();
    });

    // ***** 点击进入 查看钱包公钥（ 创建观察钱包时 ）
    self.toShowPubKey = function () {
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
