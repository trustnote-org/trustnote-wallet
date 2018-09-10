var bwcModule = angular.module('bwcModule', []);
console.log("before");

var Client = require('../angular-bitcore-wallet-client/bitcore-wallet-client/index.js');
console.log("after");

bwcModule.constant('MODULE_VERSION', '1.0.0');

bwcModule.provider("bwcService", function () {
    var provider = {};

    provider.$get = function () {
        var service = {};

        service.getBitcore = function () {
            return Client.Bitcore;
        };

        service.getSJCL = function () {
            return Client.sjcl;
        };

        service.getUtils = function () {
            return Client.Utils;
        };

        service.getClient = function (walletData) {
            var bwc = new Client({});
            if (walletData)
                bwc.import(walletData);
            return bwc;
        };

        return service;
    };

    return provider;
});
