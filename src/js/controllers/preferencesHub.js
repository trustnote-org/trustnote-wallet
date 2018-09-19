'use strict';

angular.module('trustnoteApp.controllers').controller('preferencesHubController',
    function ($scope, $timeout, $log, configService, go) {
        var config = configService.getSync();
        this.hub = config.hub;
        this.arrHub = configService.hub;

        this.save = function () {
            var self = this;
            var device = require('trustnote-pow-common/device.js');
            var lightWallet = require('trustnote-pow-common/light_wallet.js');
            self.hub = self.hub.replace(/^wss?:\/\//i, '').replace(/^https?:\/\//i, '');

            $log.debug("hub:", self.hub);

            var opts = { hub: self.hub };

            configService.set(opts, function (err) {
                if (err) {
                    $log.error("save hub:", err);
                    $scope.$emit('Local/DeviceError', err);
                    return;
                }

                $timeout(function () {
                    device.setDeviceHub(self.hub);
                    lightWallet.setLightVendorHost(self.hub);
                }, 800);

                $timeout(function () {
                    go.path('preferencesGlobal');
                }, 50);
            });
        };
    });
