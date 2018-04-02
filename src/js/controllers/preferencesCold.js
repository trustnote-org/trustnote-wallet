'use strict';

angular.module('copayApp.controllers').controller('preferencesColdController', function ($scope, profileService) {

	var fc = profileService.focusedClient;
	var self = this;

	self.myDeviceAddress = require('trustnote-common/device.js').getMyDeviceAddress();
	self.addr = '';

	self.credentials = fc.credentials;
	self.qrcode = '{"type":"c1","name":"TTT","pub":"' + self.credentials.xPubKey + '","n":0,"value":1234}';

	var crypto = require("crypto");
	self.wallet_Id = crypto.createHash("sha256").update(self.credentials.xPubKey.toString(), "utf8").digest("base64");
	//console.log(self.wallet_Id);

	// 添加代码： 处理二维码 /***************************************************/

	this.BeforeScan = function() {};

	this.handleQrcode = function parseUri(str, callbacks) {
		//console.log(typeof (str));
		//var str = JSON.parse(str);

		var arr = str.split('?');
		if(arr[0] == self.wallet_Id && arr[1] == 1234){
			//console.log(self.myDeviceAddress);
			self.addr = self.myDeviceAddress;
			$scope.index.coldWalletScanner = true; // 显示：模态框
			self.ShowaddrQr = true; // 显示：设备地址 + value
		}else {
			//console.log('hhhhh')
		}

		// switch (str.type) {
		// 	case "c1" :
		// 		self.tempValue = str.value;
		// 		self.tempPubKey = str.pub;
		// 		self.tempAccount = str.n;
		// 		self.qrCodeColdwallet1 = JSON.stringify(str);
		// 		break;
		// 	case "c2" :
		// 		if (self.tempValue === str.value) {
		// 			var opts = {
		// 				m: 1,
		// 				n: 1,
		// 				name: "TTT(*)",
		// 				xPubKey: self.tempPubKey,
		// 				account: self.tempAccount,
		// 				network: 'livenet',
		// 				cosigners: []
		// 			};
		// 			var coldDeviceAddr = str.addr;
		// 			$timeout(function () {
		// 				profileService.createColdWallet(opts, coldDeviceAddr, function (err, walletId) {
		// 					if (err) {
		// 						$log.warn(err);
		// 						self.error = err;
		// 						$timeout(function () {
		// 							$rootScope.$apply();
		// 						});
		// 						return;
		// 					}
		// 					if (opts.externalSource) {
		// 						if (opts.n == 1) {
		// 							$rootScope.$emit('Local/WalletImported', walletId);
		// 						}
		// 					}
		// 				});
		// 			}, 100);
		// 		}
		// 		break;
		// }
	};
});
