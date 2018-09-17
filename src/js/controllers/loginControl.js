'use strict';

angular.module('trustnoteApp.controllers').controller('loginControl', function ($scope, $rootScope, go, profileService, gettextCatalog, addressService, $timeout, safeApplyService) {
    var self = this;
    var ecdsaSig = require('trustnote-common/signature.js');
    var Bitcore = require('bitcore-lib');
    var db = require('trustnote-common/db.js');
    var https = require('https');

    self.showLogining = false;
    self.objToWeb = go.objToWeb;

    self.loginWebwallet = function () {
        if (self.showLogining) {
            return;
        }

        // check contract wallet to login
        if ($scope.index.shared_address) {
            var err = gettextCatalog.getString('Contract wallet cannot be logged in');
            self.setError(err);
            return;
        }

        var fc = profileService.focusedClient;

        // check watching wallet to login
        if (fc.observed) {
            var err = gettextCatalog.getString('Watching wallet cannot be logged in');
            self.setError(err);
            return;
        }

        self.showLogining = true;
        var DataObj = {};
        DataObj.data = self.objToWeb.loginMsg;  // 登陆吗

        if (fc.isPrivKeyEncrypted()) {
            profileService.insistUnlockFC(null, true, function (err) {
                if (err) {
                    self.showLogining = false;
                    return;
                }
                else {
                    //return self.loginWebwallet();
                    DataObj.extendedpubkey = profileService.focusedClient.credentials.xPubKey;  // 根公钥

                    var account = profileService.focusedClient.credentials.account;
                    var path = "m/44'/0'/" + account + "'/1/1024";
                    var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
                    var privateKey = xPrivKey.derive(path).privateKey;
                    var privKeyBuf = privateKey.bn.toBuffer({ size: 32 });
                    var tobeSign = new Buffer(self.objToWeb.loginMsg, "base64");
                    self.SignedData = ecdsaSig.sign(tobeSign, privKeyBuf);
                    DataObj.sig = self.SignedData;  // 对登陆码进行签名
                    self.fcWalletId = profileService.focusedClient.credentials.walletId;

                    finishLogin();
                }
            });
            return;
        }

        DataObj.extendedpubkey = profileService.focusedClient.credentials.xPubKey;  // 根公钥
        var account = profileService.focusedClient.credentials.account;
        var path = "m/44'/0'/" + account + "'/1/1024";
        var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
        var privateKey = xPrivKey.derive(path).privateKey;
        var privKeyBuf = privateKey.bn.toBuffer({ size: 32 });
        var tobeSign = new Buffer(self.objToWeb.loginMsg, "base64");
        self.SignedData = ecdsaSig.sign(tobeSign, privKeyBuf);
        DataObj.sig = self.SignedData;  // 对登陆码进行签名

        self.fcWalletId = profileService.focusedClient.credentials.walletId;
        finishLogin();


        // 定义函数 - 完成登陆
        function finishLogin() {
            db.query("SELECT address_index from my_addresses where wallet='" + self.fcWalletId + "' ORDER BY address_index DESC LIMIT 1;", function (rows) {
                DataObj.max_index = rows[0].address_index;
                var content = JSON.stringify(DataObj); // 需要post的 数据
                //console.log(content);
                var options = {
                    hostname: 'beta.itoken.top',
                    port: 443,
                    path: '/webwallet/login',
                    method: 'POST',
                    timeout: 6000,
                    headers: {
                        'Content-Type': 'application/json',
                        'referer': 'trustnote.org'
                    }
                };
                var req = https.request(options, function (res) {
                    res.setEncoding('utf8');
                    res.on('data', function (data) {
                        data = JSON.parse(data);
                        if (res.statusCode == 200 && data.errCode == 0) {
                            self.loginSuccess = true;
                            $timeout(function () {
                                self.loginSuccess = false;
                                go.path('walletHome');
                            }, 1000)
                        } else {
                            self.showLogining = false;
                            var err = gettextCatalog.getString('Login error, try later');
                            self.setError(err);
                        }
                    });
                });
                req.on('error', function (e) {
                    //console.log("http error");
                    self.showLogining = false;
                    var err = gettextCatalog.getString('httpErr');
                    self.setError(err);
                });
                req.write(content);
                req.end();
            });
        }
    };

    self.setError = function (err) {
        self.error = err;

        safeApplyService.safeApply($scope);

        $timeout(function () {
            self.error = null;
        }, 1500)
    };
});

