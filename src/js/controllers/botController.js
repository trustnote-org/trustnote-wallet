'use strict';

angular.module('trustnoteApp.controllers').controller('botController',
    function ($stateParams, $scope, $log, go, correspondentListService, safeApplyService) {
        var self = this;
        
        var bots = require('trustnote-common/bots.js');

        // get params id from route url
        var id = $stateParams.id;

        bots.getBotByID(id, function (bot) {
            bot.description = correspondentListService.escapeHtmlAndInsertBr(bot.description);
            self.bot = bot;
            safeApplyService.safeApply($scope);
            $log.debug("bot:", self.bot);
        });

        this.pair = function (bot) {
            var matches = bot.pairing_code.match(/^([\w\/+]+)@([\w.:\/-]+)#([\w\/+-]+)$/);
            var pubkey = matches[1];
            var hub = matches[2];
            var pairing_secret = matches[3];
            $scope.index.setOngoingProcess("pairing", true);
            correspondentListService.acceptInvitation(hub, pubkey, pairing_secret, function (err) {
                $scope.index.setOngoingProcess("pairing", false);
            });
        }

        this.open = function (bot) {
            correspondentListService.setCurrentCorrespondent(bot.device_address, function () {
                go.path('correspondentDevices.correspondentDevice');
            });
        }
    });