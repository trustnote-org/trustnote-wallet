'use strict';

angular.module('copayApp.controllers').controller('loginControl', function ($scope, $rootScope, go, profileService, gettextCatalog, addressService, $timeout) {
	var self = this;
	var ecdsaSig = require('trustnote-common/signature.js');
	var Bitcore = require('bitcore-lib');
	var db = require('trustnote-common/db.js');
	var https = require('http'); // *************************** 待修改


	self.objToWeb = go.objToWeb;
	self.loginWebwallet = function () {
		var fc = profileService.focusedClient;
		if (fc.isPrivKeyEncrypted()) {
			profileService.unlockFC(null, function (err) {
				if (err) {
					$timeout(function () {
						$scope.$apply()
					}, 10);
					return;
				}
				return self.loginWebwallet();
			});
			return;
		}


		var DataObj = {};
		DataObj.extendedpubkey = profileService.focusedClient.credentials.xPubKey;  // 根公钥
		DataObj.data = self.objToWeb.loginMsg;  // 登陆吗

		var account = profileService.focusedClient.credentials.account;
		var path = "m/44'/0'/"+account+"'/1/1024";
		var xPrivKey = new Bitcore.HDPrivateKey.fromString(profileService.focusedClient.credentials.xPrivKey);
		var privateKey = xPrivKey.derive(path).privateKey;
		var privKeyBuf = privateKey.bn.toBuffer({size: 32});
		var tobeSign = new Buffer(self.objToWeb.loginMsg, "base64");
		self.SignedData = ecdsaSig.sign(tobeSign, privKeyBuf);
		DataObj.sig = self.SignedData;  // 对登陆码进行签名

		var fcWalletId = profileService.focusedClient.credentials.walletId;

		db.query("SELECT address_index from my_addresses where wallet='"+fcWalletId+"' ORDER BY address_index DESC LIMIT 1;", function (rows) {
			DataObj.max_index = rows[0].address_index;
			var content = JSON.stringify(DataObj); // 需要post的 数据
			//console.log(content);
			var options = {
				hostname: '10.10.10.192', // *************************** 待修改
				port: 3003,
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

	};

});

