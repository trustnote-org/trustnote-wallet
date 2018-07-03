'use strict';

angular.module('copayApp.controllers').controller('loginControl', function ($scope, $rootScope, go, profileService, gettextCatalog, addressService, $timeout) {
	var self = this;
	var ecdsaSig = require('trustnote-common/signature.js');
	var Bitcore = require('bitcore-lib');
	var db = require('trustnote-common/db.js');
	var https = require('https');

	self.showLogining = 0;
	self.objToWeb = go.objToWeb;

	self.loginWebwallet = function () {
		if(self.showLogining == 1){
			return;
		}
		self.showLogining = 1;
		var fc = profileService.focusedClient;
		if(fc.observed) {
			self.loginErr = 1;
			$timeout(function () {
				self.loginErr = 0;
			}, 1500)
			return;
		}
		var DataObj = {};
		DataObj.data = self.objToWeb.loginMsg;  // 登陆吗

		if (fc.isPrivKeyEncrypted()) {
			profileService.checkPassClose = false;
			profileService.passWrongUnlockFC(null, function (err) {
				if (err == 'cancel') {  // 点击取消
					self.showLogining = 0;
					profileService.checkPassClose = true;
				} else if (err) {  // 密码输入错误
					return;
				}
				else {
					//return self.loginWebwallet();
					DataObj.extendedpubkey = profileService.focusedClient.credentials.xPubKey;  // 根公钥

					var account = profileService.focusedClient.credentials.account;
					var path = "m/44'/0'/"+account+"'/1/1024";
					var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
					var privateKey = xPrivKey.derive(path).privateKey;
					var privKeyBuf = privateKey.bn.toBuffer({size: 32});
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
		var path = "m/44'/0'/"+account+"'/1/1024";
		var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
		var privateKey = xPrivKey.derive(path).privateKey;
		var privKeyBuf = privateKey.bn.toBuffer({size: 32});
		var tobeSign = new Buffer(self.objToWeb.loginMsg, "base64");
		self.SignedData = ecdsaSig.sign(tobeSign, privKeyBuf);
		DataObj.sig = self.SignedData;  // 对登陆码进行签名

		self.fcWalletId = profileService.focusedClient.credentials.walletId;
		finishLogin();


		// 定义函数 - 完成登陆
		function finishLogin() {
			db.query("SELECT address_index from my_addresses where wallet='"+self.fcWalletId+"' ORDER BY address_index DESC LIMIT 1;", function (rows) {
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
							self.loginSuccess = 1;
							$timeout(function () {
								self.loginSuccess = 0;
								go.path('walletHome');
							}, 1000)
						}else{
							self.loginErr = 1;
							$timeout(function () {
								self.loginErr = 0;
							}, 1500)
						}
					});
				});
				req.on('error', function (e) {
					//console.log("http error");
					self.loginErr = 1;
					$timeout(function () {
						self.loginErr = 0;
					}, 1500)
				});
				req.write(content);
				req.end();
			});
		}
	};

});

