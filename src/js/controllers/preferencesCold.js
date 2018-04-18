'use strict';

angular.module('copayApp.controllers').controller('preferencesColdController', function ($scope,  profileService, nodeWebkit, isCordova) {
	var fc = profileService.focusedClient;
	var self = this;
	self.myDeviceAddress = require('trustnote-common/device.js').getMyDeviceAddress();  // 获取我的 设备地址 getMyDeviceAddress
	self.credentials = fc.credentials;
	self.objQr_to_show = {
		"type": "c1",
		"name": "TTT",
		"pub": self.credentials.xPubKey,
		"n": 0,
		"value": Math.floor(Math.random()*9000+1000)
	};
	self.qrcode = JSON.stringify(self.objQr_to_show);

	// 此时 设置一个临时变量 用于验证钱包之间扫码的实效性
	self.setTmpeNum = function () {
		profileService.tmpeNum = self.objQr_to_show.value;
		$scope.index.scanErr = 0;
	};
	self.setTmpeNum();
	//self.addr = '';
	//self.qrcode = '{"type":"c1","name":"TTT","pub":"' + self.credentials.xPubKey + '","n":0,"value":1234}';

	var crypto = require("crypto");
	self.wallet_Id = crypto.createHash("sha256").update(self.credentials.xPubKey.toString(), "utf8").digest("base64");


	// 复制 钱包公钥 到粘贴板
	self.copyxPubKey = function() {
		var xPub = profileService.focusedClient.credentials.xPubKey;
		if (isCordova) {
			window.cordova.plugins.clipboard.copy(xPub);
			//window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
		}
		else if (nodeWebkit.isDefined()) {
			nodeWebkit.writeToClipboard(xPub);
			//window.plugins.toast.showShortCenter(gettextCatalog.getString('Copied to clipboard'));
		}
	};
});



//console.log(self.wallet_Id);

// 添加代码： 处理二维码 /***************************************************/

// this.BeforeScan = function() {};
//
// this.handleQrcode = function parseUri(str, callbacks) {
// 	//console.log(typeof (str));
// 	//var str = JSON.parse(str);
//
// 	var arr = str.split('?');
// 	if(arr[0] == self.wallet_Id && arr[1] == 1234){
// 		//console.log(self.myDeviceAddress);
// 		self.addr = self.myDeviceAddress;
// 		$scope.index.coldWalletScanner = true; // 显示：模态框
// 		self.ShowaddrQr = true; // 显示：设备地址 + value
// 	}else {
// 		//console.log('hhhhh')
// 	}
//
// 	// switch (str.type) {
// 	// 	case "c1" :
// 	// 		self.tempValue = str.value;
// 	// 		self.tempPubKey = str.pub;
// 	// 		self.tempAccount = str.n;
// 	// 		self.qrCodeColdwallet1 = JSON.stringify(str);
// 	// 		break;
// 	// 	case "c2" :
// 	// 		if (self.tempValue === str.value) {
// 	// 			var opts = {
// 	// 				m: 1,
// 	// 				n: 1,
// 	// 				name: "TTT(*)",
// 	// 				xPubKey: self.tempPubKey,
// 	// 				account: self.tempAccount,
// 	// 				network: 'livenet',
// 	// 				cosigners: []
// 	// 			};
// 	// 			var coldDeviceAddr = str.addr;
// 	// 			$timeout(function () {
// 	// 				profileService.createColdWallet(opts, coldDeviceAddr, function (err, walletId) {
// 	// 					if (err) {
// 	// 						$log.warn(err);
// 	// 						self.error = err;
// 	// 						$timeout(function () {
// 	// 							$rootScope.$apply();
// 	// 						});
// 	// 						return;
// 	// 					}
// 	// 					if (opts.externalSource) {
// 	// 						if (opts.n == 1) {
// 	// 							$rootScope.$emit('Local/WalletImported', walletId);
// 	// 						}
// 	// 					}
// 	// 				});
// 	// 			}, 100);
// 	// 		}
// 	// 		break;
// 	// }
// };